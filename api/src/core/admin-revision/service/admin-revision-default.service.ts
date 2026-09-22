import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, EntityManager, In } from 'typeorm';
import { ColumnMetadata } from 'typeorm/metadata/ColumnMetadata';
import { FileEntity } from '../../../common/entity/file.entity';
import { InquiryEntity } from '../../../common/entity/inquiry.entity';
import { PostFileEntity } from '../../../common/entity/post-file.entity';
import { PostTranslationEntity } from '../../../common/entity/post-translation.entity';
import { PostEntity } from '../../../common/entity/post.entity';
import type { RevisionEntity } from '../../../common/entity/revision.entity';
import { CommonError } from '../../../common/error/common-error';
import { RevisionService } from '../../../common/revision/revision.service';
import type { SessionPayload } from '../../../common/session/session-token';
import { AdminAuthError } from '../../admin-auth/error/admin-auth.error';
import { canEditBoard } from '../../admin-auth/service/board-access';
import { AdminRevisionError } from '../error/admin-revision.error';

type Snap = Record<string, unknown>;

/** 목록 한 줄. before/after 는 싣지 않는다 — 낱개 조회에서만. */
export interface RevisionRow {
  id: number;
  actor: string;
  action: string;
  collection: string;
  item_id: string;
  created_on: Date;
  label: string;
  board: string | null;
}

/**
 * 변경 이력 조회와 되돌리기.
 *
 * 스냅샷은 글 화면이 돌려주는 모양(칸 + translations[] + files[])이다. 되돌릴 때 칸 이름을
 * 하나하나 적지 않고 엔티티 메타데이터로 맞춘다 — 새 칸이 생겨도(채용·예약 등) 이 파일을
 * 고치지 않아도 따라온다. 스냅샷에 없는 칸은 건드리지 않는다.
 *
 * 되돌리기는 글(posts)과 문의(상태·담당자·메모)만. 파일은 본체가 없어 못 되돌린다.
 */
@Injectable()
export class AdminRevisionDefaultService {
  constructor(
    @InjectDataSource() private readonly ds: DataSource,
    private readonly revisionService: RevisionService,
  ) {}

  async list(options: { collection?: string; actor?: string; page?: number }) {
    const r = await this.revisionService.listRecent({
      ...options,
      pageSize: 50,
    });
    return { ...r, data: r.data.map((x) => this.row(x)) };
  }

  async item(collection: string, itemId: string, who: SessionPayload) {
    const rows = await this.revisionService.listFor(collection, itemId, 100);
    if (rows[0]) this.assertCanSee(rows[0], who);
    else if (collection === 'admin_users' && who.role !== 'admin')
      throw CommonError.createByErrorCode(AdminAuthError.FORBIDDEN);
    return { data: rows.map((x) => this.row(x)) };
  }

  async get(id: number, who: SessionPayload) {
    const rev = await this.revisionService.get(id);
    if (!rev) throw CommonError.createByErrorCode(AdminRevisionError.NOT_FOUND);
    this.assertCanSee(rev, who);
    return {
      ...this.row(rev),
      before: rev.before ?? null,
      after: rev.after ?? null,
      restorable:
        (rev.collection === 'posts' || rev.collection === 'inquiries') &&
        rev.before != null,
    };
  }

  /** 이 이력의 「바꾸기 전」으로 되돌린다. 되돌리기 자체도 이력 한 줄이 된다. */
  async restore(id: number, who: SessionPayload) {
    const rev = await this.revisionService.get(id);
    if (!rev) throw CommonError.createByErrorCode(AdminRevisionError.NOT_FOUND);
    if (rev.collection === 'files')
      throw CommonError.createByErrorCode(
        AdminRevisionError.FILE_NOT_RESTORABLE,
      );
    if (rev.collection !== 'posts' && rev.collection !== 'inquiries')
      throw CommonError.createByErrorCode(AdminRevisionError.NOT_RESTORABLE);
    const snap = rev.before as Snap | null;
    if (!snap)
      throw CommonError.createByErrorCode(AdminRevisionError.NO_BEFORE);

    if (rev.collection === 'posts') return this.restorePost(snap, who);
    return this.restoreInquiry(Number(rev.itemId), snap, who);
  }

  // ── 글 ───────────────────────────────────────────────────────────────

