/**
 * GrowXD 장의 글 — 관리 화면(페이지 → GrowXD)에서 고친다. 모양은 api 의
 * core/page/schema/intro-pages.schema.ts 와 같다. 씨앗(db/migrations/0008)이자 예비 글.
 */
import { GROWXD, GROWXD_LEAD } from '../solutionContent'
import { featureOf, leadOf, type FeaturePageContent } from '../../pageContentParts'

export const GROWXD_KEY = 'service-growxd'

export const GROWXD_DEFAULT: FeaturePageContent = {
  shell: {
    kicker: 'GrowXD',
    kickerSub: 'AI솔루션',
    headLead: 'AI가 스스로 최적화하는 ',
    headStrong: '지능형 생산 관리 시스템, GrowXD',
    desc: '단순한 실적 수집(MES)을 넘어 AI 기반의 분석과 예측 기능을 결합한 차세대 제조실행시스템입니다.',
    ctaTitle: 'GrowXD와 함께 자율 제조의 시대를 시작하세요',
    ctaDesc: '현장 데이터부터 전사 지표까지 한 흐름으로 잇습니다.',
  },
  lead: leadOf(GROWXD_LEAD),
  features: GROWXD.map(featureOf),
}
