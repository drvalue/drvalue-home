/**
 * 화장품 MES 장의 글 — 관리 화면(페이지 → 화장품 MES)에서 고친다. 모양은 api 의
 * core/page/schema/intro-pages.schema.ts 와 같다. 씨앗(db/migrations/0008)이자 예비 글.
 * 제조AI(M.AX) 소개 장의 「화장품 MES」 카드도 이 글의 제목·설명을 쓴다.
 */
import { INDUSTRIES } from '../maxContent'
import { featureOf, leadOf, shotOf, type IndustryContent } from '../../../pageContentParts'

const IND = INDUSTRIES.find((i) => i.id === 'cos')!

export const COSMETICS_MES_KEY = 'business-cosmetics-mes'

export const COSMETICS_MES_DEFAULT: IndustryContent = {
  shell: {
    kicker: '화장품 MES',
    kickerSub: '제조AI(M.AX)',
    headLead: IND.headLead,
    headStrong: IND.headStrong,
    desc: IND.desc,
    ctaTitle: '우리 공장에 맞는 M.AX 구성이 궁금하신가요?',
    ctaDesc: '',
  },
  lead: leadOf(IND.lead!),
  // 2026-09-22 workspace.growxd.com(디마인 테넌트) 실제 화면. 아래 기능 판에 안 쓰는 둘이 번갈아 뜬다. 업체·제품·담당자는 가렸다.
  heroShots: [
    shotOf({ src: '/screens/cos-cash.jpg', alt: '수금 현황 화면 — 수주번호·명세서번호·수금액·최종수금일·출고일·출고금액·수주금액', w: 1600, h: 1000, tag: '영업 · 수금 현황', url: 'max.drvalue.co.kr / 수금' }),
    shotOf({ src: '/screens/cos-audit.jpg', alt: '감사 현황 화면 — 내부/외부 감사 항목과 감사 결과', w: 1600, h: 1000, tag: '품질 · 감사 현황', url: 'max.drvalue.co.kr / 감사' }),
  ],
  features: IND.features.map(featureOf),
  // 기능 9개를 네 묶음으로 나눈다(2026-09-22 원본 구성). 묶음마다 다른 모양(layout)은
  // 페이지 글 스키마에 칸이 없어 안 옮겼다 — 전부 기본 모양(기능 전문 판)으로 나간다.
  groups: [
    {
      kicker: '연구 → 영업',
      title: '처방에서 수금까지, 다시 입력하지 않습니다',
      desc: '연구노트의 처방이 제조 BOM 이 되고, 견적·수주·출하·세금계산서·수금이 한 줄로 이어집니다.',
      nos: '1, 2',
      cols: '',
    },
    {
      kicker: '구매 → 생산',
      title: '원료 발주부터 작업지시까지 한 흐름으로',
      desc: '발주·입고·재고·단가와 원료별 성분을 관리하고, 수주 기반 생산계획이 작업지시와 칭량·공정 전환으로 이어집니다.',
      nos: '3, 4',
      cols: '',
    },
    {
      kicker: '품질 → 규제',
      title: '단계별 검사부터 cGMP·클레임·규제까지',
      desc: '원료부터 완제품까지 일곱 단계 검사, GMP 양식 출력과 감사 추적, 클레임·CAPA, 국가별 규제·성분·MSDS 대조를 한 시스템에서 합니다.',
      nos: '5, 6, 7, 8',
      cols: '',
    },
    {
      kicker: '모니터링',
      title: '공정·설비·환경을 실시간으로 기록합니다',
      desc: '공정 이상은 즉시 알리고, 설비의 환경 데이터와 SCADA·유지보수 이력을 같은 화면에서 봅니다.',
      nos: '9',
      cols: '',
    },
  ],
}
