/**
 * everyrag 장의 글 — 관리 화면(페이지 → everyrag)에서 고친다. 모양은 api 의
 * core/page/schema/intro-pages.schema.ts 와 같다. 씨앗(db/migrations/0022)이자 예비 글.
 * 대화 시연(EveryragDemo)과 시작 코드는 코드다(everyragContent.ts).
 *
 * 출처: 운영 중인 서비스 사이트 studio.everyrag.com(2026-11-12 확인)의 첫 장 · Assistant 장.
 * 거기 있는 글을 이 사이트의 합니다체로 옮겼다. 요금 숫자와 「준비 중」으로 적힌 것(Plugin · CLI · 온라인 결제)은
 * 싣지 않았다. 화면 둘은 그 사이트의 공개 장을 1440 폭으로 찍은 것. 우리가 쓴 문장은 everyragContent.ts 머리말에.
 */
import { ER_AFTER, ER_BEFORE } from '../everyragContent'
import { compareOf, imageOf, type EveryragContent } from '../../pageContentParts'

export const EVERYRAG_KEY = 'service-everyrag'

/** 머리말 둘째 단추가 가는 곳 — 운영 중인 서비스. 주소는 페이지 글이 아니라 코드다. */
export const EVERYRAG_URL = 'https://studio.everyrag.com/'

export const EVERYRAG_DEFAULT: EveryragContent = {
  shell: {
    kicker: 'everyrag',
    kickerSub: 'AI솔루션',
    headLead: '벡터 DB 없이 ',
    headStrong: '자료에 근거를 붙여 답하는 RAG, everyrag',
    desc: '파일 · JSON · 대화 기록을 API 키로 넣으면 조각 나누기 · 임베딩 · 색인 · 요약까지 처리합니다. 올린 즉시 채팅으로 시험하고, 답에는 원문 인용이 붙습니다.',
    heroLink: 'everyrag 바로가기',
    ctaTitle: '우리 자료로 답하는 AI, everyrag 로 먼저 확인해 보세요',
    ctaDesc: 'studio.everyrag.com 에서 서비스를 바로 살펴볼 수 있습니다. 도입·연동 상담은 아래로.',
  },
  lead: {
    title: '벡터 DB 를 몰라도 됩니다',
    desc: '자료를 넣으면 요약하고 색인하고, 근거를 붙여 답합니다.',
    heroN: '',
    heroLabel: '',
    items: [
      { t: '근거 인용', d: '답의 인용 번호는 서버가 넘긴 근거 안에서만 인정합니다. 인용문은 모델 출력이 아니라 원문에서 가져옵니다.' },
      { t: '요약 지식', d: '원문만 뒤지지 않고, 쌓일 때마다 만든 주제 요약도 함께 찾습니다. 기간이나 사람 질문에 강합니다.' },
      { t: '컬렉션 격리', d: '모든 저장 · 검색 쿼리에 컬렉션 조건이 필수입니다. 다른 컬렉션의 자료는 섞이지 않습니다.' },
    ],
  },
  heroShots: [
    {
      image: imageOf({
        src: '/screens/everyrag-home.jpg',
        alt: 'everyrag 서비스 첫 화면 — 「벡터 DB 없이 자료에 근거를 붙여요」 제목과 무료로 시작 단추, 문서·JSON·표가 조각으로 나뉘어 색인되고 인용이 붙은 답으로 이어지는 그림',
        w: 1440,
        h: 900,
      }),
      tag: 'everyrag · RAG 플랫폼',
      url: 'studio.everyrag.com',
    },
  ],
  demo: {
    kicker: 'Assistant',
    title: '있으면 인용하고, 없으면 없다고 답합니다',
    desc: '자료에서 온 답에는 원문 인용이 붙습니다. 자료에 없으면 없다고 답하고, 일반 지식으로 덧붙일 때는 「자료 밖」으로 따로 표시합니다. 아래는 everyrag 가 사이트에 올려 둔 예시 대화를 그대로 따라간 것입니다.',
  },
  compareStatement: {
    kicker: '',
    title: '만드는 시간이 아니라 물어보는 시간',
    desc: '벡터 DB 와 파이프라인을 세우던 일을, 자료를 넣고 묻는 일로 바꿉니다.',
  },
  compare: compareOf(ER_BEFORE, ER_AFTER, {
    src: '/screens/everyrag-assistant.jpg',
    alt: 'everyrag 서비스 사이트의 채팅 예시 화면 — 인용 번호가 붙은 답, 자료에서 못 찾았다는 답, 「자료 밖」 표시가 붙은 답',
    w: 1120,
    h: 904,
  }),
  extra: {
    kicker: 'API',
    title: 'API 키 하나로 시작합니다',
    desc: '넣기와 묻기는 같은 키로 합니다. 범위는 ingest · query · admin 이고, 키 원문은 발급할 때 한 번만 보여 줍니다.',
  },
  steps: [
    { t: '넣기', d: '파일을 끌어다 놓거나, JSON · 대화 기록을 API 로 보냅니다. 조각 나누기는 everyrag 가 합니다.' },
    { t: '요약 · 색인', d: '쌓일 때마다 주제별 요약(지식 뷰)을 만들고, 단어와 의미 두 방식으로 색인합니다.' },
    { t: '검색 · 답', d: '질문 종류를 가려 찾고, 재순위한 뒤 근거를 판정해서 답합니다. 인용은 서버가 검증합니다.' },
  ],
}
