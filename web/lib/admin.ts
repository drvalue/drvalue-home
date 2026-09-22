/**
 * 관리 화면이 부르는 /api/admin/*. 세션 쿠키(dv_admin)는 브라우저가 붙인다.
 * 401 이면 로그인 화면으로 보낸다 — 세션은 30분이라 편집 중에도 만료될 수 있다.
 * 오류 본문의 message 를 그대로 Error 로 올린다. 화면은 그 문장을 그대로 보여 준다.
 */

import type * as Api from './api-types.gen'
import type { ApiResponse } from './api-types.gen'

export const BOARDS = [
  { key: 'notice', label: '공지사항', ordered: false },
  { key: 'press', label: '보도자료', ordered: false },
  { key: 'news', label: '뉴스', ordered: false },
  { key: 'recruit', label: '채용공고', ordered: false },
  { key: 'faq', label: 'FAQ', ordered: true },
  { key: 'patent', label: '특허', ordered: true },
  { key: 'copyright', label: '저작권', ordered: true },
  { key: 'case', label: '수행실적', ordered: true },
  { key: 'history', label: '연혁', ordered: true },
] as const

export type BoardKey = (typeof BOARDS)[number]['key']

export function boardOf(key: string) {
  return BOARDS.find((b) => b.key === key) ?? null
}

export const INQUIRY_STATUS: Record<string, string> = {
  new: '접수',
  in_progress: '진행중',
  answered: '답변완료',
  closed: '종료',
  spam: '스팸',
}

// 응답·요청의 모양은 api 가 정한다 — lib/api-types.gen.ts(scripts/gen-types.mjs 가 만든다)에서 가져다 쓴다.
export type AdminMe = Api.ControllerAdminAuthDefaultMeResponseDto
export type AdminRole = NonNullable<AdminMe['role']>
export type PostRow = Api.ControllerAdminPostDefaultRowResponseDto
export type Translation = Api.ControllerAdminPostTranslationResponseDto
export type PostFull = Api.ControllerAdminPostDefaultDetailResponseDto
export type PostSave = Api.ControllerAdminPostDefaultSaveDto
export type Inquiry = Api.ControllerAdminInquiryDefaultResponseDto
/** 목록 봉투 { data, total, page, pageSize } — 주소마다 api 문서의 것. */
export type PostPage = ApiResponse<'GET /api/admin/posts'>
export type InquiryPage = ApiResponse<'GET /api/admin/inquiries'>

export class AdminError extends Error {
  status: number
  /** api 의 `resultCode`(예: ADMIN_POST_FILE_GONE). 화면이 어느 칸을 짚을지 문구가 아니라 이것으로 고른다. */
  code: string | null
  constructor(status: number, message: string, code: string | null = null) {
    super(message)
    this.status = status
    this.code = code
  }
}

/**
 * 관리 API 호출. 실패하면 api 가 준 문구(`message`, 사용자에게 하는 말)를 그대로 에러로 던진다.
 * 화면은 `e.message` 를 띄우면 된다. 문구가 없을 때만 여기 기본 문구를 쓴다.
 */
export async function adminFetch<T = unknown>(path: string, init: RequestInit = {}): Promise<T> {
  let res: Response
  try {
    res = await fetch(path, { credentials: 'include', ...init })
  } catch {
    throw new AdminError(0, '서버에 연결하지 못했습니다. 네트워크를 확인하고 다시 시도해 주세요.')
  }
  if (res.status === 401) {
    if (typeof window !== 'undefined' && !location.pathname.startsWith('/admin/login')) {
      location.replace('/admin/login')
    }
    throw new AdminError(401, '로그인이 필요합니다.')
  }
  if (!res.ok) {
    let message = '요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.'
    let code: string | null = null
    try {
      const body = (await res.json()) as { message?: unknown; resultCode?: unknown }
      if (typeof body.message === 'string' && body.message) message = body.message
      if (typeof body.resultCode === 'string') code = body.resultCode
    } catch {}
    throw new AdminError(res.status, message, code)
  }
  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}

export function adminJson<T = unknown>(path: string, method: string, body: unknown): Promise<T> {
  return adminFetch<T>(path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

export async function uploadFile(file: File, title?: string) {
  const form = new FormData()
  form.append('file', file)
  if (title) form.append('title', title)
  const res = await adminFetch<ApiResponse<'POST /api/admin/files'>>('/api/admin/files', { method: 'POST', body: form })
  return res.data
}

/** '2025-10-01' → '25.10'. 수행실적 표의 표기. */
export function yymm(iso: string | null | undefined): string {
  const m = /^(\d{2})(\d{2})-(\d{2})/.exec(iso ?? '')
  return m ? `${m[2]}.${m[3]}` : ''
}

export function today(): string {
  return new Date().toISOString().slice(0, 10)
}

/** 채용 고용 형태. api EMPLOYMENT_TYPES 와 같다. */
export const EMPLOYMENT_LABEL: Record<string, string> = {
  fulltime: '정규직',
  contract: '계약직',
  intern: '인턴',
}

/** ISO → '9/30 10:00'. 목록의 예약 배지용. */
export function shortWhen(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getMonth() + 1}/${d.getDate()} ${p(d.getHours())}:${p(d.getMinutes())}`
}

/** ISO → '10/1'. 날짜만(이 컴퓨터 시간대) — 「내림 예정」 배지. */
export function shortDate(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

/** 아직 오지 않은 시각인가. 목록의 예약·내림 배지가 쓴다. */
export const isFuture = (iso: string | null | undefined): boolean => !!iso && new Date(iso).getTime() > Date.now()
