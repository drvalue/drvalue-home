/**
 * 관리 화면의 메인 배너·팝업(/api/admin/home/*). 저장은 목록 전체를 한 번에 — 순서는 배열 순서.
 * 모양은 api 의 core/home/dto 와 같다(응답 `*-response.dto.ts`, 요청 `controller-home-default.dto.ts`).
 */
import { adminFetch, adminJson } from './admin'

export type LiveState = 'live' | 'scheduled' | 'ended' | 'off'

export const LIVE_LABEL: Record<LiveState, string> = {
  live: '진행 중',
  scheduled: '예약',
  ended: '끝남',
  off: '꺼짐',
}

export type HomeImage = { id: string; url: string; width: number | null; height: number | null }

export type BannerText = {
  languages_code: string
  title: string | null
  description: string | null
  alt: string | null
  link_label: string | null
}
export type PopupText = {
  languages_code: string
  title: string | null
  body: string | null
  alt: string | null
  link_label: string | null
}

type Common = {
  /** 저장 전 새 항목은 null. 화면의 key 는 `key` 로 따로 든다. */
  id: number | null
  visible: boolean
  state?: LiveState
  image: HomeImage | null
  link_href: string | null
  starts_at: string | null
  ends_at: string | null
  updated_on?: string | null
  updated_by?: string | null
}
export type Banner = Common & { translations: BannerText[] }
export type Popup = Common & { width: number; dismiss_days: number; translations: PopupText[] }

export const listBanners = async () => (await adminFetch<{ data: Banner[] }>('/api/admin/home/banners')).data
export const listPopups = async () => (await adminFetch<{ data: Popup[] }>('/api/admin/home/popups')).data

const common = (x: Common) => ({
  id: x.id ?? undefined,
  visible: x.visible,
  image: x.image?.id ?? null,
  link_href: x.link_href?.trim() || null,
  starts_at: x.starts_at || null,
  ends_at: x.ends_at || null,
})

export const saveBanners = async (items: Banner[]) =>
  (
    await adminJson<{ data: Banner[] }>('/api/admin/home/banners', 'PUT', {
      items: items.map((b) => ({ ...common(b), translations: b.translations })),
    })
  ).data

export const savePopups = async (items: Popup[]) =>
  (
    await adminJson<{ data: Popup[] }>('/api/admin/home/popups', 'PUT', {
      items: items.map((p) => ({ ...common(p), width: p.width, dismiss_days: p.dismiss_days, translations: p.translations })),
    })
  ).data

/** 한 언어 글 — 없으면 빈 칸으로 만든다(저장할 때 빈 언어는 api 가 행을 안 만든다). */
export function textFor<T extends { languages_code: string }>(rows: T[], lang: string, empty: (lang: string) => T): T {
  return rows.find((t) => t.languages_code === lang) ?? empty(lang)
}

export const emptyBannerText = (lang: string): BannerText => ({
  languages_code: lang,
  title: '',
  description: '',
  alt: '',
  link_label: '',
})
export const emptyPopupText = (lang: string): PopupText => ({
  languages_code: lang,
  title: '',
  body: '',
  alt: '',
  link_label: '',
})

export const newBanner = (): Banner => ({
  id: null,
  visible: true,
  image: null,
  link_href: '',
  starts_at: null,
  ends_at: null,
  translations: [emptyBannerText('ko-KR')],
})
export const newPopup = (): Popup => ({
  id: null,
  visible: true,
  image: null,
  link_href: '',
  starts_at: null,
  ends_at: null,
  width: 480,
  dismiss_days: 1,
  translations: [emptyPopupText('ko-KR')],
})

/** ISO ↔ datetime-local 값('2026-09-30T10:00'). 화면은 이 컴퓨터 시간대로 보여 준다. */
export function toLocal(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
}
export const fromLocal = (v: string) => (v ? new Date(v).toISOString() : null)
