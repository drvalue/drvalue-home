import { Injectable } from '@nestjs/common';
import { Brackets } from 'typeorm';
import { PostTranslationEntity } from '../../../common/entity/post-translation.entity';
import { PostEntity } from '../../../common/entity/post.entity';
import { CommonError } from '../../../common/error/common-error';
import { ControllerAdminPostDefaultSaveDto } from '../dto/controller-admin-post-default.dto';
import { AdminPostError } from '../error/admin-post.error';
import { PostDefaultRepository } from '../repository/post-default.repository';
import { RevisionService } from '../../../common/revision/revision.service';
import {
  canEditBoard,
  visibleBoards,
} from '../../admin-auth/service/board-access';
import { BOARDS } from '../../../common/entity/post.entity';
import { AdminAuthError } from '../../admin-auth/error/admin-auth.error';
import type { SessionPayload } from '../../../common/session/session-token';

const PAGE = 30;

const iso = (d: Date | string | null | undefined): string | null =>
  d ? new Date(d).toISOString() : null;

/** 관리 화면이 보는 목록 한 줄. */
export interface AdminPostRow {
  id: number;
  board: string;
  slug: string;
  status: string;
  title: string;
  published_date: string;
  sort: number | null;
  is_pinned: boolean;
  thumbnail: string | null;
  history_year: string | null;
  cert_no: string | null;
  press_media: string | null;
  period_start: string | null;
  period_end: string | null;
  employment_type: string | null;
  is_open_ended: boolean;
  deadline: string | null;
  faq_category: string | null;
  publish_at: string | null;
  unpublish_at: string | null;
}

@Injectable()
export class AdminPostDefaultService {
  constructor(
    private readonly postDefaultRepository: PostDefaultRepository,
    private readonly revisionService: RevisionService,
  ) {}

  /** 역할이 이 게시판을 만질 수 있나. 목록·낱개 읽기도 막는다 — hr 이 공지를 볼 이유가 없다. */
  assertBoard(who: SessionPayload, board: string): void {
    if (!canEditBoard(who.role, board))
      throw new CommonError(AdminAuthError.FORBIDDEN);
  }

  async list(
    options: { board?: string; q?: string; status?: string; page?: number },
    who: SessionPayload,
  ) {
    if (options.board) this.assertBoard(who, options.board);
    const page = Math.max(1, options.page ?? 1);
    const qb = this.postDefaultRepository.repository
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.translations', 't')
      .orderBy('p.sort', 'ASC', 'NULLS LAST')
      .addOrderBy('p.publishedDate', 'DESC')
      .addOrderBy('p.id', 'DESC');
    if (options.board)
      qb.andWhere('p.board = :board', { board: options.board });
    else
      qb.andWhere('p.board IN (:...boards)', {
        boards: visibleBoards(who.role, BOARDS),
      });
    if (options.status)
      qb.andWhere('p.status = :status', { status: options.status });
    if (options.q) {
      qb.andWhere(
        new Brackets((w) => {
          w.where('t.title ILIKE :q', { q: `%${options.q}%` }).orWhere(
            'p.slug ILIKE :q',
            { q: `%${options.q}%` },
          );
        }),
      );
    }
    // 게시판(공지·보도·뉴스)은 날짜순이 먼저다. 증서·연혁·FAQ 는 sort 가 먼저.
    if (
      options.board === 'notice' ||
      options.board === 'press' ||
      options.board === 'news'
    ) {
      qb.orderBy('p.isPinned', 'DESC')
        .addOrderBy('p.publishedDate', 'DESC')
        .addOrderBy('p.id', 'DESC');
    }
    if (options.board === 'history') {
      qb.orderBy('p.historyYear', 'DESC')
        .addOrderBy('p.sort', 'ASC', 'NULLS LAST')
        .addOrderBy('p.id', 'ASC');
    }
    // 채용은 마감 임박 순. 상시 채용은 뒤로, 마감일 없는 것도 뒤로.
    if (options.board === 'recruit') {
      qb.orderBy('p.isOpenEnded', 'ASC')
        .addOrderBy('p.deadline', 'ASC', 'NULLS LAST')
        .addOrderBy('p.publishedDate', 'DESC')
        .addOrderBy('p.id', 'DESC');
    }
    const [rows, total] = await qb
      .skip((page - 1) * PAGE)
      .take(PAGE)
      .getManyAndCount();
    return { data: rows.map((r) => this.row(r)), total, page, pageSize: PAGE };
  }

