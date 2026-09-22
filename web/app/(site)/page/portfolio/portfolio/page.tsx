import { PAGE_CSS } from '../../business/max/maxStyles'
import SolutionShell from '../../business/max/SolutionShell'
import PortfolioTable from './PortfolioTable'
import { seoMeta } from '@/lib/seo'
import { PORTFOLIO_LIST } from './list'
import { cmsBoard, yymm } from '@/lib/cms'
import type { Row } from './PortfolioTable'

/** CMS 에서 고친 것이 바로 보이게 요청마다 그린다(lib/cms.ts). */
export const dynamic = 'force-dynamic'


/**
 * /page/portfolio/portfolio.php 를 옮긴 것. 2026-09-18 옛 꾸밈(사진 머리 + AOS)
 * 에서 M.AX 계열과 같은 틀(SolutionShell)로 옮겼다. 표와 요약은 그대로
 * PortfolioTable 이 그린다. 새로 지은 문장은 없다.
 *
 * 주소에서 `.php` 를 뺐다. 옛 주소는 lib/phpRoutes.mjs 의 목록대로 308 로
 * 넘어오므로 검색에 쌓인 것을 잃지 않는다.
 */

const PATH = '/page/portfolio/portfolio'

export const generateMetadata = seoMeta({
  title: '주요 수행실적',
  description:
    '안산스마트공장 보급, 경기도형 스마트공장 공급기술 상용화, 한양대학교 R&D 등 9건의 수행 과제와 기간·발주 유형을 공개합니다.',
  path: PATH,
})

/**
 * 이 장만의 CSS. 표·요약·거르개(pf_*) 규칙은 옛 장의 것을 그대로 옮겼다.
 * 템플릿 문자열이다 — 안에 역따옴표를 넣지 않는다.
 */
const PF_CSS = `
/* 수행실적 메뉴는 하위 장이 하나라 왼쪽 차례표가 안 그려진다. 공용 규칙은
   두 칸(212px + 본문)이어서 차례표가 없으면 본문이 212px 칸에 들어간다 —
   그때는 한 칸으로 돌린다. */
#dvmax .mx_split:not(:has(.mx_side)) { display: block; }

/* 요약 세 칸. 숫자는 전부 아래 표에서 센 것이다. */
#dvmax .pf_sum {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 1px;
  background: #e5eaef; border: 1px solid #e5eaef; border-radius: 10px;
  overflow: hidden; margin-bottom: 26px; }
#dvmax .pf_sum > div { background: #fff; padding: 22px 20px; text-align: center; }
#dvmax .pf_sum b { display: block; font-size: 26px; font-weight: 800; color: #191f28; letter-spacing: -.5px; }
#dvmax .pf_sum span { display: block; margin-top: 6px; font-size: 13.5px; color: #8b95a1; font-weight: 600; }

/* 발주·사업 유형 거르개. 이건 실제로 누르는 것이라 단추 모양이 맞다. */
#dvmax .pf_filter { display: flex; flex-wrap: wrap; gap: 7px; margin-bottom: 20px; }
#dvmax .pf_fbtn {
  appearance: none; font-family: inherit; cursor: pointer;
  font-size: 13px; font-weight: 700; color: #4e5968;
  background: #fff; border: 1px solid #cfdfe8; border-radius: 7px; padding: 7px 13px;
  transition: background .16s, border-color .16s, color .16s; }
#dvmax .pf_fbtn i { font-style: normal; margin-left: 5px; color: #97a5b4; font-weight: 700; }
#dvmax .pf_fbtn:hover { background: #f4f7fa; }
#dvmax .pf_fbtn.is-on { background: #3d5a80; border-color: #3d5a80; color: #fff; }
#dvmax .pf_fbtn.is-on i { color: rgba(255,255,255,.72); }
#dvmax .pf_fbtn:focus-visible { outline: 3px solid #d71920; outline-offset: 2px; }

#dvmax .pf_table_wrap { overflow-x: auto; }
#dvmax .pf_table {
  width: 100%; border-collapse: separate; border-spacing: 0 12px;
  font-family: 'Pretendard', sans-serif; }
#dvmax .pf_table thead th {
  background: #191f28; color: #fff; font-weight: 700; font-size: 17px;
  padding: 20px 24px; text-align: center; }
#dvmax .pf_table thead th:first-child { border-radius: 14px 0 0 14px; text-align: left; }
#dvmax .pf_table thead th:last-child { border-radius: 0 14px 14px 0; }

#dvmax .pf_table tbody tr { background: #fff; transition: 0.3s; }
#dvmax .pf_table tbody tr:hover { box-shadow: 0 12px 30px rgba(0,0,0,0.07); }
#dvmax .pf_table tbody td {
  padding: 22px 24px; font-size: 17px; color: #4e5968; vertical-align: middle; }
#dvmax .pf_table tbody td:first-child {
  border-radius: 14px 0 0 14px; font-weight: 700; color: #191f28;
  word-break: keep-all; line-height: 1.5; }
#dvmax .pf_table tbody td:last-child { border-radius: 0 14px 14px 0; }
#dvmax .pf_col_period { text-align: center; white-space: nowrap; font-weight: 600; color: #191f28; }
#dvmax .pf_col_type { text-align: center; word-break: keep-all; }
#dvmax .pf_col_type span {
  display: inline-block; background: #e8f0fb; color: #1b64da;
  padding: 8px 16px; border-radius: 999px; font-size: 15px; font-weight: 700; line-height: 1.4; }

@media (max-width: 900px) {
  #dvmax .pf_table { border-spacing: 0 8px; }
  #dvmax .pf_table thead th, #dvmax .pf_table tbody td { padding: 16px 14px; font-size: 15px; }
  #dvmax .pf_col_type span { font-size: 13px; padding: 6px 12px; }
}
@media (prefers-reduced-motion: reduce) {
  #dvmax .pf_fbtn, #dvmax .pf_table tbody tr { transition: none; }
}
`

/** CMS(게시판 「수행실적」)가 우선. PORTFOLIO_LIST 는 CMS 가 안 될 때의 예비. */
export default async function Page() {
  const cms = await cmsBoard('case')
  const rows: readonly Row[] = cms
    ? cms.map((r) => ({
        과제명: r.title ?? '',
        기간: `${yymm(r.period_start)}~${yymm(r.period_end)}`,
        구분: r.case_category_label ?? '',
      }))
    : PORTFOLIO_LIST
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PAGE_CSS }} />
      <style dangerouslySetInnerHTML={{ __html: PF_CSS }} />
      <SolutionShell
        path={PATH}
        kicker="주요 수행실적"
        kickerSub="수행실적"
        headLead="디알밸류의 수행실적을 "
        headStrong="확인해 보세요."
        desc={`안산스마트공장 보급, 경기도형 스마트공장 공급기술 상용화, 한양대학교 R&D 등 ${rows.length}건의 수행 과제와 기간·발주 유형을 공개합니다.`}
        ctaTitle="문의사항이 있으신가요?"
        ctaDesc="프로젝트 문의는 문의하기에서 남길 수 있습니다."
      >
        <h2 className="mx_sec_title">주요 수행실적</h2>
        <div data-rv>
          <PortfolioTable rows={rows} />
        </div>
      </SolutionShell>
    </>
  )
}
