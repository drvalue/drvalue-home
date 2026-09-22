/**
 * Patterns.tsx(Showcase · Bento · FlowCard)의 CSS. maxStyles.ts 의 PAGE_CSS 끝에 이어 붙는다 —
 * 순서가 뒤여야 같은 명시도의 v4 규칙을 덮는다. 색은 v4 것만 쓴다(먹 #191f28 · 남색 #152238 ·
 * 강철 #3e78c8 · 붉은 표시 #d71920 · 웜 판 #f1efeb). 보라·분홍은 레퍼런스 브랜드라 안 쓴다.
 */
export const PATTERN_CSS = `
/* ── Showcase: 알약 탭 줄 + 큰 카드 + ‹ › ── */
#dvmax.mx_v4 .mx_show { margin: 40px 0 0; }
#dvmax.mx_v4 .mx_show_tabs { display: flex; justify-content: center; gap: 4px; margin: 0 auto 22px; padding: 6px; width: max-content; max-width: 100%; border-radius: 999px; background: #f1efeb; overflow-x: auto; scrollbar-width: none; }
#dvmax.mx_v4 .mx_show_tabs::-webkit-scrollbar { display: none; }
#dvmax.mx_v4 .mx_show_tabs button { flex: 0 0 auto; min-height: 46px; padding: 0 26px; border: 0; border-radius: 999px; background: transparent; color: #4e5968; font-size: 16px; font-weight: 600; cursor: pointer; white-space: nowrap; transition: background .25s, color .25s; }
#dvmax.mx_v4 .mx_show_tabs button:hover { color: #191f28; }
#dvmax.mx_v4 .mx_show_tabs button.on { background: #191f28; color: #fff; }
#dvmax.mx_v4 .mx_show_tabs button:focus-visible { outline: 2px solid #191f28; outline-offset: 2px; }
#dvmax.mx_v4 .mx_show_stage { position: relative; }
#dvmax.mx_v4 .mx_show_card { position: relative; display: grid; grid-template-columns: minmax(0, 5fr) minmax(0, 7fr); gap: 32px; align-items: center; min-height: 520px; padding: 56px 64px; border-radius: 28px; overflow: hidden; color: #191f28;
  background: linear-gradient(135deg, #e9f1fc 0%, #d3e2f6 60%, #bcd2ef 100%); animation: hkSwap .45s cubic-bezier(.2,.75,.2,1); }
#dvmax.mx_v4 .mx_show_card::after { content: ''; position: absolute; inset: 0; pointer-events: none; background-image: radial-gradient(rgba(21,34,56,.12) 1px, transparent 1.3px); background-size: 22px 22px; opacity: .5; }
#dvmax.mx_v4 .mx_show_txt { position: relative; z-index: 2; }
#dvmax.mx_v4 .mx_show_k { display: inline-block; margin: 0 0 18px; padding: 6px 14px; border-radius: 999px; background: #152238; color: #fff; font-size: 13px; font-weight: 700; letter-spacing: .02em; }
#dvmax.mx_v4 .mx_show_txt h3 { margin: 0; font-size: clamp(28px, 3vw, 40px); line-height: 1.28; letter-spacing: -.03em; font-weight: 600; color: #191f28; word-break: keep-all; }
#dvmax.mx_v4 .mx_show_txt h3 b { font-weight: 600; color: #191f28; }
#dvmax.mx_v4 .mx_show_txt h3 .mx_hl { color: #191f28; }
#dvmax.mx_v4 .mx_show_txt > p:not(.mx_show_k) { margin: 18px 0 0; font-size: 18px; line-height: 1.7; color: #4e5968; max-width: 30em; word-break: keep-all; }
#dvmax.mx_v4 .mx_show_more { display: inline-flex; align-items: center; gap: 6px; margin-top: 28px; min-height: 48px; padding: 0 22px; border-radius: 12px; background: #fff; box-shadow: 0 6px 20px rgba(21,34,56,.10); font-size: 16px; font-weight: 700; color: #191f28; text-decoration: none; }
#dvmax.mx_v4 .mx_show_more i { font-style: normal; font-size: 20px; line-height: 1; transition: transform .2s; }
#dvmax.mx_v4 .mx_show_more:hover i { transform: translateX(3px); }
#dvmax.mx_v4 .mx_show_fig { position: relative; z-index: 1; margin: 0; }
#dvmax.mx_v4 .mx_show_fig .mx_browser { position: relative; width: 100%; border-radius: 12px; box-shadow: 0 30px 80px rgba(21,34,56,.30); }
#dvmax.mx_v4 .mx_show_arr { position: absolute; top: 50%; z-index: 4; width: 48px; height: 48px; margin-top: -24px; border: 0; border-radius: 50%; background: rgba(255,255,255,.7); backdrop-filter: blur(8px); color: #191f28; box-shadow: 0 6px 20px rgba(21,34,56,.12); cursor: pointer; display: grid; place-items: center; transition: background .2s, transform .2s; }
#dvmax.mx_v4 .mx_show_arr svg { width: 22px; height: 22px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
#dvmax.mx_v4 .mx_show_arr:hover { background: #fff; transform: scale(1.06); }
#dvmax.mx_v4 .mx_show_arr:focus-visible { outline: 2px solid #191f28; outline-offset: 3px; }
#dvmax.mx_v4 .mx_show_arr.prev { left: 20px; } #dvmax.mx_v4 .mx_show_arr.next { right: 20px; }
#dvmax.mx_v4 .mx_show_dots { display: flex; justify-content: center; gap: 8px; margin: 18px 0 0; }
#dvmax.mx_v4 .mx_show_dots i { width: 8px; height: 8px; border-radius: 50%; background: #d5dae0; transition: background .25s, transform .25s; }
#dvmax.mx_v4 .mx_show_dots i.on { background: #191f28; transform: scale(1.25); }

/* ── Bento: 어두운 바탕 + 넓은 카드 1 + 반 카드 2 ── */
#dvmax.mx_v4 .mx_bento { position: relative; overflow: hidden; padding: 96px 0 104px; color: #191f28; background: #f3f5f8; }
#dvmax.mx_v4 .mx_bento .mx_blob { display: none; }
#dvmax.mx_v4 .mx_bento .mx_b1 { width: 560px; height: 560px; left: -200px; top: -160px; background: #bcd2ef; opacity: .7; }
#dvmax.mx_v4 .mx_bento .mx_b2 { width: 480px; height: 480px; right: -160px; top: 30%; background: #ffd9c2; opacity: .5; }
#dvmax.mx_v4 .mx_bento .mx_wrap { position: relative; }
#dvmax.mx_v4 .mx_bento_head { text-align: center; color: #191f28; margin: 0 0 44px; }
#dvmax.mx_v4 .mx_bento_k { display: inline-block; margin: 0 0 18px; padding: 7px 16px; border-radius: 999px; background: #3e78c8; color: #fff; font-size: 14px; font-weight: 700; letter-spacing: .02em; }
#dvmax.mx_v4 .mx_fb .mx_bento_k { background: rgba(255,255,255,.16); border: 1px solid rgba(255,255,255,.22); }
#dvmax.mx_v4 .mx_bento_head h2 { margin: 0; font-size: clamp(32px, 3.8vw, 52px); line-height: 1.25; letter-spacing: -1.5px; font-weight: 600; color: #191f28; }
#dvmax.mx_v4 .mx_bento_d { margin: 18px auto 0; max-width: 40em; font-size: 19px; line-height: 1.65; color: #4e5968; word-break: keep-all; }
#dvmax.mx_v4 .mx_fb .mx_bento_d { color: rgba(255,255,255,.75); }
#dvmax.mx_v4 .mx_bento_grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 20px; margin: 0; padding: 0; list-style: none; }
#dvmax.mx_v4 .mx_bento_grid > li { position: relative; display: flex; flex-direction: column; min-height: 420px; padding: 40px 40px 0; border-radius: 24px; overflow: hidden; background: #fff; box-shadow: 0 1px 2px rgba(21,34,56,.04), 0 12px 32px rgba(21,34,56,.06); }
#dvmax.mx_v4 .mx_bento_grid > li.wide { grid-column: 1 / -1; display: grid; grid-template-columns: minmax(0, 5fr) minmax(0, 7fr); gap: 28px; min-height: 380px; padding-right: 0; }
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
#dvmax.mx_v4 .mx_bento_fig { position: relative; z-index: 1; margin: 0; flex: 1; min-height: 200px; }
#dvmax.mx_v4 .mx_bento_fig .mx_browser { position: absolute; left: 0; top: 0; width: 110%; max-width: none; border-radius: 12px 0 0 0; box-shadow: 0 24px 60px rgba(0,0,0,.18); }
#dvmax.mx_v4 .mx_bento_grid > li.wide .mx_bento_fig { min-height: 300px; align-self: end; }
#dvmax.mx_v4 .mx_bento_grid > li.wide .mx_bento_fig .mx_browser { top: 40px; width: 112%; }
#dvmax.mx_v4 .mx_bento_grid > li:not(.wide) .mx_bento_fig { margin: 0 -40px 0 0; }

/* ── FlowCard: 연한 카드, 글 왼쪽 · 단계 카드 ↓ 오른쪽 ── */
#dvmax.mx_v4 .mx_fcard { display: grid; grid-template-columns: minmax(0, 6fr) minmax(0, 6fr); gap: 40px; align-items: center; margin: 24px 0 0; padding: 56px 56px; border-radius: 24px; background: #eef2f8; }
#dvmax.mx_v4 .mx_fcard.sand { background: #f4efe6; } #dvmax.mx_v4 .mx_fcard.steel { background: #dbe6f5; }
#dvmax.mx_v4 .mx_fcard_txt h3 { margin: 0; font-size: clamp(26px, 2.6vw, 36px); line-height: 1.3; letter-spacing: -.03em; font-weight: 600; word-break: keep-all; }
#dvmax.mx_v4 .mx_fcard_txt p { margin: 14px 0 0; font-size: 18px; line-height: 1.7; color: #4e5968; max-width: 30em; word-break: keep-all; }
#dvmax.mx_v4 .mx_fcard_steps { position: relative; margin: 0; padding: 0; list-style: none; display: grid; gap: 22px; justify-self: center; width: min(100%, 420px); }
#dvmax.mx_v4 .mx_fcard_steps li { position: relative; display: grid; grid-template-columns: 36px 1fr; gap: 14px; align-items: center; padding: 16px 20px; border-radius: 16px; background: #fff; box-shadow: 0 10px 30px rgba(21,34,56,.10); font-size: 15px; line-height: 1.55; color: #191f28; word-break: keep-all; }
#dvmax.mx_v4 .mx_fcard_steps li:first-child { background: #191f28; color: #fff; }
#dvmax.mx_v4 .mx_fcard_steps li:first-child .mx_hl { color: #fff; }
#dvmax.mx_v4 .mx_fcard_steps li i { display: grid; place-items: center; width: 36px; height: 36px; border-radius: 50%; background: #eef2f8; color: #191f28; font-style: normal; font-weight: 800; font-size: 14px; }
#dvmax.mx_v4 .mx_fcard_steps li:first-child i { background: rgba(255,255,255,.16); color: #fff; }
#dvmax.mx_v4 .mx_fcard_steps li + li::before { content: ''; position: absolute; left: 50%; top: -22px; width: 2px; height: 22px; background: #98a4b3; }
#dvmax.mx_v4 .mx_fcard_steps li + li::after { content: ''; position: absolute; left: calc(50% - 4px); top: -8px; border: 5px solid transparent; border-top-color: #98a4b3; border-bottom: 0; }
#dvmax.mx_v4 .mx_fcard_steps.rv-wait > li { opacity: 0; transform: translateY(12px); }
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
  #dvmax.mx_v4 .mx_bento_fig, #dvmax.mx_v4 .mx_bento_grid > li.wide .mx_bento_fig { min-height: 0; margin: 0 -22px 0 0; }
  #dvmax.mx_v4 .mx_bento_fig .mx_browser, #dvmax.mx_v4 .mx_bento_grid > li.wide .mx_bento_fig .mx_browser { position: relative; top: 0; width: 108%; max-height: 220px; }
  #dvmax.mx_v4 .mx_fcard { grid-template-columns: 1fr; gap: 28px; padding: 28px 22px; border-radius: 18px; }
}
@media (prefers-reduced-motion: reduce) {
  #dvmax.mx_v4 .mx_show_card { animation: none; }
  #dvmax.mx_v4 .mx_fcard_steps.rv-wait > li { opacity: 1; transform: none; transition: none; }
}
`
export const PATTERN_CSS2 = `
/* ── HeroCycle: 머리말 화면이 몇 초마다 넘어간다 ── */
/* 비율은 HeroCycle 이 한 번만 정한다(가장 납작한 장 기준). 장마다 바꾸면 판이 출렁인다 — transition 도 없앴다. */
#dvmax.mx_v4 .mx_cycle { position: relative; overflow: hidden; background: #fff; }
/* contain — 잘라 채우면 표 화면의 좌측 라벨·앞 열이 날아간다. 툴바 밑에 붙이고 남는 아래는 흰 여백. */
#dvmax.mx_v4 .mx_cycle img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: contain; object-position: top center; background: #fff; opacity: 0; transform: scale(1.04); transition: opacity .9s ease, transform .9s ease; }
#dvmax.mx_v4 .mx_cycle img.on { opacity: 1; transform: scale(1); animation: mxKen 6s ease-out both; }
@keyframes mxKen { from { transform: scale(1); } to { transform: scale(1.025); } }
#dvmax.mx_v4 .mx_cycle_tag { animation: mxPop .5s cubic-bezier(.22,.68,.24,1) both; }

/* ── FlowBand: 어두운 판 · 단계 레일(게이지) · 이어진 카드 둘 · KPI 유리 카드 ── */
#dvmax.mx_v4 .mx_fb { position: relative; overflow: hidden; padding: 96px 0 104px; color: #fff; background: linear-gradient(311deg, #0f1a2c 15%, #1f3560 89%); }
#dvmax.mx_v4 .mx_fb .mx_blob { position: absolute; border-radius: 50%; filter: blur(70px); pointer-events: none; }
#dvmax.mx_v4 .mx_fb .mx_b1 { width: 560px; height: 560px; left: -200px; bottom: -220px; background: #2a4a86; opacity: .6; }
#dvmax.mx_v4 .mx_fb .mx_b2 { width: 420px; height: 420px; right: -140px; top: -160px; background: #7a1d24; opacity: .35; }
#dvmax.mx_v4 .mx_fb .mx_wrap { position: relative; }
#dvmax.mx_v4 .mx_fb_head { text-align: center; margin: 0 0 44px; }
#dvmax.mx_v4 .mx_fb_head h2 { margin: 0; font-size: clamp(32px, 3.8vw, 52px); line-height: 1.25; letter-spacing: -1.5px; font-weight: 600; color: #fff; }
#dvmax.mx_v4 .mx_fb_rail { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 18px; margin: 0; padding: 0; list-style: none; }
#dvmax.mx_v4 .mx_fb_rail button { display: block; width: 100%; text-align: left; padding: 0; border: 0; background: transparent; color: rgba(255,255,255,.5); cursor: pointer; transition: color .25s; }
#dvmax.mx_v4 .mx_fb_rail .hk_show_bar { background: rgba(255,255,255,.16); }
#dvmax.mx_v4 .mx_fb_rail button.on .hk_show_bar { background: rgba(255,255,255,.22); }
#dvmax.mx_v4 .mx_fb_rail .hk_show_bar b { background: #fff; }
#dvmax.mx_v4 .mx_fb_rail button > b { display: block; margin-top: 14px; font-size: 17px; font-weight: 700; line-height: 1.3; word-break: keep-all; }
#dvmax.mx_v4 .mx_fb_rail button > b small { display: block; margin-bottom: 4px; font-size: 12px; font-weight: 700; letter-spacing: .06em; color: rgba(255,255,255,.4); font-variant-numeric: tabular-nums; }
#dvmax.mx_v4 .mx_fb_rail button > span { display: block; margin-top: 4px; font-size: 13px; color: rgba(255,255,255,.45); }
#dvmax.mx_v4 .mx_fb_rail button.on { color: #fff; } #dvmax.mx_v4 .mx_fb_rail button.on > span { color: rgba(255,255,255,.7); }
#dvmax.mx_v4 .mx_fb_rail button:hover { color: rgba(255,255,255,.85); }
#dvmax.mx_v4 .mx_fb_rail button:focus-visible { outline: 2px solid #fff; outline-offset: 4px; border-radius: 4px; }
#dvmax.mx_v4 .mx_fb_panel { display: grid; grid-template-columns: minmax(0, 1fr) 72px minmax(0, 1fr); align-items: start; margin: 40px auto 0; max-width: 980px; animation: hkSwap .45s cubic-bezier(.2,.75,.2,1); }
#dvmax.mx_v4 .mx_fb_panel.one { grid-template-columns: minmax(0, 560px); justify-content: center; }
#dvmax.mx_v4 .mx_fb_card { border-radius: 18px; background: #fff; color: #191f28; box-shadow: 0 24px 60px rgba(0,0,0,.28); overflow: hidden; }
#dvmax.mx_v4 .mx_fb_card header { display: flex; align-items: baseline; gap: 12px; padding: 16px 22px; border-bottom: 1px solid #e5e8eb; background: #f7f9fa; }
#dvmax.mx_v4 .mx_fb_card header small { font-size: 12px; font-weight: 700; color: #8b95a1; letter-spacing: .04em; }
#dvmax.mx_v4 .mx_fb_card h3 { margin: 0; font-size: 20px; font-weight: 800; letter-spacing: -.01em; }
#dvmax.mx_v4 .mx_fb_card.sub header { background: #eef2f8; }
#dvmax.mx_v4 .mx_fb_notes { list-style: none; margin: 0; padding: 14px 22px 18px; display: grid; gap: 8px; }
#dvmax.mx_v4 .mx_fb_notes li { display: flex; align-items: center; gap: 10px; padding: 10px 14px; border-radius: 10px; background: #f7f9fa; font-size: 15px; line-height: 1.5; color: #333d4b; word-break: keep-all; }
#dvmax.mx_v4 .mx_fb_notes li.ai { background: #fff3f3; color: #191f28; font-weight: 600; }
#dvmax.mx_v4 .mx_fb_notes li em { flex: 0 0 auto; font-style: normal; font-size: 11px; font-weight: 800; letter-spacing: .04em; padding: 2px 7px; border-radius: 6px; background: #d71920; color: #fff; }
#dvmax.mx_v4 .mx_fb_link { position: relative; align-self: center; margin-top: 30px; height: 2px; background: repeating-linear-gradient(90deg, rgba(255,255,255,.85) 0 6px, transparent 6px 12px); }
#dvmax.mx_v4 .mx_fb_link::after { content: ''; position: absolute; right: -4px; top: -4px; width: 10px; height: 10px; border-radius: 50%; background: #fff; box-shadow: 0 0 0 4px rgba(255,255,255,.3); }
#dvmax.mx_v4 .mx_fb_kpi { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; margin: 56px 0 0; padding: 0; list-style: none; }
#dvmax.mx_v4 .mx_fb_kpi li { padding: 28px 26px 26px; border-radius: 20px; background: rgba(255,255,255,.07); border: 1px solid rgba(255,255,255,.12); backdrop-filter: blur(8px); transition: background .25s, transform .25s; }
#dvmax.mx_v4 .mx_fb_kpi li:hover { background: rgba(255,255,255,.12); transform: translateY(-3px); }
#dvmax.mx_v4 .mx_fb_kpi li b { display: block; font-size: 20px; font-weight: 700; color: #fff; }
#dvmax.mx_v4 .mx_fb_kpi li > span { display: block; margin-top: 10px; font-size: 14px; line-height: 1.6; color: rgba(255,255,255,.72); word-break: keep-all; }
@media (hover: hover) { #dvmax.mx_v4 .mx_fb_rail:hover .hk_show_bar b { animation-play-state: paused; } }
@media (max-width: 900px) {
  #dvmax.mx_v4 .mx_fb { padding: 64px 0 72px; }
  #dvmax.mx_v4 .mx_fb_rail { grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; }
  #dvmax.mx_v4 .mx_fb_rail button > b { font-size: 15px; }
  #dvmax.mx_v4 .mx_fb_panel { grid-template-columns: 1fr; gap: 14px; } #dvmax.mx_v4 .mx_fb_link { display: none; }
  #dvmax.mx_v4 .mx_fb_kpi { grid-template-columns: 1fr; margin-top: 36px; }
}
@media (prefers-reduced-motion: reduce) {
  #dvmax.mx_v4 .mx_cycle img.on { animation: none; } #dvmax.mx_v4 .mx_fb_panel { animation: none; }
}
`
export const PATTERN_CSS3 = `
/* ── 글씨 크고 깔끔하게(2026-09-22 사용자): channel.io marketing·documents 실측 h1 64/600/-2px · h2 52/600/-1.5px ── */
#dvmax.mx_v4 .mx_hero4 h2 { font-size: clamp(34px, 4.6vw, 64px); font-weight: 600; letter-spacing: -2px; line-height: 1.22; max-width: 20em; }
#dvmax.mx_v4 .mx_hero4 h2 b { font-weight: 600; }
#dvmax.mx_v4 .mx_hero4 p { font-size: clamp(17px, 1.5vw, 21px); color: #4e5968; }
#dvmax.mx_v4 .mx_state { font-size: clamp(30px, 3.8vw, 52px); font-weight: 600; letter-spacing: -1.5px; line-height: 1.25; }
#dvmax.mx_v4 .mx_state_p { font-size: clamp(16px, 1.4vw, 19px); }
#dvmax.mx_v4 .mx_ghead h2 { font-size: clamp(28px, 3.2vw, 44px); font-weight: 600; letter-spacing: -1.2px; }
#dvmax.mx_v4 .mx_kicker { display: table; padding: 7px 16px; border-radius: 999px; background: #3e78c8; color: #fff; font-size: 14px; font-weight: 700; letter-spacing: .02em; }
#dvmax.mx_v4 .mx_kicker span { color: rgba(255,255,255,.7); }
#dvmax.mx_v4 .mx_hero4 .mx_kicker { color: #fff; }
#dvmax.mx_v4 .mx_hero4 .mx_kicker, #dvmax.mx_v4 .mx_kicker.hk_center, #dvmax.mx_v4 .mx_kicker[style*="center"] { margin-left: auto; margin-right: auto; }
`
export const PATTERN_CSS4 = `
/* 좁은 판 — 채팅 창 같은 작은 화면은 폭 640 으로 가운데. 2026-09-22 사용자: 「너무 과하게 확대됨」 */
#dvmax.mx_v4 .mx_plate.narrow .mx_browser { max-width: 640px; margin: 0 auto; border-radius: 12px; }
#dvmax.mx_v4 .mx_plate.narrow .mx_plate_in { padding-bottom: 48px; }

/* ── FeatureShow: 게이지 레일 + 기능 전문 판(글 왼쪽 · 화면 오른쪽) ── */
#dvmax.mx_v4 .mx_fs { margin: 40px 0 0; }
#dvmax.mx_v4 .mx_fs_rail { display: grid; grid-template-columns: repeat(auto-fit, minmax(0, 1fr)); gap: 18px; margin: 0 0 28px; padding: 0; list-style: none; }
#dvmax.mx_v4 .mx_fs_rail button { display: block; width: 100%; text-align: left; padding: 0; border: 0; background: transparent; color: #8b95a1; cursor: pointer; transition: color .25s; }
#dvmax.mx_v4 .mx_fs_rail button > b { display: block; margin-top: 14px; font-size: 17px; font-weight: 700; line-height: 1.3; word-break: keep-all; }
#dvmax.mx_v4 .mx_fs_rail button > b small { display: block; margin-bottom: 4px; font-size: 12px; font-weight: 700; letter-spacing: .06em; color: #b0b8c1; font-variant-numeric: tabular-nums; }
#dvmax.mx_v4 .mx_fs_rail button.on { color: #191f28; } #dvmax.mx_v4 .mx_fs_rail button:hover { color: #4e5968; }
#dvmax.mx_v4 .mx_fs_rail button:focus-visible { outline: 2px solid #191f28; outline-offset: 4px; border-radius: 4px; }
#dvmax.mx_v4 .mx_fs_panel { display: grid; grid-template-columns: minmax(0, 5fr) minmax(0, 7fr); gap: 40px; align-items: center; padding: 48px 56px; border-radius: 28px; overflow: hidden; min-height: 520px;
  background: linear-gradient(135deg, #e9f1fc 0%, #d3e2f6 60%, #bcd2ef 100%); animation: hkSwap .45s cubic-bezier(.2,.75,.2,1); }
#dvmax.mx_v4 .mx_fs_panel.one { grid-template-columns: 1fr; padding: 48px 56px; min-height: 0; }
#dvmax.mx_v4 .mx_fs_panel.one .mx_fs_txt { padding-bottom: 0; }
#dvmax.mx_v4 .mx_fs_txt { padding-bottom: 0; }
#dvmax.mx_v4 .mx_fs_k { display: inline-block; margin: 0 0 16px; padding: 6px 14px; border-radius: 999px; background: #152238; color: #fff; font-size: 13px; font-weight: 700; letter-spacing: .02em; }
#dvmax.mx_v4 .mx_fs_txt h3 { margin: 0; font-size: clamp(24px, 2.4vw, 32px); line-height: 1.3; letter-spacing: -.03em; font-weight: 600; color: #191f28; word-break: keep-all; }
#dvmax.mx_v4 .mx_fs_txt h3 .mx_hl { color: #191f28; }
#dvmax.mx_v4 .mx_fs_pts { list-style: none; margin: 22px 0 0; padding: 0; display: grid; gap: 10px; }
#dvmax.mx_v4 .mx_fs_pts li { position: relative; padding: 12px 16px 12px 40px; border-radius: 12px; background: rgba(255,255,255,.72); font-size: 16px; line-height: 1.6; color: #333d4b; word-break: keep-all; }
#dvmax.mx_v4 .mx_fs_pts li::before { content: ''; position: absolute; left: 16px; top: 19px; width: 12px; height: 12px; border-radius: 50%; background: #3e78c8; box-shadow: 0 0 0 4px rgba(62,120,200,.18); }
#dvmax.mx_v4 .mx_fs_pts li .mx_hl { color: #191f28; }
#dvmax.mx_v4 .mx_fs_callout { margin: 20px 0 0; padding: 18px 22px; border-radius: 14px; background: #152238; color: #fff; }
#dvmax.mx_v4 .mx_fs_callout p { margin: 0; font-size: 14px; line-height: 1.6; color: rgba(255,255,255,.72); }
#dvmax.mx_v4 .mx_fs_callout .mx_fs_res { margin-top: 6px; font-size: 20px; font-weight: 700; line-height: 1.35; color: #fff; word-break: keep-all; }
#dvmax.mx_v4 .mx_fs_chips { list-style: none; margin: 18px 0 0; padding: 0; display: flex; flex-wrap: wrap; gap: 8px; }
#dvmax.mx_v4 .mx_fs_chips li { padding: 6px 12px; border-radius: 999px; background: rgba(21,34,56,.08); font-size: 13px; font-weight: 600; color: #4e5968; }
#dvmax.mx_v4 .mx_fs_fig { position: relative; margin: 0; }
#dvmax.mx_v4 .mx_fs_fig .mx_browser { position: relative; width: 100%; border-radius: 12px; box-shadow: 0 24px 60px rgba(21,34,56,.22); }
/* 화면 여럿일 때 ShotViewer 의 「N장 크게 보기」 — 프레임 밑은 판에 잘리므로 프레임 위 오른쪽에 띄운다. */
#dvmax.mx_v4 .mx_fs_fig .dvshot_more { position: absolute; right: 24px; top: -22px; z-index: 5; margin: 0; padding: 8px 14px; border-radius: 999px; background: #fff; box-shadow: 0 6px 18px rgba(21,34,56,.12); }
#dvmax.mx_v4 .mx_fs_fig .dvshot_grid { display: block; }
/* will-change: transform 은 fixed 자식(크게 보기 창)의 기준 상자가 된다 — 여기선 끈다. */
#dvmax.mx_v4 .mx_fs_fig .mx_browser { will-change: auto; }
#dvmax.mx_v4 .mx_fs_fig .dvshot img { border: 0; border-radius: 0; }
#dvmax.mx_v4 .mx_fs_fig .dvshot_frame { border-radius: 0; box-shadow: none; }
#dvmax.mx_v4 .mx_fs_fig .dvshot figcaption { display: none; }
#dvmax.mx_v4 .mx_fs .mx_cols { margin-top: 24px; }
@media (hover: hover) { #dvmax.mx_v4 .mx_fs_rail:hover .hk_show_bar b { animation-play-state: paused; } }
@media (max-width: 900px) {
  #dvmax.mx_v4 .mx_fs_rail { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
  #dvmax.mx_v4 .mx_fs_rail button > b { font-size: 15px; }
  #dvmax.mx_v4 .mx_fs_panel, #dvmax.mx_v4 .mx_fs_panel.one { grid-template-columns: 1fr; gap: 20px; padding: 26px 20px; border-radius: 20px; min-height: 0; }
  #dvmax.mx_v4 .mx_fs_fig { margin: 0; }
  #dvmax.mx_v4 .mx_fs_fig .dvshot_more { position: static; margin: 8px 0 0; }
}
@media (prefers-reduced-motion: reduce) { #dvmax.mx_v4 .mx_fs_panel { animation: none; } }
`
