/**
 * 제조AI(M.AX) 소개 장의 글 — 관리 화면(페이지 → 제조AI(M.AX))에서 고친다. 모양은 api 의
 * core/page/schema/intro-pages.schema.ts 와 같다. 씨앗(db/migrations/0008)이자 예비 글.
 * 제품군 카드의 제목·설명은 여기 없다 — PCB MES · 화장품 MES · MES AI 장의 머리말을 그대로 쓴다
 * (두 곳에 적으면 한쪽만 고쳐진다).
 */
import { imageOf, shotOf, type MaxHubContent } from '../../pageContentParts'

export const MAX_HUB_KEY = 'business-max'

export const MAX_HUB_DEFAULT: MaxHubContent = {
  shell: {
    kicker: '제조서비스플랫폼',
    kickerSub: '제조AI(M.AX)',
    headLead: '현장의 흐르는 데이터를 자동으로 축적·처리하는 M.AX, ',
    headStrong: '견적부터 출고·정산까지 번호 하나로 이어집니다',
    desc: '견적부터 출고까지 하나의 흐름으로 연결된 업종 특화 기능과 제조 AI를 더해 데이터 입력 부담 없이 스스로 기록되고 자동 처리되는 시스템을 만들어 가고 있습니다.',
    heroLink: '어디부터 볼까',
    ctaTitle: '우리 공장에 맞는 M.AX 구성이 궁금하신가요?',
    ctaDesc: '',
  },
  // 몇 초마다 넘어가는 넷 — 아래 제품군 카드 셋(재고 현황·GMP 양식·AI 비서)과 안 겹치는 화면으로.
  heroShots: [
    shotOf({ src: '/screens/pcb-dash.jpg', alt: '전사 현황 화면 — 당일 수주량·투입량·불량 수와 사양·지시서·출고 대기', w: 1600, h: 1000, tag: 'PCB MES · 전사 현황', url: 'max.drvalue.co.kr / 현황' }),
    shotOf({ src: '/screens/pcb-spec.jpg', alt: '사양 등록 화면 — 모델·필름 소요량·표면처리·적층구조·납품량이 한 장에', w: 1600, h: 563, tag: 'PCB MES · 사양 등록', url: 'max.drvalue.co.kr / 사양' }),
    shotOf({ src: '/screens/cos-material.jpg', alt: '원료 관리 화면 — 원료코드·단가·재고와 최근 입고 이력', w: 1600, h: 463, tag: '화장품 MES · 원료 관리', url: 'max.drvalue.co.kr / 원료' }),
    shotOf({ src: '/screens/form-mapping.jpg', alt: 'AI 가 양식 구조를 읽고 MES 필드에 맞추는 화면', w: 1600, h: 799, tag: 'MES AI · 양식 자동 매핑', url: 'max.drvalue.co.kr / 양식' }),
  ],
  statement: {
    kicker: '제품군',
    title: '업종별 기능과 그 위에서 도는 제조 AI 를 나눠 두었습니다',
    desc: '업종 특화 MES 둘과 그 위에서 도는 제조 AI. 탭을 누르거나 화살표로 넘겨 보세요.',
  },
  pcbCard: {
    kicker: 'PCB MES',
    shot: imageOf({ src: '/screens/pcb-stock.jpg', alt: '재고 현황 화면 — 모델별 재고수량·최고/최저 재고·금액·최종 출고일', w: 1600, h: 1000 }),
    url: 'max.drvalue.co.kr / 재고 현황',
  },
  cosCard: {
    kicker: '화장품 MES',
    shot: imageOf({ src: '/screens/form-generate.jpg', alt: 'GMP 양식 출력 화면 — 품질관리기록서를 시스템 값으로 채워 생성', w: 1600, h: 1025 }),
    url: 'max.drvalue.co.kr / GMP 양식',
  },
  aiCard: {
    kicker: 'MES AI',
    shot: imageOf({ src: '/screens/knowledge-ai.jpg', alt: '제조지식 AI 비서 화면 — LOT 이력·유사 클레임 사례·MES 실시간 조회', w: 1600, h: 900 }),
    url: 'max.drvalue.co.kr / AI 비서',
  },
}
