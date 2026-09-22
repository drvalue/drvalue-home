import { EMPLOYMENT_LABEL, INQUIRY_STATUS } from './admin'

/**
 * 변경 이력 · 권한 화면의 타입과 헬퍼. lib/admin.ts 는 공용이라 여기 따로 둔다.
 */

export type RevisionRow = {
  id: number
  actor: string
  action: 'create' | 'update' | 'delete' | 'restore' | string
  collection: 'posts' | 'inquiries' | 'files' | 'admin_users' | string
  item_id: string
  created_on: string
  label: string
  board: string | null
}

/**
 * 홈 요약(`GET /api/admin/dashboard`). 범위가 못 보는 칸은 api 가 비운다 —
 * 문의는 인사에게 null, 최근 변경은 전체 권한이 아니면 null. 게시판 수는 0 인 게시판이 빠진다.
 */
export type DashboardSummary = {
  inquiries: { new: number; mine_open: number } | null
  drafts: { board: string; count: number }[]
  scheduled: { board: string; count: number }[]
  recent: RevisionRow[] | null
}

export type RevisionFull = RevisionRow & {
  before: Record<string, unknown> | null
  after: Record<string, unknown> | null
  restorable: boolean
}

export type AdminUserRow = {
  email: string
  name: string | null
  role: 'admin' | 'marketing' | 'hr'
  enabled: boolean
  last_login_on: string | null
}

export const ACTION_LABEL: Record<string, string> = {
  create: '작성',
  update: '수정',
  delete: '삭제',
  restore: '복구',
}

export const COLLECTION_LABEL: Record<string, string> = {
  posts: '글',
  inquiries: '문의',
  files: '파일',
  admin_users: '권한',
  menu: '메뉴',
  pages: '페이지',
}

export const ROLE_LABEL: Record<AdminUserRow['role'], string> = {
  admin: '전체 권한',
  marketing: '마케팅',
  hr: '인사',
}

export const ROLE_HINT: Record<AdminUserRow['role'], string> = {
  admin: '모든 게시판 · 문의 · 미디어 · 권한',
  marketing: '채용공고를 뺀 게시판 · 문의 · 미디어',
  hr: '채용공고만',
}

const BOARD_LABEL: Record<string, string> = {
  notice: '공지사항',
  press: '보도자료',
  news: '뉴스',
  recruit: '채용공고',
  faq: 'FAQ',
  patent: '특허',
  copyright: '저작권',
  case: '수행실적',
  history: '연혁',
}

export function boardLabel(key: string | null): string {
  return key ? (BOARD_LABEL[key] ?? key) : ''
}

/** 칸 이름 → 사람이 읽는 이름. 모르는 칸은 칸 이름 그대로. */
const FIELD_LABEL: Record<string, string> = {
  board: '게시판',
  slug: '주소',
  status: '상태',
  published_date: '표시 날짜',
  publish_at: '게시 예약',
  unpublish_at: '내리기 예약',
  sort: '순서',
  is_pinned: '상단 고정',
  is_featured: '메인 노출',
  thumbnail: '대표 이미지',
  press_media: '매체명',
  period_start: '시작',
  period_end: '종료',
  cert_state: '등록/출원',
  cert_no: '번호',
  cert_date: '등록일',
  cert_made_date: '창작일',
  cert_kind: '종류',
  history_year: '연도',
  employment_type: '고용 형태',
  is_open_ended: '상시 채용',
  deadline: '마감',
  title: '제목',
  summary: '요약',
  body: '본문',
  case_category_label: '구분',
  faq_category: 'FAQ 분류',
  seo_title: '검색 제목',
  seo_description: '검색 설명',
  assignee_email: '담당자',
  note: '메모',
  name: '이름',
  email: '이메일',
  role: '범위',
  enabled: '사용',
  files: '첨부',
}

const LANG_LABEL: Record<string, string> = { 'ko-KR': '한국어', 'en-US': 'English' }

/** 비교에서 빼는 칸 — 파생값이거나 사람에게 뜻이 없다. */
const SKIP = new Set(['id', 'thumbnail_url', 'translations', 'last_login_on', 'created_on', 'updated_on'])

/** HTML 을 글자로. 본문 비교는 태그가 아니라 읽히는 글로 한다. */
export function htmlText(v: string): string {
  return v
    .replace(/<\s*br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|h[1-6])>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/** 칸 값 → 사람이 읽는 말. 비교 표에 `published`·`faq` 같은 코드가 그대로 나오지 않게. */
const VALUE_LABEL: Record<string, Record<string, string>> = {
  status: { published: '공개', draft: '초안', ...INQUIRY_STATUS },
  board: BOARD_LABEL,
  role: ROLE_LABEL,
  cert_state: { registered: '등록', applied: '출원' },
  employment_type: EMPLOYMENT_LABEL,
}
const WHEN_KEYS = new Set(['publish_at', 'unpublish_at'])

function show(key: string, v: unknown): string {
  if (v === null || v === undefined || v === '') return ''
  if (typeof v === 'boolean') return v ? '예' : '아니오'
  if (typeof v === 'string' && VALUE_LABEL[key]?.[v]) return VALUE_LABEL[key][v]
  if (typeof v === 'string' && WHEN_KEYS.has(key)) return when(v)
  if (key === 'body' && typeof v === 'string') return htmlText(v)
  if (key === 'files' && Array.isArray(v))
    return v.map((f) => String((f as { name?: string; id?: string }).name ?? (f as { id?: string }).id ?? '')).join(', ')
  if (typeof v === 'object') return JSON.stringify(v)
  return String(v)
}

export type DiffRow = { key: string; label: string; before: string; after: string; changed: boolean }

/**
 * 변경 전·후를 칸별로 편다. 글은 번역을 언어별 칸으로(제목 · 한국어 …).
 * 두 쪽 중 한 쪽에만 있는 칸도 싣는다 — 만들기(전 없음)·지우기(후 없음)도 같은 표로 보인다.
 */
export function diffRows(before: Record<string, unknown> | null, after: Record<string, unknown> | null): DiffRow[] {
  const b = flatten(before)
  const a = flatten(after)
  const keys = [...new Set([...Object.keys(b), ...Object.keys(a)])]
  const order = (k: string) => {
    const base = k.split('·')[0].trim()
    const i = Object.keys(FIELD_LABEL).indexOf(base)
    return i < 0 ? 999 : i
  }
  keys.sort((x, y) => order(x) - order(y) || x.localeCompare(y))
  return keys.map((k) => {
    const [base, lang] = k.split('·').map((s) => s.trim())
    const label = (FIELD_LABEL[base] ?? base) + (lang ? ` · ${LANG_LABEL[lang] ?? lang}` : '')
    const bv = b[k] ?? ''
    const av = a[k] ?? ''
    return { key: k, label, before: bv, after: av, changed: bv !== av }
  })
}

function flatten(s: Record<string, unknown> | null): Record<string, string> {
  const out: Record<string, string> = {}
  if (!s) return out
  for (const [k, v] of Object.entries(s)) {
    if (SKIP.has(k)) continue
    out[k] = show(k, v)
  }
  const ts = s.translations
  if (Array.isArray(ts)) {
    for (const t of ts as Record<string, unknown>[]) {
      const lang = String(t.languages_code ?? '')
      for (const [k, v] of Object.entries(t)) {
        if (k === 'languages_code') continue
        out[`${k} · ${lang}`] = show(k, v)
      }
    }
  }
  return out
}

export function when(v: string | null | undefined): string {
  if (!v) return ''
  const d = new Date(v)
  if (Number.isNaN(d.getTime())) return String(v)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}
