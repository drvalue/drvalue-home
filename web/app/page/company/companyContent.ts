/**
 * 회사소개 네 장(안내·비전·연혁·찾아오시는 길)의 글과, 넷이 같이 쓰는 CSS.
 *
 * 2026-09-18 옛 꾸밈(사진 머리 + t_inner + AOS)에서 M.AX 계열과 같은 틀
 * (SolutionShell + maxStyles)로 옮기면서 글을 여기로 빼냈다. **문장을 새로
 * 지어내지 않았다** — 옛 장에 있던 문장·숫자·이름을 그대로 옮겨 담고, 머리말과
 * 요약 칸에 나눠 놓았을 뿐이다. 화면 파일에 글을 적지 않는 것은
 * solutionContent.ts 와 같은 이유다.
 */
import type { Lead } from '../business/max/SolutionShell'

/* ── 안내 ───────────────────────────────────────────────────────── */

export const INTRO_LEAD: Lead = {
  title: '제조의 디지털 전환을 선도하는 최고의 데이터 파트너, 디알밸류',
  desc: '우리는 단순한 솔루션 제공자를 넘어 제조 현장의 언어를 데이터로 통일합니다.',
  items: [
    { t: 'Intelligence', d: '정밀한 AI 알고리즘을 통해 제조 현장의 데이터 속에 숨겨진 최적의 해답을 찾아냅니다.' },
    { t: 'Connectivity', d: '현장의 기기와 정보 시스템을 유기적으로 연결하여 데이터가 끊김 없이 흐르게 합니다.' },
    { t: 'Efficiency', d: '불필요한 공정과 대기 시간을 줄여 제조 생산성의 드라마틱한 향상을 숫자로 증명합니다.' },
  ],
}

/** 제품 화면 한 장. 옛 장의 /opt/deshboard_pc.jpg 는 Lorem ipsum 이 찍힌 스톡
 *  템플릿이라 뺐고, M.AX 의 실제 전사 현황 화면을 건다. 예비 그림(/photo/dev-work.jpg)도 스톡. */
export const INTRO_SHOT = { src: '/screens/pcb-dash.jpg', alt: '전사 현황 화면 — 당일 수주량·투입량·불량 수와 사양·지시서·출고 대기', w: 1600, h: 1000 }

export const INTRO_FILM = {
  id: 'hPMiQP-zI1g',
  title: '브랜드 필름',
  desc: '디알밸류가 그리는 미래를 영상을 통해 확인하세요.',
  videoTitle: '디알밸류 브랜드 필름',
}

/* ── 비전 ───────────────────────────────────────────────────────── */

export const VISION_LEAD: Lead = {
  title: '데이터를 통해 제조업의 본질적인 가치를 혁신합니다.',
  desc: '지능화된 기술을 통해 인류의 생산 활동을 더 풍요롭고 가치 있게 만드는 것이 디알밸류의 존재 이유입니다.',
  hero: { n: '2030', label: 'Vision 2030' },
  items: [
    { t: 'Global Top-tier AI Solution', d: '전 세계 30개국 이상의 제조 현장에 디알밸류의 AI 알고리즘을 공급하여 글로벌 표준을 수립합니다.' },
    { t: 'Zero-Defect Manufacturing', d: "예지 보전과 실시간 품질 예측 기술을 통해 '불량률 0%'를 향한 완벽한 공정 제어를 실현합니다." },
    { t: 'Sustainable Innovation', d: '에너지 최적화와 자원 효율 극대화를 통해 탄소 중립을 실천하는 친환경 스마트 팩토리를 선도합니다.' },
  ],
}

export const VISION_STRATEGY = {
  title: 'Strategic Direction',
  items: [
    { t: '기술 초격차 확보', d: '독자적인 딥러닝 모델 개발과 R&D 투자를 통해 AI 제조 솔루션의 기술 우위를 점합니다.' },
    { t: '고객 성공 파트너십', d: '단순 공급을 넘어 고객사의 비즈니스 성장을 함께 고민하는 데이터 기반 컨설팅을 제공합니다.' },
    { t: '글로벌 네트워크 확장', d: '유럽, 북미 등 글로벌 거점을 확보하여 세계적인 제조 혁신 네트워크를 구축합니다.' },
  ],
}

