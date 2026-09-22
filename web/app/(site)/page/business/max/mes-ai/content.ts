/**
 * MES AI 장의 글 — 관리 화면(페이지 → MES AI)에서 고친다. 모양은 api 의
 * core/page/schema/intro-pages.schema.ts 와 같다. 씨앗(db/migrations/0008)이자 예비 글.
 * 제조AI(M.AX) 소개 장의 「MES AI」 카드도 이 글의 제목·설명을 쓴다.
 */
import { AI_HEAD, AI_LEAD, AI_SHOWN } from '../maxContent'
import { imageOf, leadOf, lines, shotOf, type MesAiContent } from '../../../pageContentParts'

export const MES_AI_KEY = 'business-mes-ai'

const URLS = ['max.drvalue.co.kr / 자재 입출고', 'max.drvalue.co.kr / 규제 검증', 'max.drvalue.co.kr / AI 비서']
const TONES = ['', 'sand', 'steel']

export const MES_AI_DEFAULT: MesAiContent = {
  shell: {
    kicker: 'MES AI',
    kickerSub: '제조AI(M.AX)',
    headLead: AI_HEAD.headLead,
    headStrong: AI_HEAD.headStrong,
    desc: AI_HEAD.desc,
    ctaTitle: '',
    ctaDesc: '',
  },
  lead: leadOf(AI_LEAD),
  // 몇 초마다 넘어가는 셋 — 양식 자동생성(a2, 오토폼 장이 맡는 기능)의 화면이라 아래 벤토의 셋과 안 겹친다.
  heroShots: [
    shotOf({ src: '/screens/form-mapping.jpg', alt: 'AI 가 양식 구조를 읽고 MES 필드에 맞추는 화면', w: 1600, h: 799, tag: '양식 자동 매핑', url: 'max.drvalue.co.kr / 양식' }),
    shotOf({ src: '/screens/solution-form-automation-upload.jpg', alt: '양식 업로드 화면 — 데이터베이스 연결 상태와 분석된 hwp·hwpx 양식 목록', w: 1600, h: 1121, tag: '양식 업로드', url: 'max.drvalue.co.kr / 양식 업로드' }),
    shotOf({ src: '/screens/solution-form-automation-generate.jpg', alt: '문서 생성 화면 — 레코드를 고르면 품질관리기록서 양식을 값으로 채운다', w: 1600, h: 1024, tag: '문서 생성', url: 'max.drvalue.co.kr / 문서 생성' }),
  ],
  // 제목을 「읽고, 대조하고, 물어봅니다」로 두면 바로 위 요약 칸(AI_LEAD.title)과 같은 문장이 두 번 보인다.
  bento: {
    kicker: '실제 화면',
    title: 'MES 안에서 도는 AI 셋',
    desc: '문서에서 값을 뽑아 MES 와 맞춰 보고, 국가별 규제를 대조하고, 흩어진 제조 지식을 대화로 꺼냅니다.',
  },
  ais: AI_SHOWN.map((a, i) => ({
    label: a.label.replace(/^[①-⑤]\s*/, ''),
    title: a.title,
    desc: AI_LEAD.items![i].d,
    steps: lines(a.steps),
    shot: imageOf(a.shots![0]),
    url: URLS[i],
    tone: TONES[i],
  })),
}
