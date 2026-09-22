import { cache } from 'react'
import { MENU_ITEMS } from './menu'
import type { MenuItem } from './menu'

/**
 * 관리 화면에서 고친 메뉴를 읽는다(서버 전용). api 가 안 닿으면 lib/menu.ts 의 예비를 쓴다.
 *
 * 머리글·현재 위치 줄·옆 차례표·바닥글이 모두 이것만 부른다 — 한 요청 안에서는 React `cache` 로
 * 한 번만 읽고, 요청 사이에는 fetch 데이터 캐시(60초, 태그 `menu`)를 쓴다. 머리글은 모든 장에 있어서
 * no-store 로 두면 모든 장이 요청마다 그려지고 api 를 한 번씩 더 부른다. 관리 화면이 저장하면
 * `/api/admin/menu/refresh`(route handler)가 태그를 비워 다음 요청에 바로 보인다.
 *
 * api 가 비었거나(대분류 0) 느리면(2초) 예비로 간다 — 메뉴가 통째로 사라진 머리글보다 낫다.
 * sitemap(app/sitemap.ts)은 아직 lib/menu.ts 를 직접 읽는다(E10 몫) — 이 함수로 바꾸면 된다.
 */

const ORIGIN = process.env.API_ORIGIN || 'http://localhost:3500'
export const MENU_TAG = 'menu'

export type FooterLink = { label: string; href: string }
export type SiteMenu = {
  top: MenuItem[]
  footer: FooterLink[]
  /** cms = 관리 화면 값 · code = lib/menu.ts 예비 */
  source: 'cms' | 'code'
}

type ApiChild = { label: string; href: string; description: string | null; hidden_in_dropdown: boolean }
type ApiNode = { label: string; href: string; match: string[]; children: ApiChild[] }

function toMenuItem(n: ApiNode): MenuItem {
  return {
    title: n.label,
    link: n.href,
    match: n.match,
    // 하위가 없으면 sub 를 두지 않는다 — 빈 드롭다운 상자를 그리지 않게.
    sub: n.children.length
      ? n.children.map((c) => ({ t: c.label, l: c.href, d: c.description ?? '', hidden: c.hidden_in_dropdown || undefined }))
      : undefined,
  }
}

export const CODE_MENU: SiteMenu = { top: MENU_ITEMS, footer: [], source: 'code' }

export const getMenu = cache(async (): Promise<SiteMenu> => {
  try {
    const res = await fetch(`${ORIGIN}/api/content/menu`, {
      next: { revalidate: 60, tags: [MENU_TAG] },
      signal: AbortSignal.timeout(2000),
    })
    if (!res.ok) return CODE_MENU
    const body = (await res.json()) as { data?: { top?: ApiNode[]; footer?: FooterLink[] } }
    const top = body.data?.top ?? []
    if (!top.length) return CODE_MENU
    return { top: top.map(toMenuItem), footer: body.data?.footer ?? [], source: 'cms' }
  } catch {
    return CODE_MENU
  }
})

/**
 * 주소로 메뉴 이름을 찾는다(없으면 fallback). 제품 소개 두 장(M.AX · AI솔루션)이 탭 글자를 메뉴와
 * 맞출 때 쓴다 — 그 장의 구역 차례·링크는 코드(lib/menu.ts)가 정한다. 관리 화면에서 순서를 바꾸거나
 * 숨겨도 장의 구역이 엇갈리지 않고, 이름을 바꾸면 탭 글자만 따라간다.
 */
export async function menuLabelOf(): Promise<(href: string, fallback: string) => string> {
  const { top } = await getMenu()
  const names = new Map<string, string>()
  for (const m of top) for (const s of m.sub ?? []) names.set(s.l, s.t)
  return (href, fallback) => names.get(href) ?? fallback
}
