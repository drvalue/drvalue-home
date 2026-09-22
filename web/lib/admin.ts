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
export type AdminMe = { email: string; name: string | null; role: AdminRole | null }

/** api 의 board-access 와 같은 규칙. 메뉴를 가리는 용도 — 막는 것은 api 가 한다. */
export function canEditBoard(role: AdminRole | null, board: string): boolean {
  if (role === 'admin') return true
  if (role === 'hr') return board === 'recruit'
  if (role === 'marketing') return board !== 'recruit'
  return false
}

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
}

export type Translation = {
  languages_code: 'ko-KR' | 'en-US'
  title: string | null
  summary: string | null
  body: string | null
  case_category_label: string | null
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

export async function adminFetch<T = unknown>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(path, { credentials: 'include', ...init })
  if (res.status === 401) {
    if (typeof window !== 'undefined' && !location.pathname.startsWith('/admin/login')) {
      location.replace('/admin/login')
    }
    throw new AdminError(401, '로그인이 필요하다')
  }
  if (!res.ok) {
    let message = `HTTP ${res.status}`
    try {
      const body = (await res.json()) as { message?: string | string[] }
      if (Array.isArray(body.message)) message = body.message.join(' / ')
      else if (body.message) message = body.message
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