/* ── 연혁 ───────────────────────────────────────────────────────── */

/**
 * `note` 는 그 항목이 무엇인지 한 줄로 알려 주는 자리다. 항목 이름만으로는
 * 「S 바우처가 뭔데」 가 안 풀린다. 검색에도 이 글이 걸린다.
 *
 * **채운 것은 뜻이 이미 정해져 있거나 이 저장소에서 확인되는 것뿐이다.**
 * 비어 있는 `note` 는 회사가 알려 줘야 채운다 — 어느 기관의 무슨 사업으로
 * 선정됐는지는 지어낼 수 없다.
 *
 * 주석 처리된 항목은 되살리지 않는다. 회사가 일부러 가린 것들이다
 * (app/home/proofData.ts 의 메모 참고).
 */
export const HISTORY = [
  {
    year: '2026',
    items: [
      { t: '소상공인 AI 활용지원 사업 전문 AI 멘토 기업 선정', note: '' },
      { t: 'AI 바우처 선정', note: '' },
      { t: '클라우드 바우처 선정', note: '' },
      { t: 'S 바우처 재선정', note: '' },
    ],
  },
  {
    year: '2025',
    items: [
      { t: 'S 바우처 선정', note: '' },
      { t: '제조 AI 솔루션 100선 선정', note: '' },
      {
        t: 'ISO 9001 / ISO 14001 인증',
        note: '품질경영시스템(9001)과 환경경영시스템(14001) 국제 규격 인증',
      },
      { t: '클라우드 서비스 적격 평가 인증', note: '' },
      { t: 'AI V&V AI 성능 시험', note: '' },
      {
        t: '한양대학교 ERICA 스마트융합공학부 MOU 체결',
        note: '디알밸류가 자리한 한양대학교 ERICA 캠퍼스와의 산학 협력',
      },
      { t: '중소기업벤처부 통합 기술보호지원 자문 진행', note: '' },
    ],
  },
  {
    year: '2024',
    items: [
      { t: '기업부설연구소 설립', note: '' },
      {
        t: '디알밸류 법인 설립',
        note: '한양대학교 ERICA 창업보육센터에서 시작 · 사업자등록번호 491-87-02850',
      },
    ],
  },
] as const

export const HISTORY_LEAD: Lead = { title: '주요 연혁' }

/* ── 찾아오시는 길 ──────────────────────────────────────────────── */

export const LOCATION_LEAD: Lead = { title: '오시는 길' }

export const LOCATION = {
  company: '주식회사 디알밸류',
  intro: '디알밸류는 한양대학교 ERICA 창업보육센터에 위치하고 있습니다.',
  address: ['경기도 안산시 상록구 한양대학로 55', '한양대학교 ERICA 창업보육센터 318호'],
  /* 푸터와 같은 번호로 맞췄다. 원본에는 개인 휴대전화가 적혀 있었다 —
     같은 번호가 특허 출원 서류에도 찍혀 있어 개인정보로 남는다. */
  tel: { text: '031-400-3880', href: 'tel:0314003880' },
  email: 'hi@drvalue.co.kr',
  guide: {
    title: '방문 안내',
    desc: '방문 전 일정 협의 후 내방하시면 보다 원활한 상담이 가능합니다. 교내 주차가 가능하며, 창업보육센터 방문객임을 확인해 주세요.',
  },
  // 좌표를 박은 embed 는 카카오 데이터센터가 가운데 오고 핀이 화면 밖이었다(사용자 지적,
  // 2026-09-21 실측). 장소 이름으로 찾게 하면 구글이 핀과 이름표를 창업보육센터에 놓는다.
  mapSrc:
    'https://www.google.com/maps?q=' +
    encodeURIComponent('한양대학교 ERICA 창업보육센터') +
    '&z=17&hl=ko&output=embed',
}

