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
  // 국가별 규제 검증. 이 장의 탭(원료·GMP 양식·클레임)엔 없는 화면이라 겹치지 않는다. 안 겹치는 화면이 하나뿐이라 한 장.
  heroShots: [
    shotOf({ src: '/screens/cos-regulation.jpg', alt: '국가별 규제 기준으로 성분을 검증하는 화면 — 성분·기준·허용 한도 표', w: 1600, h: 836, tag: '국가별 규제 검증', url: 'max.drvalue.co.kr / 규제 검증' }),
  ],
  features: IND.features.map(featureOf),
  groups: [
    {
      kicker: '연구 → 품질',
      title: '연구노트부터 클레임까지 한 시스템',
      desc: '처방 기준으로 원료 단가가 자동 산출되고, cGMP 양식은 시스템에서 바로 출력되며, 클레임은 원인 LOT 역추적까지 한곳에서 이어집니다.',
      nos: '1, 2, 3',
      cols: '',
    },
    {
      kicker: '모니터링',
      title: '공정과 환경을 실시간으로 기록합니다',
      desc: '공정별 진행·이상 상태를 실시간으로 확인하고, 온·습도 등 제조 환경 데이터를 자동으로 쌓아 품질에 미친 영향까지 연계해 봅니다.',
      nos: '4, 5',
      cols: '',
    },
  ],
}