  private async restorePost(snap: Snap, who: SessionPayload) {
    const id = Number(snap.id);
    const warnings: string[] = [];
    const { before, after } = await this.ds.transaction(async (m) => {
      const repo = m.getRepository(PostEntity);
      const current = await this.snapshot(m, id, snap);
      const slug = String(snap.slug ?? '');
      if (slug && (!current || current.slug !== slug)) {
        const clash = await repo.findOne({ where: { slug } });
        if (clash && clash.id !== id)
          throw CommonError.createByErrorCode(AdminRevisionError.SLUG_TAKEN);
      }

      const values = this.fromSnap(
        m.connection.getMetadata(PostEntity).columns,
        snap,
        ['id'],
      ) as Partial<PostEntity>;
      if (values.thumbnail) {
        const ok = await m
          .getRepository(FileEntity)
          .exist({ where: { id: values.thumbnail } });
        if (!ok) {
          values.thumbnail = null;
          warnings.push('대표 이미지 파일이 지워져 있어 비워 두었습니다.');
        }
      }
      if (current) await repo.update({ id }, values);
      else {
        // 지운 글은 원래 번호로 되살린다 — 이력이 번호로 이어져 있다. TypeORM 은 자동 증가
        // 칸에 준 값을 버리므로(실측) 넣은 뒤 번호를 옮긴다. 아직 딸린 행이 없어 안전하다.
        const r = await repo.insert(values);
        const newId = Number((r.identifiers[0] as { id: number }).id);
        if (newId !== id)
          await m.query('UPDATE posts SET id = $1 WHERE id = $2', [id, newId]);
      }

      const tRepo = m.getRepository(PostTranslationEntity);
      await tRepo.delete({ post: { id } });
      const tCols = m.connection.getMetadata(PostTranslationEntity).columns;
      for (const t of (snap.translations as Snap[] | undefined) ?? []) {
        await tRepo.insert({
          ...(this.fromSnap(tCols, t, [
            'id',
            'posts',
          ]) as Partial<PostTranslationEntity>),
          post: { id } as PostEntity,
        });
      }

      const fRepo = m.getRepository(PostFileEntity);
      await fRepo.delete({ post: { id } });
      const wanted = ((snap.files as Snap[] | undefined) ?? [])
        .map((f) => String(f.id ?? ''))
        .filter(Boolean);
      if (wanted.length) {
        const have = new Set(
          (
            await m
              .getRepository(FileEntity)
              .find({ where: { id: In(wanted) }, select: { id: true } })
          ).map((f) => f.id),
        );
        const gone = wanted.filter((f) => !have.has(f));
        if (gone.length)
          warnings.push(`첨부 ${gone.length}개는 파일이 지워져 있어 뺐습니다.`);
        for (const fileId of wanted.filter((f) => have.has(f)))
          await fRepo.insert({ post: { id } as PostEntity, fileId });
      }

      return { before: current, after: await this.snapshot(m, id, snap) };
    });
    await this.revisionService.record({
      actor: who.email,
      action: 'restore',
      collection: 'posts',
      itemId: id,
      before,
      after,
    });
    return { data: after, warnings };
  }

  /**
   * 지금 글을 스냅샷 모양으로. ref(되돌릴 스냅샷)가 있으면 그 칸만 남긴다 —
   * 글 화면이 만든 스냅샷과 칸이 같아야 이력 비교가 헛돌지 않는다.
   */
  private async snapshot(
    m: EntityManager,
    id: number,
    ref?: Snap | null,
  ): Promise<Snap | null> {
    const row = await m.getRepository(PostEntity).findOne({
      where: { id },
      relations: { translations: true, files: { file: true } },
      order: { files: { id: 'ASC' } },
    });
    if (!row) return null;
    const out = this.toSnap(m.connection.getMetadata(PostEntity).columns, row);
    out.thumbnail_url = row.thumbnail
      ? `/api/admin/files/${row.thumbnail}`
      : null;
    const tCols = m.connection.getMetadata(PostTranslationEntity).columns;
    out.translations = (row.translations ?? []).map((t) => {
      const o = this.toSnap(tCols, t);
      delete o.id;
      delete o.posts;
      return o;
    });
    out.files = (row.files ?? [])
      .filter((f) => f.fileId)
      .map((f) => ({
        id: f.fileId as string,
        name: f.file?.title || f.file?.filenameDownload || '첨부파일',
        url: `/api/admin/files/${f.fileId}`,
      }));
    if (!ref) return out;
    const keep = new Set([...Object.keys(ref), 'id', 'translations', 'files']);
    const picked: Snap = {};
    for (const k of Object.keys(out)) if (keep.has(k)) picked[k] = out[k];
    const refT = (ref.translations as Snap[] | undefined)?.[0];
    if (refT) {
      const tk = new Set(Object.keys(refT));
      picked.translations = (out.translations as Snap[]).map((t) =>
        Object.fromEntries(Object.entries(t).filter(([k]) => tk.has(k))),
      );
    }
    return picked;
  }

