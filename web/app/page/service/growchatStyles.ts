/**
 * 채팅(GrowChat) 장만 쓰는 꾸밈. maxStyles.ts 의 `.hk_*`(한건 장)를 같이 쓰고, 여기엔 시연 창(`.gc_*`)만.
 * 다른 장과 같은 파일을 안 건드리려고 따로 뒀다(2026-09-22, 여러 사람이 같은 사본을 고치던 날).
 */
export const GROWCHAT_CSS = `
/* 머리말 그림 — 채널톡처럼 밝은 판 위에 상담원 화면(뒤)과 고객 대화(앞)를 겹친다. 그림 둘 다 실제 캡처. */
#dvmax.mx_v4 .gc_hero { position: relative; margin: 0 0 8px; border-radius: 25px; overflow: hidden; background: #f1efeb; padding: 56px 48px; min-height: 620px; }
#dvmax.mx_v4 .gc_hero::before { content: ''; position: absolute; inset: 0; background: radial-gradient(60% 70% at 18% 20%, rgba(215,25,32,.14), transparent 60%), radial-gradient(50% 60% at 88% 90%, rgba(21,34,56,.18), transparent 60%); }
#dvmax.mx_v4 .gc_frame { position: relative; background: #fff; border-radius: 14px; overflow: hidden; box-shadow: 0 30px 80px rgba(21,34,56,.22); }
#dvmax.mx_v4 .gc_frame_bar { display: flex; align-items: center; gap: 6px; height: 32px; padding: 0 12px; background: #f2f4f6; border-bottom: 1px solid #e5e8eb; }
#dvmax.mx_v4 .gc_frame_bar i { width: 9px; height: 9px; border-radius: 50%; background: #d5dae0; display: block; }
#dvmax.mx_v4 .gc_frame_bar span { margin-left: 8px; font-size: 12px; color: #62707e; }
#dvmax.mx_v4 .gc_frame img { display: block; width: 100%; height: auto; }
#dvmax.mx_v4 .gc_hero_agent { width: 72%; }
#dvmax.mx_v4 .gc_hero_cust { position: absolute; right: 48px; bottom: 48px; width: 40%; box-shadow: 0 40px 90px rgba(21,34,56,.30); }
#dvmax.mx_v4 .gc_hero_tag { position: absolute; left: 24px; top: 24px; font-size: 12px; font-weight: 700; color: #191f28; background: rgba(255,255,255,.85); border-radius: 999px; padding: 6px 12px; }
@media (max-width: 900px) {
  #dvmax.mx_v4 .gc_hero { padding: 48px 16px 24px; min-height: 0; border-radius: 18px; }
  #dvmax.mx_v4 .gc_hero_agent { width: 100%; }
  #dvmax.mx_v4 .gc_hero_cust { position: relative; right: auto; bottom: auto; width: 82%; margin: -24px 0 0 auto; }
}
#dvmax.mx_v4 .gc_plate { background: #eaf0f8 url('/bg/hangeon-light.jpg') center / cover no-repeat; }
/* 전/후 오른쪽 카드: 관리자센터 캡처는 왼쪽 위(방 목록 + 상태 탭)를 보여 준다 */
#dvmax.mx_v4 .gc_pair .hk_light img { object-position: 0 0; }
#dvmax.mx_v4 .gc_demo { max-width: 460px; margin: 0 auto; }
#dvmax.mx_v4 .gc_win { background: #f7f8fb; border-radius: 22px; box-shadow: 0 30px 80px rgba(21,34,56,.22); overflow: hidden; border: 1px solid #e5e8eb; }
#dvmax.mx_v4 .gc_top { display: flex; align-items: baseline; gap: 12px; padding: 16px 20px; background: #fff; border-bottom: 1px solid #e5e8eb; }
#dvmax.mx_v4 .gc_top b { font-size: 16px; color: #191f28; } #dvmax.mx_v4 .gc_top span { font-size: 12px; color: #62707e; }
#dvmax.mx_v4 .gc_body { padding: 20px 16px 10px; min-height: 470px; display: flex; flex-direction: column; gap: 10px; }
#dvmax.mx_v4 .gc_body p { margin: 0; font-size: 14px; line-height: 1.6; word-break: keep-all; }
#dvmax.mx_v4 .gc_sys { align-self: center; font-size: 12px !important; color: #fff; background: #f4a3c9; border-radius: 999px; padding: 4px 12px; }
#dvmax.mx_v4 .gc_start { animation: mxPop .45s cubic-bezier(.22,.68,.24,1) both; }
#dvmax.mx_v4 .gc_me { align-self: flex-end; max-width: 88%; background: #e4e7ec; color: #191f28; border-radius: 14px 14px 4px 14px; padding: 12px 14px; animation: mxPop .4s cubic-bezier(.22,.68,.24,1) both; }
#dvmax.mx_v4 .gc_caret { display: inline-block; width: 2px; height: 1em; background: #191f28; margin-left: 2px; vertical-align: -2px; animation: hkCaret .8s steps(2) infinite; }
#dvmax.mx_v4 .gc_them { align-self: flex-start; max-width: 92%; display: grid; gap: 8px; }
#dvmax.mx_v4 .gc_who { font-size: 12px; color: #62707e; }
#dvmax.mx_v4 .gc_them p { background: #fff; border: 1px solid #e5e8eb; border-radius: 4px 14px 14px 14px; padding: 12px 14px; color: #191f28; animation: mxPop .5s cubic-bezier(.22,.68,.24,1) both; animation-delay: calc(var(--i, 0) * .7s); }
#dvmax.mx_v4 .gc_them small { font-size: 11px; color: #8b95a1; justify-self: end; }
#dvmax.mx_v4 .gc_input { display: flex; align-items: center; gap: 10px; margin: 6px 12px 12px; padding: 10px 14px; background: #fff; border: 1.5px solid #3e6fd8; border-radius: 10px; font-size: 13px; color: #8b95a1; min-height: 44px; }
/* 긴 글은 앞이 잘리고 꼬리가 보인다 — rtl 트릭은 문장부호·커서가 앞으로 튀어 안 쓴다 */
#dvmax.mx_v4 .gc_input span { flex: 1; display: flex; justify-content: flex-end; overflow: hidden; white-space: nowrap; }
#dvmax.mx_v4 .gc_input span b { font-weight: inherit; flex: none; }
#dvmax.mx_v4 .gc_p1 .gc_input span, #dvmax.mx_v4 .gc_p2 .gc_input span { color: #191f28; }
#dvmax.mx_v4 .gc_input i { font-style: normal; color: #3e6fd8; }
#dvmax.mx_v4 .gc_p0 .gc_body > *:not(:first-child) { display: none; }
@media (max-width: 900px) { #dvmax.mx_v4 .gc_body { min-height: 380px; } }
@media (prefers-reduced-motion: reduce) {
  #dvmax.mx_v4 .gc_me, #dvmax.mx_v4 .gc_them p, #dvmax.mx_v4 .gc_start, #dvmax.mx_v4 .gc_caret { animation: none; }
}

/* 선언 구역 — 빛 위 큰 문장 둘(alf-customer). */
#dvmax.mx_v4 .gc_manifesto { position: relative; margin: 24px 0 8px; padding: 140px 24px 150px; text-align: center; }
#dvmax.mx_v4 .gc_manifesto::before { content: ''; position: absolute; inset: 0; pointer-events: none; background:
  radial-gradient(45% 55% at 30% 45%, rgba(215,25,32,.16), transparent 70%),
  radial-gradient(45% 55% at 70% 55%, rgba(21,34,56,.16), transparent 70%),
  radial-gradient(60% 50% at 50% 50%, rgba(241,239,235,.9), transparent 75%); filter: blur(10px); }
#dvmax.mx_v4 .gc_manifesto p { position: relative; margin: 0 auto; max-width: 22em; font-size: clamp(24px, 3vw, 38px); line-height: 1.45; font-weight: 700; letter-spacing: -.02em; color: #6b7684; word-break: keep-all; }
#dvmax.mx_v4 .gc_manifesto p b { color: #191f28; font-weight: 800; }
#dvmax.mx_v4 .gc_mani_l2 { margin-top: 18px !important; font-size: clamp(18px, 2vw, 26px) !important; font-weight: 600 !important; }
/* 시연 2열 — 왼쪽 창, 오른쪽 글 */
#dvmax.mx_v4 .gc_demo2 { display: grid; grid-template-columns: minmax(0, 1.05fr) minmax(0, .95fr); gap: 56px; align-items: center; }
#dvmax.mx_v4 .gc_demo2_win { margin: 0; }
#dvmax.mx_v4 .gc_demo2_txt h2 { margin: 12px 0 0; font-size: clamp(28px, 3.2vw, 40px); line-height: 1.3; letter-spacing: -.02em; font-weight: 700; color: #191f28; word-break: keep-all; }
#dvmax.mx_v4 .gc_demo2_txt h2 b { color: #d71920; }
#dvmax.mx_v4 .gc_demo2_d { margin: 18px 0 0; font-size: 16px; line-height: 1.7; color: #62707e; word-break: keep-all; }
#dvmax.mx_v4 .gc_demo2_lab { margin: 40px 0 12px; font-size: 14px; font-weight: 700; color: #4e5968; }
#dvmax.mx_v4 .gc_chips { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 10px; align-items: flex-start; }
#dvmax.mx_v4 .gc_chips li { padding: 12px 18px; border-radius: 999px; background: #f6f5f2; border: 1px solid #ebe8e2; font-size: 15px; line-height: 1.5; color: #333d4b; word-break: keep-all; }
@media (max-width: 900px) {
  #dvmax.mx_v4 .gc_manifesto { padding: 80px 8px 90px; }
  #dvmax.mx_v4 .gc_demo2 { grid-template-columns: 1fr; gap: 28px; }
  #dvmax.mx_v4 .gc_chips li { border-radius: 18px; }
}
`