  /** 수행실적 「구분」에 지금까지 쓴 값. 폼이 datalist 로 보여 준다 — 같은 말을 다르게 적는 것을 막는다. */
  async categoryLabels(): Promise<string[]> {
    const rows = await this.postDefaultRepository.translations
      .createQueryBuilder('t')
      .innerJoin('t.post', 'p')
      .select('DISTINCT t.caseCategoryLabel', 'label')
      .where(
        "p.board = 'case' AND t.caseCategoryLabel IS NOT NULL AND t.caseCategoryLabel <> ''",
      )
      .orderBy('label', 'ASC')
      .getRawMany<{ label: string }>();
    return rows.map((r) => r.label);
  }

  /** FAQ 「분류」에 지금까지 쓴 값. 수행실적 구분과 같은 방식 — 같은 말을 다르게 적지 않게. */
  async faqCategories(): Promise<string[]> {
    const rows = await this.postDefaultRepository.translations
      .createQueryBuilder('t')
      .innerJoin('t.post', 'p')
      .select('DISTINCT t.faqCategory', 'label')
      .where(
        "p.board = 'faq' AND t.faqCategory IS NOT NULL AND t.faqCategory <> ''",
      )
      .orderBy('label', 'ASC')
      .getRawMany<{ label: string }>();
    return rows.map((r) => r.label);
  }

  async get(id: number, who?: SessionPayload) {
    const row = await this.postDefaultRepository.findOneFull(id);
    if (!row) throw new CommonError(AdminPostError.NOT_FOUND);
    if (who) this.assertBoard(who, row.board);
    return this.full(row);
  }

  async create(dto: ControllerAdminPostDefaultSaveDto, who: SessionPayload) {
    this.assertBoard(who, dto.board);
    this.requireKo(dto);
    const slug = dto.slug || `${dto.board}-${Date.now().toString(36)}`;
    if (await this.postDefaultRepository.findBySlug(slug))
      throw new CommonError(AdminPostError.SLUG_TAKEN);
    const row = this.postDefaultRepository.repository.create({
      ...this.columns(dto),
      slug,
      board: dto.board,
      status: dto.status ?? 'draft',
    });
    // 새 글은 맨 뒤. 증서·연혁 목록에서 순서가 곧 화면 순서다.
    const last = await this.postDefaultRepository.repository
      .createQueryBuilder('p')
      .select('MAX(p.sort)', 'max')
      .where('p.board = :board', { board: dto.board })
      .getRawOne<{ max: number | null }>();
    row.sort = (last?.max ?? 0) + 1;
    row.translations = dto.translations.map((t) =>
      this.postDefaultRepository.translations.create(this.translation(t)),
    );
    row.files = (dto.file_ids ?? []).map((fileId) =>
      this.postDefaultRepository.files.create({ fileId }),
    );
    const saved = await this.postDefaultRepository.repository.save(row);
    const after = await this.get(saved.id);
    await this.revisionService.record({
      actor: who.email,
      action: 'create',
      collection: 'posts',
      itemId: saved.id,
      after,
    });
    return after;
  }

  async update(
    id: number,
    dto: ControllerAdminPostDefaultSaveDto,
    who: SessionPayload,
  ) {
    this.assertBoard(who, dto.board);
    this.requireKo(dto);
    const row = await this.postDefaultRepository.findOneFull(id);
    if (!row) throw new CommonError(AdminPostError.NOT_FOUND);
    this.assertBoard(who, row.board);
    const before = this.full(row);
    if (dto.slug && dto.slug !== row.slug) {
      if (await this.postDefaultRepository.findBySlug(dto.slug))
        throw new CommonError(AdminPostError.SLUG_TAKEN);
      row.slug = dto.slug;
    }
    Object.assign(row, this.columns(dto), {
      board: dto.board,
      status: dto.status ?? row.status,
    });
    // 번역은 언어별로 덮는다. 보내지 않은 언어는 그대로 둔다.
    for (const t of dto.translations) {
      const have = row.translations.find(
        (x) => x.languagesCode === t.languages_code,
      );
      if (have) Object.assign(have, this.translation(t));
      else
        row.translations.push(
          this.postDefaultRepository.translations.create(this.translation(t)),
        );
    }
    if (dto.file_ids) {
      await this.postDefaultRepository.files.delete({ post: { id } });
      row.files = dto.file_ids.map((fileId) =>
        this.postDefaultRepository.files.create({ fileId }),
      );
    }
    await this.postDefaultRepository.repository.save(row);
    const after = await this.get(id);
    await this.revisionService.record({
      actor: who.email,
      action: 'update',
      collection: 'posts',
      itemId: id,
      before,
      after,
    });
    return after;
  }

