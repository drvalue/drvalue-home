import { Injectable } from '@nestjs/common';
import { BOARDS, PostEntity } from '../../../common/entity/post.entity';
import { PostTranslationEntity } from '../../../common/entity/post-translation.entity';
import { CommonError } from '../../../common/error/common-error';
import { ServiceException } from '../../../common/error/service-exception.decorator';
import { sanitizeBody } from '../../../common/html/sanitize-body';
import { RevisionService } from '../../../common/revision/revision.service';
import type { SessionPayload } from '../../../common/session/session-token';
import type { ITransactionContext } from '../../../common/typeorm/transaction-context';
import { Transactional } from '../../../common/typeorm/transactional.decorator';
import { AdminAuthError } from '../../admin-auth/error/admin-auth.error';
import {
  canEditBoard,
  visibleBoards,
} from '../../admin-auth/service/board-access';
import {
  ControllerAdminPostDefaultDetailResponseDto,
  ControllerAdminPostDefaultPageResponseDto,
  ControllerAdminPostDefaultRowResponseDto,
} from '../dto/controller-admin-post-default-response.dto';
import {
  ControllerAdminPostDefaultListQueryDto,
  ControllerAdminPostDefaultSaveDto,
  ControllerAdminPostTranslationDto,
} from '../dto/controller-admin-post-default.dto';
import { AdminPostError } from '../error/admin-post.error';
import { FileDefaultRepository } from '../repository/file-default.repository';
import { PostDefaultRepository } from '../repository/post-default.repository';
import { PostFileDefaultRepository } from '../repository/post-file-default.repository';
import { PostTranslationDefaultRepository } from '../repository/post-translation-default.repository';
import { fromSnap, pickLike, Snap, toSnap } from './post-snapshot';

const PAGE_SIZE = 30;

/**
 * 글 게시판(공지·보도·뉴스)의 대표 이미지는 본문의 첫 그림이다. 따로 올리는 칸이 없다.
 * 편집기가 넣는 주소는 `/api/content/assets/<uuid>`. 본문에 그림이 없으면 대표 이미지도 없다.
 */
const THUMB_FROM_BODY = ['notice', 'press', 'news'];
const BODY_IMAGE_RE =
  /\/api\/content\/assets\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i;

type Detail = ControllerAdminPostDefaultDetailResponseDto;

/**
 * 관리 화면의 글. 게시판 9종이 같은 표(posts)를 쓴다.
 *
 * 규칙: 범위(admin·marketing·hr)가 못 만지는 게시판은 목록·낱개 읽기까지 막는다 ·
 * 한국어 제목 필수 · 주소(slug) 겹침 금지 · 저장·삭제는 변경 이력과 한 트랜잭션.
 */
@Injectable()
export class AdminPostDefaultService {
  constructor(
    private readonly postDefaultRepository: PostDefaultRepository,
    private readonly postTranslationDefaultRepository: PostTranslationDefaultRepository,
    private readonly postFileDefaultRepository: PostFileDefaultRepository,
    private readonly fileDefaultRepository: FileDefaultRepository,
    private readonly revisionService: RevisionService,
  ) {}

  /** 이 범위가 이 게시판을 만질 수 있나. 못 만지면 403. */
  private assertBoard(who: SessionPayload, board: string): void {
    if (!canEditBoard(who.role, board))
      throw CommonError.createByErrorCode(AdminAuthError.FORBIDDEN);
  }

  /**
   * 관리 목록 한 쪽(30개). 게시판을 안 고르면 이 범위로 볼 수 있는 게시판 전부.
   * 순서는 사이트 목록과 같다 — 저장소의 `findAdminPage` 가 게시판별로 정한다.
   */
  @ServiceException({ errorCode: AdminPostError.LIST_UNKNOWN })
  async list(
    ctx: ITransactionContext,
    query: ControllerAdminPostDefaultListQueryDto,
    who: SessionPayload,
  ): Promise<ControllerAdminPostDefaultPageResponseDto> {
    if (query.board) this.assertBoard(who, query.board);
    const page = Math.max(1, query.page ?? 1);
    const [rows, total] = await this.postDefaultRepository.findAdminPage(ctx, {
      boards: visibleBoards(who.role, BOARDS),
      board: query.board,
      status: query.status,
      q: query.q,
      schedule: query.schedule,
      page,
      pageSize: PAGE_SIZE,
    });
    return {
      data: rows.map((r) => ControllerAdminPostDefaultRowResponseDto.from(r)),
      total,
      page,
      pageSize: PAGE_SIZE,
    };
  }

