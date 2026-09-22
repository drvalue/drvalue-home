/**
 * 찾아오시는 길의 글 — 관리 화면(페이지 → 찾아오시는 길)에서 고친다. 모양은 api 의
 * core/page/schema/company-location.schema.ts 와 같다(칸을 바꾸면 둘 다 고친다).
 *
 * LOCATION_DEFAULT 는 두 곳에서 쓴다:
 *  1) api 가 안 닿거나 행이 없을 때 화면이 그리는 예비 글
 *  2) web/scripts/page-seed.mjs 가 처음 DB 에 넣는 씨앗(db/migrations/0004)
 * 이 파일은 다른 모듈을 `@/` 로 부르지 않는다 — 씨앗 스크립트가 node 로 바로 읽는다.
 */
import { LOCATION, LOCATION_LEAD } from '../companyContent'
import type { ImageValue, PageContentMap } from '../../../../../lib/page-types.gen'

/** 그림 칸. 치수는 저장할 때 api 가 미디어 파일에서 적는다. */
export type PageImage = ImageValue | null
/** 모양은 api 의 칸 구조에서 만든 형(lib/page-types.gen.ts). */
export type LocationContent = PageContentMap['company-location']

export const LOCATION_PAGE_KEY = 'company-location'

export const LOCATION_DEFAULT: LocationContent = {
  shell: {
    kicker: '찾아오시는 길',
    kickerSub: '회사소개',
    headLead: '디알밸류로 찾아오시는 길을 ',
    headStrong: '상세히 안내해 드립니다.',
    desc: LOCATION.intro,
    leadTitle: LOCATION_LEAD.title,
    ctaTitle: '방문 전에 미리 연락 주세요.',
    ctaDesc: '방문 전 일정을 협의하시면 보다 원활한 상담이 가능합니다.',
  },
  place: {
    company: LOCATION.company,
    address: LOCATION.address.map((line) => ({ line })),
    tel: LOCATION.tel.text,
    email: LOCATION.email,
    mapQuery: '한양대학교 ERICA 창업보육센터',
  },
  guide: { title: LOCATION.guide.title, desc: LOCATION.guide.desc, photo: null },
}

/**
 * 장소 이름으로 구글 지도를 띄운다. 관리 화면은 iframe 주소가 아니라 장소 이름만 받는다 —
 * 주소 칸에 아무 사이트나 넣어 이 장에 끼워 넣지 못하게.
 */
export const mapEmbedSrc = (query: string) =>
  'https://www.google.com/maps?q=' + encodeURIComponent(query) + '&z=17&hl=ko&output=embed'

/** '031-400-3880' → 'tel:0314003880' */
export const telHref = (tel: string) => 'tel:' + tel.replace(/[^0-9+]/g, '')
