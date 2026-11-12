/**
 * everyrag 장의 글 — 관리 화면(페이지 → everyrag)에서 고친다. 모양은 api 의
 * core/page/schema/intro-pages.schema.ts 와 같다. 씨앗(db/migrations/0022)이자 예비 글.
 *
 * 출처: 운영 중인 서비스 사이트 studio.everyrag.com(2026-11-12 확인)의 첫 장 · Database · Assistant 장.
 * **문장을 새로 지어내지 않았다** — 거기 있는 글을 이 사이트의 합니다체로 옮겼다. 요금 숫자와
 * 「준비 중」으로 적힌 것(Plugin · CLI · 온라인 결제)은 싣지 않았다. 화면은 그 사이트 첫 장을 1440 폭으로 찍은 것.
 */
import { imageOf, type EveryragContent } from '../../pageContentParts'

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
    title: '있으면 인용하고, 없으면 없다고 답합니다',
    desc: '자료에서 온 주장에는 원문 인용이 붙습니다. 자료에 없는 일반 지식은 「자료 밖」으로 따로 표시합니다.',
    heroN: '',
    heroLabel: '',
    items: [
      { t: '근거 인용', d: '답의 인용 번호는 서버가 넘긴 근거 안에서만 인정합니다. 인용문은 모델 출력이 아니라 원문에서 가져옵니다.' },
      { t: '자료 밖 표시', d: '기록에 없으면 없다고 답합니다. 일반 지식으로 덧붙일 때는 「자료 밖」으로 따로 표시합니다.' },
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
  sections: [
    {
      kicker: '넣기 · 요약 · 검색',
      title: '넣고, 정리하고, 찾아서 답합니다',
      desc: '',
      items: [
        { t: '넣기', d: '파일을 끌어다 놓거나, JSON · 대화 기록을 API 로 보냅니다. 조각 나누기는 everyrag 가 합니다.' },
        { t: '요약 · 색인', d: '쌓일 때마다 주제별 요약(지식 뷰)을 만들고, 단어와 의미 두 방식으로 색인합니다.' },
        { t: '검색 · 답', d: '질문 종류를 가려 찾고, 재순위한 뒤 근거를 판정해서 답합니다. 인용은 서버가 검증합니다.' },
      ],
    },
    {
      kicker: 'Database',
      title: '넣으면 요약하고, 색인하고, 찾아 줍니다',
      desc: '컬렉션 하나가 격리 단위입니다. 대화형과 문서형이 있고, 둘 다 같은 검색 · 재순위 · 근거 규칙을 씁니다.',
      items: [
        { t: '파일도 JSON 도 대화도', d: '끌어다 놓거나 API 로 보내면 조각 나누기와 임베딩을 알아서 합니다. 같은 id 로 다시 보내면 건너뜁니다.' },
        { t: '단어와 의미를 함께', d: '질문 종류를 먼저 가리고, 하이브리드로 찾아 재순위합니다. 결과마다 점수와 출처를 보여 줍니다.' },
        { t: '쌓일 때마다 요약', d: '주제별 요약과 요점을 지식 뷰로 만듭니다. 새 기록이 들어오면 해당 주제만 다시 요약합니다.' },
      ],
    },
    {
      kicker: 'Assistant',
      title: '파일을 올리면 바로 물어볼 수 있습니다',
      desc: '파일과 지침을 주면 채팅 화면이 생기고, 컬렉션마다 MCP 주소가 자동으로 발급됩니다. 배포 전에 답과 근거를 확인합니다.',
      items: [
        { t: '지침', d: '말투와 답변 범위를 지침으로 정합니다.' },
        { t: 'MCP', d: '에이전트에 붙일 주소가 자동으로 생깁니다.' },
        { t: 'API', d: '같은 컬렉션을 chat 엔드포인트로 호출합니다.' },
      ],
    },
  ],
}
