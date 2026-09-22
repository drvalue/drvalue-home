/**
 * AI 솔루션 개발 장의 글 — 관리 화면(페이지 → AI 솔루션 개발)에서 고친다. 모양은 api 의
 * core/page/schema/intro-pages.schema.ts 와 같다. 씨앗(db/migrations/0008)이자 예비 글.
 * 제품군 다섯 구역의 제목·설명은 여기 없다 — 오토폼 · 컷온 · CADON · 채팅 · 한건 장의 요약 칸을 그대로 쓴다.
 */
import { AISOL, AISOL_LEAD, AUTOFORM, CADON, CHAT, CUTON, CUTON_SHOT } from '../../service/solutionContent'
import { imageOf, leadOf, plainText, shotOf, type AiSolContent, type ShowTabContent } from '../../pageContentParts'

export const AI_SOL_KEY = 'business-ai-sol'

const tab = (x: { t: string; d: string; tone?: string; tag: string; url: string; shot: { src: string; alt: string; w: number; h: number } }): ShowTabContent => ({
  image: imageOf(x.shot),
  tag: x.tag,
  url: x.url,
  t: x.t,
  d: x.d,
  tone: x.tone ?? '',
})

/** 로드맵(AISOL 기능 1)의 요점 셋 — 「이름 — 설명」 꼴을 열 둘로 나눈다. */
const road = AISOL[0]

