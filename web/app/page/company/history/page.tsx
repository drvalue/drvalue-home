import { HISTORY, HISTORY_LEAD, COMPANY_CSS } from '../companyContent'
import { PAGE_CSS } from '../../business/max/maxStyles'
import SolutionShell from '../../business/max/SolutionShell'
import { pageMeta } from '@/lib/seo'
import { cmsBoard, type CmsPost } from '@/lib/cms'

/**
 * /page/company/history.php 를 옮긴 것. 2026-09-18 옛 꾸밈(사진 머리 + t_inner + AOS)
 * 에서 M.AX 계열과 같은 틀로 옮겼다 — 메뉴를 옮겨 다닐 때 두 꾸밈이 섞여 난잡했다.
 * 연혁 목록은 companyContent.ts 에 그대로 옮겨 두었다. 새로 지은 문장은 없다 —
 * 머리말의 한 줄은 이 장의 metadata description 을 그대로 쓴다(옛 본문에 산문이 없었다).
 */
const PATH = '/page/company/history'

export const metadata = pageMeta({
  title: '연혁',
  description:
    '2024년 법인 설립부터 기업부설연구소, ISO 9001·14001 인증, AI 바우처·클라우드 바우처 선정까지 디알밸류가 걸어온 기록입니다.',
  path: PATH,
})

/**
 * CMS(게시판 「연혁」)가 우선. 연도 내림차순, 한 해 안은 관리 화면의 순서(sort).
 * companyContent.ts 의 HISTORY 는 CMS 가 안 될 때의 예비.
 */
type Year = { year: string; items: readonly { t: string; note: string }[] }

function fromCms(rows: CmsPost[]): Year[] {
  const by = new Map<string, { t: string; note: string }[]>()
  for (const r of rows) {
    const y = r.history_year ?? (r.published_date ?? '').slice(0, 4)
    if (!y || !r.title) continue
    if (!by.has(y)) by.set(y, [])
    by.get(y)!.push({ t: r.title, note: r.summary ?? '' })
  }
  return [...by.entries()].sort((a, b) => b[0].localeCompare(a[0])).map(([year, items]) => ({ year, items }))
}

export default async function Page() {
  const cms = await cmsBoard('history')
  const years: readonly Year[] = cms ? fromCms(cms) : HISTORY
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PAGE_CSS }} />
      <style dangerouslySetInnerHTML={{ __html: COMPANY_CSS }} />
      <SolutionShell
        path={PATH}
        kicker="연혁"
        kickerSub="회사소개"
        headLead="디알밸류가 걸어온 "
        headStrong="혁신과 성장의 기록입니다."
        desc={metadata.description as string}
        lead={HISTORY_LEAD}
        ctaTitle="문의사항이 있으신가요?"
        ctaDesc="프로젝트 문의는 문의하기에서 남길 수 있습니다."
      >
        <div className="timeline_container">
          {years.map((h) => (
            <div className="history_item" key={h.year} data-rv>
              <h3 className="history_year">{h.year}</h3>
              <ul className="history_list">
                {h.items.map((it) => (
                  <li key={it.t}>
                    <span className="history_desc">
                      {it.t}
                      {it.note && <em className="history_note">{it.note}</em>}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </SolutionShell>
    </>
  )
}
