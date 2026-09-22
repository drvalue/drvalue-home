/**
 * 오토폼 장만의 꾸밈. 공용 `.hk_*`(시연 창·전/후·판·탭)은 maxStyles.ts 것을 그대로 쓰고,
 * 여기에는 이 장에만 있는 조각 — 단계 단추(af_steps)·화면 무대(af_stage)·라벨(af_labels)·
 * 양식 카드(af_form) — 만 둔다. page.tsx 가 PAGE_CSS 다음에 두 번째 <style> 로 넣는다.
 */
export const AUTOFORM_CSS = `
#dvmax.mx_v4 .af_demo { max-width: 1000px; margin: 0 auto; }
#dvmax.mx_v4 .af_steps { list-style: none; margin: 0 0 16px; padding: 0; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; counter-reset: none; }
#dvmax.mx_v4 .af_steps button { position: relative; width: 100%; min-height: 44px; display: flex; gap: 12px; align-items: flex-start; text-align: left; padding: 14px 16px 16px; border: 0; border-radius: 14px; background: rgba(255,255,255,.55); color: #8b95a1; cursor: pointer; overflow: hidden; transition: background .25s, color .25s; }
#dvmax.mx_v4 .af_steps button i { flex: none; width: 26px; height: 26px; border-radius: 50%; display: grid; place-items: center; font-style: normal; font-size: 13px; font-weight: 800; background: #e5e8eb; color: #8b95a1; transition: background .25s, color .25s; }
#dvmax.mx_v4 .af_steps button b { display: block; font-size: 15px; font-weight: 700; line-height: 1.35; }
#dvmax.mx_v4 .af_steps button small { display: block; margin-top: 4px; font-size: 12.5px; line-height: 1.5; color: #8b95a1; word-break: keep-all; }
#dvmax.mx_v4 .af_steps button.on { background: #fff; color: #191f28; box-shadow: 0 10px 30px rgba(21,34,56,.12); }
#dvmax.mx_v4 .af_steps button.on i { background: #191f28; color: #fff; }
#dvmax.mx_v4 .af_steps button.done i { background: #1a9e5c; color: #fff; }
#dvmax.mx_v4 .af_steps button:hover { color: #4e5968; }
#dvmax.mx_v4 .af_steps button:focus-visible { outline: 2px solid #191f28; outline-offset: 2px; }
#dvmax.mx_v4 .af_bar { position: absolute; left: 0; right: 0; bottom: 0; height: 3px; background: #e5e8eb; }
#dvmax.mx_v4 .af_bar b { display: block; height: 100%; width: 0; margin: 0; background: #191f28; animation: hkBar linear forwards; }
#dvmax.mx_v4 .af_win { background: #f2f4f6; }
#dvmax.mx_v4 .af_stage { position: relative; height: 480px; overflow: hidden; }
#dvmax.mx_v4 .af_stage img { display: block; width: 100%; height: 100%; object-fit: cover; animation: hkSwap .45s cubic-bezier(.2,.75,.2,1); }
#dvmax.mx_v4 .af_labels { list-style: none; margin: 0; padding: 0; position: absolute; left: 22px; bottom: 22px; right: 22px; display: flex; flex-wrap: wrap; gap: 8px; }
#dvmax.mx_v4 .af_labels li { padding: 8px 12px; border-radius: 10px; background: rgba(25,31,40,.92); color: #fff; font-size: 13px; font-weight: 600; line-height: 1.3; box-shadow: 0 8px 24px rgba(0,0,0,.18); animation: mxPop .5s cubic-bezier(.22,.68,.24,1) both; animation-delay: calc(var(--i, 0) * .28s + .35s); word-break: keep-all; }
#dvmax.mx_v4 .af_labels li:first-child { background: #d71920; }
/* 양식 카드 — 등록 화면의 「분석된 양식」 한 줄 + 매핑 화면의 칸 대응 */
#dvmax.mx_v4 .af_plate { grid-template-columns: 300px 72px minmax(0, 560px); }
#dvmax.mx_v4 .af_dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #1a9e5c; margin-right: 6px; vertical-align: 1px; }
#dvmax.mx_v4 .af_form { padding: 22px 24px; border-radius: 14px; background: #fff; box-shadow: 0 24px 60px rgba(0,0,0,.22); animation: hkSwap .38s cubic-bezier(.2,.75,.2,1); }
#dvmax.mx_v4 .af_form p { margin: 0; }
#dvmax.mx_v4 .af_form_head { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
#dvmax.mx_v4 .af_form_head b { font-size: 17px; font-weight: 700; color: #191f28; word-break: break-all; }
#dvmax.mx_v4 .af_form_head em { font-style: normal; font-size: 11px; font-weight: 800; color: #3e6fd8; letter-spacing: .04em; }
#dvmax.mx_v4 .af_form_head span { margin-left: auto; font-size: 12px; font-weight: 700; color: #3e6fd8; background: #e8f0fb; border-radius: 6px; padding: 3px 8px; }
#dvmax.mx_v4 .af_form_meta { margin-top: 6px !important; font-size: 13.5px; color: #62707e; }
#dvmax.mx_v4 .af_form_note { margin-top: 16px !important; padding: 12px 14px; border-radius: 10px; background: #f7f8fa; font-size: 14px; color: #4e5968; border: 1px dashed #d7dce2; }
#dvmax.mx_v4 .af_pairs { list-style: none; margin: 16px 0 0; padding: 0; display: grid; gap: 6px; }
#dvmax.mx_v4 .af_pairs li { display: flex; align-items: center; gap: 10px; padding: 9px 12px; border-radius: 8px; background: #fbf5ee; font-size: 14px; }
#dvmax.mx_v4 .af_pairs li b { color: #191f28; font-weight: 700; } #dvmax.mx_v4 .af_pairs li i { color: #b3141a; font-style: normal; font-weight: 800; }
#dvmax.mx_v4 .af_pairs li code { margin-left: auto; font-family: ui-monospace, Menlo, monospace; font-size: 12.5px; color: #1f3f7a; background: #e8f0fb; border-radius: 4px; padding: 2px 8px; }
/* 전/후 오른쪽 — 매핑 화면의 원본·대응 부분을 확대 */
#dvmax.mx_v4 .af_light img { object-position: 60% 30%; }
@media (max-width: 900px) {
  #dvmax.mx_v4 .af_steps { grid-template-columns: 1fr; gap: 6px; }
  #dvmax.mx_v4 .af_steps button small { display: none; } #dvmax.mx_v4 .af_steps button.on small { display: block; }
  /* 좁은 화면: 화면을 자르지 않고 통째로, 라벨은 그 아래에 */
  #dvmax.mx_v4 .af_stage { height: auto; }
  #dvmax.mx_v4 .af_stage img { height: auto; object-fit: initial; }
  #dvmax.mx_v4 .af_labels { position: static; padding: 10px; gap: 6px; background: #f2f4f6; } #dvmax.mx_v4 .af_labels li { font-size: 11.5px; padding: 6px 9px; }
  #dvmax.mx_v4 .af_plate { grid-template-columns: 1fr; }
}
@media (prefers-reduced-motion: reduce) {
  #dvmax.mx_v4 .af_labels li, #dvmax.mx_v4 .af_stage img, #dvmax.mx_v4 .af_form { animation: none; }
}
`
