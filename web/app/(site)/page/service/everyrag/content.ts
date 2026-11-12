/**
 * everyrag 장의 글 — 관리 화면(페이지 → everyrag)에서 고친다. 모양은 api 의
 * core/page/schema/intro-pages.schema.ts 와 같다. 씨앗(db/migrations/0022)이자 예비 글.
 * 대화 시연(EveryragDemo)은 코드다(everyragContent.ts).
 *
 * 출처: 운영 중인 서비스 사이트 studio.everyrag.com(2026-11-12 확인)의 첫 장(Business 쪽 문장) · Assistant · Enterprise 장.
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
    headLead: '우리 회사의 기록을 ',
    headStrong: '믿고 쓸 수 있는 답으로, everyrag',
    desc: '쌓인 문서와 대화를 요약 지식으로 정리하고, 근거가 없으면 없다고 답합니다. 팀마다 자료가 나뉘어 다른 팀 자료가 섞이지 않습니다.',
    heroLink: 'everyrag 바로가기',
    ctaTitle: '우리 자료로 답하는 AI, everyrag 로 먼저 확인해 보세요',
    ctaDesc: 'studio.everyrag.com 에서 서비스를 바로 살펴볼 수 있습니다. 도입·연동 상담은 아래로.',
  },
  lead: {
    title: '문서를 올리면 바로 물어볼 수 있습니다',
    desc: '파일을 올리면 채팅 화면이 생깁니다. 답 문장 끝의 인용 번호에서 원문을 볼 수 있습니다.',
    heroN: '',
    heroLabel: '',
    items: [
      { t: '근거가 붙은 답', d: '자료에서 온 답에는 어느 문서인지 인용이 붙습니다. 인용문은 AI 가 지어낸 말이 아니라 원문에서 가져옵니다.' },
      { t: '없으면 없다고', d: '기록에 없으면 없다고 답합니다. 일반 지식으로 덧붙일 때는 「자료 밖」으로 따로 표시합니다.' },
      { t: '팀별로 나뉜 자료', d: '조직 · 프로젝트 · 컬렉션으로 자료를 나눕니다. 다른 팀의 자료는 섞이지 않습니다.' },
    ],
  },
  heroShots: [
    {
      image: imageOf({
        src: '/screens/everyrag-home.jpg',
        alt: 'everyrag 서비스 첫 화면 — 「우리 팀의 기록을 믿고 쓸 수 있는 답으로」 제목과 무료로 시작 단추, 문서와 표가 조각으로 나뉘어 정리되고 인용이 붙은 답으로 이어지는 그림',
        w: 1424,
        h: 536,
      }),
      tag: 'everyrag · 사내 문서 AI',
      url: 'studio.everyrag.com',
    },
  ],
  demo: {
    kicker: '질문과 답',
    title: '있으면 인용하고, 없으면 없다고 답합니다',
    desc: '자료에서 온 답에는 원문 인용이 붙습니다. 자료에 없으면 없다고 답하고, 일반 지식으로 덧붙일 때는 「자료 밖」으로 따로 표시합니다. 아래는 everyrag 가 사이트에 올려 둔 예시 대화를 그대로 따라간 것입니다.',
  },
  compareStatement: {
    kicker: '',
    title: '찾는 시간이 아니라 묻는 시간',
    desc: '문서를 뒤지고 아는 사람을 찾던 일을, 올려 두고 묻는 일로 바꿉니다.',
  },
  compare: compareOf(ER_BEFORE, ER_AFTER, {
    src: '/screens/everyrag-assistant.jpg',
    alt: 'everyrag 서비스 사이트의 채팅 예시 화면 — 인용 번호가 붙은 답, 자료에서 못 찾았다는 답, 「자료 밖」 표시가 붙은 답',
    w: 1120,
    h: 904,
  }),
  extra: {
    kicker: '시작하기',
    title: '올리고, 정리되고, 물어봅니다',
    desc: '문서(docx · pdf · txt)와 표(csv), 대화 기록, 사진과 스캔 이미지까지 올릴 수 있습니다.',
  },
  steps: [
    { t: '자료 올리기', d: '파일을 끌어다 놓으면 됩니다. 나누고 정리하는 일은 everyrag 가 합니다.' },
    { t: '자동 요약', d: '쌓일 때마다 주제별로 묶어 요약합니다. 새 기록이 들어오면 해당 주제만 다시 요약합니다.' },
    { t: '묻고 확인하기', d: '채팅으로 묻고, 답에 붙은 인용에서 원문을 확인합니다.' },
  ],
}
