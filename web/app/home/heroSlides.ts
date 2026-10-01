/**
 * 홈 머리 그림의 둘째 장 — 보도자료 한 건.
 * 글은 `/page/support/press/dongbang-bnh-smart-factory` 본문에서 옮겼다(2026-10-01). 숫자는 그 글의
 * 「사업 개요」·「목표 수치」 문장 그대로다 — 새로 지어 쓰지 않는다. 관리 화면에서는 아직 못 고친다
 * (첫 장의 글만 「메인 화면 › 문구」가 정한다). 보도자료가 바뀌면 여기를 같이 고친다.
 */
export const PRESS_SLIDE = {
  kicker: 'PRESS · 보도자료',
  titleLead: '동방비앤에이치와',
  titleStrong: '제조AI 특화 스마트공장 구축 협약',
  desc: '중소벤처기업부 제조AI 특화 스마트공장 구축지원사업 협약을 맺고, 화장품 제조 특화 AI 솔루션 CosmoGMP.AI 적용에 착수했습니다. 한국경제TV 에 보도되었습니다.',
  primary: { label: '보도자료 보기', href: '/page/support/press/dongbang-bnh-smart-factory' },
  secondary: { label: '보도자료 목록', href: '/page/support/press' },
  facts: ['총 사업비 4억 원', '제조 리드타임 31.5% 단축 목표', '납기준수율 66.7% → 90% 목표'],
  image: { src: '/opt/main_bg_04.jpg', width: 1920, height: 1280 },
} as const
