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

/**
 * 메뉴 설명의 숫자 자리표시 — 화면에 적는 숫자는 자료에서 센다(손으로 적은 「등록 1건 · 출원 5건」 이 글이
 * 늘어도 그대로였다). 설명에 `{patent.registered}` 처럼 적으면 공개 게시판의 글 수로 바꾼다.
 *   {patent} 특허 전체 · {patent.registered} 등록 · {patent.applied} 출원 · {copyright} 저작권 · {case} 수행실적
 * 수를 못 읽으면(api 가 안 닿으면) 그 자리표시가 든 토막(「 · 」로 나뉜 한 조각)을 빼고, 틀린 숫자를 안 보인다.
 */
export const COUNT_TOKENS = ['patent', 'patent.registered', 'patent.applied', 'copyright', 'case'] as const
type Counts = Partial<Record<(typeof COUNT_TOKENS)[number], number>>

async function boardRows(board: string, limit: number): Promise<{ total: number; data: { cert_state?: string | null }[] } | null> {
  try {
    const res = await fetch(`${ORIGIN}/api/content/posts?board=${board}&limit=${limit}`, {
      next: { revalidate: 60, tags: [MENU_TAG] },
      signal: AbortSignal.timeout(2000),
    })
    if (!res.ok) return null
    const body = (await res.json()) as { total?: number; data?: { cert_state?: string | null }[] }
    return typeof body.total === 'number' ? { total: body.total, data: body.data ?? [] } : null
  } catch {
    return null
  }
}

const menuCounts = cache(async (): Promise<Counts> => {
  const [patent, copyright, cases] = await Promise.all([boardRows('patent', 100), boardRows('copyright', 1), boardRows('case', 1)])
  const out: Counts = {}
  // 특허는 목록 한 쪽(100)에 다 들어올 때만 등록·출원을 나눠 센다 — 넘치면 나눈 수가 틀린다.
  if (patent) {
    out.patent = patent.total
    if (patent.data.length === patent.total) {
      out['patent.registered'] = patent.data.filter((r) => r.cert_state === 'registered').length
      out['patent.applied'] = patent.data.filter((r) => r.cert_state === 'applied').length
    }
  }
  if (copyright) out.copyright = copyright.total
  if (cases) out.case = cases.total
  return out
})

const TOKEN_RE = /\{([a-z.]+)\}/g

/** 설명 한 줄의 자리표시를 수로 바꾼다. 못 바꾼 자리표시가 든 토막은 뺀다. 자리표시가 없으면 그대로. */
export function fillCounts(text: string, counts: Counts): string {
  if (!text.includes('{')) return text
  return text
    .split(' · ')
    .map((part) => {
      let missing = false
      const filled = part.replace(TOKEN_RE, (_, key: string) => {
        const n = counts[key as keyof Counts]
        if (typeof n !== 'number') missing = true
        return typeof n === 'number' ? String(n) : ''
      })
      return missing ? null : filled
    })
    .filter((x): x is string => x !== null && x.trim() !== '')
    .join(' · ')
}

async function withCounts(menu: SiteMenu): Promise<SiteMenu> {
  const needs = menu.top.some((m) => (m.sub ?? []).some((s) => s.d?.includes('{')))
  if (!needs) return menu
  const counts = await menuCounts()
  return {
    ...menu,
    top: menu.top.map((m) => (m.sub ? { ...m, sub: m.sub.map((s) => (s.d ? { ...s, d: fillCounts(s.d, counts) } : s)) } : m)),
  }
}

export const getMenu = cache(async (): Promise<SiteMenu> => {
  try {
    const res = await fetch(`${ORIGIN}/api/content/menu`, {
      next: { revalidate: 60, tags: [MENU_TAG] },
      signal: AbortSignal.timeout(2000),
    })
    if (!res.ok) return withCounts(CODE_MENU)
    const body = (await res.json()) as { data?: { top?: ApiNode[]; footer?: FooterLink[] } }
    const top = body.data?.top ?? []
    if (!top.length) return withCounts(CODE_MENU)
    return withCounts({ top: top.map(toMenuItem), footer: body.data?.footer ?? [], source: 'cms' })
  } catch {
    return withCounts(CODE_MENU)
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