export const AI_SOL_DEFAULT: AiSolContent = {
  shell: {
    kicker: 'AI 솔루션 개발',
    kickerSub: 'AI솔루션',
    headLead: '기업의 혁신을 완성하는 ',
    headStrong: '맞춤형 AI 솔루션 파트너, 디알밸류',
    desc: '최신 LLM 기술부터 보안이 강조된 온프레미스 기반 로컬 AI까지, 기업 내부 데이터를 기반으로 답변하는 RAG 시스템을 구축합니다.',
    heroLink: '만들어 둔 것 보기',
    ctaTitle: '사내 자료로 답하는 AI, 디알밸류와 시작하는 게 가장 빠릅니다',
    ctaDesc: '만들어 둔 제품 다섯을 상용으로 돌리고 있습니다. 어떤 자료가 얼마나 있는지만 알려주세요.',
  },
  lead: leadOf(AISOL_LEAD),
  heroShots: [
    shotOf({ src: '/screens/knowledge-ai.jpg', alt: '제조지식 AI 비서 화면 — LOT 이력·유사 클레임 사례·MES 실시간 조회', w: 1600, h: 900, tag: 'RAG · 사내 자료로 답합니다', url: 'drvalue.co.kr / 제조지식 AI 비서' }),
  ],
  road: {
    kicker: road.kicker,
    title: plainText(road.title),
    items: road.points.map((p) => {
      const [t, d] = plainText(p).split(' — ')
      return { t, d: d ?? '' }
    }),
  },
  autoformTabs: [
    tab({ t: '쓰던 한글 양식을 그대로 올립니다', d: plainText(AUTOFORM[0].points[0]), tone: 'sand', tag: '양식 등록', url: 'autoform / 양식 등록', shot: { src: '/screens/solution-form-automation-upload.jpg', alt: '양식 등록 화면 — 올린 한글 양식 목록과 분석·연결 상태', w: 1600, h: 1121 } }),
    tab({ t: '문서 칸과 업무 데이터를 맺어 둡니다', d: plainText(AUTOFORM[1].points[0]), tone: 'sand', tag: '데이터 연결', url: 'autoform / 매핑', shot: { src: '/screens/solution-form-automation-mapping.jpg', alt: '매핑 화면 — 한글 원본과 DB 스키마를 나란히 놓고 칸을 맺는다', w: 1600, h: 799 } }),
    tab({ t: '레코드를 고르면 문서가 나옵니다', d: plainText(AUTOFORM[2].points[0]), tone: 'sand', tag: '문서 생성', url: 'autoform / 생성', shot: { src: '/screens/solution-form-automation-generate.jpg', alt: '문서 생성 화면 — 레코드를 골라 채운 문서', w: 1600, h: 1024 } }),
  ],
  cutonTabs: [
    tab({ t: '도면을 올리면 항목이 잡힙니다', d: '영역을 드래그해 항목을 만들고 재질그룹별 예상가를 한 번에 받습니다(체험 가이드 화면).', tone: 'steel', tag: '예상견적산출', url: 'cuton.co.kr / 체험 가이드', shot: { src: '/screens/cuton-sim.jpg', alt: '예상견적산출 체험 화면 — sample-bracket.dxf 위에 항목 둘을 드래그로 잡은 상태', w: 1440, h: 1300 } }),
    tab({ t: '재질그룹별 예상가가 같은 화면에', d: '분석값과 재질그룹 가격표, 최저 합계가 도면 옆에 바로 뜹니다.', tone: 'steel', tag: '견적 결과', url: 'cuton.co.kr / 체험 가이드', shot: { src: '/screens/cuton-result.jpg', alt: '견적 결과 화면 — 분석값과 재질그룹별 가격, 최저 합계', w: 1290, h: 810 } }),
    tab({ t: '견적 상세와 도면 미리보기', d: plainText(CUTON[0].points[0] ?? ''), tone: 'steel', tag: '견적 상세', url: 'cuton.co.kr / 견적 상세', shot: CUTON_SHOT }),
  ],
  cadonTabs: [
    tab({ t: 'STEP 을 열어 전개할 부품을 고릅니다', d: plainText(CADON[0].points[0]), tag: 'STEP 미리보기', url: 'AutoCAD / CADON', shot: { src: '/screens/cuton-autocad-01-3d-preview.jpg', alt: 'STEP 미리보기 — 3D 형상을 돌려 보며 전개 대상을 고른다', w: 1600, h: 1347 } }),
    tab({ t: '전개 결과가 도면 위에 그려집니다', d: plainText(CADON[1].points[0] ?? ''), tag: '전개 결과', url: 'AutoCAD / CADON', shot: { src: '/screens/cuton-autocad-02-unfold-result.jpg', alt: '전개 결과 — AutoCAD 안에 절단선·절곡선이 레이어로 작도된다', w: 1600, h: 993 } }),
    tab({ t: '절곡 순서를 돌려 보고 3D 로 되접습니다', d: plainText(CADON[2]?.points[0] ?? ''), tag: '절곡 시뮬레이션', url: 'AutoCAD / CADON', shot: { src: '/screens/cuton-autocad-03-bend-simulation.jpg', alt: '절곡 시뮬레이션 — 스텝별 3D 형상과 각도·반경·DFM 검토', w: 1600, h: 1000 } }),
  ],
  chatTabs: [
    tab({ t: '고객은 상담 버블에서 바로 대화', d: plainText(CHAT[0].points[2]), tone: 'sand', tag: '고객 쪽', url: 'growchat / 홈페이지 상담 창', shot: { src: '/screens/growchat-customer.jpg', alt: '고객 상담 창의 대화 — MES 도입 문의 두 건, 상담 시작, 상담사의 LOT 추적 답', w: 924, h: 676 } }),
    tab({ t: '상담원은 한 화면에서 대화·이력·상태', d: plainText(CHAT[1].points[1]), tone: 'sand', tag: '상담원 쪽', url: 'growchat / 관리자센터', shot: { src: '/screens/growchat-agent.jpg', alt: '상담원 관리자센터 — 대화방 목록과 대화, 고객 정보', w: 1600, h: 1000 } }),
  ],
  hangeonTabs: [
    tab({ t: 'Chat — 근거 기반 질의응답', d: 'KCS·KDS·표준품셈과 법령 조문을 인용해 답합니다.', tag: 'Chat', url: 'hankeon.com / chat', shot: { src: '/screens/hankeon-chat.jpg', alt: '한건 Chat 화면 — 건축법 시행령 조문을 인용해 답한다', w: 1600, h: 1000 } }),
    tab({ t: 'Biz — 맞춤 입찰 검색', d: '나라장터·지자체 공고를 면허와 지역 기준으로 가려 줍니다.', tone: 'steel', tag: 'Biz', url: 'hankeon.com / biz', shot: { src: '/screens/hankeon-biz.jpg', alt: '한건 Biz 내게 맞는 공고 화면 — 적합·부적합과 이유', w: 1600, h: 1000 } }),
  ],
}
