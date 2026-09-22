/**
 * 회사소개 「비전」의 글 — 관리 화면(페이지 → 회사소개 · 비전)에서 고친다. 모양은 api 의
 * core/page/schema/intro-pages.schema.ts 와 같다. 씨앗(db/migrations/0008)이자 예비 글.
 */
import { VISION_LEAD, VISION_STRATEGY } from '../companyContent'
import { leadOf, type Card, type LeadContent, type ShellContent } from '../../pageContentParts'

export type CompanyVisionContent = {
  shell: ShellContent
  lead: LeadContent
  strategy: { title: string; items: Card[] }
}

export const COMPANY_VISION_KEY = 'company-vision'

export const COMPANY_VISION_DEFAULT: CompanyVisionContent = {
  shell: {
    kicker: '비전',
    kickerSub: '회사소개',
    headLead: '디알밸류가 그리는 ',
    headStrong: '지능형 제조의 새로운 세상',
    desc: '우리는 단순한 자동화를 넘어, 제조 현장의 모든 데이터를 살아있는 정보로 전환합니다.',
    ctaTitle: '',
    ctaDesc: '',
  },
  lead: leadOf(VISION_LEAD),
  strategy: { title: VISION_STRATEGY.title, items: VISION_STRATEGY.items.map(({ t, d }) => ({ t, d })) },
}