/* ── 넷이 같이 쓰는 CSS ─────────────────────────────────────────────
   maxStyles 의 PAGE_CSS 뒤에 심는다. 거기 없는 것만 적는다 — 제품 화면 한 장,
   영상 표지, 연혁 줄, 지도·주소 칸. 이름을 PAGE_CSS 로 두는 이유:
   scripts/check-src.py 가 그 이름의 템플릿 문자열만 백틱 검사를 한다.
   이 블록은 템플릿 문자열이다 — 안에 역따옴표를 쓰면 문자열이 끊긴다. */
const PAGE_CSS = `
/* 본문 마지막 덩어리와 아래 어두운 문의 띠 사이를 띄운다. 기능 덩어리(mx_feat)가
   제 아래 여백을 갖는 것과 같은 몫이다 — 없으면 붙어서 잘린 것처럼 보인다. */
#dvmax .mx_main > :last-child { margin-bottom: 90px; }

/* 안내 — 제품 화면 한 장 */
#dvmax .cp_shot { margin: 0; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 44px rgba(21,34,56,.12); background: #fff; }
#dvmax .cp_shot img { display: block; width: 100%; height: auto; }

/* 안내 — 브랜드 필름 */
#dvmax .cp_film { margin-top: 56px; }
#dvmax .cp_h3 { font-size: 26px; font-weight: 800; letter-spacing: -.8px; margin: 0 0 8px; word-break: keep-all; }
#dvmax .cp_h3desc { margin: 0 0 22px; font-size: 16px; color: #6b7684; word-break: keep-all; }
#dvmax .video_container { position: relative; width: 100%; padding-bottom: 56.25%; border-radius: 16px; overflow: hidden;
  box-shadow: 0 24px 48px rgba(21,34,56,.16); }
#dvmax .video_container iframe { position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0; }
/* 표지. 누르기 전까지 유튜브를 안 불러온다(components/VideoFacade.tsx). */
#dvmax .dvvid_play { position: absolute; inset: 0; width: 100%; height: 100%; padding: 0; border: 0; background: #0b1016;
  cursor: pointer; display: block; font-family: inherit; }
#dvmax .dvvid_play img { width: 100%; height: 100%; object-fit: cover; display: block; opacity: .82; transition: opacity .25s, transform .4s; }
#dvmax .dvvid_play:hover img { opacity: 1; transform: scale(1.02); }
#dvmax .dvvid_btn { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); display: block;
  filter: drop-shadow(0 6px 18px rgba(0,0,0,.4)); transition: transform .2s; }
#dvmax .dvvid_play:hover .dvvid_btn { transform: translate(-50%, -50%) scale(1.08); }
#dvmax .dvvid_play:focus-visible { outline: 3px solid #d71920; outline-offset: -3px; }
/* 화면에는 안 띄우되 읽어 주는 기계에는 남긴다. */
#dvmax .dvvid_label { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }

/* 비전 — 전략 카드는 mx_navcard 를 쓰되 누르는 자리가 아니므로 위치만 맞춘다 */
#dvmax .cp_strategy { margin-top: 8px; }
#dvmax .cp_strategy .mx_navcard { padding-top: 24px; }
#dvmax .cp_strategy .mx_navcard > b { margin-top: 0; }

/* 연혁 — 세로 줄에 연도와 항목 */
#dvmax .timeline_container { position: relative; padding-left: 48px; margin-top: 8px; }
#dvmax .timeline_container::before { content: ""; position: absolute; left: 6px; top: 10px; bottom: 0; width: 2px; background: #e5eaef; }
/* 연도와 항목을 좌우로 나눈다. 한 줄로 쌓으면 항목이 짧아 오른쪽이
   통째로 비었다. 연도는 왼쪽에서 자리를 지키고 항목이 남은 폭을 다 쓴다. */
#dvmax .history_item { position: relative; margin-bottom: 56px; display: grid; grid-template-columns: 116px minmax(0, 1fr);
  column-gap: 28px; align-items: start; }
#dvmax .history_item:last-child { margin-bottom: 0; }
#dvmax .history_item::before { content: ""; position: absolute; left: -52px; top: 6px; width: 22px; height: 22px; border-radius: 50%;
  box-sizing: border-box; background: #fff; border: 4px solid #d71920; z-index: 1; }
#dvmax .history_year { font-size: 32px; font-weight: 800; color: #d71920; margin: 0; line-height: 1.1; letter-spacing: -.5px; }
#dvmax .history_list { margin: 0; padding: 0 0 0 26px; list-style: none; border-left: 1px solid #edf1f5; }
#dvmax .history_list li { display: flex; margin-bottom: 14px; line-height: 1.6; align-items: flex-start; }
#dvmax .history_list li:last-child { margin-bottom: 0; }
#dvmax .history_list li::before { content: ""; flex: 0 0 auto; width: 7px; height: 7px; border-radius: 50%; background: #3d5a80;
  margin-right: 12px; margin-top: 9px; }
#dvmax .history_desc { color: #4e5968; font-size: 17px; font-weight: 500; word-break: keep-all; }
/* 항목이 무엇인지 한 줄로. 항목 이름 아래에 작게 둔다 — 같은 크기로
   쓰면 무엇이 사건이고 무엇이 설명인지 구분이 안 된다. */
#dvmax .history_note { display: block; margin-top: 3px; font-style: normal; font-size: 14.5px; font-weight: 400; color: #8b95a1; line-height: 1.55; }

/* 찾아오시는 길 — 지도와 주소 */
#dvmax .location_box { display: grid; grid-template-columns: minmax(0, 1fr) 380px; gap: 20px; align-items: stretch; margin-top: 8px; }
#dvmax .map_box { min-height: 460px; border: 1px solid #e5eaef; border-radius: 16px; overflow: hidden; background: #f8f9fa; }
#dvmax .map_box iframe { display: block; width: 100%; height: 100%; min-height: 460px; border: 0; }
#dvmax .info_box { border: 1px solid #e5eaef; border-radius: 16px; padding: 32px 30px; background: #fff; }
#dvmax .info_box h3 { margin: 0 0 22px; font-size: 22px; font-weight: 800; letter-spacing: -.6px; }
#dvmax .info_list { margin: 0; display: flex; flex-direction: column; gap: 18px; }
#dvmax .info_item { padding-bottom: 18px; border-bottom: 1px solid #f2f4f6; }
#dvmax .info_item:last-child { padding-bottom: 0; border-bottom: 0; }
#dvmax .info_item dt { margin-bottom: 6px; font-size: 13px; font-weight: 800; color: #d71920; }
#dvmax .info_item dd { margin: 0; font-size: 16px; font-weight: 600; color: #333; line-height: 1.7; word-break: keep-all; }
#dvmax .info_item dd a { color: inherit; }
#dvmax .guide_box { margin-top: 24px; padding: 20px 22px; border-radius: 12px; background: #f9fafb; }
#dvmax .guide_box h4 { margin: 0 0 8px; font-size: 16px; font-weight: 800; }
#dvmax .guide_box p { margin: 0; font-size: 14.5px; color: #6b7684; line-height: 1.7; word-break: keep-all; }
/* 건물 사진 — 관리 화면에서 넣었을 때만 있다 */
#dvmax .guide_photo { display: block; width: 100%; height: auto; margin-top: 14px; border-radius: 10px; }

@media (max-width: 991px) {
  #dvmax .location_box { grid-template-columns: 1fr; }
  #dvmax .map_box, #dvmax .map_box iframe { min-height: 360px; }
  #dvmax .info_box { padding: 26px 22px; }
}
@media (max-width: 900px) {
  #dvmax .timeline_container { padding-left: 36px; }
  #dvmax .history_item::before { left: -40px; }
  #dvmax .history_year { font-size: 26px; }
  #dvmax .history_desc { font-size: 16px; }
  /* 좁은 화면에서는 연도가 위로 올라간다 — 116px 을 떼면 본문이 눌린다. */
  #dvmax .history_item { grid-template-columns: 1fr; row-gap: 14px; }
  #dvmax .history_list { border-left: 0; padding-left: 0; }
  #dvmax .cp_h3 { font-size: 22px; }
}
@media (prefers-reduced-motion: reduce) {
  #dvmax .dvvid_play img, #dvmax .dvvid_btn { transition: none; }
  #dvmax .dvvid_play:hover img { transform: none; }
  #dvmax .dvvid_play:hover .dvvid_btn { transform: translate(-50%, -50%); }
}
`
export const COMPANY_CSS = PAGE_CSS
