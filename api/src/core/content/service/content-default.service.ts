import { Injectable, Logger } from '@nestjs/common';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { AppConfig } from '../../../common/config/app-config';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository, SelectQueryBuilder } from 'typeorm';
import { FileEntity } from '../../../common/entity/file.entity';
import { PostEntity } from '../../../common/entity/post.entity';
import { CommonError } from '../../../common/error/common-error';
import { sanitizeBody } from '../../../common/html/sanitize-body';
import { ContentError } from '../error/content.error';

/** 게시판 한 쪽의 글 수. 화면의 페이지 번호가 이 값을 전제한다. */
export const PAGE_SIZE = 10;
/** `limit` 으로 늘릴 수 있는 상한. 연혁·증서처럼 한 장에 다 보이는 목록용. */
export const MAX_LIMIT = 100;

const LANGS = ['ko-KR', 'en-US'];
/** 공개 사이트 기본 언어. 요청 언어 번역이 없을 때 여기로 떨어진다. */
const DEFAULT_LANGUAGE = 'ko-KR';
const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;
const UUID_RE = /^[0-9a-fA-F-]{36}$/;

/**
 * 지금 공개된 글. 상태만 보지 않는다 — 예약 공개(publish_at) 전과 자동 내림
 * (unpublish_at) 뒤는 status 가 아직 published 여도 안 나간다. admin-schedule 이
 * 1분마다 상태를 맞추지만, 그 1분 사이에도 새지 않게 여기서 시각을 직접 본다.
 */
const LIVE =
  "p.status = 'published' AND (p.publish_at IS NULL OR p.publish_at <= now()) AND (p.unpublish_at IS NULL OR p.unpublish_at > now())";

export interface Attachment {
  id: string;
  name: string;
  url: string;
}

export interface PublicFile {
  path: string;
  type: string;
  size: number;
}

type PostRow = PostEntity & { thumb?: FileEntity | null };

/**
 * 공개 사이트가 읽는 게시판. DB 를 직접 읽는다 — published 만.
 * 응답 모양은 Directus 를 앞에 두던 때와 같다(contracts.md). verify.sh 가 그 약속을 잰다.
 */
@Injectable()
export class ContentDefaultService {
  private readonly log = new Logger(ContentDefaultService.name);

  constructor(
    @InjectRepository(PostEntity)
    private readonly posts: Repository<PostEntity>,
    @InjectRepository(FileEntity)
    private readonly files: Repository<FileEntity>,
  ) {}

  language(requested?: string): string {
    const fallback = DEFAULT_LANGUAGE;
    return requested && LANGS.includes(requested) ? requested : fallback;
  }

