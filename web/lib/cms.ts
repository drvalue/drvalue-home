/**
 * 서버에서 CMS 목록을 읽는다 — 특허·저작권·수행실적·연혁처럼 한 장에 다 보이는 것.
 *
 * 브라우저의 `/api` 되넘김이 서버에는 없으므로 Nest 주소를 직접 쓴다
 * (next.config.mjs 의 rewrite 와 같은 환경변수). 응답이 안 오면(non-2xx·예외) null 을
 * 돌려주고 화면이 코드에 남긴 예비 목록을 쓴다 — CMS 가 죽어도 장이 비면 안 된다.
 * 빈 배열은 null 이 아니다. 편집자가 전부 내린 것이다.
 * 요청마다 DB 에서 읽는다. api→DB 직결이라 비용이 없다. 저장 즉시 반영이 곧 동기화다.
 * 이 함수를 쓰는 장은 `export const dynamic = 'force-dynamic'` 을 둔다 — 안 두면 빌드 때
 * 한 번 그린 것이 굳는다.
 */
import type * as Api from './api-types.gen'
import type { ApiResponse } from './api-types.gen'
import type { PageContentMap, PageKey } from './page-types.gen'

// 모양은 api 문서에서 만든 형(lib/api-types.gen.ts). 손으로 옮겨 적지 않는다.
/** 공개 목록의 글 한 건(GET /api/content/posts 의 data[]). */
export type CmsPost = Api.ControllerContentDefaultPostResponseDto
/** 공개 글 하나(GET /api/content/posts/:slug 의 data) — 본문·첨부 포함. */
export type CmsPostFull = Api.ControllerContentDefaultPostDetailResponseDto

/** 글 하나. 없으면(404) 'missing' — 화면이 notFound() 를 부른다. 못 읽으면 null. */
export async function cmsPost(slug: string): Promise<CmsPostFull | 'missing' | null> {
  try {
    const res = await fetch(`${ORIGIN}/api/content/posts/${encodeURIComponent(slug)}`, { cache: 'no-store' })
    if (res.status === 404) return 'missing'
    if (!res.ok) return null
    const body = (await res.json()) as Partial<ApiResponse<'GET /api/content/posts/{slug}'>>
    return body.data ?? null
  } catch {
    return null
  }
}

const ORIGIN = process.env.API_ORIGIN || 'http://localhost:3500'

export async function cmsBoard(board: string, limit = 100): Promise<CmsPost[] | null> {
  try {
    const res = await fetch(`${ORIGIN}/api/content/posts?board=${board}&limit=${limit}`, {
      cache: 'no-store',
    })
    if (!res.ok) return null
    const body = (await res.json()) as Partial<ApiResponse<'GET /api/content/posts'>>
    // 빈 목록은 편집자가 다 내린 것이지 장애가 아니다. 예비 목록으로 되돌리지 않는다.
    return Array.isArray(body.data) ? body.data : null
  } catch {
    return null
  }
}

/** 공개 목록 봉투에서 화면이 쓰는 칸(data · total · pageSize) — api 문서의 것. */
export type CmsPage = Pick<ApiResponse<'GET /api/content/posts'>, 'data' | 'total' | 'pageSize'>

/**
 * 게시판 한 쪽(공지·보도·뉴스). 순서는 api 가 정한다(고정 글 → 날짜).
 * 검색어·기간은 api 가 거른다. 못 읽으면 null — 화면이 「불러오지 못했습니다」를 그린다.
 */
export async function cmsBoardPage(
  board: string,
  q: { page?: number; q?: string; startDate?: string; endDate?: string } = {},
): Promise<CmsPage | null> {
  const qs = new URLSearchParams({ board })
  if (q.page && q.page > 1) qs.set('page', String(q.page))
  if (q.q) qs.set('q', q.q)
  if (q.startDate) qs.set('startDate', q.startDate)
  if (q.endDate) qs.set('endDate', q.endDate)
  try {
    const res = await fetch(`${ORIGIN}/api/content/posts?${qs}`, { cache: 'no-store' })
    if (!res.ok) return null
    const body = (await res.json()) as Partial<CmsPage>
    if (!Array.isArray(body.data)) return null
    return { data: body.data, total: Number(body.total) || 0, pageSize: Number(body.pageSize) || 10 }
  } catch {
    return null
  }
}