  // ── 문의 ─────────────────────────────────────────────────────────────

  private async restoreInquiry(id: number, snap: Snap, who: SessionPayload) {
    const repo = this.ds.getRepository(InquiryEntity);
    const row = await repo.findOne({ where: { id } });
    if (!row)
      throw CommonError.createByErrorCode(AdminRevisionError.TARGET_GONE);
    const view = (r: InquiryEntity) => ({
      id: r.id,
      name: r.name,
      status: r.status,
      assignee_email: r.assigneeEmail,
      note: r.note,
    });
    const before = view(row);
    const pick = (a: string, b: string) =>
      a in snap ? snap[a] : b in snap ? snap[b] : undefined;
    const status = pick('status', 'status');
    const assignee = pick('assignee_email', 'assigneeEmail');
    const note = pick('note', 'note');
    if (status !== undefined) row.status = String(status);
    if (assignee !== undefined)
      row.assigneeEmail = (assignee as string) ?? null;
    if (note !== undefined) row.note = (note as string) ?? null;
    const after = view(await repo.save(row));
    await this.revisionService.record({
      actor: who.email,
      action: 'restore',
      collection: 'inquiries',
      itemId: id,
      before,
      after,
    });
    return { data: after, warnings: [] as string[] };
  }

  // ── 공통 ─────────────────────────────────────────────────────────────

  private toSnap(cols: ColumnMetadata[], entity: object): Snap {
    const out: Snap = {};
    for (const c of cols) {
      if (c.relationMetadata) continue;
      const v = c.getEntityValue(entity);
      out[c.databaseName] = v instanceof Date ? v.toISOString() : (v ?? null);
    }
    return out;
  }

  /** 스냅샷(칸 이름 = DB 이름) → 엔티티 속성. 스냅샷에 없는 칸은 싣지 않는다. */
  private fromSnap(cols: ColumnMetadata[], snap: Snap, skip: string[]): Snap {
    const out: Snap = {};
    for (const c of cols) {
      if (c.relationMetadata || skip.includes(c.databaseName)) continue;
      if (!(c.databaseName in snap)) continue;
      let v = snap[c.databaseName];
      const t = String(c.type).toLowerCase();
      if (v != null && (t.includes('timestamp') || c.type === Date))
        v = new Date(String(v));
      out[c.propertyName] = v;
    }
    return out;
  }

  private assertCanSee(rev: RevisionEntity, who: SessionPayload): void {
    if (who.role === 'admin') return;
    if (rev.collection === 'admin_users')
      throw CommonError.createByErrorCode(AdminAuthError.FORBIDDEN);
    if (rev.collection === 'posts') {
      const board = this.boardOf(rev);
      if (board && !canEditBoard(who.role, board))
        throw CommonError.createByErrorCode(AdminAuthError.FORBIDDEN);
    }
  }

  private boardOf(rev: RevisionEntity): string | null {
    const s = (rev.after ?? rev.before) as Snap | null;
    return rev.collection === 'posts' && s && typeof s.board === 'string'
      ? s.board
      : null;
  }

  private row(rev: RevisionEntity): RevisionRow {
    return {
      id: Number(rev.id),
      actor: rev.actor,
      action: rev.action,
      collection: rev.collection,
      item_id: rev.itemId,
      created_on: rev.createdOn,
      label: this.label(rev),
      board: this.boardOf(rev),
    };
  }

  private label(rev: RevisionEntity): string {
    const s = (rev.after ?? rev.before) as Snap | null;
    if (!s) return rev.itemId;
    if (rev.collection === 'posts') {
      const ts = (s.translations as Snap[] | undefined) ?? [];
      const ko = ts.find((t) => t.languages_code === 'ko-KR') ?? ts[0];
      return String(ko?.title || s.slug || rev.itemId);
    }
    if (rev.collection === 'inquiries')
      return String(s.name ?? `문의 ${rev.itemId}`);
    if (rev.collection === 'admin_users') return String(s.email ?? rev.itemId);
    if (rev.collection === 'files')
      return String(
        s.title || s.filename_download || s.filenameDownload || rev.itemId,
      );
    return rev.itemId;
  }
}
