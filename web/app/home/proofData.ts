/**
 * 메인 "신뢰의 근거" 카드.
 *
 * **운영 연혁(/page/company/history)에 화면으로 보이는 항목만** 옮겼다.
 * 설명 줄도 제목을 쉬운 말로 다시 쓴 것뿐이고, 없는 사실을 보태지 않았다.
 * 인증·선정은 틀리면 안 되는 종류의 문장이다.
 *
 * 한 번 사고를 냈다: 운영 연혁 HTML 에는 `<!-- -->` 로 **주석 처리해 둔
 * 항목**이 섞여 있다(엠슈머 파트너사 1,000개 돌파, DR-Vision 고도화,
 * 벤처기업 확인서, 스마트팩토리 특허 등록, 기업부설연구소 설립 승인).
 * 화면에 안 나오는 것 = 회사가 지금은 안 내보내기로 한 것이다. 태그만 떼고
 * 글자를 긁으면 그게 그대로 딸려 들어온다. **연혁을 다시 긁을 일이 있으면
 * 주석부터 지우고 긁어라.**
 */

export type Proof = {
  year: '2026' | '2025' | '2024'
  /** 카드 분류. 색과 배지 글자가 이것으로 갈린다. */
  kind: '인증' | '선정' | '협력'
  title: string
  detail: string
  icon: string
}

export const PROOFS: Proof[] = [
  {
    year: '2026',
    kind: '선정',
    title: '소상공인 AI 활용지원 사업 전문 AI 멘토 기업 선정',
    detail: 'AI 도입을 돕는 전문 멘토 기업으로 선정됐습니다.',
    icon: 'fa-users',
  },
  {
    year: '2026',
    kind: '선정',
    title: 'AI 바우처 · 클라우드 바우처 선정, S 바우처 재선정',
    detail: 'AI·클라우드 바우처에 선정되고 S 바우처는 다시 선정됐습니다.',
    icon: 'fa-ticket',
  },
  {
    year: '2025',
    kind: '선정',
    title: '제조 AI 솔루션 100선 선정',
    detail: '제조 AI 솔루션 100선에 선정됐습니다.',
    icon: 'fa-trophy',
  },
  {
    year: '2025',
    kind: '인증',
    title: 'ISO 9001 / ISO 14001 인증',
    detail: '품질경영(9001)과 환경경영(14001) 국제 표준 인증입니다.',
    icon: 'fa-certificate',
  },
  {
    year: '2025',
    kind: '인증',
    title: '클라우드 서비스 적격 평가 인증',
    detail: '클라우드 서비스 적격 평가 인증을 받았습니다.',
    icon: 'fa-cloud',
  },
  {
    year: '2025',
    kind: '인증',
    title: 'AI V&V AI 성능 시험',
    detail: 'AI 성능 시험(V&V)을 받았습니다.',
    icon: 'fa-check-square-o',
  },
  {
    year: '2025',
    kind: '협력',
    title: '한양대학교 ERICA 스마트융합공학부 MOU 체결',
    detail: '한양대학교 ERICA 스마트융합공학부와 업무협약을 맺었습니다.',
    icon: 'fa-handshake-o',
  },
  {
    year: '2025',
    kind: '협력',
    title: '중소기업벤처부 통합 기술보호지원 자문 진행',
    detail: '중소기업벤처부 통합 기술보호지원 자문을 진행했습니다.',
    icon: 'fa-shield',
  },
  {
    year: '2025',
    kind: '선정',
    title: 'S 바우처 선정',
    detail: 'S 바우처에 선정됐습니다.',
    icon: 'fa-ticket',
  },
  {
    year: '2024',
    kind: '협력',
    title: '기업부설연구소 설립',
    detail: '자체 연구 조직을 두고 있습니다.',
    icon: 'fa-flask',
  },
  {
    year: '2024',
    kind: '협력',
    title: '디알밸류 법인 설립',
    detail: '(주)디알밸류를 설립했습니다.',
    icon: 'fa-building-o',
  },
]

export const YEARS: Proof['year'][] = ['2026', '2025', '2024']
