/**
 * 관리 화면의 메인 배너·팝업(/api/admin/home/*). 저장은 목록 전체를 한 번에 — 순서는 배열 순서.
 * 모양은 api 의 core/home/dto 와 같다(응답 `*-response.dto.ts`, 요청 `controller-home-default.dto.ts`).
 */
import { adminFetch, adminJson } from './admin'
import type * as Api from './api-types.gen'
import type { ApiBody, ApiResponse } from './api-types.gen'

// 모양은 api 문서에서 만든 형(lib/api-types.gen.ts). 화면이 들고 고치는 항목은 새 항목(id 없음)이 있어
// 응답 형에서 id 를 비울 수 있게 하고, 서버가 채우는 칸(state·sort·고친 사람)은 없어도 되게 한다.
export type LiveState = Api.ControllerHomeDefaultBannerResponseDto['state']

export const LIVE_LABEL: Record<LiveState, string> = {
  live: '진행 중',
  scheduled: '예약',
  ended: '끝남',
  off: '꺼짐',
}

export type HomeImage = Api.ControllerHomeDefaultImageResponseDto
export type BannerText = Api.ControllerHomeDefaultBannerTextResponseDto
/** 이 사이트의 언어 — api 문서의 목록(ko-KR · en-US). */
export type Lang = BannerText['languages_code']
export type PopupText = Api.ControllerHomeDefaultPopupTextResponseDto

type Editable<T extends { id: number; state: LiveState }> = Omit<T, 'id' | 'state' | 'sort' | 'updated_on' | 'updated_by'> & {
  /** 저장 전 새 항목은 null. 화면의 key 는 `key` 로 따로 든다. */
  id: number | null
  state?: LiveState
  updated_on?: string | null
  updated_by?: string | null
}
export type Banner = Editable<Api.ControllerHomeDefaultBannerResponseDto>
export type Popup = Editable<Api.ControllerHomeDefaultPopupResponseDto>
type Common = Pick<Banner, 'id' | 'visible' | 'image' | 'link_href' | 'starts_at' | 'ends_at'>

export const listBanners = async () => (await adminFetch<ApiResponse<'GET /api/admin/home/banners'>>('/api/admin/home/banners')).data
export const listPopups = async () => (await adminFetch<ApiResponse<'GET /api/admin/home/popups'>>('/api/admin/home/popups')).data

const common = (x: Common) => ({
  id: x.id ?? undefined,
  visible: x.visible,
  image: x.image?.id ?? null,
  link_href: x.link_href?.trim() || null,
  starts_at: x.starts_at || null,
  ends_at: x.ends_at || null,
})

export const saveBanners = async (items: Banner[]) => {
  const body: ApiBody<'PUT /api/admin/home/banners'> = {
    items: items.map((b) => ({ ...common(b), translations: b.translations })),
  }
  return (await adminJson<ApiResponse<'PUT /api/admin/home/banners'>>('/api/admin/home/banners', 'PUT', body)).data
}

export const savePopups = async (items: Popup[]) => {
  const body: ApiBody<'PUT /api/admin/home/popups'> = {
    items: items.map((p) => ({ ...common(p), width: p.width, dismiss_days: p.dismiss_days, translations: p.translations })),
  }
  return (await adminJson<ApiResponse<'PUT /api/admin/home/popups'>>('/api/admin/home/popups', 'PUT', body)).data
}

/** 한 언어 글 — 없으면 빈 칸으로 만든다(저장할 때 빈 언어는 api 가 행을 안 만든다). */
export function textFor<T extends { languages_code: Lang }>(rows: T[], lang: Lang, empty: (lang: Lang) => T): T {
  return rows.find((t) => t.languages_code === lang) ?? empty(lang)
}

export const emptyBannerText = (lang: Lang): BannerText => ({
  languages_code: lang,
  title: '',
  description: '',
  alt: '',
  link_label: '',
})
export const emptyPopupText = (lang: Lang): PopupText => ({
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
