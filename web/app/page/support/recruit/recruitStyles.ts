/**
 * 채용 장(목록·상세) 전용 CSS. 템플릿 문자열이다 — 안에 역따옴표를 넣지 않는다.
 * 이름이 PAGE_CSS 여야 check-src 가 본다.
 */
export const PAGE_CSS = `
#dvmax .rc_list { list-style: none; margin: 0; padding: 0; display: grid; gap: 12px; }
#dvmax .rc_item a {
  display: grid; gap: 6px; padding: 20px 22px; border: 1px solid #e5e8eb; border-radius: 12px;
  background: #fff; color: #191f28; text-decoration: none; min-width: 0;
  transition: border-color .16s, box-shadow .16s; }
#dvmax .rc_item a:hover { border-color: #cfdfe8; box-shadow: 0 6px 18px rgba(0,0,0,.05); }
#dvmax .rc_item a:focus-visible { outline: 3px solid #d71920; outline-offset: 2px; }
#dvmax .rc_top { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
#dvmax .rc_tag {
  display: inline-block; font-size: 12px; font-weight: 700; padding: 2px 8px; border-radius: 4px;
  color: #3d5a80; background: #eef3f8; border: 1px solid #cfdfe8; line-height: 1.5; }
#dvmax .rc_tag.is-open { color: #1f7a4d; background: #e6f4ec; border-color: #bfe3cd; }
#dvmax .rc_tag.is-closed { color: #8b95a1; background: #f2f4f6; border-color: #e5e8eb; }
#dvmax .rc_title { margin: 0; font-size: 18px; font-weight: 700; line-height: 1.45; word-break: keep-all; overflow-wrap: anywhere; }
#dvmax .rc_sum { margin: 0; color: #4e5968; font-size: 14.5px; line-height: 1.6; }
#dvmax .rc_due { font-size: 13px; color: #8b95a1; font-variant-numeric: tabular-nums; }
#dvmax .rc_state { padding: 40px 20px; text-align: center; color: #4e5968; border: 1px dashed #d8dee4; border-radius: 12px; }
#dvmax .rc_state a { color: #3d5a80; font-weight: 700; }

#dvmax .rc_art { max-width: 820px; }
#dvmax .rc_art h2 { margin: 8px 0 10px; font-size: 26px; line-height: 1.35; word-break: keep-all; overflow-wrap: anywhere; }
#dvmax .rc_body { margin-top: 24px; font-size: 16px; line-height: 1.8; color: #333d4b; overflow-wrap: anywhere; }
#dvmax .rc_body img { max-width: 100%; height: auto; }
#dvmax .rc_body h2 { font-size: 21px; margin: 28px 0 10px; }
#dvmax .rc_body h3 { font-size: 18px; margin: 22px 0 8px; }
#dvmax .rc_body ul, #dvmax .rc_body ol { padding-left: 22px; }
#dvmax .rc_files { margin: 28px 0 0; padding: 16px 18px; list-style: none; border: 1px solid #e5e8eb; border-radius: 10px; display: grid; gap: 6px; }
#dvmax .rc_files a { color: #3d5a80; font-weight: 600; overflow-wrap: anywhere; }
#dvmax .rc_back { display: inline-block; margin-top: 32px; color: #3d5a80; font-weight: 700; text-decoration: none; }
#dvmax .rc_back:focus-visible { outline: 3px solid #d71920; outline-offset: 2px; }
@media (prefers-reduced-motion: reduce) { #dvmax .rc_item a { transition: none; } }
`
