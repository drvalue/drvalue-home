import type * as Api from '@/lib/api-types.gen'
/** /api/admin/inquiries 의 한 건 — 모양은 api 문서의 것. */
export type InquiryDetail = Api.ControllerAdminInquiryDefaultResponseDto
export type Assignee = Api.ControllerAdminInquiryAssigneeResponseDto

/** '2026-09-22T08:01:24Z' → '2026.09.22 17:01' (서울). */
export function when(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const p = new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(d)
  const g = (t: string) => p.find((x) => x.type === t)?.value ?? ''
  return `${g('year')}.${g('month')}.${g('day')} ${g('hour')}:${g('minute')}`
}

/** 답장 메일 주소. 제목은 「[디알밸류] {유형} 문의 답변」, 본문에 원문을 인용한다. */
export function replyHref(q: InquiryDetail): string {
  const subject = `[디알밸류] ${q.type} 문의 답변`
  // mailto 는 너무 길면 메일 앱이 잘라 먹는다. 원문은 1500자까지만 싣는다.
  const original = q.message.length > 1500 ? q.message.slice(0, 1500) + '…' : q.message
  const quoted = original
    .split('\n')
    .map((l) => `> ${l}`)
    .join('\n')
  const body = `${q.name} 님, 안녕하세요.\n디알밸류입니다.\n\n\n\n--- ${when(q.created_on)} 에 남기신 문의 ---\n${quoted}\n`
  return `mailto:${q.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}