  async findPosts(options: {
    board?: string;
    page?: string;
    q?: string;
    startDate?: string;
    endDate?: string;
    lang?: string;
    limit?: string;
  }) {
    const language = this.language(options.lang);
    const keyword = (options.q ?? '').trim().slice(0, 200);
    const limit = Math.min(
      MAX_LIMIT,
      Math.max(1, Number(options.limit) || PAGE_SIZE),
    );
    const page = Math.max(1, Number(options.page) || 1);

    const qb = this.base(language);
    if (options.board)
      qb.andWhere('p.board = :board', { board: options.board });
    if (keyword) {
      // 검색은 언어를 가리지 않는다 — 영어 번역이 걸려 같은 글이 나오는 것은 맞는 결과다.
      qb.andWhere(
        'p.id IN (SELECT posts FROM posts_translations WHERE title ILIKE :kw OR summary ILIKE :kw OR body ILIKE :kw)',
        { kw: `%${keyword}%` },
      );
    }
    // 기간 검색은 화면에 보이는 날짜(published_date) 기준. publish_at 은 예약 장치다.
    if (options.startDate && DAY_RE.test(options.startDate))
      qb.andWhere('p.publishedDate >= :s', { s: options.startDate });
    if (options.endDate && DAY_RE.test(options.endDate))
      qb.andWhere('p.publishedDate <= :e', { e: options.endDate });
    this.applyOrder(qb, options.board);

    const [rows, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();
    return {
      // FAQ 는 답(본문)까지 목록에 싣는다 — 한 장에 접기 목록으로 다 보인다.
      data: rows.map((r) =>
        this.present(r as PostRow, language, options.board === 'faq'),
      ),
      total,
      pageSize: limit,
      language,
    };
  }

  async findPost(slug: string, lang?: string) {
    const language = this.language(lang);
    const row = await this.base(language)
      .leftJoinAndSelect('p.files', 'pf')
      .leftJoinAndSelect('pf.file', 'ff')
      .andWhere('p.slug = :slug', { slug })
      .getOne();
    if (!row) throw CommonError.createByErrorCode(ContentError.POST_NOT_FOUND);
    const post = this.present(row as PostRow, language, true);
    return { data: { ...post, attachments: this.attachments(row) }, language };
  }

  /**
   * 파일 원본. 게시된 글이 실제로 가리키는 파일만 통과시킨다 — 대표 그림 · 공유 그림 ·
   * 첨부 · 본문 HTML 안의 그림. 업로드 폴더에는 초안 첨부도 있으므로 uuid 모양만 보고
   * 흘리면 안 된다.
   * 다른 곳의 이미지를 공개하기 시작하면 fileIsPublic 에 추가해야 한다.
   */
  async publicFile(id: string): Promise<PublicFile> {
    if (!UUID_RE.test(id))
      throw CommonError.createByErrorCode(ContentError.FILE_ID_INVALID);
    if (!(await this.fileIsPublic(id)))
      throw CommonError.createByErrorCode(ContentError.FILE_NOT_FOUND);
    const row = await this.files.findOne({ where: { id } });
    const name = String(row?.filenameDisk ?? '').replace(/[/\\]/g, '');
    const path = join(AppConfig.uploadsDir, name);
    if (!row || !name || !existsSync(path)) {
      // 행은 있는데 디스크에 없다 — 밖으로는 404, 원인은 로그에.
      this.log.warn(`파일 ${id}: 디스크에 없음`);
      throw CommonError.createByErrorCode(ContentError.FILE_NOT_FOUND);
    }
    return {
      path,
      type: row.type ?? 'application/octet-stream',
      size: statSync(path).size,
    };
  }

  stream(path: string) {
    return createReadStream(path);
  }

  private base(language: string): SelectQueryBuilder<PostEntity> {
    return this.posts
      .createQueryBuilder('p')
      .leftJoinAndSelect(
        'p.translations',
        't',
        't.languages_code IN (:...langs)',
        { langs: this.languages(language) },
      )
      .leftJoinAndMapOne('p.thumb', FileEntity, 'f', 'f.id = p.thumbnail')
      .where(LIVE);
  }

  private async fileIsPublic(id: string): Promise<boolean> {
    // 정적 장의 공유 그림(관리 화면 「SEO」). 장은 늘 공개라 조건이 없다.
    const pageRows: unknown[] = await this.files.manager.query(
      'SELECT 1 FROM page_meta WHERE og_image = $1 LIMIT 1',
      [id],
    );
    if (pageRows.length > 0) return true;
    const n = await this.posts
      .createQueryBuilder('p')
      .leftJoin('p.files', 'pf')
      // 목록과 같은 조건 — 예약 전·내린 뒤의 첨부가 파일 주소로 새지 않게.
      .where(LIVE)
      .andWhere(
        new Brackets((w) => {
          w.where('p.thumbnail = :id', { id })
            .orWhere('p.og_image = :id', { id })
            .orWhere('pf.directus_files_id = :id', { id })
            // 편집기로 본문에 넣은 그림. 본문 HTML 이 이 주소를 품고 있으면 공개다.
            // id 는 위에서 UUID_RE 로 걸렀지만 문자열은 바인딩으로만 넣는다.
            .orWhere(
              'p.id IN (SELECT tb.posts FROM posts_translations tb WHERE tb.body LIKE :inBody)',
              { inBody: `%/api/content/assets/${id}%` },
            );
        }),
      )
      .getCount();
    if (n > 0) return true;
    // 페이지 글(page_contents)에 넣은 그림. 저장한 것이 곧 공개다. 값은 {"id":"<uuid>"} 모양이라 따옴표째 찾는다.
    const pages: Array<{ n: string }> = await this.posts.query(
      `SELECT count(*) AS n FROM page_contents WHERE content::text LIKE '%"' || $1::text || '"%'`,
      [id],
    );
    if (Number(pages[0]?.n ?? 0) > 0) return true;
    // 메인 배너·팝업의 그림. 살아 있는 동안(보이기 · 기간 안)만 공개다 — 예약해 둔 배너 그림이 먼저 새지 않게.
    const home: Array<{ n: string }> = await this.posts.query(
      `SELECT (SELECT count(*) FROM home_banners b
                WHERE b.image = $1::uuid AND b.visible
                  AND (b.starts_at IS NULL OR b.starts_at <= now())
                  AND (b.ends_at IS NULL OR b.ends_at > now()))
            + (SELECT count(*) FROM home_popups p
                WHERE p.image = $1::uuid AND p.visible
                  AND (p.starts_at IS NULL OR p.starts_at <= now())
                  AND (p.ends_at IS NULL OR p.ends_at > now())) AS n`,
      [id],
    );
    return Number(home[0]?.n ?? 0) > 0;
  }

  /** 요청 언어 + 기본 언어. 한 언어만 실으면 번역 없는 글이 제목 없이 나간다. */
  private languages(requested: string): string[] {
    const fallback = DEFAULT_LANGUAGE;
    return requested === fallback ? [requested] : [requested, fallback];
  }

  /**
   * 게시판(공지·보도·뉴스)은 날짜순. 증서·수행실적·FAQ 는 관리 화면에서 끈 순서(sort),
   * 연혁은 연도 내림차순 안에서 sort, 채용은 마감 임박 순 — 목록 장은 「최신 글」이 아니다.
   */
  private applyOrder(qb: SelectQueryBuilder<PostEntity>, board?: string): void {
    if (board === 'history') {
      qb.orderBy('p.historyYear', 'DESC')
        .addOrderBy('p.sort', 'ASC', 'NULLS LAST')
        .addOrderBy('p.id', 'ASC');
    } else if (
      board === 'patent' ||
      board === 'copyright' ||
      board === 'case' ||
      board === 'faq'
    ) {
      qb.orderBy('p.sort', 'ASC', 'NULLS LAST')
        .addOrderBy('p.publishedDate', 'DESC')
        .addOrderBy('p.id', 'ASC');
    } else if (board === 'recruit') {
      // 채용은 마감 임박 순. 상시 채용·마감일 없는 것은 뒤로.
      qb.orderBy('p.isOpenEnded', 'ASC')
        .addOrderBy('p.deadline', 'ASC', 'NULLS LAST')
        .addOrderBy('p.publishedDate', 'DESC')
        .addOrderBy('p.id', 'DESC');
    } else {
      qb.orderBy('p.isPinned', 'DESC')
        .addOrderBy('p.publishedDate', 'DESC')
        .addOrderBy('p.id', 'DESC');
    }
  }

  /**
   * 번역 한 벌을 본문 옆에 편다. 요청 언어가 없으면 기본 언어로 떨어뜨린다.
   * thumbnail 은 우리 주소 문자열, 치수는 thumbnail_size 에 — 게시판 JS 가 문자열로 읽는다.
   */
  private present(r: PostRow, language: string, withBody = false) {
    const t =
      r.translations?.find((x) => x.languagesCode === language) ??
      r.translations?.[0];
    const out: Record<string, unknown> = {
      id: r.id,
      board: r.board,
      slug: r.slug,
      published_date: r.publishedDate,
      publish_at: r.publishAt,
      unpublish_at: r.unpublishAt,
      is_pinned: r.isPinned,
      sort: r.sort,
      thumbnail: r.thumbnail ? `/api/content/assets/${r.thumbnail}` : null,
      thumbnail_size:
        r.thumb && r.thumb.width && r.thumb.height
          ? { w: r.thumb.width, h: r.thumb.height }
          : null,
      cert_state: r.certState,
      cert_no: r.certNo,
      cert_date: r.certDate,
      cert_made_date: r.certMadeDate,
      cert_kind: r.certKind,
      history_year: r.historyYear,
      period_start: r.periodStart,
      period_end: r.periodEnd,
      press_media: r.pressMedia,
      employment_type: r.employmentType,
      is_open_ended: r.isOpenEnded,
      deadline: r.deadline,
      title: t?.title ?? null,
      summary: t?.summary ?? null,
      case_category_label: t?.caseCategoryLabel ?? null,
      faq_category: t?.faqCategory ?? null,
      seo_title: t?.seoTitle ?? null,
      seo_description: t?.seoDescription ?? null,
      // 공유 카드 그림(없으면 화면이 대표 이미지 → 사이트 기본 그림) · 검색 제외 · 사이트맵 lastmod.
      og_image: r.ogImage ? `/api/content/assets/${r.ogImage}` : null,
      no_index: r.noIndex,
      updated_on: r.updatedOn ? new Date(r.updatedOn).toISOString() : null,
    };
    // 저장할 때 이미 다듬지만, 되돌리기·옛 행·DB 직접 수정이 그 길을 비켜 갈 수 있다 — 내보낼 때 한 번 더.
    if (withBody) out.body = sanitizeBody(t?.body);
    return out;
  }

  private attachments(r: PostEntity): Attachment[] {
    return (r.files ?? [])
      .filter((f) => f.fileId)
      .map((f) => ({
        id: f.fileId as string,
        name: f.file?.title || f.file?.filenameDownload || '첨부파일',
        url: `/api/content/assets/${f.fileId}`,
      }));
  }
}