  /** 수행실적 「구분」에 지금까지 쓴 값. 폼이 목록으로 보여 줘 같은 말을 다르게 적지 않게 한다. */
  @ServiceException({ errorCode: AdminPostError.LABELS_UNKNOWN })
  async categoryLabels(ctx: ITransactionContext): Promise<string[]> {
    return this.postTranslationDefaultRepository.findCaseCategoryLabels(ctx);
  }

  /** FAQ 「분류」에 지금까지 쓴 값. */
  @ServiceException({ errorCode: AdminPostError.LABELS_UNKNOWN })
  async faqCategories(ctx: ITransactionContext): Promise<string[]> {
    return this.postTranslationDefaultRepository.findFaqCategories(ctx);
  }

  /**
   * 글 하나 전부. `who` 가 없으면 범위를 안 본다 — 예약 게시(cron)가 이력을 남길 때 쓴다.
   */
  @ServiceException({ errorCode: AdminPostError.GET_UNKNOWN })
  async get(
    ctx: ITransactionContext,
    id: number,
    who?: SessionPayload,
  ): Promise<Detail> {
    const row = await this.findOrThrow(ctx, id);
    if (who) this.assertBoard(who, row.board);
    return ControllerAdminPostDefaultDetailResponseDto.from(row);
  }

  /** 새 글. 주소를 비우면 `<게시판>-<시각>` 으로 짓고, 같은 게시판 맨 뒤 순서에 붙인다. */
  @ServiceException({ errorCode: AdminPostError.SAVE_UNKNOWN })
  @Transactional()
  async create(
    ctx: ITransactionContext,
    dto: ControllerAdminPostDefaultSaveDto,
    who: SessionPayload,
  ): Promise<Detail> {
    this.assertBoard(who, dto.board);
    this.requireKoTitle(dto);
    const slug = dto.slug || `${dto.board}-${Date.now().toString(36)}`;
    await this.assertSlugFree(ctx, slug);
    await this.assertFilesExist(ctx, dto);
    await this.assertOgImage(ctx, dto);

    const posts = this.postDefaultRepository.repository(ctx);
    const row = posts.create({
      ...this.columns(dto),
      slug,
      board: dto.board,
      status: dto.status ?? 'draft',
      sort: (await this.postDefaultRepository.findMaxSort(ctx, dto.board)) + 1,
    });
    row.translations = dto.translations.map((t) =>
      this.postTranslationDefaultRepository
        .repository(ctx)
        .create(this.translation(t)),
    );
    row.files = (dto.file_ids ?? []).map((fileId) =>
      this.postFileDefaultRepository.repository(ctx).create({ fileId }),
    );
    const saved = await posts.save(row);

    const after = await this.get(ctx, saved.id);
    await this.revisionService.record(
      {
        actor: who.email,
        action: 'create',
        collection: 'posts',
        itemId: saved.id,
        after,
      },
      ctx,
    );
    return after;
  }

