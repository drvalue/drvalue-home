/**
 * 컷온 장만의 꾸밈. 한건 장의 .hk_* 틀(창·전/후·✕✓·폭 전체 판·자동 탭)을 그대로 쓰고,
 * 여기엔 시연 창 안의 견적 칸(.ct_*)과 판 배경만 있다. maxStyles.ts 는 건드리지 않는다(병렬 작업 규칙).
 */
export const CUTON_CSS = `
#dvmax.mx_v4 .ct_demo { max-width: 980px; }
#dvmax.mx_v4 .ct_body { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.1fr); gap: 28px; }
#dvmax.mx_v4 .ct_file { display: grid; grid-template-columns: 34px 1fr; grid-template-rows: auto auto; column-gap: 12px; align-items: center; margin: 0; padding: 12px 14px; border-radius: 12px; background: #f2f4f6; }
#dvmax.mx_v4 .ct_file i { grid-row: 1 / 3; width: 34px; height: 34px; border-radius: 8px; background: #191f28; position: relative; }
#dvmax.mx_v4 .ct_file i::after { content: 'DXF'; position: absolute; inset: 0; display: grid; place-items: center; color: #fff; font-size: 10px; font-weight: 800; font-style: normal; letter-spacing: .5px; }
#dvmax.mx_v4 .ct_file b { font-size: 14px; color: #191f28; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
#dvmax.mx_v4 .ct_file span { font-size: 12px; color: #62707e; }
#dvmax.mx_v4 .ct_items { list-style: none; margin: 14px 0 0; padding: 0; display: grid; gap: 8px; }
#dvmax.mx_v4 .ct_items li { display: grid; grid-template-columns: auto 1fr auto; gap: 10px; align-items: baseline; padding: 10px 14px; border: 1px solid #e5e8eb; border-radius: 10px; font-size: 13px; }
#dvmax.mx_v4 .ct_items li b { color: #191f28; } #dvmax.mx_v4 .ct_items li span { color: #8b95a1; } #dvmax.mx_v4 .ct_items li em { font-style: normal; font-weight: 700; color: #2b5fd9; font-variant-numeric: tabular-nums; }
#dvmax.mx_v4 .ct_spec { margin: 18px 0 0; display: grid; gap: 0; }
#dvmax.mx_v4 .ct_spec > div { display: flex; justify-content: space-between; gap: 12px; padding: 9px 2px; border-bottom: 1px solid #eef1f4; font-size: 13px; opacity: .28; transition: opacity .35s; }
#dvmax.mx_v4 .ct_spec > div.on { opacity: 1; }
#dvmax.mx_v4 .ct_spec dt { margin: 0; color: #62707e; } #dvmax.mx_v4 .ct_spec dd { margin: 0; color: #191f28; font-weight: 700; font-variant-numeric: tabular-nums; }
#dvmax.mx_v4 .ct_gh { margin: 0 0 10px; font-size: 13px; font-weight: 700; color: #191f28; display: flex; justify-content: space-between; }
#dvmax.mx_v4 .ct_gh span { font-weight: 500; color: #8b95a1; }
#dvmax.mx_v4 .ct_groups { list-style: none; margin: 0; padding: 0; border: 1px solid #e5e8eb; border-radius: 12px; overflow: hidden; }
#dvmax.mx_v4 .ct_groups li { display: grid; grid-template-columns: 90px 1fr auto; gap: 10px; align-items: center; padding: 11px 14px; border-top: 1px solid #eef1f4; font-size: 13px; }
#dvmax.mx_v4 .ct_groups li:first-child { border-top: 0; }
#dvmax.mx_v4 .ct_groups li b { color: #191f28; display: flex; align-items: center; gap: 6px; }
#dvmax.mx_v4 .ct_groups li b i { font-style: normal; font-size: 10px; font-weight: 800; color: #fff; background: #2b5fd9; border-radius: 999px; padding: 2px 7px; }
#dvmax.mx_v4 .ct_groups li span { color: #62707e; } #dvmax.mx_v4 .ct_groups li em { font-style: normal; font-weight: 700; color: #191f28; font-variant-numeric: tabular-nums; }
#dvmax.mx_v4 .ct_groups li.low { background: #f3f6fd; }
#dvmax.mx_v4 .ct_total { margin: 16px 0 0; display: flex; justify-content: space-between; align-items: baseline; padding: 14px 16px; border-radius: 12px; background: #191f28; color: #fff; }
#dvmax.mx_v4 .ct_total span { font-size: 13px; color: #c9d0d8; } #dvmax.mx_v4 .ct_total b { font-size: 26px; font-weight: 800; font-variant-numeric: tabular-nums; }
/* 단계: 1 도면만 · 2 분석값 · 3 가격 · 4 끝. 스크립트 없음 = 끝 */
#dvmax.mx_v4 .ct_p1 .ct_items li, #dvmax.mx_v4 .ct_p1 .ct_spec, #dvmax.mx_v4 .ct_p1 .ct_right, #dvmax.mx_v4 .ct_p2 .ct_right { visibility: hidden; }
#dvmax.mx_v4 .ct_p1 .ct_file { animation: mxPop .5s cubic-bezier(.22,.68,.24,1) both; }
#dvmax.mx_v4 .ct_p2 .ct_items li { animation: mxPop .45s cubic-bezier(.22,.68,.24,1) both; animation-delay: calc(var(--i, 0) * .18s); }
#dvmax.mx_v4 .ct_p3 .ct_groups li { animation: mxPop .45s cubic-bezier(.22,.68,.24,1) both; animation-delay: calc(var(--i, 0) * .14s); }
#dvmax.mx_v4 .ct_p3 .ct_total { animation: mxPop .5s cubic-bezier(.22,.68,.24,1) both; animation-delay: .9s; }
/* 폭 전체 판 — 한건과 배경만 다르게(도면 격자) */
#dvmax.mx_v4 .ct_show .hk_show_plate { background: #23324a; background-image: linear-gradient(rgba(255,255,255,.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.06) 1px, transparent 1px), radial-gradient(60% 80% at 20% 30%, rgba(62,111,216,.55), transparent 70%), radial-gradient(50% 70% at 85% 80%, rgba(215,25,32,.35), transparent 70%); background-size: 28px 28px, 28px 28px, 100% 100%, 100% 100%; }
#dvmax.mx_v4 .ct_show .hk_show_plate::before { background: linear-gradient(180deg, rgba(10,16,28,.05), rgba(10,16,28,.35)); backdrop-filter: none; }
#dvmax.mx_v4 .ct_card::before { background: #2b5fd9; }
#dvmax.mx_v4 .ct_card .hk_bid_src i { background: #2b5fd9; }
#dvmax.mx_v4 .ct_rows { list-style: none; margin: 12px 0 0; padding: 0; display: grid; gap: 6px; }
#dvmax.mx_v4 .ct_rows li { display: flex; justify-content: space-between; gap: 12px; font-size: 13px; padding: 6px 0; border-bottom: 1px solid #eef1f4; }
#dvmax.mx_v4 .ct_rows li span { color: #62707e; } #dvmax.mx_v4 .ct_rows li b { color: #191f28; font-variant-numeric: tabular-nums; }
#dvmax.mx_v4 .ct_card .hk_bid_verdict { background: #f3f6fd; } #dvmax.mx_v4 .ct_card .hk_bid_verdict b { border-color: #2b5fd9; color: #2b5fd9; }
#dvmax.mx_v4 .ct_light img { object-position: 0 100%; }
#dvmax.mx_v4 .ct_show + .mx_ext { margin-top: 56px; }
@media (max-width: 900px) {
  #dvmax.mx_v4 .ct_body { grid-template-columns: 1fr; gap: 18px; }
  #dvmax.mx_v4 .ct_groups li { grid-template-columns: 72px 1fr auto; padding: 10px 12px; }
  #dvmax.mx_v4 .ct_demo .hk_ctl button { white-space: nowrap; }
}
@media (prefers-reduced-motion: reduce) {
  #dvmax.mx_v4 .ct_demo * { animation: none !important; }
}
`
