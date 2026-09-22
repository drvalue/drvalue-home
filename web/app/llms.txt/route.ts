import { getMenu } from '@/lib/menu-cms'
import { ORG, SITE_DESCRIPTION, SITE_NAME, SITE_ORIGIN } from '@/lib/seo'
import { cmsBoard } from '@/lib/cms'
import { BOARDS, detailPath } from '../(site)/page/support/board/boards'

/**
 * /llms.txt — AI 답변 엔진이 읽는 사이트 요약(llmstxt.org 형식: 마크다운).
 * 새로 지은 말은 없다: 회사 정보는 푸터·Organization(lib/seo.ts), 장 설명은 메뉴의 한 줄(getMenu — 관리 화면 값),
 * 소식은 게시된 공지·보도·뉴스 제목이다. 요청마다 만든다 — 글을 올리면 바로 들어간다.
 */
export const dynamic = 'force-dynamic'

export async function GET(): Promise<Response> {
  const lines: string[] = [
    `# ${SITE_NAME} (${ORG.alt})`,
    '',
    `> ${SITE_DESCRIPTION}`,
    '',
    `${ORG.name} · 대표 ${ORG.ceo} · 사업자등록번호 ${ORG.bizNo}`,
    `주소 ${ORG.addr} · 전화 ${ORG.tel} · 이메일 ${ORG.email}`,
    '',
  ]

  // 메뉴는 머리글과 같은 것(관리 화면 값, 설명의 숫자는 자료에서 센 값) — 코드의 예비를 직접 읽으면 자리표시가 그대로 나간다.
  const { top } = await getMenu()
  for (const m of top) {
    const subs = (m.sub ?? []).filter((s) => !s.hidden)
    lines.push(`## ${m.title}`, '')
    if (!subs.length) lines.push(`- [${m.title}](${SITE_ORIGIN}${m.link})`)
    for (const s of subs) lines.push(`- [${s.t}](${SITE_ORIGIN}${s.l}): ${s.d}`)
    lines.push('')
  }

  const boards = await Promise.all((['notice', 'press', 'news'] as const).map((b) => cmsBoard(b, 10)))
  const recent = boards
    .flatMap((rows, i) => (rows ?? []).map((r) => ({ conf: BOARDS[(['notice', 'press', 'news'] as const)[i]], r })))
    .sort((a, b) => (b.r.published_date ?? '').localeCompare(a.r.published_date ?? ''))
    .slice(0, 10)
  if (recent.length) {
    lines.push('## 최근 소식', '')
    for (const { conf, r } of recent)
      lines.push(`- [${r.title}](${SITE_ORIGIN}${detailPath(conf, r.slug)}): ${conf.label} · ${(r.published_date ?? '').slice(0, 10)}`)
    lines.push('')
  }

  lines.push('## 문의', '', `- [문의하기](${SITE_ORIGIN}/page/support/notify_form): 도입 상담·견적 문의`, `- 이메일 ${ORG.email} · 전화 ${ORG.tel}`, '')

  return new Response(lines.join('\n'), {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8', 'Cache-Control': 'public, max-age=3600' },
  })
}