  /**
   * 고치기. 번역은 언어별로 덮고 보내지 않은 언어는 그대로 둔다.
   * `file_ids` 를 보내면 첨부를 그 목록으로 갈아 끼운다.
   */
  @ServiceException({ errorCode: AdminPostError.SAVE_UNKNOWN })
  @Transactional()
  async update(
    ctx: ITransactionContext,
    id: number,
    dto: ControllerAdminPostDefaultSaveDto,
    who: SessionPayload,
  ): Promise<Detail> {
    this.assertBoard(who, dto.board);
    this.requireKoTitle(dto);
    const row = await this.findOrThrow(ctx, id);
    this.assertBoard(who, row.board);
    await this.assertOgImage(ctx, dto);
    const before = ControllerAdminPostDefaultDetailResponseDto.from(row);
    await this.assertFilesExist(ctx, dto);

    if (dto.slug && dto.slug !== row.slug) {
      await this.assertSlugFree(ctx, dto.slug);
      row.slug = dto.slug;
    }
    Object.assign(row, this.columns(dto), {
      board: dto.board,
      status: dto.status ?? row.status,
    });
    for (const t of dto.translations) {
      const have = row.translations.find(
        (x) => x.languagesCode === t.languages_code,
      );
      if (have) Object.assign(have, this.translation(t));
      else
        row.translations.push(
          this.postTranslationDefaultRepository
            .repository(ctx)
            .create(this.translation(t)),
        );
    }
    if (dto.file_ids) {
      await this.postFileDefaultRepository.deleteByPost(ctx, id);
      row.files = dto.file_ids.map((fileId) =>
        this.postFileDefaultRepository.repository(ctx).create({ fileId }),
      );
    }
    await this.postDefaultRepository.repository(ctx).save(row);

    const after = await this.get(ctx, id);
    await this.revisionService.record(
      {
        actor: who.email,
        action: 'update',
        collection: 'posts',
        itemId: id,
        before,
        after,
      },
      ctx,
    );
    return after;
  }

  /** 지우기. 번역·첨부 행은 FK(ON DELETE CASCADE)가 같이 지운다. 파일은 남는다. */
  @ServiceException({ errorCode: AdminPostError.DELETE_UNKNOWN })
  @Transactional()
  async remove(
    ctx: ITransactionContext,
    id: number,
    who: SessionPayload,
  ): Promise<void> {
    const row = await this.findOrThrow(ctx, id);
    this.assertBoard(who, row.board);
    const before = ControllerAdminPostDefaultDetailResponseDto.from(row);
    await this.postDefaultRepository.repository(ctx).remove(row);
    await this.revisionService.record(
      {
        actor: who.email,
        action: 'delete',
        collection: 'posts',
        itemId: id,
        before,
      },
      ctx,
    );
  }

  /**
   * `ids` 순서대로 sort = 1..n. 같은 게시판 안에서만 뜻이 있다.
   * 그 글들의 게시판을 이 범위가 만질 수 있어야 한다(인사가 공지 순서를 못 바꾼다).
   */
  @ServiceException({ errorCode: AdminPostError.REORDER_UNKNOWN })
  @Transactional()
  async reorder(
    ctx: ITransactionContext,
    ids: number[],
    who: SessionPayload,
  ): Promise<void> {
    for (const board of await this.postDefaultRepository.findBoardsOf(ctx, ids))
      this.assertBoard(who, board);
    for (const [i, id] of ids.entries())
      await this.postDefaultRepository.updateSort(ctx, id, i + 1);
  }

