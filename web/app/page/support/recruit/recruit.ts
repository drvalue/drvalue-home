import type { CmsPost } from '@/lib/cms'
import { dots } from '@/lib/cms'

/** 채용 고용 형태 표기. api EMPLOYMENT_TYPES 와 같다. */
export const EMPLOYMENT_LABEL: Record<string, string> = {
  fulltime: '정규직',
  contract: '계약직',
  intern: '인턴',
}

/** 오늘(서울) 'YYYY-MM-DD'. 마감 판정용. */
function todaySeoul(): string {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Seoul' }).format(new Date())
}

/** 마감 배지. 상시 · 마감 · ~날짜 까지. */
export function dueOf(p: Pick<CmsPost, 'is_open_ended' | 'deadline'>): { text: string; cls: string } {
  if (p.is_open_ended) return { text: '상시 채용', cls: 'is-open' }
  if (!p.deadline) return { text: '채용 시 마감', cls: '' }
  if (p.deadline < todaySeoul()) return { text: '마감', cls: 'is-closed' }
  return { text: `~ ${dots(p.deadline)} 까지`, cls: '' }
}
