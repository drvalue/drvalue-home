import { Injectable, Logger } from '@nestjs/common';
import {
  DirectusRow,
  DirectusService,
} from '../../../common/directus/directus.service';
import { CommonError } from '../../../common/error/common-error';
import { ContentError } from '../error/content.error';

/** 게시판 한 쪽의 글 수. 화면의 페이지 번호가 이 값을 전제한다. */
export const PAGE_SIZE = 10;
/** `limit` 으로 늘릴 수 있는 상한. 연혁·증서처럼 한 장에 다 보이는 목록용. */
export const MAX_LIMIT = 100;

/** 목록·상세가 같이 내보내는 칸. 게시판마다 쓰는 칸이 다르지만 없는 값은 null 로 그냥 나간다. */
const LIST_FIELDS = [
  'id,board,slug,published_date,publish_at,unpublish_at,is_pinned,sort',
  'thumbnail.id,thumbnail.width,thumbnail.height',
  'cert_state,cert_no,cert_date,cert_made_date,cert_kind,history_year',
  'case_category,period_start,period_end',
  'translations.*',
].join(',');

const PUBLISHED = { status: { _eq: 'published' } };
const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;
const UUID_RE = /^[0-9a-fA-F-]{36}$/;

export interface Attachment {
  id: string;
  name: string;
  url: string;
}

export interface UpstreamFile {
  status: number;
  headers: Headers;
  body: ReadableStream<Uint8Array>;
}

@Injectable()
export class ContentDefaultService {
  private readonly log = new Logger(ContentDefaultService.name);

  constructor(private readonly directus: DirectusService) {}

  async findPosts(options: {
    board?: string;
    page?: string;
    q?: string;
    startDate?: string;
    endDate?: string;
    lang?: string;
    limit?: string;
  }) {
    this.directus.assertConfigured();
    const language = this.directus.language(options.lang);
    const keyword = (options.q ?? '').trim().slice(0, 200);
    const and: unknown[] = [
      PUBLISHED,
      ...(options.board ? [{ board: { _eq: options.board } }] : []),
    ];
    if (keyword) {
      and.push({
        _or: ['title', 'summary', 'body'].map((f) => ({
          translations: { [f]: { _icontains: keyword } },
        })),
      });
    }
    // 기간 검색은 화면에 보이는 날짜(published_date) 기준. publish_at 은 예약 장치다.
    if (options.startDate && DAY_RE.test(options.startDate))
      and.push({ published_date: { _gte: options.startDate } });
    if (options.endDate && DAY_RE.test(options.endDate))
      and.push({ published_date: { _lte: options.endDate } });

    const limit = Math.min(
      MAX_LIMIT,
      Math.max(1, Number(options.limit) || PAGE_SIZE),
    );
    const res = await this.directus.get<DirectusRow[]>('/items/posts', {
      filter: JSON.stringify({ _and: and }),
      fields: LIST_FIELDS,
      deep: JSON.stringify({
        translations: {
          _filter: {
            languages_code: { _in: this.directus.languages(language) },
          },
        },
      }),
      sort: this.sortOf(options.board),
      limit,
      page: Math.max(1, Number(options.page) || 1),
      meta: 'filter_count',
    });
    const data = (res.data ?? []).map((row) =>
      this.present(this.flat(row, language)),
    );
    return {
      data,
      total: res.meta?.['filter_count'] ?? null,
      pageSize: limit,
      language,
    };
  }

  async findPost(slug: string, lang?: string) {
    this.directus.assertConfigured();
    const language = this.directus.language(lang);
    const res = await this.directus.get<DirectusRow[]>('/items/posts', {
      filter: JSON.stringify({ _and: [PUBLISHED, { slug: { _eq: slug } }] }),
      fields:
        '*,thumbnail.id,thumbnail.width,thumbnail.height,translations.*,attachments.directus_files_id.id,' +
        'attachments.directus_files_id.title,attachments.directus_files_id.filename_download',
      deep: JSON.stringify({
        translations: {
          _filter: {
            languages_code: { _in: this.directus.languages(language) },
          },
        },
      }),
      limit: 1,
    });
    const row = res.data?.[0];
    if (!row) throw new CommonError(ContentError.POST_NOT_FOUND);
    const post = this.present(this.flat(row, language));
    return {
      data: { ...post, attachments: this.attachments(post['attachments']) },
      language,
    };
  }