  async remove(id: number, who: SessionPayload): Promise<void> {
    const row = await this.postDefaultRepository.findOneFull(id);
    if (!row) throw new CommonError(AdminPostError.NOT_FOUND);
    this.assertBoard(who, row.board);
    const before = this.full(row);
    await this.postDefaultRepository.repository.remove(row);
    await this.revisionService.record({
      actor: who.email,
      action: 'delete',
      collection: 'posts',
      itemId: id,
      before,
    });
  }

  /** ids 순서대로 sort = 1..n. 같은 게시판 안에서만 뜻이 있다. */
  async reorder(ids: number[]): Promise<void> {
    await this.postDefaultRepository.repository.manager.transaction(
      async (m) => {
        for (const [i, id] of ids.entries())
          await m.update(PostEntity, { id }, { sort: i + 1 });
      },
    );
  }

  private requireKo(dto: ControllerAdminPostDefaultSaveDto): void {
    const ko = dto.translations.find((t) => t.languages_code === 'ko-KR');
    if (!ko?.title?.trim()) throw new CommonError(AdminPostError.NEED_KO);
  }

  private columns(dto: ControllerAdminPostDefaultSaveDto): Partial<PostEntity> {
    const nul = (v: string | null | undefined) =>
      v === undefined ? undefined : v || null;
    // 예약 시각: 보내지 않으면 그대로, 빈 값·null 이면 지운다.
    const when = (v: string | null | undefined) =>
      v === undefined ? undefined : v ? new Date(v) : null;
    return {
      publishedDate: dto.published_date,
      isPinned: dto.is_pinned ?? undefined,
      isFeatured: dto.is_featured ?? undefined,
      thumbnail: nul(dto.thumbnail),
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
    };
  }

  private translation(
    t: ControllerAdminPostDefaultSaveDto['translations'][number],
  ): Partial<PostTranslationEntity> {
    return {
      languagesCode: t.languages_code,
      title: t.title ?? null,
      summary: t.summary ?? null,
      body: t.body ?? null,
      caseCategoryLabel: t.case_category_label ?? null,
      faqCategory: t.faq_category ?? null,
      seoTitle: t.seo_title ?? null,
      seoDescription: t.seo_description ?? null,
    };
  }

  private row(r: PostEntity): AdminPostRow {
    const ko =
      r.translations?.find((t) => t.languagesCode === 'ko-KR') ??
      r.translations?.[0];
    return {
      id: r.id,
      board: r.board,
      slug: r.slug,
      status: r.status,
      title: ko?.title ?? '',
      published_date: r.publishedDate,
      sort: r.sort,
      is_pinned: r.isPinned,
      thumbnail: r.thumbnail ? `/api/admin/files/${r.thumbnail}` : null,
      history_year: r.historyYear,
      cert_no: r.certNo,
      press_media: r.pressMedia,
      period_start: r.periodStart,
      period_end: r.periodEnd,
      employment_type: r.employmentType,
      is_open_ended: r.isOpenEnded,
      deadline: r.deadline,
      faq_category: ko?.faqCategory ?? null,
      publish_at: iso(r.publishAt),
      unpublish_at: iso(r.unpublishAt),
    };
  }

  private full(r: PostEntity) {
    return {
      id: r.id,
      board: r.board,
      slug: r.slug,
      status: r.status,
      published_date: r.publishedDate,
      sort: r.sort,
      is_pinned: r.isPinned,
      is_featured: r.isFeatured,
      thumbnail: r.thumbnail,
      thumbnail_url: r.thumbnail ? `/api/admin/files/${r.thumbnail}` : null,
      press_media: r.pressMedia,
      period_start: r.periodStart,
      period_end: r.periodEnd,
      cert_state: r.certState,
      cert_no: r.certNo,
      cert_date: r.certDate,
      cert_made_date: r.certMadeDate,
      cert_kind: r.certKind,
      history_year: r.historyYear,
      employment_type: r.employmentType,
      is_open_ended: r.isOpenEnded,
      deadline: r.deadline,
      publish_at: iso(r.publishAt),
      unpublish_at: iso(r.unpublishAt),
      translations: (r.translations ?? []).map((t) => ({
        languages_code: t.languagesCode,
        title: t.title,
        summary: t.summary,
        body: t.body,
        case_category_label: t.caseCategoryLabel,
        faq_category: t.faqCategory,
        seo_title: t.seoTitle,
        seo_description: t.seoDescription,
      })),
      files: (r.files ?? [])
        .filter((f) => f.fileId)
        .map((f) => ({
          id: f.fileId as string,
          name: f.file?.title || f.file?.filenameDownload || '첨부파일',
          url: `/api/admin/files/${f.fileId}`,
        })),
    };
  }
}
