/**
 * 스마트 팩토리 사업 장의 글 — 관리 화면(페이지 → 스마트 팩토리 사업)에서 고친다. 모양은 api 의
 * core/page/schema/intro-pages.schema.ts 와 같다. 씨앗(db/migrations/0008)이자 예비 글.
 */
import { SMARTFAC, SMARTFAC_LEAD } from '../../service/solutionContent'
import { featureOf, leadOf, type FeaturePageContent } from '../../pageContentParts'

export const SMART_FAC_KEY = 'business-smart-fac'

export const SMART_FAC_DEFAULT: FeaturePageContent = {
  shell: {
    kicker: '스마트 팩토리 사업',
    kickerSub: 'M.AX',
    headLead: '제조 현장의 가치를 데이터로, ',
    headStrong: '디알밸류 스마트팩토리 솔루션',
    desc: '생산성은 높이고, 비용은 낮추는 지능형 공장 구축의 표준',
    ctaTitle: '디알밸류와 함께 제조업의 혁신을 시작하세요.',
    ctaDesc: '현장 진단부터 정부지원사업 연계까지 전문가가 직접 상담해 드립니다.',
  },
  lead: leadOf(SMARTFAC_LEAD),
  features: SMARTFAC.map(featureOf),
}
