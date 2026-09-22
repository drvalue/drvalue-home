/**
 * CADON 장의 글 — 관리 화면(페이지 → CADON)에서 고친다. 모양은 api 의 core/page/schema/intro-pages.schema.ts
 * 와 같다. 씨앗(db/migrations/0008)이자 예비 글. 시연(CadonDemo)과 판정 패널(CadonCases)은 코드다.
 * AI 솔루션 개발 장의 「CADON」 구역 제목·설명도 이 글의 요약 칸을 쓴다.
 */
import { CADON_LEAD } from '../solutionContent'
import { CD_AFTER, CD_BEFORE } from '../cadonContent'
import { compareOf, leadOf, shotOf, type ServiceDemoContent } from '../../pageContentParts'

export const CADON_KEY = 'service-cadon'

export const CADON_DEFAULT: ServiceDemoContent = {
  shell: {
    kicker: 'CADON in AutoCAD',
    kickerSub: 'AI솔루션',
    headLead: 'AutoCAD 안에서 판금을 ',
    headStrong: '펴고 되짚습니다',
    desc: '3D STEP 또는 2D DXF 도면을 바탕으로 전개 결과를 확인하고, 절단선·절곡선 작도와 DFM 검토, 절곡 시뮬레이션까지 AutoCAD 작업 환경에서 끝냅니다.',
    ctaTitle: '도면은 밖으로 나가지 않습니다 — CADON 으로 AutoCAD 안에서 전개하세요',
    ctaDesc: '쓰시는 AutoCAD 버전과 판금 자재를 알려주시면 적용 방안을 검토해 드립니다.',
  },
  lead: leadOf(CADON_LEAD),
  heroShots: [
    shotOf({ src: '/screens/cadon-02-unfold.jpg', alt: 'CutON 전개 결과 — AutoCAD 도면 위에 절단선·절곡선이 작도되고, PASS 1 · A1100 t 2 · 절곡 6 · DFM 경고 4 패널이 뜬다', w: 1600, h: 993, tag: 'CADON · 전개 결과', url: 'AutoCAD / CADON' }),
  ],
  demo: {
    kicker: '전개 한 번',
    title: 'STEP 을 열어 전개하고, 돌려 보고, 되접기까지 AutoCAD 안에서',
    desc: 'STEP 을 열고 「이 파일로 전개」를 누르면 전개도가 도면 위에 그려지고, 절곡 순서를 돌려 본 뒤 다시 3D 로 되접어 확인합니다. 아래는 부품 하나를 실제로 돌린 화면을 순서대로 다시 보여 주는 것입니다.',
  },
  compareStatement: {
    kicker: '',
    title: '기다리는 시간이 아니라 검토하는 시간',
    desc: '외부 전개 서비스에 올리고 기다리던 일을, AutoCAD 명령 하나로 그 자리에서 끝냅니다.',
  },
  compare: compareOf(CD_BEFORE, CD_AFTER, {
    src: '/screens/cuton-autocad-03-bend-simulation.jpg',
    alt: 'CutON 절곡 시뮬레이션 화면 — 스텝별 형상과 DFM 위반',
    w: 1600,
    h: 880,
  }),
  extra: {
    kicker: '검토',
    title: '만들 수 있는 형상인지 그 자리에서 봅니다',
    desc: '전개가 끝나면 PASS · REVIEW · 실패로 판정하고, 만들 수 없는 플랜지는 어느 스텝에서 얼마나 짧은지 짚어 줍니다. 아래는 같은 부품의 실제 패널입니다.',
  },
}
