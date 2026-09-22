import type { MetadataRoute } from 'next'
import { CLEAN_PATHS } from '@/lib/phpRoutes.mjs'
import { MENU_ITEMS } from '@/lib/menu'
import { pageOverrides, SITE_ORIGIN } from '@/lib/seo'
import type { CmsPost } from '@/lib/cms'
import { BOARDS, detailPath, isBoardKey } from './(site)/page/support/board/boards'

/**
 * 검색엔진에게 주는 페이지 목록.
 *
 * 주소를 여기 손으로 적지 않는다 — `lib/phpRoutes.mjs` 가 이미 단 하나의
 * 목록이고, 리다이렉트와 대조 검사도 거기서 읽는다. 새 페이지를 거기 넣으면
 * 이 파일은 저절로 따라간다.
 *
 * 다만 `phpRoutes.mjs` 는 **원본 PHP 에 있던 주소**의 목록이다. 새로 만든
 * 페이지는 PHP 짝이 없어 거기 안 들어간다. 그래서 메뉴(`lib/menu.ts`)에 실린
 * 주소를 합친다 — 메뉴에 올린 장은 검색엔진도 알아야 하고, 메뉴를 고치면
 * 여기가 저절로 따라간다.
 *
 * 게시판 글(공지·보도·뉴스·채용)은 글마다 한 줄, lastmod 는 마지막 저장 시각(updated_on).
 * 정적 장에는 lastmod 를 달지 않는다 — 전에는 요청 시각을 달아 모든 장이 늘 「방금 바뀜」이었다
 * (검색엔진은 그런 값을 믿지 않는다). 요청마다 만든다(글이 바로 들어가게).
 *
 * 뺀 것:
 * - 글 작성 안내(`notify_form`) — 관리 화면으로 넘기는 자리다. 그 페이지 자신도 noIndex 다.
 * - 옛 특허 화면(`patent_old`) — 메뉴에 없고 특허 장과 같은 내용이다(noIndex).
 * - 메뉴에서 내린 네 장(스마트 팩토리 사업 · AI 솔루션 개발 · GrowTalk · GrowXD).
 *   **주소는 살아 있다** — 검색으로 들어오는 사람은 그대로 본다. noIndex 도 안 건다.
 *   다만 사이트 안에서 갈 길이 없어진 장을 목록으로 내주지는 않는다.
 * - 관리 화면 「SEO」나 글에서 「검색에서 제외」한 장·글.
 * - 글이 하나도 없는 게시판(그동안 그 목록 장은 noIndex 다).
 */
export const dynamic = 'force-dynamic'

const SKIP = new Set([
  '/page/support/notify_form',
  '/page/tech/patent_old',
  '/page/business/smart_fac',
  '/page/business/ai_sol',
  '/page/service/growtok',
  '/page/service/growxd',
])

/** 글이 따로 주소를 갖는 게시판. 나머지(증서·수행실적·연혁·FAQ)는 목록 장 하나에 다 보인다. */
const POST_BOARDS = ['notice', 'press', 'news', 'recruit'] as const
/** 비면 목록 장을 빼는 게시판(글이 있어야 뜻이 있는 장). */
const EMPTY_SKIP: Record<string, string> = {
  news: '/page/support/news',
  recruit: '/page/support/recruit',
  faq: '/page/support/faq',
}

const API = process.env.API_ORIGIN || 'http://localhost:3500'

/** 게시판 글 전부(100개씩). 못 읽으면 null — 그 게시판은 목록 장만 남기고 빼지 않는다. */
async function allPosts(board: string): Promise<CmsPost[] | null> {
  const out: CmsPost[] = []
  try {
    for (let page = 1; page <= 50; page++) {
      const res = await fetch(`${API}/api/content/posts?board=${board}&limit=100&page=${page}`, { cache: 'no-store' })
      if (!res.ok) return null
      const body = (await res.json()) as { data?: CmsPost[]; total?: number }
      const rows = Array.isArray(body.data) ? body.data : []
      out.push(...rows)
      if (rows.length < 100 || out.length >= Number(body.total ?? 0)) break
    }
    return out
  } catch {
    return null
  }
}

function postPath(board: string, slug: string): string {
  return isBoardKey(board) ? detailPath(BOARDS[board], slug) : `/page/support/${board}/${encodeURIComponent(slug)}`
}

/** 얼마나 자주 바뀌는가. 게시판이 제일 잦고 회사 정보는 드물다. */
function rank(path: string): { changeFrequency: 'daily' | 'weekly' | 'monthly'; priority: number } {
  if (path === '/') return { changeFrequency: 'weekly', priority: 1 }
  if (path.startsWith('/page/support/')) return { changeFrequency: 'daily', priority: 0.8 }
  if (path.startsWith('/page/service/') || path.startsWith('/page/business/'))
    return { changeFrequency: 'monthly', priority: 0.9 }
  return { changeFrequency: 'monthly', priority: 0.6 }
}

const latest = (rows: CmsPost[]): Date | undefined => {
  const t = rows.map((r) => Date.parse(r.updated_on ?? '')).filter((n) => !Number.isNaN(n))
  return t.length ? new Date(Math.max(...t)) : undefined
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [overrides, ...boards] = await Promise.all([
    pageOverrides(),
    ...[...POST_BOARDS, 'faq'].map((b) => allPosts(b)),
  ])
  const byBoard = new Map([...POST_BOARDS, 'faq'].map((b, i) => [b, boards[i]]))
  const hidden = new Set(overrides.filter((o) => o.no_index).map((o) => o.path))
  for (const [board, path] of Object.entries(EMPTY_SKIP)) {
    const rows = byBoard.get(board)
    if (rows && rows.length === 0) hidden.add(path)
  }

  const fromMenu = MENU_ITEMS.flatMap((m) => [m.link, ...(m.sub ?? []).map((s) => s.l)])
  const paths = [...new Set(['/', ...(CLEAN_PATHS as string[]), ...fromMenu])].filter(
    (p) => !SKIP.has(p) && !hidden.has(p),
  )
  const listLastmod = new Map<string, Date | undefined>()
  for (const b of [...POST_BOARDS, 'faq']) {
    const rows = byBoard.get(b)
    if (rows?.length) listLastmod.set(`/page/support/${b}`, latest(rows))
  }

  const pages: MetadataRoute.Sitemap = paths.map((path) => {
    const lastModified = listLastmod.get(path)
    return { url: `${SITE_ORIGIN}${path}`, ...(lastModified ? { lastModified } : {}), ...rank(path) }
  })
  const posts: MetadataRoute.Sitemap = POST_BOARDS.flatMap((board) =>
    (byBoard.get(board) ?? [])
      .filter((p) => !p.no_index)
      .map((p) => ({
        url: `${SITE_ORIGIN}${postPath(board, p.slug)}`,
        ...(p.updated_on ? { lastModified: new Date(p.updated_on) } : {}),
        changeFrequency: 'monthly' as const,
        priority: 0.5,
      })),
  )
  return [...pages, ...posts]
}
