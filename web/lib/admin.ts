/**
 * 관리 화면이 부르는 /api/admin/*. 세션 쿠키(dv_admin)는 브라우저가 붙인다.
 * 401 이면 로그인 화면으로 보낸다 — 세션은 30분이라 편집 중에도 만료될 수 있다.
 * 오류 본문의 message 를 그대로 Error 로 올린다. 화면은 그 문장을 그대로 보여 준다.
 */

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

export type AdminRole = 'admin' | 'marketing' | 'hr'
/** `boards` 는 이 범위로 만질 수 있는 게시판 키 — 규칙은 api(board-access.ts)에만 있다. */
export type AdminMe = { email: string; name: string | null; role: AdminRole | null; boards: string[] }

export type PostRow = {
  id: number
  board: string
  slug: string
  status: string
  title: string
  published_date: string
  sort: number | null
  is_pinned: boolean
  thumbnail: string | null
  history_year: string | null
  cert_no: string | null
  period_start?: string | null
  period_end?: string | null
  press_media?: string | null
  employment_type?: string | null
  is_open_ended?: boolean
  deadline?: string | null
  faq_category?: string | null
  publish_at?: string | null
  unpublish_at?: string | null
}

export type Translation = {
  languages_code: 'ko-KR' | 'en-US'
  title: string | null
  summary: string | null
  body: string | null
  case_category_label: string | null
  faq_category: string | null
  seo_title: string | null
  seo_description: string | null
}

export type PostFull = {
  id: number
  board: string
  slug: string
  status: string
  published_date: string
  sort: number | null
  is_pinned: boolean
  is_featured: boolean
  thumbnail: string | null
  thumbnail_url: string | null
  press_media: string | null
  period_start: string | null
  period_end: string | null
  cert_state: 'registered' | 'applied' | null
  cert_no: string | null
  cert_date: string | null
  cert_made_date: string | null
  cert_kind: string | null
  history_year: string | null
  employment_type: string | null
  is_open_ended: boolean
  deadline: string | null
  /** 예약 공개 · 자동 내림 (ISO). null 이면 없음. */
  publish_at: string | null
  unpublish_at: string | null
  translations: Translation[]
  files: { id: string; name: string; url: string }[]
}

export type Inquiry = {
  id: number
  type: string
  status: string
  name: string
  email: string | null
  company: string | null
  phone: string | null
  message: string
  consent: boolean
  source_path: string | null
}

export type Page<T> = { data: T[]; total: number; page: number; pageSize: number }

export class AdminError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
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
    try {
      const body = (await res.json()) as { message?: unknown }
      if (typeof body.message === 'string' && body.message) message = body.message
    } catch {}
    throw new AdminError(res.status, message)
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
  const res = await adminFetch<{
    data: { id: string; url: string; filename_download: string; title: string | null; width: number | null; height: number | null }
  }>('/api/admin/files', { method: 'POST', body: form })
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
