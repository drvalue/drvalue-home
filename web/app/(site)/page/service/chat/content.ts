/**
 * 채팅(GrowChat) 장의 글 — 관리 화면(페이지 → 채팅)에서 고친다. 모양은 api 의 core/page/schema/intro-pages.schema.ts
 * 와 같다. 씨앗(db/migrations/0008)이자 예비 글. 대화 시연(GrowchatDemo)과 시연 구역의 문구(GC_UI·GC_DEMO)는
 * 실제 창에서 받은 기록이라 코드다. 요약 칸은 선언 문장과 AI 솔루션 개발 장의 「채팅」 구역이 쓴다.
 */
import { CHAT_LEAD } from '../solutionContent'
import { GC_AFTER, GC_BEFORE } from '../growchatContent'
import { compareOf, imageOf, leadOf, type ChatContent } from '../../pageContentParts'

export const CHAT_KEY = 'service-chat'

export const CUSTOMER_SHOT = { src: '/screens/growchat-customer.jpg', alt: '고객 상담 창의 대화 — PCB MES 도입 문의 두 건, 「상담이 시작되었습니다」, 상담사의 LOT 추적 답', w: 924, h: 676 }
export const AGENT_SHOT = { src: '/screens/growchat-agent.jpg', alt: '상담원 관리자센터 — 왼쪽 대기중·진행중 방 목록, 가운데 대화와 상담전송·내부전송, 오른쪽 현재 상담 정보', w: 1600, h: 1000 }

export const CHAT_DEFAULT: ChatContent = {
  shell: {
    kicker: '채팅',
    kickerSub: 'AI솔루션',
    headLead: '고객과 상담원을 ',
    headStrong: '곧바로 잇습니다',
    desc: '홈페이지 오른쪽 아래 버블을 누르면 문의가 열리고, 상담원은 한 화면에서 배정받아 답합니다. 디알밸류 홈페이지가 지금 쓰는 그 창입니다.',
    ctaTitle: '고객과 상담원을 곧바로 잇는 채팅, 지금 이 홈페이지에서 써 보세요',
    ctaDesc: '오른쪽 아래 상담 버블이 바로 그 창입니다. 도입 상담은 아래에서.',
  },
  lead: leadOf(CHAT_LEAD),
  agentShot: imageOf(AGENT_SHOT),
  customerShot: imageOf(CUSTOMER_SHOT),
  compareStatement: {
    kicker: '',
    title: '받는 곳이 하나면 놓치는 문의가 없습니다',
    desc: '전화 한 통, 메일 한 줄로 흩어지던 문의가 방 하나에 상태와 함께 모입니다.',
  },
  compare: compareOf(GC_BEFORE, GC_AFTER, AGENT_SHOT),
}
