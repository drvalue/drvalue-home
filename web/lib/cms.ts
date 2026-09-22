/**
 * 서버에서 CMS 목록을 읽는다 — 특허·저작권·수행실적·연혁처럼 한 장에 다 보이는 것.
 *
 * 브라우저의 `/api` 되넘김이 서버에는 없으므로 Nest 주소를 직접 쓴다
 * (next.config.mjs 의 rewrite 와 같은 환경변수). 실패하면 null 을 돌려주고
 * 화면이 코드에 남긴 예비 목록을 쓴다 — CMS 가 죽어도 장이 비면 안 된다.
 * 5분 캐시. 관리 화면에서 고친 것이 바로 안 보이는 이유가 이것이다.
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
}

const ORIGIN = process.env.API_ORIGIN || 'http://localhost:3500'

export async function cmsBoard(board: string, limit = 100): Promise<CmsPost[] | null> {
  try {
    const res = await fetch(`${ORIGIN}/api/content/posts?board=${board}&limit=${limit}`, {
      next: { revalidate: 300 },
    })
    if (!res.ok) return null
    const body = (await res.json()) as { data?: CmsPost[] }
    return Array.isArray(body.data) && body.data.length ? body.data : null
  } catch {
    return null
  }
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