  /**
   * 변경 이력의 스냅샷(글 화면 모양)으로 글을 되돌린다. 지운 글은 원래 번호로 되살린다.
   * 주소가 다른 글과 겹치면 409. 지워진 대표 그림·첨부는 빼고 되돌리고 그 사실을 경고로 돌려준다.
   * 되돌림도 변경 이력(action restore) 한 줄이다. 호출자(변경 이력)가 연 트랜잭션에 탄다.
   */
  @ServiceException({ errorCode: AdminPostError.RESTORE_UNKNOWN })
  @Transactional()
  async restoreSnapshot(
    ctx: ITransactionContext,
    snap: Snap,
    who: SessionPayload,
  ): Promise<{ data: Snap | null; warnings: string[] }> {
    const id = Number(snap.id);
    const warnings: string[] = [];
    const current = await this.snapshotOf(ctx, id, snap);
    const slug = String(snap.slug ?? '');
    if (slug && (!current || current.slug !== slug)) {
      const clash = await this.postDefaultRepository.findBySlug(ctx, slug);
      if (clash && clash.id !== id)
        throw CommonError.createByErrorCode(AdminPostError.RESTORE_SLUG_TAKEN);
    }

    const values = fromSnap(this.postDefaultRepository.columns(ctx), snap, [
      'id',
    ]) as Partial<PostEntity>;
    if (
      values.thumbnail &&
      !(await this.fileDefaultRepository.exists(ctx, values.thumbnail))
    ) {
      values.thumbnail = null;
      warnings.push('대표 이미지 파일이 지워져 있어 비워 두었습니다.');
    }
    if (current)
      await this.postDefaultRepository.updateColumns(ctx, id, values);
    else await this.postDefaultRepository.insertWithId(ctx, id, values);

    const tCols = this.postTranslationDefaultRepository.columns(ctx);
    await this.postTranslationDefaultRepository.replaceForPost(
      ctx,
      id,
      ((snap.translations as Snap[] | undefined) ?? []).map((t) => {
        const row = fromSnap(tCols, t, [
          'id',
          'posts',
        ]) as Partial<PostTranslationEntity>;
        // 저장과 같은 소독 — 이력의 본문은 소독 규칙이 생기기 전 글일 수 있다.
        if ('body' in row) row.body = sanitizeBody(row.body);
        return row;
      }),
    );

    await this.postFileDefaultRepository.deleteByPost(ctx, id);
    const wanted = ((snap.files as Snap[] | undefined) ?? [])
      .map((f) => String(f.id ?? ''))
      .filter(Boolean);
    const have = await this.fileDefaultRepository.findExistingIds(ctx, wanted);
    const gone = wanted.filter((f) => !have.has(f));
    if (gone.length)
      warnings.push(`첨부 ${gone.length}개는 파일이 지워져 있어 뺐습니다.`);
    await this.postFileDefaultRepository.attach(
      ctx,
      id,
      wanted.filter((f) => have.has(f)),
    );

    const after = await this.snapshotOf(ctx, id, snap);
    await this.revisionService.record(
      {
        actor: who.email,
        action: 'restore',
        collection: 'posts',
        itemId: id,
        before: current,
        after,
      },
      ctx,
    );
    return { data: after, warnings };
  }

