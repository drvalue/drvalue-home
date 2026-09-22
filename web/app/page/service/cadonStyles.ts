/**
 * CADON 장만의 꾸밈. 한건 장의 `.hk_*`(전/후 쌍·목록·판)는 maxStyles.ts 것을 그대로 쓰고,
 * 여기는 시연(`.cd_demo`)과 판정 판(`.cd_show`)만 있다. 전부 `#dvmax.mx_v4` 아래.
 * 색: 실제 CutON 패널이 어두운 바탕(#1f2429)에 주황(#f26f21) 단추라 카드도 그 톤을 따른다 —
 * 제품 화면과 옆에 놓였을 때 같은 물건으로 읽히게.
 */
export const CADON_CSS = `
/* ── 시연 ─────────────────────────────────────────── */
#dvmax.mx_v4 .cd_demo { display: grid; grid-template-columns: minmax(0, 1.55fr) minmax(280px, 1fr); gap: 28px; align-items: start; }
#dvmax.mx_v4 .cd_screen { background: #1f2429; border-radius: 16px; overflow: hidden; box-shadow: 0 30px 80px rgba(21,34,56,.28); }
#dvmax.mx_v4 .cd_screen_bar { display: flex; align-items: center; gap: 6px; height: 36px; padding: 0 14px; background: #2a3037; border-bottom: 1px solid #3a4149; }
#dvmax.mx_v4 .cd_screen_bar i { width: 10px; height: 10px; border-radius: 50%; background: #4b535c; display: block; }
#dvmax.mx_v4 .cd_screen_bar span { margin-left: 10px; font-size: 12px; color: #aab3bd; font-variant-numeric: tabular-nums; }
#dvmax.mx_v4 .cd_shots { position: relative; aspect-ratio: 16 / 10; background: #1f2429; }
#dvmax.mx_v4 .cd_shots img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: center top; opacity: 0; transition: opacity .55s ease; }
#dvmax.mx_v4 .cd_shots img.on { opacity: 1; }
/* 1단계(3D 미리보기)는 세로가 길어 cover 면 「이 파일로 전개」 단추와 치수 줄이 잘린다 — 창 바탕이 어두워 contain 여백이 티 안 남 */
#dvmax.mx_v4 .cd_shots img:first-child { object-fit: contain; background: #1f2429; }
#dvmax.mx_v4 .cd_facts { list-style: none; margin: 0; padding: 12px 16px 14px; display: flex; flex-wrap: wrap; gap: 8px; border-top: 1px solid #3a4149; min-height: 58px; }
#dvmax.mx_v4 .cd_facts li { font-size: 13px; color: #e6e9ec; background: #2a3037; border: 1px solid #3a4149; border-radius: 8px; padding: 6px 10px; font-variant-numeric: tabular-nums;
  animation: mxPop .45s cubic-bezier(.22,.68,.24,1) both; animation-delay: calc(var(--i, 0) * .14s + .25s); }
#dvmax.mx_v4 .cd_steps { list-style: none; margin: 0; padding: 0; display: grid; gap: 6px; counter-reset: none; }
#dvmax.mx_v4 .cd_steps button { width: 100%; display: flex; gap: 14px; align-items: flex-start; text-align: left; padding: 14px 16px; min-height: 44px; border: 0; border-radius: 14px; background: transparent; cursor: pointer; color: #8b95a1; transition: background .2s, color .2s; }
#dvmax.mx_v4 .cd_steps button i { flex: none; width: 28px; height: 28px; border-radius: 50%; display: grid; place-items: center; font-style: normal; font-size: 13px; font-weight: 800; background: #e8ebee; color: #8b95a1; transition: background .2s, color .2s; }
#dvmax.mx_v4 .cd_steps button b { display: block; font-size: 16px; font-weight: 700; line-height: 1.4; word-break: keep-all; }
#dvmax.mx_v4 .cd_steps button small { display: none; margin-top: 4px; font-size: 14px; line-height: 1.5; color: #62707e; word-break: keep-all; }
#dvmax.mx_v4 .cd_steps li.ok button { color: #4e5968; } #dvmax.mx_v4 .cd_steps li.ok button i { background: #1a9e5c; color: #fff; }
#dvmax.mx_v4 .cd_steps li.on button { background: #f7f8fa; color: #191f28; } #dvmax.mx_v4 .cd_steps li.on button i { background: #191f28; color: #fff; }
#dvmax.mx_v4 .cd_steps li.on button small { display: block; }
#dvmax.mx_v4 .cd_steps button:hover { color: #191f28; }
#dvmax.mx_v4 .cd_steps button:focus-visible { outline: 2px solid #191f28; outline-offset: 2px; }
#dvmax.mx_v4 .cd_ctl { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-top: 14px; padding: 0 4px; font-size: 13px; color: #4e5968; }
#dvmax.mx_v4 .cd_ctl button { border: 1px solid #191f28; background: transparent; border-radius: 999px; padding: 8px 16px; min-height: 44px; font: inherit; font-size: 14px; cursor: pointer; }
#dvmax.mx_v4 .cd_ctl button:hover { background: #191f28; color: #fff; }

/* ── 판정 판 + 탭 (한건 .hk_show 와 같은 골격) ────────────── */
#dvmax.mx_v4 .cd_show { margin: 40px 0 0; }
#dvmax.mx_v4 .cd_show_plate { position: relative; border-radius: 28px; overflow: hidden; display: grid; grid-template-columns: 300px 72px minmax(0, 560px); justify-content: center; align-items: center; padding: 72px 48px; min-height: 480px;
  background: #d9d3c6 url('/bg/hangeon-light.jpg') center/cover no-repeat; }
#dvmax.mx_v4 .cd_show_plate::before { content: ''; position: absolute; inset: 0; background: linear-gradient(180deg, rgba(36,42,52,.08), rgba(36,42,52,.42)); backdrop-filter: blur(6px); }
#dvmax.mx_v4 .cd_show_plate > * { position: relative; }
#dvmax.mx_v4 .cd_show_me { padding: 22px 24px; border-radius: 16px; background: rgba(255,255,255,.86); backdrop-filter: blur(10px); box-shadow: 0 14px 40px rgba(0,0,0,.14); }
#dvmax.mx_v4 .cd_show_me_t { margin: 0 0 12px; font-size: 13px; font-weight: 700; color: #62707e; }
#dvmax.mx_v4 .cd_show_me ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 10px; }
#dvmax.mx_v4 .cd_show_me li { display: grid; grid-template-columns: 40px 1fr; gap: 10px; font-size: 14px; align-items: baseline; }
#dvmax.mx_v4 .cd_show_me li span { color: #8b95a1; } #dvmax.mx_v4 .cd_show_me li b { color: #191f28; font-weight: 700; word-break: keep-all; font-variant-numeric: tabular-nums; }
#dvmax.mx_v4 .cd_show_link { display: block; height: 2px; background: repeating-linear-gradient(90deg, rgba(255,255,255,.9) 0 6px, transparent 6px 12px); }
#dvmax.mx_v4 .cd_show_link::after { content: ''; position: absolute; right: -4px; top: -4px; width: 10px; height: 10px; border-radius: 50%; background: #fff; box-shadow: 0 0 0 4px rgba(255,255,255,.35); }
#dvmax.mx_v4 .cd_panel { background: #1f2429; color: #e6e9ec; border-radius: 16px; padding: 20px 22px 22px; box-shadow: 0 24px 60px rgba(0,0,0,.30); animation: cdSwap .38s cubic-bezier(.2,.75,.2,1); }
@keyframes cdSwap { from { opacity: 0; transform: translateY(14px) scale(.98); } to { opacity: 1; transform: none; } }
#dvmax.mx_v4 .cd_panel p, #dvmax.mx_v4 .cd_panel ul { margin: 0; }
#dvmax.mx_v4 .cd_panel_head { display: flex; align-items: baseline; gap: 10px; font-size: 16px; font-weight: 700; color: #fff; }
#dvmax.mx_v4 .cd_panel_head b { color: #f26f21; font-weight: 800; letter-spacing: -.01em; }
#dvmax.mx_v4 .cd_panel_head span { margin-left: auto; font-size: 12px; font-weight: 400; color: #8b95a1; max-width: 46%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
#dvmax.mx_v4 .cd_panel_chips { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 12px !important; }
#dvmax.mx_v4 .cd_panel_chips em { font-style: normal; font-size: 12px; padding: 4px 9px; border-radius: 6px; background: #2a3037; color: #d9dde3; font-variant-numeric: tabular-nums; }
#dvmax.mx_v4 .cd_panel_chips em:first-child { background: #163b2a; color: #5fd39a; }
#dvmax.mx_v4 .cd_panel.dfm .cd_panel_chips em:first-child { background: #3a3419; color: #f2c94c; }
#dvmax.mx_v4 .cd_panel.fold .cd_panel_chips em:first-child { background: #2a3037; color: #d9dde3; }
#dvmax.mx_v4 .cd_panel_box { margin-top: 12px; padding: 14px 16px; border-radius: 10px; background: #2a3037; }
#dvmax.mx_v4 .cd_panel_line { display: flex; align-items: center; gap: 10px; font-size: 14px; color: #fff; font-weight: 700; }
#dvmax.mx_v4 .cd_panel_line i { margin-left: auto; font-style: normal; font-size: 12px; font-weight: 700; padding: 3px 9px; border-radius: 6px; background: #163b2a; color: #5fd39a; }
#dvmax.mx_v4 .cd_panel.dfm .cd_panel_line i { background: #3a3419; color: #f2c94c; } #dvmax.mx_v4 .cd_panel.fold .cd_panel_line i { background: #f26f21; color: #fff; }
#dvmax.mx_v4 .cd_panel_box ul { list-style: none; padding: 0; margin-top: 10px !important; display: grid; gap: 5px; }
#dvmax.mx_v4 .cd_panel_box li { font-size: 13px; line-height: 1.5; color: #c9d0d8; font-variant-numeric: tabular-nums; }
#dvmax.mx_v4 .cd_panel.dfm .cd_panel_box li { color: #f2c94c; }
#dvmax.mx_v4 .cd_show_tabs { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 40px; margin: 28px 0 0; align-items: start; }
#dvmax.mx_v4 .cd_show_tabs button { display: block; align-self: start; text-align: left; padding: 0; border: 0; background: transparent; cursor: pointer; color: #8b95a1; transition: color .25s; }
#dvmax.mx_v4 .cd_show_tabs button > b { display: block; margin-top: 18px; font-size: 20px; font-weight: 700; line-height: 1.35; word-break: keep-all; }
#dvmax.mx_v4 .cd_show_tabs button > span { display: block; margin-top: 10px; font-size: 15px; line-height: 1.65; color: #8b95a1; word-break: keep-all; transition: color .25s; }
#dvmax.mx_v4 .cd_show_tabs button.on { color: #191f28; } #dvmax.mx_v4 .cd_show_tabs button.on span { color: #4e5968; }
#dvmax.mx_v4 .cd_show_tabs button:hover { color: #4e5968; }
#dvmax.mx_v4 .cd_show_tabs button:focus-visible { outline: 2px solid #191f28; outline-offset: 4px; border-radius: 4px; }
#dvmax.mx_v4 .cd_show_bar { display: block; height: 4px; border-radius: 999px; background: #e5e8eb; overflow: hidden; }
#dvmax.mx_v4 .cd_show_bar b { display: block; height: 100%; width: 0; margin: 0; border-radius: 999px; background: #191f28; animation: cdBar linear forwards; }
@keyframes cdBar { from { width: 0 } to { width: 100% } }
#dvmax.mx_v4 .cd_show_tabs button.on .cd_show_bar { background: #d7dce2; }

@media (max-width: 900px) {
  #dvmax.mx_v4 .cd_demo { grid-template-columns: 1fr; gap: 16px; }
  #dvmax.mx_v4 .cd_shots { aspect-ratio: 4 / 3; }
  #dvmax.mx_v4 .cd_show_plate { grid-template-columns: 1fr; gap: 18px; min-height: 0; padding: 24px 18px; border-radius: 18px; } #dvmax.mx_v4 .cd_show_link { display: none; }
  #dvmax.mx_v4 .cd_panel_head span { max-width: 100%; white-space: normal; margin-left: 0; flex-basis: 100%; }
  #dvmax.mx_v4 .cd_panel_head { flex-wrap: wrap; }
  #dvmax.mx_v4 .cd_show_tabs { grid-template-columns: 1fr; gap: 18px; } #dvmax.mx_v4 .cd_show_tabs button > b { margin-top: 12px; font-size: 17px; }
}
@media (prefers-reduced-motion: reduce) {
  #dvmax.mx_v4 .cd_facts li, #dvmax.mx_v4 .cd_panel { animation: none; }
  #dvmax.mx_v4 .cd_shots img { transition: none; }
}
`
