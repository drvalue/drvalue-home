/**
 * everyrag 장 전용 CSS. 창 틀(hk_win · hk_bar · hk_body · hk_ctl)과 전/후(hk_pair)는 maxStyles 것을 그대로 쓴다.
 * 이 문자열 안에 역따옴표를 넣지 않는다(check-src.py).
 */
export const EVERYRAG_CSS = `
#dvmax.mx_v4 .er_demo .hk_body { min-height: 0; }
#dvmax.mx_v4 .er_chat { display: grid; gap: 14px; margin: 0; padding: 0; list-style: none; }
#dvmax.mx_v4 .er_chat li { margin: 0; font-size: 15px; line-height: 1.6; word-break: keep-all; }
#dvmax.mx_v4 .er_q { justify-self: end; max-width: 80%; padding: 12px 16px; background: #111; color: #fff; border-radius: 12px 12px 4px 12px; }
#dvmax.mx_v4 .er_a { justify-self: start; max-width: 88%; padding: 14px 16px; background: #fff; color: #191f28; border: 1px solid #e5e8eb; border-radius: 12px 12px 12px 4px; }
#dvmax.mx_v4 .er_a sup { margin-left: 2px; color: #1f3f7a; font-weight: 700; }
#dvmax.mx_v4 .er_cite { display: block; margin-top: 10px; padding: 10px 12px; background: #e8f0fb; border-left: 3px solid #3e6fd8; border-radius: 0 8px 8px 0; font-size: 13px; color: #1f3f7a; }
#dvmax.mx_v4 .er_cite b { display: block; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 12.5px; }
#dvmax.mx_v4 .er_out { display: inline-block; margin-right: 8px; padding: 2px 8px; border-radius: 6px; background: #fff1dc; color: #8a5200; font-size: 12.5px; font-weight: 700; }
#dvmax.mx_v4 .er_a.none { color: #4e5968; }
/* 재생 중에만 스크립트가 숨긴다 — 스크립트가 없으면 전부 보인다 */
#dvmax.mx_v4 .er_chat li.er_hide { display: none; }
#dvmax.mx_v4 .er_chat li.er_in { animation: mxPop .5s cubic-bezier(.22,.68,.24,1) both; }
#dvmax.mx_v4 .er_code { margin: 0 0 8px; padding: 24px 28px; background: #1b2433; color: #e6edf5; border-radius: 16px; overflow-x: auto; font: 13.5px/1.75 ui-monospace, SFMono-Regular, Menlo, monospace; white-space: pre; }
#dvmax.mx_v4 .er_code .c { color: #8fa3bd; }
#dvmax.mx_v4 .er_code:focus-visible { outline: 2px solid #191f28; outline-offset: 3px; }
#dvmax.mx_v4 .er_code_note { margin: 0; font-size: 13px; color: #62707e; }
@media (max-width: 720px) {
  #dvmax.mx_v4 .er_q, #dvmax.mx_v4 .er_a { max-width: 94%; }
  #dvmax.mx_v4 .er_code { padding: 18px 16px; font-size: 12.5px; }
}
@media (prefers-reduced-motion: reduce) {
  #dvmax.mx_v4 .er_chat li.er_in { animation: none; }
}
`
