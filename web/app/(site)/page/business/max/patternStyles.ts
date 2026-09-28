/**
 * Patterns.tsx(Showcase · Bento · FlowCard)의 CSS. maxStyles.ts 의 PAGE_CSS 끝에 이어 붙는다 —
 * 순서가 뒤여야 같은 명시도의 v4 규칙을 덮는다. 색은 v4 것만 쓴다(먹 #191f28 · 남색 #152238 ·
 * 강철 #3e78c8 · 붉은 표시 #d71920 · 웜 판 #f1efeb). 보라·분홍은 레퍼런스 브랜드라 안 쓴다.
 */
export const PATTERN_CSS = `
/* ── Showcase: 알약 탭 줄 + 큰 카드 + ‹ › ── */
#dvmax.mx_v4 .mx_show { margin: 40px 0 0; }
/* 제품군 탭 — 베이지 캡슐 속 알약 → 밑줄 탭(2026-09-28, 레퍼런스: 채널톡·Tulip 의 누르는 탭). */
#dvmax.mx_v4 .mx_show_tabs { display: flex; justify-content: center; gap: 28px; margin: 0 auto 36px; padding: 0; width: max-content; max-width: 100%; border-bottom: 1px solid #e5e8eb; overflow-x: auto; scrollbar-width: none; }
#dvmax.mx_v4 .mx_show_tabs::-webkit-scrollbar { display: none; }
#dvmax.mx_v4 .mx_show_tabs button { flex: 0 0 auto; min-height: 48px; padding: 0 2px; margin-bottom: -1px; border: 0; border-bottom: 2px solid transparent; border-radius: 0; background: transparent; color: #8b95a1; font-size: 17px; font-weight: 600; cursor: pointer; white-space: nowrap; transition: color .2s, border-color .2s; }
#dvmax.mx_v4 .mx_show_tabs button:hover { color: #191f28; }
#dvmax.mx_v4 .mx_show_tabs button.on { color: #191f28; border-bottom-color: #191f28; }
#dvmax.mx_v4 .mx_show_tabs button:focus-visible { outline: 2px solid #191f28; outline-offset: 2px; }
#dvmax.mx_v4 .mx_show_stage { position: relative; }
#dvmax.mx_v4 .mx_show_card { position: relative; display: grid; grid-template-columns: minmax(0, 5fr) minmax(0, 7fr); gap: 32px; align-items: center; min-height: 0; padding: 8px 72px; color: #191f28;
  animation: hkSwap .45s cubic-bezier(.2,.75,.2,1); }
/* 2026-09-28 사용자: 카드 속 카드 — 틴트 판·점 무늬를 빼고 글과 창을 흰 바탕에 바로 둔다. */
#dvmax.mx_v4 .mx_show_txt { position: relative; z-index: 2; }
#dvmax.mx_v4 .mx_show_k { display: block; margin: 0 0 12px; padding: 0; border-radius: 0; background: none; color: #d71920; font-size: 15px; font-weight: 600; letter-spacing: 0; }
#dvmax.mx_v4 .mx_show_txt h3 { margin: 0; font-size: clamp(28px, 3vw, 40px); line-height: 1.28; letter-spacing: -.03em; font-weight: 600; color: #191f28; word-break: keep-all; }
#dvmax.mx_v4 .mx_show_txt h3 b { font-weight: 600; color: #191f28; }
#dvmax.mx_v4 .mx_show_txt h3 .mx_hl { color: #191f28; }
#dvmax.mx_v4 .mx_show_txt > p:not(.mx_show_k) { margin: 18px 0 0; font-size: 18px; line-height: 1.7; color: #4e5968; max-width: 30em; word-break: keep-all; }
/* 「자세히 보기」 — 흰 바탕 위에 떠 있던 그림자 카드 → 테두리 버튼(머리말 보조 버튼과 같은 모양). */
#dvmax.mx_v4 .mx_show_more { display: inline-flex; align-items: center; gap: 6px; margin-top: 28px; min-height: 44px; padding: 0 18px; border: 1px solid #d1d6db; border-radius: 10px; background: #fff; font-size: 15px; font-weight: 600; color: #191f28; text-decoration: none; transition: background .15s, border-color .15s; }
#dvmax.mx_v4 .mx_show_more:hover { background: #f2f4f6; border-color: #b0b8c1; }
#dvmax.mx_v4 .mx_show_more i { font-style: normal; font-size: 20px; line-height: 1; transition: transform .2s; }
#dvmax.mx_v4 .mx_show_more:hover i { transform: translateX(3px); }
#dvmax.mx_v4 .mx_show_fig { position: relative; z-index: 1; margin: 0; }
#dvmax.mx_v4 .mx_show_fig .mx_browser { position: relative; width: 100%; border: 1px solid #e5e8eb; border-radius: 12px; box-shadow: 0 12px 32px rgba(21,34,56,.08); }
/* 좌우 화살표 — 흐림 유리 원 → 흰 원 + 1px 테두리. 점(dots)은 탭과 같은 말이라 끈다. */
#dvmax.mx_v4 .mx_show_arr { position: absolute; top: 50%; z-index: 4; width: 44px; height: 44px; margin-top: -22px; border: 1px solid #e5e8eb; border-radius: 50%; background: #fff; color: #191f28; box-shadow: none; cursor: pointer; display: grid; place-items: center; transition: background .15s, border-color .15s; }
#dvmax.mx_v4 .mx_show_arr svg { width: 22px; height: 22px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
#dvmax.mx_v4 .mx_show_arr:hover { background: #f2f4f6; border-color: #d1d6db; }
#dvmax.mx_v4 .mx_show_arr:focus-visible { outline: 2px solid #191f28; outline-offset: 3px; }
#dvmax.mx_v4 .mx_show_arr.prev { left: 0; } #dvmax.mx_v4 .mx_show_arr.next { right: 0; }
#dvmax.mx_v4 .mx_show_dots { display: none; justify-content: center; gap: 8px; margin: 18px 0 0; }
#dvmax.mx_v4 .mx_show_dots i { width: 8px; height: 8px; border-radius: 50%; background: #d5dae0; transition: background .25s, transform .25s; }
#dvmax.mx_v4 .mx_show_dots i.on { background: #191f28; transform: scale(1.25); }

/* ── Bento: 어두운 바탕 + 넓은 카드 1 + 반 카드 2 ── */
#dvmax.mx_v4 .mx_bento { position: relative; overflow: hidden; padding: 96px 0 104px; color: #191f28; background: #f3f5f8; }
#dvmax.mx_v4 .mx_bento .mx_blob { display: none; }
#dvmax.mx_v4 .mx_bento .mx_b1 { width: 560px; height: 560px; left: -200px; top: -160px; background: #bcd2ef; opacity: .7; }
#dvmax.mx_v4 .mx_bento .mx_b2 { width: 480px; height: 480px; right: -160px; top: 30%; background: #ffd9c2; opacity: .5; }
#dvmax.mx_v4 .mx_bento .mx_wrap { position: relative; }
#dvmax.mx_v4 .mx_bento_head { text-align: center; color: #191f28; margin: 0 0 44px; }
#dvmax.mx_v4 .mx_bento_k { display: inline-block; margin: 0 0 14px; padding: 0; border-radius: 0; background: none; color: #d71920; font-size: 15px; font-weight: 600; letter-spacing: 0; }
#dvmax.mx_v4 .mx_bento_head h2 { margin: 0; font-size: clamp(32px, 3.8vw, 52px); line-height: 1.25; letter-spacing: -1.5px; font-weight: 600; color: #191f28; }
#dvmax.mx_v4 .mx_bento_d { margin: 18px auto 0; max-width: 40em; font-size: 19px; line-height: 1.65; color: #4e5968; word-break: keep-all; }
#dvmax.mx_v4 .mx_bento_grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 20px; margin: 0; padding: 0; list-style: none; }
#dvmax.mx_v4 .mx_bento_grid > li { position: relative; display: flex; flex-direction: column; min-height: 420px; padding: 40px 40px 0; border-radius: 24px; overflow: hidden; background: #fff; box-shadow: 0 1px 2px rgba(21,34,56,.04), 0 12px 32px rgba(21,34,56,.06); }
#dvmax.mx_v4 .mx_bento_grid > li.wide { grid-column: 1 / -1; display: grid; grid-template-columns: minmax(0, 5fr) minmax(0, 7fr); gap: 28px; min-height: 0; padding: 40px; }
#dvmax.mx_v4 .mx_bento_grid > li.wide .mx_bento_fig { margin-bottom: 0; }
#dvmax.mx_v4 .mx_bento_grid > li.dark { background: radial-gradient(120% 100% at 100% 0%, #24365a, #0f1a2c); color: #fff; }
#dvmax.mx_v4 .mx_bento_txt { position: relative; z-index: 2; padding-bottom: 28px; }
#dvmax.mx_v4 .mx_bento_grid > li.wide .mx_bento_txt { align-self: center; padding-bottom: 40px; }
#dvmax.mx_v4 .mx_bento_txt h3 { margin: 0; font-size: clamp(24px, 2.2vw, 32px); line-height: 1.3; letter-spacing: -.03em; font-weight: 600; word-break: keep-all; }
#dvmax.mx_v4 .mx_bento_grid > li.dark h3, #dvmax.mx_v4 .mx_bento_grid > li.dark .mx_hl { color: #fff; }
#dvmax.mx_v4 .mx_bento_txt p { margin: 14px 0 0; font-size: 17px; line-height: 1.7; color: #4e5968; max-width: 30em; word-break: keep-all; }
#dvmax.mx_v4 .mx_bento_grid > li.dark p { color: rgba(255,255,255,.75); }
#dvmax.mx_v4 .mx_bento_pts { list-style: none; margin: 16px 0 0; padding: 0; display: grid; gap: 8px; }
#dvmax.mx_v4 .mx_bento_pts li { position: relative; padding: 10px 14px 10px 34px; border-radius: 10px; background: #f3f5f8; font-size: 15px; line-height: 1.55; color: #333d4b; word-break: keep-all; }
#dvmax.mx_v4 .mx_bento_pts li em { display: inline; font-style: normal; }
#dvmax.mx_v4 .mx_bento_pts li::before { content: ''; position: absolute; left: 14px; top: 16px; width: 10px; height: 10px; border-radius: 50%; background: #3e78c8; }
#dvmax.mx_v4 .mx_bento_grid > li.dark .mx_bento_pts li { background: rgba(255,255,255,.10); color: rgba(255,255,255,.9); } #dvmax.mx_v4 .mx_bento_grid > li.dark .mx_bento_pts li::before { background: #fff; }
#dvmax.mx_v4 .mx_bento_grid > li.wide.dark { display: flex; padding: 40px; }
#dvmax.mx_v4 .mx_bento_grid > li.wide.dark .mx_bento_pts { grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
#dvmax.mx_v4 .mx_bento_grid > li.wide.dark .mx_bento_txt { padding-bottom: 0; max-width: none; }
#dvmax.mx_v4 .mx_bento_more { display: inline-flex; align-items: center; gap: 8px; margin-top: 22px; font-size: 15px; font-weight: 700; color: inherit; text-decoration: none; }
#dvmax.mx_v4 .mx_bento_more i { font-style: normal; transition: transform .2s; }
#dvmax.mx_v4 .mx_bento_more:hover i { transform: translateX(4px); }
#dvmax.mx_v4 .mx_bento_fig { position: relative; z-index: 1; margin: 0 0 40px; }
#dvmax.mx_v4 .mx_bento_fig .mx_browser { position: relative; width: 100%; border-radius: 12px; box-shadow: 0 16px 40px rgba(21,34,56,.14); }
#dvmax.mx_v4 .mx_bento_grid > li.wide .mx_bento_fig { align-self: center; }

/* ── FlowCard: 연한 카드, 글 왼쪽 · 단계 카드 ↓ 오른쪽 ── */
/* FlowCard — 2026-09-28 사용자: 틴트 판 속 흰 단계 카드(첫 칸 검정)도 겹 카드. 하위 장 기능 판과 같이 흰 바탕 · 구분선,
   단계는 상자 없이 번호 원 + 세로 이음선(차례가 뜻을 가지는 자리라 번호는 둔다). */
#dvmax.mx_v4 .mx_fcard { display: grid; grid-template-columns: minmax(0, 6fr) minmax(0, 5fr); gap: 56px; align-items: start; margin: 16px 0 0; padding: 40px 0 8px; border-top: 1px solid #e5e8eb; border-radius: 0; background: none; }
#dvmax.mx_v4 .mx_fcard.sand, #dvmax.mx_v4 .mx_fcard.steel { background: none; }
#dvmax.mx_v4 .mx_fcard_txt h3 { margin: 0; font-size: clamp(20px, 2vw, 26px); line-height: 1.35; letter-spacing: -.03em; font-weight: 700; word-break: keep-all; }
#dvmax.mx_v4 .mx_fcard_txt h3 .mx_hl { color: #191f28; }
#dvmax.mx_v4 .mx_fcard_txt p { margin: 12px 0 0; font-size: 16px; line-height: 1.65; color: #4e5968; max-width: 34em; word-break: keep-all; }
#dvmax.mx_v4 .mx_fcard_txt .mx_bento_fig { margin: 24px 0 0; }
#dvmax.mx_v4 .mx_fcard_txt .mx_bento_fig .mx_browser { border: 1px solid #e5e8eb; border-radius: 12px; box-shadow: 0 12px 32px rgba(21,34,56,.08); }
#dvmax.mx_v4 .mx_fcard_steps { position: relative; margin: 0; padding: 0; list-style: none; display: grid; gap: 0; }
#dvmax.mx_v4 .mx_fcard_steps li { position: relative; display: grid; grid-template-columns: 28px 1fr; gap: 14px; align-items: start; padding: 0 0 20px; border: 0; border-radius: 0; background: none; box-shadow: none; font-size: 16px; line-height: 1.6; color: #333d4b; word-break: keep-all; }
#dvmax.mx_v4 .mx_fcard_steps li .mx_hl { color: #191f28; }
#dvmax.mx_v4 .mx_fcard_steps li i { display: grid; place-items: center; width: 28px; height: 28px; border: 1px solid #d1d6db; border-radius: 50%; background: #fff; color: #4e5968; font-style: normal; font-weight: 700; font-size: 13px; position: relative; z-index: 1; }
#dvmax.mx_v4 .mx_fcard_steps li:not(:last-child)::before { content: ''; position: absolute; left: 13.5px; top: 28px; bottom: 0; width: 1px; background: #e5e8eb; }
#dvmax.mx_v4 .mx_fcard_steps.rv-wait > li { opacity: 0; transform: translateY(8px); }
#dvmax.mx_v4 .mx_fcard_steps.rv-wait.rv-in > li { opacity: 1; transform: none; transition: opacity .5s, transform .5s; transition-delay: calc(var(--i, 0) * .12s); }

@media (max-width: 900px) {
  #dvmax.mx_v4 .mx_show_tabs { justify-content: flex-start; width: auto; }
  #dvmax.mx_v4 .mx_show_card { grid-template-columns: 1fr; min-height: 0; padding: 26px 20px; gap: 22px; border-radius: 20px; }
  #dvmax.mx_v4 .mx_show_arr { display: none; }
  #dvmax.mx_v4 .mx_bento { padding: 64px 0 72px; }
  #dvmax.mx_v4 .mx_bento_grid { grid-template-columns: 1fr; gap: 14px; }
  #dvmax.mx_v4 .mx_bento_grid > li, #dvmax.mx_v4 .mx_bento_grid > li.wide { grid-template-columns: 1fr; display: flex; min-height: 0; padding: 26px 22px 0; gap: 0; border-radius: 18px; }
  #dvmax.mx_v4 .mx_bento_grid > li.wide .mx_bento_txt { padding-bottom: 22px; }
  #dvmax.mx_v4 .mx_bento_grid > li.wide.dark .mx_bento_pts { grid-template-columns: 1fr; }
  #dvmax.mx_v4 .mx_bento_fig, #dvmax.mx_v4 .mx_bento_grid > li.wide .mx_bento_fig { margin: 0 0 22px; }
  #dvmax.mx_v4 .mx_fcard { grid-template-columns: 1fr; gap: 24px; padding: 28px 0 4px; }
}
@media (prefers-reduced-motion: reduce) {
  #dvmax.mx_v4 .mx_show_card { animation: none; }
  #dvmax.mx_v4 .mx_fcard_steps.rv-wait > li { opacity: 1; transform: none; transition: none; }
}
`
export const PATTERN_CSS2 = `
/* ── HeroCycle: 머리말 화면 여럿 — 판 밑 탭을 눌러 바꾼다(자동 넘김은 2026-09-28 뺐다) ── */
/* 비율은 HeroCycle 이 한 번만 정한다(가장 납작한 장 기준). 장마다 바꾸면 판이 출렁인다 — transition 도 없앴다. */
#dvmax.mx_v4 .mx_cycle { position: relative; overflow: hidden; background: #fff; }
/* contain — 잘라 채우면 표 화면의 좌측 라벨·앞 열이 날아간다. 툴바 밑에 붙이고 남는 아래는 흰 여백. */
#dvmax.mx_v4 .mx_cycle img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: contain; object-position: top center; background: #fff; opacity: 0; transform: scale(1.04); transition: opacity .9s ease, transform .9s ease; }
#dvmax.mx_v4 .mx_cycle img.on { opacity: 1; transform: scale(1); animation: mxKen 6s ease-out both; }
@keyframes mxKen { from { transform: scale(1); } to { transform: scale(1.025); } }
#dvmax.mx_v4 .mx_cycle_tag { animation: mxPop .5s cubic-bezier(.22,.68,.24,1) both; }
/* 2026-09-28 사용자: 틀 › 그라데이션 판 › 브라우저 창으로 겹겹이 싸면 「AI 느낌」 — 판·틀·방울·꼬리표를 빼고 창 하나만. 화면 이름은 밑 탭이 말한다. */
#dvmax.mx_v4 .mx_plate.flat { background: none; border-radius: 0; overflow: visible; }
#dvmax.mx_v4 .mx_plate.flat .mx_plate_in { margin: 0; padding: 0; min-height: 0; border-radius: 0; overflow: visible; }
#dvmax.mx_v4 .mx_plate.flat .mx_plate_in::before, #dvmax.mx_v4 .mx_plate.flat .mx_plate_in::after { content: none; }
#dvmax.mx_v4 .mx_plate.flat .mx_browser { border: 1px solid #e5e8eb; border-radius: 12px; box-shadow: 0 12px 32px rgba(21,34,56,.08); }
#dvmax.mx_v4 .mx_cycle_tabs { display: flex; flex-wrap: wrap; justify-content: center; gap: 4px 24px; margin: 20px auto 0; width: max-content; max-width: 100%; border-bottom: 1px solid #e5e8eb; }
#dvmax.mx_v4 .mx_cycle_tabs button { min-height: 44px; margin-bottom: -1px; padding: 0 2px; border: 0; border-bottom: 2px solid transparent; border-radius: 0; background: none; color: #8b95a1; font: inherit; font-size: 15px; font-weight: 600; cursor: pointer; transition: color .2s, border-color .2s; }
#dvmax.mx_v4 .mx_cycle_tabs button:hover { color: #4e5968; }
#dvmax.mx_v4 .mx_cycle_tabs button.on { color: #191f28; border-bottom-color: #191f28; }
#dvmax.mx_v4 .mx_cycle_tabs button:focus-visible { outline: 2px solid #191f28; outline-offset: 3px; }

/* ── FlowBand: 처음 시안(max-page-draft.html)의 흐름 — 흰 바탕, 칸·상자는 maxStyles.ts 의 .mx_kpi·.mx_flow* ── */
/* 2026-09-28 사용자: 어두운 그라데이션 판·흐린 방울은 「AI 느낌」이라 뺐다. 장 위쪽(인증 띠 밑)에 붙는다. */
#dvmax.mx_v4 .mx_fb { padding: 72px 0 24px; background: #fff; color: #191f28; }
#dvmax.mx_v4 .mx_fb .mx_wrap { padding: 0; }
#dvmax.mx_v4 .mx_fb .mx_flow { margin: 0; padding: 0; list-style: none; }
/* 여섯 칸이 한 줄에 안 들어가면 밀지 않고 접는다 — 접힌 줄 끝의 화살표는 다음 줄을 가리키지 못하니 끈다. */
@media (max-width: 1100px) {
  #dvmax.mx_v4 .mx_fb .mx_flow { grid-template-columns: repeat(3, minmax(0, 1fr)); min-width: 0; row-gap: 32px; }
  #dvmax.mx_v4 .mx_fb .mx_stage:nth-child(3n) .mx_arrow { display: none; }
}
@media (max-width: 900px) { #dvmax.mx_v4 .mx_fb { padding: 44px 0 8px; } }
/* 폰은 두 줄 격자(2026-09-28 사용자) — 화살표는 모두 끈다. */
@media (max-width: 640px) {
  #dvmax.mx_v4 .mx_fb .mx_flow { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 24px 10px; }
  #dvmax.mx_v4 .mx_fb .mx_arrow { display: none; }
  #dvmax.mx_v4 .mx_fb .mx_note { font-size: 12.5px; }
  #dvmax.mx_v4 .mx_fb .mx_pbox { font-size: 14.5px; padding: 11px 4px; }
}
@media (prefers-reduced-motion: reduce) {
  #dvmax.mx_v4 .mx_cycle img.on { animation: none; }
}
`
export const PATTERN_CSS3 = `
/* ── 글씨 크고 깔끔하게(2026-09-22 사용자): channel.io marketing·documents 실측 h1 64/600/-2px · h2 52/600/-1.5px ── */
/* 2026-09-28 사용자 「3/2로 내려줘」 — 머리말 제목·큰 문장·묶음 제목·기능 판 제목을 모두 위 값의 2/3 로 내렸다. */
/* 머리말 제목은 위 크기의 2/3 (2026-09-28 사용자: 「3/2로 내려줘」) */
#dvmax.mx_v4 .mx_hero4 :is(h1, h2) { font-size: clamp(23px, 3.07vw, 43px); font-weight: 600; letter-spacing: -1.3px; line-height: 1.22; max-width: 20em; }
#dvmax.mx_v4 .mx_hero4 :is(h1, h2) b { font-weight: 600; }
#dvmax.mx_v4 .mx_hero4 p { font-size: clamp(17px, 1.5vw, 21px); color: #4e5968; }
/* 구역 큰 문장·묶음 제목도 2/3 — 머리말 제목보다 커 보이던 것(2026-09-28 사용자: 「위쪽에 있는것들 글씨가 다 큰데」) */
#dvmax.mx_v4 .mx_state { font-size: clamp(20px, 2.53vw, 35px); font-weight: 600; letter-spacing: -1px; line-height: 1.25; }
#dvmax.mx_v4 .mx_state_p { font-size: clamp(16px, 1.4vw, 19px); }
#dvmax.mx_v4 .mx_ghead h2 { font-size: clamp(19px, 2.13vw, 29px); font-weight: 600; letter-spacing: -.8px; }
/* 구역 머리 글 — 2026-09-28 사용자·블라인드 비평: 파란 알약은 「AI 느낌」. 레퍼런스(업스테이지·flex·c3·Tulip 안쪽 장 19곳)에
   알약 라벨은 하나도 없었다 — 바탕 없이 브랜드색 글자만. */
#dvmax.mx_v4 .mx_kicker { display: table; padding: 0; border-radius: 0; background: none; color: #d71920; font-size: 15px; font-weight: 600; letter-spacing: 0; }
#dvmax.mx_v4 .mx_kicker span { color: #8b95a1; }
#dvmax.mx_v4 .mx_hero4 .mx_kicker { color: #d71920; }
#dvmax.mx_v4 .mx_hero4 .mx_kicker, #dvmax.mx_v4 .mx_kicker.hk_center, #dvmax.mx_v4 .mx_kicker[style*="center"] { margin-left: auto; margin-right: auto; }
`
export const PATTERN_CSS4 = `
/* 좁은 판 — 채팅 창 같은 작은 화면은 폭 640 으로 가운데. 2026-09-22 사용자: 「너무 과하게 확대됨」 */
#dvmax.mx_v4 .mx_plate.narrow .mx_browser { max-width: 640px; margin: 0 auto; border-radius: 12px; }
#dvmax.mx_v4 .mx_plate.narrow .mx_plate_in { padding-bottom: 48px; }

/* ── FeatureShow: 기능 전문 줄(글 왼쪽 · 화면 오른쪽) ──
   2026-09-28 사용자: 파란 그라데이션 판 › 흰 상자 요점 › 검은 알약 › 해시태그 칩 › 검은 콜아웃 = 카드 속 카드 속 카드.
   레퍼런스(flex·업스테이지 기능 줄, Tulip 제품 장)처럼 흰 바탕에 구분선 한 줄로 나누고 겹을 전부 뺀다. 글·요점은 그대로. */
#dvmax.mx_v4 .mx_fs { margin: 24px 0 0; }
#dvmax.mx_v4 .mx_fs_panel { display: grid; grid-template-columns: minmax(0, 5fr) minmax(0, 7fr); gap: 56px; align-items: center; padding: 56px 0; border-top: 1px solid #e5e8eb; }
#dvmax.mx_v4 .mx_fs_panel:last-child { border-bottom: 1px solid #e5e8eb; }
#dvmax.mx_v4 .mx_fs_panel.one { grid-template-columns: 1fr; }
#dvmax.mx_v4 .mx_fs_k { margin: 0 0 10px; font-size: 15px; font-weight: 600; color: #d71920; }
#dvmax.mx_v4 .mx_fs_txt h3 { margin: 0; font-size: clamp(18px, 1.7vw, 23px); line-height: 1.35; letter-spacing: -.03em; font-weight: 700; color: #191f28; word-break: keep-all; }
#dvmax.mx_v4 .mx_fs_txt h3 .mx_hl { color: #191f28; }
#dvmax.mx_v4 .mx_fs_pts { list-style: none; margin: 18px 0 0; padding: 0; display: grid; gap: 8px; }
#dvmax.mx_v4 .mx_fs_pts li { position: relative; padding-left: 16px; font-size: 16px; line-height: 1.65; color: #4e5968; word-break: keep-all; }
#dvmax.mx_v4 .mx_fs_pts li::before { content: ''; position: absolute; left: 2px; top: 11px; width: 5px; height: 5px; border-radius: 50%; background: #8b95a1; }
#dvmax.mx_v4 .mx_fs_pts li .mx_hl { color: #191f28; }
#dvmax.mx_v4 .mx_fs_callout { margin: 20px 0 0; padding: 2px 0 2px 16px; border-left: 3px solid #d71920; }
#dvmax.mx_v4 .mx_fs_callout p { margin: 0; font-size: 14px; line-height: 1.6; color: #6b7684; }
#dvmax.mx_v4 .mx_fs_callout .mx_fs_res { margin-top: 4px; font-size: 16px; font-weight: 700; line-height: 1.45; color: #191f28; word-break: keep-all; }
#dvmax.mx_v4 .mx_fs_chips { list-style: none; margin: 16px 0 0; padding: 0; display: flex; flex-wrap: wrap; gap: 4px 12px; }
#dvmax.mx_v4 .mx_fs_chips li { font-size: 14px; font-weight: 500; color: #8b95a1; }
#dvmax.mx_v4 .mx_fs_fig { position: relative; margin: 0; }
#dvmax.mx_v4 .mx_fs_fig .mx_browser { position: relative; width: 100%; border: 1px solid #e5e8eb; border-radius: 12px; box-shadow: 0 12px 32px rgba(21,34,56,.08); will-change: auto; }
/* 화면 여럿일 때 ShotViewer 의 「N장 크게 보기」 — 창 위에 떠 있던 흰 알약 → 창 밑 글자 단추. */
#dvmax.mx_v4 .mx_fs_fig .dvshot_more { position: static; display: flex; width: 100%; margin: 0; padding: 12px 16px; border: 0; border-top: 1px solid #eef0f2; border-radius: 0; background: #fafbfc; box-shadow: none; font-size: 14px; font-weight: 600; color: #4e5968; }
#dvmax.mx_v4 .mx_fs_fig .dvshot_more:hover { color: #191f28; background: #f2f4f6; }
#dvmax.mx_v4 .mx_fs_fig .dvshot_grid { display: block; }
#dvmax.mx_v4 .mx_fs_fig .dvshot img { border: 0; border-radius: 0; }
#dvmax.mx_v4 .mx_fs_fig .dvshot_frame { border-radius: 0; box-shadow: none; }
#dvmax.mx_v4 .mx_fs_fig .dvshot figcaption { display: none; }
#dvmax.mx_v4 .mx_fs .mx_cols { margin-top: 24px; }
@media (max-width: 900px) {
  #dvmax.mx_v4 .mx_fs_panel, #dvmax.mx_v4 .mx_fs_panel.one { grid-template-columns: 1fr; gap: 22px; padding: 36px 0; }
}
/* ── 한 축: 왼쪽 정렬(2026-09-28 사용자 · 블라인드 비평 R3 「가운데 정렬 템플릿」) — 머리말·구역 제목·탭. 문의 띠만 가운데. ── */
#dvmax.mx_v4 .mx_hero4 { text-align: left; }
#dvmax.mx_v4 .mx_hero4 :is(h1, h2) { margin: 0; }
#dvmax.mx_v4 .mx_hero4 > .mx_wrap > p:not(.mx_kicker) { margin: 18px 0 30px; }
#dvmax.mx_v4 .mx_hero4 .mx_kicker, #dvmax.mx_v4 .mx_kicker.hk_center, #dvmax.mx_v4 .mx_kicker[style*="center"] { margin-left: 0; margin-right: 0; }
#dvmax.mx_v4 .mx_hero4_act { justify-content: flex-start; }
#dvmax.mx_v4 .mx_state { text-align: left; margin: 0; }
#dvmax.mx_v4 .mx_state_p { text-align: left; margin: 16px 0 0; }
#dvmax.mx_v4 .hk_center { text-align: left; }
#dvmax.mx_v4 .mx_bento_head { text-align: left; }
/* 화면 밑 탭은 가운데 — 글은 왼쪽 축이어도 탭은 위 화면에 딸린 것이라 화면 가운데에 둔다(2026-09-28 사용자 「왼쪽에 안 두면 좋겠다」). */
#dvmax.mx_v4 .mx_cycle_tabs { margin: 20px auto 0; justify-content: center; }
/* 화면 없는 머리말(M.AX 허브) — 오른쪽이 비어 보이지 않게 글 폭을 넓히고, 바로 밑 흐름도(허브의 대표 그림)로 곧장 잇는다. */
#dvmax.mx_v4 .mx_hero4:not(:has(.mx_plate)) :is(h1, h2) { max-width: 28em; }
#dvmax.mx_v4 .mx_hero4:not(:has(.mx_plate)) > .mx_wrap > p:not(.mx_kicker) { max-width: 46em; }
#dvmax.mx_v4 .mx_hero4:not(:has(.mx_plate)) { padding-bottom: 24px; }
#dvmax.mx_v4 .mx_main > .mx_fb:first-child { padding-top: 40px; }
/* ── 제품군 판 셋(고정) ── */
#dvmax.mx_v4 .mx_show_rows { margin: 36px 0 0; }
#dvmax.mx_v4 .mx_show_row { display: grid; grid-template-columns: minmax(0, 5fr) minmax(0, 7fr); gap: 56px; align-items: center; padding: 48px 0; border-top: 1px solid #e5e8eb; }
#dvmax.mx_v4 .mx_show_row:last-child { border-bottom: 1px solid #e5e8eb; }
#dvmax.mx_v4 .mx_show_row .mx_show_txt h3 { font-size: clamp(22px, 2.2vw, 30px); }
@media (max-width: 900px) { #dvmax.mx_v4 .mx_show_row { grid-template-columns: 1fr; gap: 22px; padding: 32px 0; } }
/* 요약 카드 — 큰 문장 바로 밑, 테두리 1px 의 낮은 카드(업스테이지 제조 장의 2×2 카드 짜임). 겹 없음: 카드 안에 카드 · 그림자 · 알약 없음. */
#dvmax.mx_v4 .mx_keys { padding-top: 72px; }
#dvmax.mx_v4 .mx_keycards { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; margin: 32px 0 0; padding: 0; list-style: none; }
#dvmax.mx_v4 .mx_keycards li { padding: 24px 24px 26px; border: 1px solid #e5e8eb; border-radius: 10px; background: #fff; }
#dvmax.mx_v4 .mx_keycards b { display: block; font-size: 18px; font-weight: 700; line-height: 1.4; color: #191f28; word-break: keep-all; }
#dvmax.mx_v4 .mx_keycards span { display: block; margin-top: 8px; font-size: 15px; line-height: 1.65; color: #4e5968; word-break: keep-all; }
@media (max-width: 900px) { #dvmax.mx_v4 .mx_keycards { grid-template-columns: 1fr; gap: 10px; margin-top: 24px; } #dvmax.mx_v4 .mx_keys { padding-top: 48px; } }
/* 화면 판(Plate) 전부 — 2026-09-28: 머리말·시연의 그라데이션 판 › 방울 › 점 무늬 › 창의 겹을 v4 장 전체에서 뺀다(M.AX 허브에서 먼저 한 것과 같은 결정, 결정 0018).
   바탕 없이 창 하나 — 1px 테두리 · 옅은 그림자. 판 머리 꼬리표도 끈다(화면 이름은 창 주소줄과 밑 탭이 말한다). */
#dvmax.mx_v4 .mx_plate { background: none; border-radius: 0; overflow: visible; }
#dvmax.mx_v4 .mx_plate_in { margin: 0; padding: 0; min-height: 0; border-radius: 0; overflow: visible; }
#dvmax.mx_v4 .mx_plate_in::before, #dvmax.mx_v4 .mx_plate_in::after { content: none; }
#dvmax.mx_v4 .mx_plate .mx_blob, #dvmax.mx_v4 .mx_plate_tag { display: none; }
#dvmax.mx_v4 .mx_plate .mx_browser { border: 1px solid #e5e8eb; border-radius: 12px; box-shadow: 0 12px 32px rgba(21,34,56,.08); }
/* 제목 줄바꿈 — 낱말(가운뎃점 묶음) 중간이나 「·」 앞에서 끊기지 않게 균형 줄바꿈. 전역 overflow-wrap: anywhere 는 칸보다 긴 낱말만을 위한 것. */
#dvmax.mx_v4 :is(.mx_hero4 :is(h1, h2), .mx_state, .mx_show_txt h3, .mx_fs_txt h3, .mx_fcard_txt h3) { text-wrap: balance; overflow-wrap: normal; }
#dvmax.mx_v4 .mx_fb .mx_state_p { margin-bottom: 32px; }
/* 폰: 구역 제목이 그 밑 판 제목보다 작아지지 않게. */
@media (max-width: 900px) { #dvmax.mx_v4 .mx_state { font-size: 24px; } #dvmax.mx_v4 .mx_show_row .mx_show_txt h3 { font-size: 20px; } }
/* 탭 패널을 전부 HTML 에 싣고 hidden 으로 숨긴다 — 클래스의 display 가 hidden 을 이기지 않게. */
#dvmax.mx_v4 article[hidden] { display: none !important; }
/* 기능 판 밑 3열(PCB KPI 셋 등) — 글만 있는 3열이 덩그러니였다. 요약과 같은 낮은 테두리 카드로(2026-09-28 검수). */
#dvmax.mx_v4 .mx_fs .mx_cols { gap: 16px; margin-top: 28px; }
#dvmax.mx_v4 .mx_fs .mx_cols > li { padding: 24px 24px 26px; border: 1px solid #e5e8eb; border-radius: 10px; background: #fff; }
#dvmax.mx_v4 .mx_fs .mx_cols b { font-size: 18px; }
@media (max-width: 900px) { #dvmax.mx_v4 .mx_fs .mx_cols { grid-template-columns: 1fr; gap: 10px; } }
/* 폰: 그림이 여러 장이면 창 아래 「화면 N장 크게 보기」가 있으니 그림 위 확대 버튼은 감춘다 — 같은 일을 하는 단추가 둘 겹쳤다. */
@media (max-width: 700px) { #dvmax.mx_v4 .mx_fs_fig:has(.dvshot_more) .dvshot_zoom { display: none; } }
`
