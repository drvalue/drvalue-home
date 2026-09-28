/**
 * PCB MES 장의 글 — 관리 화면(페이지 → PCB MES)에서 고친다. 모양은 api 의
 * core/page/schema/intro-pages.schema.ts 와 같다. 씨앗(db/migrations/0008)이자 예비 글.
 * 제조AI(M.AX) 소개 장의 「PCB MES」 카드도 이 글의 제목·설명을 쓴다.
 */
import { INDUSTRIES, KPI } from '../maxContent'
import { featureOf, leadOf, shotOf, type IndustryContent } from '../../../pageContentParts'

const IND = INDUSTRIES.find((i) => i.id === 'pcb')!

export const PCB_MES_KEY = 'business-pcb-mes'

export const PCB_MES_DEFAULT: IndustryContent = {
  shell: {
    kicker: 'PCB MES',
    kickerSub: '제조AI(M.AX)',
    headLead: IND.headLead,
    headStrong: IND.headStrong,
    desc: IND.desc,
    ctaTitle: '우리 공장에 맞는 M.AX 구성이 궁금하신가요?',
    ctaDesc: '',
  },
  lead: leadOf(IND.lead!),
  // 아래 탭의 첫 화면(전사 현황·사양 등록·배열·공정·불량·출고)과 안 겹치는 셋이 번갈아 뜬다.
  heroShots: [
    shotOf({ src: '/screens/pcb-lamination.jpg', alt: '적층구조 라이브러리 화면 — 층별 CF·PP·CCL 구성과 두께를 조합해 저장', w: 1600, h: 1000, tag: '적층구조 라이브러리', url: 'max.drvalue.co.kr / 적층구조' }),
    shotOf({ src: '/screens/pcb-inspect.jpg', alt: '검사기준서 관리 화면 — 기준서 버전·검사등급과 업체별 기준서 지정', w: 1600, h: 1000, tag: '검사기준서 관리', url: 'max.drvalue.co.kr / 검사기준서' }),
    shotOf({ src: '/screens/pcb-collect.jpg', alt: '수금 현황 화면 — 수주번호별 수주금액·출고금액·수금액·최종 수금일', w: 1600, h: 1000, tag: '수금 현황', url: 'max.drvalue.co.kr / 수금' }),
  ],
  features: IND.features.map(featureOf),
  groups: [
    {
      kicker: '수주 → 배치',
      title: '사양 등록부터 원판 배치까지',
      desc: '',
      nos: '1, 2, 3',
      cols: '',
    },
    {
      kicker: '생산 → 정산',
      title: '진척·검사·정산을 실시간으로',
      desc: '',
      nos: '4, 5, 6',
      cols: '',
    },
    {
      kicker: 'KPI',
      title: '쌓인 기록이 곧 지표가 됩니다',
      desc: '',
      nos: '7',
      cols: 'kpi',
    },
  ],
  kpi: KPI.map((k) => ({ t: k.h, d: k.p })),
}
