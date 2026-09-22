/**
 * GrowTalk 장의 글 — 관리 화면(페이지 → GrowTalk)에서 고친다. 모양은 api 의
 * core/page/schema/intro-pages.schema.ts 와 같다. 씨앗(db/migrations/0008)이자 예비 글.
 */
import { GROWTOK, GROWTOK_LEAD } from '../solutionContent'
import { featureOf, leadOf, type FeaturePageContent } from '../../pageContentParts'

export const GROWTOK_KEY = 'service-growtok'

export const GROWTOK_DEFAULT: FeaturePageContent = {
  shell: {
    kicker: 'GrowTalk',
    kickerSub: 'AI솔루션',
    headLead: '현장의 목소리를 데이터로, ',
    headStrong: '지능형 협업 플랫폼 GrowTalk',
    desc: '제조·공공기관·쇼핑몰 운영사 등 현장의 실시간 상황을 데이터화하여 신속한 의사결정을 돕는 스마트 협업 플랫폼입니다.',
    ctaTitle: 'GrowTalk으로 스마트한 현장을 만들어보세요',
    ctaDesc: '현장과 사무실이 같은 화면에서 이야기합니다.',
  },
  lead: leadOf(GROWTOK_LEAD),
  features: GROWTOK.map(featureOf),
}