  /** 지금 글을 스냅샷 모양으로(되돌릴 스냅샷 ref 의 칸만). 없으면 null. */
  private async snapshotOf(
    ctx: ITransactionContext,
    id: number,
    ref: Snap,
  ): Promise<Snap | null> {
    const row = await this.postDefaultRepository.findOneFull(ctx, id);
    if (!row) return null;
    const out = toSnap(this.postDefaultRepository.columns(ctx), row);
    out.thumbnail_url = row.thumbnail
      ? `/api/admin/files/${row.thumbnail}`
      : null;
    const tCols = this.postTranslationDefaultRepository.columns(ctx);
    out.translations = (row.translations ?? []).map((t) => {
      const o = toSnap(tCols, t);
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
    return pickLike(out, ref);
  }

  private async findOrThrow(
    ctx: ITransactionContext,
    id: number,
  ): Promise<PostEntity> {
    const row = await this.postDefaultRepository.findOneFull(ctx, id);
    if (!row) throw CommonError.createByErrorCode(AdminPostError.NOT_FOUND);
    return row;
  }

  private async assertSlugFree(
    ctx: ITransactionContext,
    slug: string,
  ): Promise<void> {
    if (await this.postDefaultRepository.findBySlug(ctx, slug))
      throw CommonError.createByErrorCode(AdminPostError.SLUG_TAKEN);
  }

  /**
   * 걸려는 첨부·증서 그림이 아직 있나. 미디어에서 지운 파일을 폼이 들고 있다가 저장하면
   * FK(migrations/0003)에 걸려 500 이 됐다 — 사용자가 고칠 수 있는 일이라 409 로 알린다.
   * 글 게시판의 대표 그림은 본문에서 고르므로(`columns`) 보낸 thumbnail 은 보지 않는다.
   */
  private async assertFilesExist(
    ctx: ITransactionContext,
    dto: ControllerAdminPostDefaultSaveDto,
  ): Promise<void> {
    const files = dto.file_ids ?? [];
    const thumb = THUMB_FROM_BODY.includes(dto.board)
      ? null
      : dto.thumbnail || null;
    const ids = [...new Set(thumb ? [...files, thumb] : files)];
    const have = await this.fileDefaultRepository.findExistingIds(ctx, ids);
    if (files.some((id) => !have.has(id)))
      throw CommonError.createByErrorCode(AdminPostError.FILE_GONE);
    if (thumb && !have.has(thumb))
      throw CommonError.createByErrorCode(AdminPostError.THUMB_GONE);
  }

  private requireKoTitle(dto: ControllerAdminPostDefaultSaveDto): void {
    const ko = dto.translations.find((t) => t.languages_code === 'ko-KR');
    if (!ko?.title?.trim())
      throw CommonError.createByErrorCode(AdminPostError.NEED_KO);
  }

  /** DTO → 칸. 보내지 않은 칸(undefined)은 그대로, 비운 칸('' · null)은 null. */
  private columns(dto: ControllerAdminPostDefaultSaveDto): Partial<PostEntity> {
    const nul = (v: string | null | undefined) =>
      v === undefined ? undefined : v || null;
    const when = (v: string | null | undefined) =>
      v === undefined ? undefined : v ? new Date(v) : null;
    return {
      publishedDate: dto.published_date,
      isPinned: dto.is_pinned ?? undefined,
      isFeatured: dto.is_featured ?? undefined,
      thumbnail: THUMB_FROM_BODY.includes(dto.board)
        ? this.firstBodyImage(dto)
        : nul(dto.thumbnail),
      pressMedia: nul(dto.press_media),
      periodStart: nul(dto.period_start),
      periodEnd: nul(dto.period_end),
      certState: nul(dto.cert_state),
      certNo: nul(dto.cert_no),
      certDate: nul(dto.cert_date),
      certMadeDate: nul(dto.cert_made_date),
      certKind: nul(dto.cert_kind),
      historyYear: nul(dto.history_year),
      employmentType: nul(dto.employment_type),
      isOpenEnded: dto.is_open_ended ?? undefined,
      deadline: nul(dto.deadline),
      publishAt: when(dto.publish_at),
      unpublishAt: when(dto.unpublish_at),
      ogImage: nul(dto.og_image?.toLowerCase()),
      noIndex: dto.no_index ?? undefined,
    };
  }

  /** 공유 그림이 실제 파일인가. 미디어에서 지운 파일이면 FK 가 500 을 내기 전에 400 으로 알린다. */
  private async assertOgImage(
    ctx: ITransactionContext,
    dto: ControllerAdminPostDefaultSaveDto,
  ): Promise<void> {
    if (!dto.og_image) return;
    if (!(await this.fileDefaultRepository.exists(ctx, dto.og_image)))
      throw CommonError.createByErrorCode(AdminPostError.OG_IMAGE_NOT_FOUND);
  }

  /** 한국어 본문의 첫 그림, 없으면 다른 언어 본문의 첫 그림. */
  private firstBodyImage(
    dto: ControllerAdminPostDefaultSaveDto,
  ): string | null {
    const isKo = (t: ControllerAdminPostTranslationDto) =>
      t.languages_code === 'ko-KR';
    const ordered = [
      ...dto.translations.filter(isKo),
      ...dto.translations.filter((t) => !isKo(t)),
    ];
    for (const t of ordered) {
      const m = BODY_IMAGE_RE.exec(sanitizeBody(t.body) ?? '');
      if (m) return m[1].toLowerCase();
    }
    return null;
  }

  private translation(
    t: ControllerAdminPostTranslationDto,
  ): Partial<PostTranslationEntity> {
    return {
      languagesCode: t.languages_code,
      title: t.title ?? null,
      summary: t.summary ?? null,
      // 관리자 글이라도 공개 화면에 HTML 로 나간다 — 편집기가 만드는 태그만 남겨 저장한다.
      body: sanitizeBody(t.body),
      caseCategoryLabel: t.case_category_label ?? null,
      faqCategory: t.faq_category ?? null,
      seoTitle: t.seo_title ?? null,
      seoDescription: t.seo_description ?? null,
    };
  }
}
