/*
 * 게시판 장 전용 CSS. 이름이 PAGE_CSS 여야 check-src 가 역따옴표를 본다.
 * 목록·기사 꼴(.dv_news · .dv_art · .dv_search · .dv_state)은 public/css/style.css 에 있다.
 * 쪽 넘김은 예전에 스크립트 단추(button)였다. 이제 서버가 그리는 링크(a)라 같은 꼴을 a 에도 준다.
 */
export const PAGE_CSS = `
#dvmax .sp_board { padding-bottom: 96px; }
.dv_pager a, .dv_pager span { min-width: 38px; height: 38px; display: inline-flex; align-items: center; justify-content: center; padding: 0 8px; border: 1px solid #e5e8eb; background: #fff; border-radius: 10px; font-family: "Pretendard"; color: #4e5968; text-decoration: none; }
.dv_pager a.on { background: #d71920; color: #fff; border-color: #d71920; font-weight: 700; }
.dv_pager span[aria-disabled="true"] { opacity: 0.4; }
.dv_search a.dv_btn { display: inline-flex; align-items: center; text-decoration: none; }
.dv_art_thumb { max-width: 100%; height: auto; border-radius: 12px; margin-bottom: 24px; }
.dv_art_files { list-style: none; margin-top: 24px; border-top: 1px solid #eef0f3; padding-top: 18px; display: flex; flex-wrap: wrap; gap: 8px 16px; }
.dv_art_files a { color: #d71920; text-decoration: none; overflow-wrap: anywhere; }
.dv_art_files a:hover { text-decoration: underline; }
.dv_art_nav { display: grid; gap: 8px; margin-top: 28px; border-top: 1px solid #eef0f3; padding-top: 18px; }
.dv_art_nav a { display: flex; gap: 12px; color: #333d4b; text-decoration: none; font-size: 15px; min-height: 44px; align-items: center; min-width: 0; }
.dv_art_nav a:hover { color: #191f28; text-decoration: underline; text-underline-offset: 4px; }
.dv_art_nav b { flex: none; width: 4.5em; color: #8b95a1; font-weight: 600; }
.dv_art_nav span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
`
