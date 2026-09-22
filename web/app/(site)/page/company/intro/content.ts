/**
 * 회사소개 「안내」의 글 — 관리 화면(페이지 → 회사소개 · 안내)에서 고친다. 모양은 api 의
 * core/page/schema/intro-pages.schema.ts 와 같다. COMPANY_INTRO_DEFAULT 는 씨앗(db/migrations/0008)이자
 * api 가 안 닿을 때의 예비 글이다. 씨앗 스크립트가 node 로 읽으므로 `@/` 를 쓰지 않는다.
 */
import { INTRO_FILM, INTRO_LEAD, INTRO_SHOT } from '../companyContent'
import { imageOf, leadOf } from '../../pageContentParts'
import type { PageContentMap } from '../../../../../lib/page-types.gen'

/** 모양은 api 의 칸 구조에서 만든 형(lib/page-types.gen.ts). */
export type CompanyIntroContent = PageContentMap['company-intro']

export const COMPANY_INTRO_KEY = 'company-intro'

export const COMPANY_INTRO_DEFAULT: CompanyIntroContent = {
  shell: {
    kicker: '안내',
    kickerSub: '회사소개',
    headLead: '데이터로 제조의 ',
    headStrong: '새로운 가치를 연결합니다.',
    desc: '현장의 비효율을 혁신하여 엔지니어가 본질에만 집중할 수 있는 세상을 만듭니다.',
    ctaTitle: '',
    ctaDesc: '',
  },
  lead: leadOf(INTRO_LEAD),
  shot: imageOf(INTRO_SHOT),
  film: { title: INTRO_FILM.title, desc: INTRO_FILM.desc, youtubeId: INTRO_FILM.id, videoTitle: INTRO_FILM.videoTitle },
}
