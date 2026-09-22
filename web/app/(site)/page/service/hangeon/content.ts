/**
 * 한건 장의 글 — 관리 화면(페이지 → 한건)에서 고친다. 모양은 api 의 core/page/schema/intro-pages.schema.ts
 * 와 같다. 씨앗(db/migrations/0008)이자 예비 글. 시연(HankeonDemo) · 「모르면 모른다」 실제 응답(HK_HONEST) ·
 * 판정 셋(BizShowcase)은 실제 응답을 옮긴 기록이라 코드다. AI 솔루션 개발 장의 「한건」 구역도 이 글의 요약 칸을 쓴다.
 */
import { HANGEON_LEAD } from '../solutionContent'
import { HK_AFTER, HK_BEFORE, HK_BIZ } from '../hankeonContent'
import { compareOf, leadOf, shotOf, type ServiceDemoContent } from '../../pageContentParts'

export const HANGEON_KEY = 'service-hangeon'

export const HANGEON_DEFAULT: ServiceDemoContent = {
  shell: {
    kicker: '한건 AI Chat',
    kickerSub: 'AI솔루션',
    headLead: '건설 법령·기준을 ',
    headStrong: '근거와 함께 답합니다',
    desc: 'LLM 과 RAG 를 함께 써서 KCS·KDS·표준품셈과 법령 조문을 근거로 답하는 건설 AI 입니다. 디알밸류가 만들어 상용으로 운영하고 있습니다.',
    ctaTitle: '건설 법령을 근거와 함께, 한건을 먼저 써 보세요',
    ctaDesc: 'hankeon.com 에서 바로 쓸 수 있습니다. 우리 회사 자료로 같은 구조를 만들려면 도입 상담으로.',
  },
  lead: leadOf(HANGEON_LEAD),
  heroShots: [
    shotOf({ src: '/screens/hankeon-chat.jpg', alt: '한건 Chat 화면 — 지하층 직통계단·특별피난계단 질문에 건축법 시행령 34조·35조, 피난·방화규칙 9조를 인용해 답한다', w: 1600, h: 1000, tag: 'Chat · 근거 기반 질의응답', url: 'hankeon.com / chat' }),
  ],
  demo: {
    kicker: 'Chat',
    title: '“지하 2층 직통계단, 특별피난계단으로 해야 합니까?” 조문을 짚어 답합니다',
    desc: '질문 한 줄을 넣으면 질문을 분류하고, 자료를 찾고, 어느 법령이 걸리는지 판정한 뒤 조문을 인용해 답합니다. 아래는 실제 응답을 순서대로 다시 보여 주는 것입니다.',
  },
  compareStatement: {
    kicker: '',
    title: '찾는 시간이 아니라 판단에 쓰는 시간',
    desc: '법령·시행령·규칙 세 곳을 오가며 조문을 대조하던 일을, 질문 한 줄로 끝냅니다.',
  },
  compare: compareOf(HK_BEFORE, HK_AFTER, {
    src: '/screens/hankeon-chat.jpg',
    alt: '한건 Chat 답변 화면 — 조문 인용과 판단 요약',
    w: 1600,
    h: 1000,
  }),
  extra: {
    kicker: 'Biz',
    title: '공고 100건 중 우리가 낼 수 있는 건 2건 — 이유까지 붙여서',
    desc: `내 정보·면허를 한 번 적어 두면 나라장터·지자체 공고를 면허와 지역 기준으로 가려 줍니다. 아래는 「${HK_BIZ.profile}」 프로필로 2026-09-22 실제 조회한 결과입니다.`,
  },
}
