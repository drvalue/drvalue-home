/**
 * 오토폼 장의 글 — 관리 화면(페이지 → 오토폼)에서 고친다. 모양은 api 의 core/page/schema/intro-pages.schema.ts
 * 와 같다. 씨앗(db/migrations/0008)이자 예비 글. 시연(AutoformDemo)과 양식 셋(AutoformShow)은 코드다.
 * AI 솔루션 개발 장의 「오토폼」 구역 제목·설명도 이 글의 요약 칸을 쓴다.
 */
import { AUTOFORM_LEAD } from '../solutionContent'
import { AF_AFTER, AF_BEFORE } from '../autoformContent'
import { compareOf, leadOf, shotOf, type ServiceDemoContent } from '../../pageContentParts'

export const AUTOFORM_KEY = 'service-autoform'

export const AUTOFORM_DEFAULT: ServiceDemoContent = {
  shell: {
    kicker: '오토폼',
    kickerSub: 'AI솔루션',
    headLead: '쓰던 한글 양식 그대로, ',
    headStrong: '데이터만 채웁니다',
    desc: '기존 문서 양식과 제조 데이터를 연결해 반복적으로 작성하는 문서 업무를 지원합니다. 사용 중인 한글 양식을 바탕으로 데이터 연동 환경을 만듭니다.',
    ctaTitle: '쓰던 한글 양식 그대로, 오토폼으로 문서를 뽑아 보세요',
    ctaDesc: '양식 파일 하나와 채울 데이터가 어디 있는지만 알려주시면 됩니다.',
  },
  lead: leadOf(AUTOFORM_LEAD),
  heroShots: [
    shotOf({ src: '/screens/solution-form-automation-upload.jpg', alt: '오토폼 양식 등록 화면 — 데이터베이스 연결 상태와 분석된 양식 9개 목록', w: 1600, h: 1121, tag: '오토폼 · 양식 등록', url: 'form automation / 양식' }),
  ],
  demo: {
    kicker: '세 단계',
    title: '양식 한 번, 연결 한 번, 그다음은 고르기만',
    desc: '양식을 올리고, 칸마다 어느 데이터가 들어갈지 한 번 정하고, 그다음부터는 레코드를 고르기만 합니다. 아래는 실제 화면을 순서대로 다시 보여 주는 것입니다.',
  },
  compareStatement: {
    kicker: '',
    title: '복사해 채우는 문서가 아니라 골라서 나오는 문서',
    desc: '지난 문서를 복사해 값을 찾아 넣고 서식이 깨지지 않게 손보던 일을, 레코드 하나 고르는 것으로 끝냅니다.',
  },
  compare: compareOf(AF_BEFORE, AF_AFTER, {
    src: '/screens/solution-form-automation-mapping.jpg',
    alt: '오토폼 매핑 화면 — 한글 원본 위에 제품명·제조번호 같은 칸과 데이터 항목의 대응이 표시된다',
    w: 1600,
    h: 799,
  }),
  extra: {
    kicker: '양식',
    title: '견적서도, 두 쪽짜리 기록서도, 빈 서식도 같은 방식으로',
    desc: '등록 화면의 목록에 있는 양식 셋입니다. 파일마다 쪽·표·스칼라·리스트 수를 읽어 두고, 같은 데이터베이스에서 채웁니다.',
  },
}
