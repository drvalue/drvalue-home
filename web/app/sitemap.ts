import type { MetadataRoute } from 'next'
import { CLEAN_PATHS } from '@/lib/phpRoutes.mjs'
import { MENU_ITEMS } from '@/lib/menu'
import { SITE_ORIGIN } from '@/lib/seo'

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
 * 뺀 것:
 * - 글 작성 안내(`notify_form`) — 관리 화면으로 넘기는 자리다. 그 페이지 자신도 noIndex 다.
 * - 옛 특허 화면(`patent_old`) — 메뉴에 없다.
 * - 메뉴에서 내린 네 장(스마트 팩토리 사업 · AI 솔루션 개발 · GrowTalk · GrowXD).
 *   **주소는 살아 있다** — 검색으로 들어오는 사람은 그대로 본다. noIndex 도 안 건다.
 *   다만 사이트 안에서 갈 길이 없어진 장을 목록으로 내주지는 않는다. 메뉴에 없는
 *   `patent_old` 를 뺀 것과 같은 규칙이다.
 */

const SKIP = new Set([
  '/page/support/notify_form',
  '/page/tech/patent_old',
  '/page/business/smart_fac',
  '/page/business/ai_sol',
  '/page/service/growtok',
  '/page/service/growxd',
])

/** 얼마나 자주 바뀌는가. 게시판이 제일 잦고 회사 정보는 드물다. */
function rank(path: string): { changeFrequency: 'daily' | 'weekly' | 'monthly'; priority: number } {
  if (path === '/') return { changeFrequency: 'weekly', priority: 1 }
  if (path.startsWith('/page/support/')) return { changeFrequency: 'daily', priority: 0.8 }
  if (path.startsWith('/page/service/') || path.startsWith('/page/business/'))
    return { changeFrequency: 'monthly', priority: 0.9 }
  return { changeFrequency: 'monthly', priority: 0.6 }
}

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()
  const fromMenu = MENU_ITEMS.flatMap((m) => [m.link, ...(m.sub ?? []).map((s) => s.l)])
  const paths = [...new Set(['/', ...(CLEAN_PATHS as string[]), ...fromMenu])].filter(
    (p) => !SKIP.has(p),
  )
  return paths.map((path) => ({
    url: `${SITE_ORIGIN}${path}`,
    lastModified: now,
    ...rank(path),
  }))
}
