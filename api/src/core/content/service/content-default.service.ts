import { Injectable, Logger } from '@nestjs/common';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository, SelectQueryBuilder } from 'typeorm';
import { FileEntity } from '../../../common/entity/file.entity';
import { PostEntity } from '../../../common/entity/post.entity';
import { CommonError } from '../../../common/error/common-error';
import { ContentError } from '../error/content.error';

/** 게시판 한 쪽의 글 수. 화면의 페이지 번호가 이 값을 전제한다. */
export const PAGE_SIZE = 10;
/** `limit` 으로 늘릴 수 있는 상한. 연혁·증서처럼 한 장에 다 보이는 목록용. */
export const MAX_LIMIT = 100;

const LANGS = ['ko-KR', 'en-US'];
const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;
const UUID_RE = /^[0-9a-fA-F-]{36}$/;

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
    const fallback = process.env.DEFAULT_LANGUAGE ?? 'ko-KR';
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
      data: rows.map((r) => this.present(r as PostRow, language)),
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
    if (!row) throw new CommonError(ContentError.POST_NOT_FOUND);
    const post = this.present(row as PostRow, language, true);
    return { data: { ...post, attachments: this.attachments(row) }, language };
  }

  /**
   * 파일 원본. 게시된 글이 실제로 가리키는 파일만 통과시킨다 — 업로드 폴더에는 초안
   * 첨부도 있으므로 uuid 모양만 보고 흘리면 안 된다.
   * 다른 곳의 이미지를 공개하기 시작하면 fileIsPublic 에 추가해야 한다.
   */
  async publicFile(id: string): Promise<PublicFile> {
    if (!UUID_RE.test(id)) throw new CommonError(ContentError.FILE_ID_INVALID);
    if (!(await this.fileIsPublic(id)))
      throw new CommonError(ContentError.FILE_NOT_FOUND);
    const row = await this.files.findOne({ where: { id } });
    const name = String(row?.filenameDisk ?? '').replace(/[/\\]/g, '');
    const path = join(
      resolve(process.env.UPLOADS_DIR || './data/uploads'),
      name,
    );
    if (!row || !name || !existsSync(path)) {
      // 행은 있는데 디스크에 없다 — 밖으로는 404, 원인은 로그에.
      this.log.warn(`파일 ${id}: 디스크에 없음`);
      throw new CommonError(ContentError.FILE_NOT_FOUND);
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
      .where('p.status = :status', { status: 'published' });
  }

  private async fileIsPublic(id: string): Promise<boolean> {
    const n = await this.posts
      .createQueryBuilder('p')
      .leftJoin('p.files', 'pf')
      .where('p.status = :status', { status: 'published' })
      .andWhere(
        new Brackets((w) => {
          w.where('p.thumbnail = :id', { id })
            .orWhere('p.og_image = :id', { id })
            .orWhere('pf.directus_files_id = :id', { id });
        }),
      )
      .getCount();
    return n > 0;
  }

  /** 요청 언어 + 기본 언어. 한 언어만 실으면 번역 없는 글이 제목 없이 나간다. */
  private languages(requested: string): string[] {
    const fallback = process.env.DEFAULT_LANGUAGE ?? 'ko-KR';
    return requested === fallback ? [requested] : [requested, fallback];
  }

  /**
   * 게시판은 날짜순. 증서·수행실적은 관리 화면에서 끈 순서(sort), 연혁은 연도
   * 내림차순 안에서 sort 다 — 그 장들은 「최신 글」이 아니라 「목록」이다.
   */
  private applyOrder(qb: SelectQueryBuilder<PostEntity>, board?: string): void {
    if (board === 'history') {
      qb.orderBy('p.historyYear', 'DESC')
        .addOrderBy('p.sort', 'ASC', 'NULLS LAST')
        .addOrderBy('p.id', 'ASC');
    } else if (
      board === 'patent' ||
      board === 'copyright' ||
      board === 'case'
    ) {
      qb.orderBy('p.sort', 'ASC', 'NULLS LAST')
        .addOrderBy('p.publishedDate', 'DESC')
        .addOrderBy('p.id', 'ASC');
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
      title: t?.title ?? null,
      summary: t?.summary ?? null,
      case_category_label: t?.caseCategoryLabel ?? null,
      seo_title: t?.seoTitle ?? null,
      seo_description: t?.seoDescription ?? null,
    };
    if (withBody) out.body = t?.body ?? null;
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