/**
 * 페이지 글(관리 화면 「페이지」에서 고친 것). 칸 모양은 api 의 core/page/schema 그대로다.
 * 못 읽거나 행이 없으면 null — 그 장은 코드의 기본 글(content.ts)로 그린다.
 * 요청 언어의 글이 없으면 api 가 기본 언어(ko-KR) 글을 준다.
 */
export async function cmsPageContent<K extends PageKey>(key: K, lang = 'ko-KR'): Promise<PageContentMap[K] | null> {
  try {
    const res = await fetch(`${ORIGIN}/api/content/pages/${encodeURIComponent(key)}?lang=${lang}`, { cache: 'no-store' })
    if (!res.ok) return null
    // 글의 모양은 key 가 정한다(lib/page-types.gen.ts — api 의 칸 구조에서 만든 형).
    const body = (await res.json()) as { data?: PageContentMap[K] }
    return body.data && typeof body.data === 'object' ? body.data : null
  } catch {
    return null
  }
}

export type CmsHomeImage = Api.ControllerHomeDefaultPublicImageDto
export type CmsHomeLink = Api.ControllerHomeDefaultPublicLinkDto
export type CmsHomeBanner = Api.ControllerHomeDefaultPublicBannerDto
export type CmsHomePopup = Api.ControllerHomeDefaultPublicPopupDto

/**
 * 메인의 기간 배너(살아 있는 것 하나)와 팝업(뜨는 차례). 관리 화면 「메인 화면」 값.
 * 못 읽으면 배너 없음 · 팝업 없음 — 메인은 기본 머리 그림으로 그린다.
 */
export async function cmsHome(lang = 'ko-KR'): Promise<{ banner: CmsHomeBanner | null; popups: CmsHomePopup[] }> {
  try {
    const res = await fetch(`${ORIGIN}/api/content/home?lang=${lang}`, { cache: 'no-store' })
    if (!res.ok) return { banner: null, popups: [] }
    const body = (await res.json()) as Partial<ApiResponse<'GET /api/content/home'>>
    return { banner: body.data?.banner ?? null, popups: Array.isArray(body.data?.popups) ? body.data.popups : [] }
  } catch {
    return { banner: null, popups: [] }
  }
}

/** 게시판의 공개 글 수. 못 읽으면 null(화면이 예비 숫자를 쓴다). 메인 머리 그림의 숫자가 이것이다. */
export async function cmsBoardTotal(board: string): Promise<number | null> {
  try {
    const res = await fetch(`${ORIGIN}/api/content/posts?board=${board}&limit=1`, { cache: 'no-store' })
    if (!res.ok) return null
    const body = (await res.json()) as { total?: unknown }
    return typeof body.total === 'number' ? body.total : null
  } catch {
    return null
  }
}

/** 페이지 글의 그림 칸 → 공개 주소. 비었으면 null. */
export function pageImageSrc(img: { id: string | null } | null | undefined): string | null {
  return img?.id ? `/api/content/assets/${img.id}` : null
}

/** '2025-06-10' → '2025.06.10'. 증서 장의 표기다. */
export function dots(iso: string | null | undefined): string {
  return (iso ?? '').slice(0, 10).replace(/-/g, '.')
}

/** '2025-10-01' → '25.10'. 수행실적 표의 표기다(월까지만 있다). */
export function yymm(iso: string | null | undefined): string {
  const m = /^(\d{2})(\d{2})-(\d{2})/.exec(iso ?? '')
  return m ? `${m[2]}.${m[3]}` : ''
}