  /**
   * 파일 원본. 게시된 글이 실제로 가리키는 파일만 통과시킨다 — 서비스 토큰은
   * directus_files 전체를 읽을 수 있어서, uuid 모양만 보고 흘리면 초안 첨부도 나간다.
   * 다른 컬렉션의 이미지를 쓰기 시작하면 fileIsPublic 에 추가해야 한다.
   */
  async fetchFile(id: string): Promise<UpstreamFile> {
    this.directus.assertConfigured();
    if (!UUID_RE.test(id)) throw new CommonError(ContentError.FILE_ID_INVALID);
    if (!(await this.fileIsPublic(id)))
      throw new CommonError(ContentError.FILE_NOT_FOUND);
    const up = await this.directus.file(id);
    if (!up.ok || !up.body) {
      // 밖으로는 404 로 뭉개되 진짜 코드는 로그에 남긴다. 권한 사고를 "없는 파일" 로 읽지 않기 위해서다.
      this.log.warn(`파일 ${id}: Directus ${up.status}`);
      throw new CommonError(
        up.status >= 500
          ? ContentError.FILE_UPSTREAM_ERROR
          : ContentError.FILE_NOT_FOUND,
      );
    }
    return { status: up.status, headers: up.headers, body: up.body };
  }

  private async fileIsPublic(id: string): Promise<boolean> {
    const res = await this.directus.get<DirectusRow[]>('/items/posts', {
      filter: JSON.stringify({
        _and: [
          PUBLISHED,
          {
            _or: [
              { thumbnail: { _eq: id } },
              { og_image: { _eq: id } },
              { attachments: { directus_files_id: { _eq: id } } },
            ],
          },
        ],
      }),
      fields: 'id',
      limit: 1,
    });
    return (res.data?.length ?? 0) > 0;
  }

  /**
   * `translations: [{...}]` 한 벌을 본문 옆에 편다. 요청 언어가 없으면 첫 번역으로
   * 떨어뜨린다. 번역 행의 id·언어·부모 참조(posts)는 버린다 — 글 번호를 덮어쓴다.
   */
  private flat(row: DirectusRow, language?: string): DirectusRow {
    const { translations, ...rest } = row as DirectusRow & {
      translations?: DirectusRow[];
    };
    const rows = Array.isArray(translations) ? translations : [];
    const t =
      rows.find((r) => r['languages_code'] === language) ?? rows[0] ?? {};
    const {
      id: _id,
      languages_code: _lang,
      posts: _owner,
      posts_id: _owner2,
      ...text
    } = t;
    return { ...rest, ...text };
  }

  /**
   * thumbnail 을 우리 주소(문자열)로 바꾸고 치수를 `thumbnail_size` 에 따로 둔다.
   * 게시판 화면 JS 가 thumbnail 을 문자열로 읽으므로 모양을 바꾸지 않는다.
   * 치수는 증서 카드가 그림 오기 전에 자리를 잡는 데 쓴다.
   */
  private present(row: DirectusRow): DirectusRow {
    const t = row['thumbnail'] as DirectusRow | string | null | undefined;
    const id = typeof t === 'string' ? t : (t?.['id'] as string | undefined);
    const size =
      t &&
      typeof t === 'object' &&
      typeof t['width'] === 'number' &&
      typeof t['height'] === 'number'
        ? { w: t['width'], h: t['height'] }
        : null;
    return { ...row, thumbnail: this.assetUrl(id), thumbnail_size: size };
  }

  /**
   * 게시판은 날짜순. 증서·수행실적은 관리 화면에서 끈 순서(sort), 연혁은 연도
   * 내림차순 안에서 sort 다 — 그 장들은 「최신 글」이 아니라 「목록」이다.
   */
  private sortOf(board?: string): string {
    if (board === 'history') return '-history_year,sort,id';
    if (board === 'patent' || board === 'copyright' || board === 'case')
      return 'sort,-published_date,id';
    return '-is_pinned,-published_date,-id';
  }

  private assetUrl(id: unknown): string | null {
    return typeof id === 'string' && id ? `/api/content/assets/${id}` : null;
  }

  private attachments(rows: unknown): Attachment[] {
    if (!Array.isArray(rows)) return [];
    return rows.flatMap((r) => {
      const f = (r as DirectusRow)?.['directus_files_id'] as
        DirectusRow | undefined;
      const id = f?.['id'];
      if (typeof id !== 'string' || !id) return [];
      const name =
        (f?.['title'] as string) ||
        (f?.['filename_download'] as string) ||
        '첨부파일';
      return [{ id, name, url: `/api/content/assets/${id}` }];
    });
  }
}
