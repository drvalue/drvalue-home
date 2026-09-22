import { adminFetch, adminJson } from '@/lib/admin'
import type * as Api from './api-types.gen'
import type { ApiBody, ApiResponse } from './api-types.gen'

/**
 * 관리 화면 「메뉴」의 자료. api(/api/admin/menu)는 메뉴 전체를 한 번에 주고받는다.
 * 규칙(한국어 이름 필수 · 깊이 2 · 링크 형식)은 api 가 정한다. 여기서는 저장 전에 같은 것을 미리 알려 주고,
 * api 가 모르는 것 하나 — 사이트 안 주소가 실제로 있는 장인지 — 만 따로 본다(linkProblems).
 */

// ── api 모양 ─────────────────────────────────────────────────────────

// api 문서에서 만든 형(lib/api-types.gen.ts). 손으로 옮겨 적지 않는다.
type ApiLabel = Api.ControllerMenuDefaultLabelResponseDto
type ApiChild = Api.ControllerMenuDefaultAdminChildResponseDto
type ApiTree = Api.ControllerMenuDefaultAdminTreeResponseDto

// ── 화면 모양 ────────────────────────────────────────────────────────

export type EditChild = {
  key: string
  href: string
  visible: boolean
  hidden_in_dropdown: boolean
  ko: string
  en: string
  koDesc: string
  enDesc: string
}
export type EditNode = EditChild & {
  /** 「켜지는 주소」 — 한 줄에 하나. 비우면 링크 주소로 켜진다. */
  match: string
  children: EditChild[]
}
export type EditMenu = { top: EditNode[]; footer: EditChild[]; updatedOn: string | null }

export const LIMITS = { top: 8, children: 12, footer: 12, label: 40, desc: 80 } as const

let seq = 0
export const newKey = () => `m${++seq}`

const labelOf = (ts: ApiLabel[], code: string) => ts.find((t) => t.languages_code === code)

function childFrom(c: ApiChild): EditChild {
  return {
    key: newKey(),
    href: c.href,
    visible: c.visible,
    hidden_in_dropdown: c.hidden_in_dropdown,
    ko: labelOf(c.translations, 'ko-KR')?.label ?? '',
    en: labelOf(c.translations, 'en-US')?.label ?? '',
    koDesc: labelOf(c.translations, 'ko-KR')?.description ?? '',
    enDesc: labelOf(c.translations, 'en-US')?.description ?? '',
  }
}

function fromApi(t: ApiTree): EditMenu {
  return {
    top: t.top.map((n) => ({ ...childFrom(n), match: (n.match ?? []).join('\n'), children: n.children.map(childFrom) })),
    footer: t.footer.map(childFrom),
    updatedOn: t.updated_on,
  }
}

export const blankChild = (): EditChild => ({
  key: newKey(),
  href: '/',
  visible: true,
  hidden_in_dropdown: false,
  ko: '',
  en: '',
  koDesc: '',
  enDesc: '',
})
export const blankNode = (): EditNode => ({ ...blankChild(), match: '', children: [] })

function labels(c: EditChild) {
  const out: Api.ControllerMenuDefaultLabelDto[] = [
    { languages_code: 'ko-KR', label: c.ko.trim(), description: c.koDesc.trim() || null },
  ]
  // 영어 이름을 비우면 보내지 않는다 — 공개 메뉴가 한국어 이름으로 떨어진다.
  if (c.en.trim()) out.push({ languages_code: 'en-US', label: c.en.trim(), description: c.enDesc.trim() || null })
  return out
}
const childBody = (c: EditChild) => ({
  href: c.href.trim(),
  visible: c.visible,
  hidden_in_dropdown: c.hidden_in_dropdown,
  translations: labels(c),
})

function toBody(m: EditMenu): ApiBody<'PUT /api/admin/menu'> {
  return {
    top: m.top.map((n) => {
      const match = n.match
        .split(/[\n,]/)
        .map((s) => s.trim())
        .filter(Boolean)
      return {
        href: n.href.trim(),
        visible: n.visible,
        match: match.length ? match : null,
        translations: labels(n),
        children: n.children.map(childBody),
      }
    }),
    footer: m.footer.map(childBody),
  }
}

export async function loadMenu(): Promise<EditMenu> {
  return fromApi((await adminFetch<ApiResponse<'GET /api/admin/menu'>>('/api/admin/menu')).data)
}

export async function saveMenu(m: EditMenu): Promise<EditMenu> {
  return fromApi((await adminJson<ApiResponse<'PUT /api/admin/menu'>>('/api/admin/menu', 'PUT', toBody(m))).data)
}

/** 사이트의 메뉴 캐시를 비운다(web 의 route handler). 실패해도 1분 안에 저절로 바뀐다. */
export async function refreshSiteMenu(): Promise<boolean> {
  try {
    await adminFetch('/api/admin/menu/refresh', { method: 'POST' })
    return true
  } catch {
    return false
  }
}

// ── 저장 전 확인 ─────────────────────────────────────────────────────

const HREF_RE = /^(\/(?!\/)[^\s<>"']*|https?:\/\/[^\s<>"']+)$/

/** api 가 막을 것을 먼저 알려 준다. 문제가 없으면 빈 배열. */
export function formProblems(m: EditMenu): string[] {
  const out: string[] = []
  const check = (c: EditChild, where: string) => {
    const name = c.ko.trim() || where
    if (!c.ko.trim()) out.push(`${where}: 한국어 이름을 입력해 주세요.`)
    if (!HREF_RE.test(c.href.trim()))
      out.push(`${name}: 링크는 /로 시작하는 사이트 안 주소나 http(s):// 로 시작하는 주소로 적어 주세요.`)
  }
  m.top.forEach((n, i) => {
    check(n, `상단 ${i + 1}번째`)
    const bad = n.match
      .split(/[\n,]/)
      .map((s) => s.trim())
      .filter(Boolean)
      .filter((s) => !s.startsWith('/'))
    if (bad.length) out.push(`${n.ko.trim() || `상단 ${i + 1}번째`}: 「켜지는 주소」는 /로 시작하게 적어 주세요.`)
    n.children.forEach((c, j) => check(c, `${n.ko.trim() || `상단 ${i + 1}번째`}의 하위 ${j + 1}번째`))
  })
  m.footer.forEach((c, i) => check(c, `하단 ${i + 1}번째`))
  return out
}

/**
 * 사이트 안 주소가 실제로 열리는지 본다(HEAD). 404 인 주소 목록을 돌려준다.
 * 어떤 장이 있는지는 web 만 안다 — api 는 모양만 본다.
 */
export async function linkProblems(m: EditMenu): Promise<string[]> {
  const all = [
    ...m.top.flatMap((n) => [n, ...n.children]),
    ...m.footer,
  ].filter((c) => c.href.trim().startsWith('/'))
  const unique = [...new Set(all.map((c) => c.href.trim()))]
  const missing = new Set<string>()
  await Promise.all(
    unique.map(async (href) => {
      try {
        const r = await fetch(href, { method: 'HEAD', credentials: 'omit', cache: 'no-store' })
        if (r.status === 404) missing.add(href)
      } catch {
        // 연결 실패는 판정하지 않는다(저장을 막지 않는다).
      }
    }),
  )
  return all
    .filter((c) => missing.has(c.href.trim()))
    .map((c) => `${c.ko.trim() || c.href}: ${c.href.trim()} 은(는) 사이트에 없는 주소입니다.`)
}
