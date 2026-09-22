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

export type CmsPost = {
  slug: string
  title: string
  summary: string | null
  published_date: string | null
  sort: number | null
  thumbnail: string | null
  thumbnail_size: { w: number; h: number } | null
  cert_state: 'registered' | 'applied' | null
  cert_no: string | null
  cert_date: string | null
  cert_made_date: string | null
  cert_kind: string | null
  history_year: string | null
  case_category_label: string | null
  period_start: string | null
  period_end: string | null
  press_media?: string | null
  employment_type?: string | null
  is_open_ended?: boolean
  deadline?: string | null
  faq_category?: string | null
  /** FAQ 목록과 낱개 조회에만 온다. HTML. */
  body?: string | null
  board?: string
  is_pinned?: boolean
  /** 검색 결과에 쓸 제목·설명. 비어 있으면 제목·요약을 쓴다. */
  seo_title?: string | null
  seo_description?: string | null
  /** 공유 카드 그림(우리 주소). 없으면 대표 이미지 → 사이트 기본 그림. */
  og_image?: string | null
  /** 검색에서 제외 — noindex, 사이트맵에서 뺀다. 사이트에는 그대로 보인다. */
  no_index?: boolean
  /** 마지막 저장 시각(ISO). 사이트맵 lastmod. */
  updated_on?: string | null
}

export type CmsPostFull = CmsPost & { body: string | null; attachments: { id: string; name: string; url: string }[] }

/** 글 하나. 없으면(404) 'missing' — 화면이 notFound() 를 부른다. 못 읽으면 null. */
export async function cmsPost(slug: string): Promise<CmsPostFull | 'missing' | null> {
  try {
    const res = await fetch(`${ORIGIN}/api/content/posts/${encodeURIComponent(slug)}`, { cache: 'no-store' })
    if (res.status === 404) return 'missing'
    if (!res.ok) return null
    const body = (await res.json()) as { data?: CmsPostFull }
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
    const body = (await res.json()) as { data?: CmsPost[] }
    // 빈 목록은 편집자가 다 내린 것이지 장애가 아니다. 예비 목록으로 되돌리지 않는다.
    return Array.isArray(body.data) ? body.data : null
  } catch {
    return null
  }
}

export type CmsPage = { data: CmsPost[]; total: number; pageSize: number }

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
export async function cmsPageContent<T>(key: string, lang = 'ko-KR'): Promise<T | null> {
  try {
    const res = await fetch(`${ORIGIN}/api/content/pages/${encodeURIComponent(key)}?lang=${lang}`, { cache: 'no-store' })
    if (!res.ok) return null
    const body = (await res.json()) as { data?: T }
    return body.data && typeof body.data === 'object' ? body.data : null
  } catch {
    return null
  }
}

export type CmsHomeImage = { url: string; width: number | null; height: number | null; alt: string }
export type CmsHomeLink = { label: string; href: string }
export type CmsHomeBanner = { id: number; image: CmsHomeImage; title: string | null; description: string | null; link: CmsHomeLink | null }
export type CmsHomePopup = {
  id: number
  image: CmsHomeImage | null
  title: string | null
  body: string | null
  link: CmsHomeLink | null
  width: number
  dismiss_days: number
}

/**
 * 메인의 기간 배너(살아 있는 것 하나)와 팝업(뜨는 차례). 관리 화면 「메인 화면」 값.
 * 못 읽으면 배너 없음 · 팝업 없음 — 메인은 기본 머리 그림으로 그린다.
 */
export async function cmsHome(lang = 'ko-KR'): Promise<{ banner: CmsHomeBanner | null; popups: CmsHomePopup[] }> {
  try {
    const res = await fetch(`${ORIGIN}/api/content/home?lang=${lang}`, { cache: 'no-store' })
    if (!res.ok) return { banner: null, popups: [] }
    const body = (await res.json()) as { data?: { banner?: CmsHomeBanner | null; popups?: CmsHomePopup[] } }
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
