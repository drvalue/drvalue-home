/**
 * 컷온 장의 글 — 관리 화면(페이지 → 컷온)에서 고친다. 모양은 api 의 core/page/schema/intro-pages.schema.ts
 * 와 같다. 씨앗(db/migrations/0008)이자 예비 글. 시연(CutonDemo)과 화면 셋(CutonShow)은 코드다.
 * AI 솔루션 개발 장의 「컷온」 구역 제목·설명도 이 글의 요약 칸을 쓴다.
 */
import { CUTON_LEAD, CUTON_SHOT } from '../solutionContent'
import { CT_AFTER, CT_BEFORE, CT_SHOW } from '../cutonContent'
import { compareOf, leadOf, shotOf, type ServiceDemoContent } from '../../pageContentParts'

export const CUTON_KEY = 'service-cuton'

export const CUTON_DEFAULT: ServiceDemoContent = {
  shell: {
    kicker: '컷온',
    kickerSub: 'AI솔루션',
    headLead: '도면 업로드 한 번으로 끝나는 ',
    headStrong: 'AI 레이저 절삭 자동 견적, 컷온',
    desc: '도면(CAD) 데이터를 AI가 즉시 분석하여 최적의 절삭 비용을 산출하는 자동 견적 플랫폼입니다.',
    ctaTitle: '도면을 올리면 견적까지, 컷온으로 먼저 받아 보세요',
    ctaDesc: 'cuton.co.kr 체험 가이드는 로그인 없이 바로 열립니다. 도입·연동 상담은 아래로.',
  },
  lead: leadOf(CUTON_LEAD),
  heroShots: [shotOf({ ...CUTON_SHOT, tag: '컷온 · 자동 견적', url: 'cuton.co.kr' })],
  demo: {
    kicker: '예상견적산출',
    title: '도면 한 장 올리면 재질그룹별 예상가까지',
    desc: 'DXF 도면을 올리면 형상을 분석해 절단 길이·구멍·면적을 읽고, 재질그룹별 예상가를 같은 화면에서 냅니다. 아래는 컷온이 사이트에 열어 둔 체험 가이드를 그대로 따라간 것입니다 — 가이드의 예시 도면·값으로, 실제 화면과 같은 흐름입니다.',
  },
  compareStatement: {
    kicker: '',
    title: '기다리는 시간이 아니라 고르는 시간',
    desc: '도면을 보내고 회신을 기다리던 일을, 올리고 고르는 일로 바꿉니다.',
  },
  compare: compareOf(CT_BEFORE, CT_AFTER, {
    src: '/screens/cuton-result.jpg',
    alt: '컷온 예상견적산출 결과 화면 — 항목별 분석값과 재질그룹별 가격, 최저 합계가 한 화면에',
    w: 1290,
    h: 810,
  }),
  extra: { kicker: '견적 · 보관 · 입찰', title: CT_SHOW.head, desc: CT_SHOW.desc },
}
