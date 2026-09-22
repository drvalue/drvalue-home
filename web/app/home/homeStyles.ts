/**
 * 홈에 새로 붙인 세 구역의 꾸밈 — 머리 그림·제품 화면 띠·수행실적 미리보기.
 *
 * page.tsx 의 `PAGE_CSS` 와 따로 둔다. 그쪽은 **원본 <style> 블록을 옮긴
 * 것**이라 원본과 대조할 때 그대로 있어야 하고, 이 파일은 우리가 새로 쓴
 * 것이다. 섞으면 어디까지가 원본인지 아무도 모르게 된다.
 *
 * 규칙은 전부 `.dv_hero` 로 감싼다.
 * 운영 css/style.css 는 층(layer)이 없어서 감싸지 않으면 다른 장까지 따라간다.
 */
export const HOME_ADD_CSS = `
/* 스크롤 등장 규칙은 styles/motion.css 로 갔다 — 전 화면 공통이라서. */

/* ── 머리 그림 ──────────────────────────────────────────────────
   원본 홈에는 머리 그림이 있다가 주석으로 꺼져 있었다(swiper 두 장).
   슬라이드는 되살리지 않는다 — 두 장을 번갈아 보여 주는 것은 읽는 사람의
   눈을 뺏기만 하고 말하는 것이 없다. 한 장을 크게 두고 천천히 당긴다. */
.dv_hero {
  position: relative; min-height: 640px; height: 86vh; max-height: 820px;
  display: flex; align-items: center; overflow: hidden; background: #0b0f14;
}
.dv_hero_bg {
  position: absolute; inset: 0;
  background: url('/opt/main_bg_01.jpg') no-repeat center center / cover;
  transform: scale(1.08);
  animation: dvHeroZoom 16s cubic-bezier(.2,.5,.2,1) forwards;
}
@keyframes dvHeroZoom { to { transform: scale(1); } }
/* 왼쪽이 글자리다. 평평한 검정 막 대신 왼쪽만 짙게 깔아 오른쪽 사진을 살린다. */
.dv_hero::after {
  content: ''; position: absolute; inset: 0; z-index: 1;
  background:
    linear-gradient(96deg, rgba(8,11,16,.92) 0%, rgba(8,11,16,.78) 36%, rgba(8,11,16,.34) 70%, rgba(8,11,16,.2) 100%),
    linear-gradient(to top, rgba(8,11,16,.55) 0%, rgba(8,11,16,0) 32%);
}
/* .dv_hero 가 flex 라서 .t_inner 가 flex 자식이 된다 — 폭을 안 주면 글자
   폭으로 줄어들고 margin:0 auto 가 그 줄어든 덩어리를 가운데로 보낸다
   (실측: 왼쪽 여백이 100px 이어야 하는데 410px 이 됐다).
   이 파일은 템플릿 문자열이다. 안에 역따옴표를 쓰면 문자열이 끊긴다. */
.dv_hero .t_inner { position: relative; z-index: 2; width: 100%; padding-top: 80px; }
.dv_hero_kicker {
  display: inline-flex; align-items: center; gap: 9px;
  font-size: 13px; font-weight: 800; letter-spacing: .16em; color: #ff8a8e;
  margin-bottom: 22px;
}
.dv_hero_kicker::before { content: ''; width: 26px; height: 2px; background: #d71920; }
.dv_hero h1 {
  font-size: 60px; line-height: 1.16; font-weight: 800; letter-spacing: -2px;
  color: #fff; margin: 0 0 22px;
}
.dv_hero h1 span { display: inline-block; }
.dv_hero h1 strong { font-weight: 800; color: #fff; }
.dv_hero p {
  font-size: 19.5px; line-height: 1.62; color: rgba(255,255,255,.82);
  max-width: 620px; margin: 0 0 34px; word-break: keep-all;
}
.dv_hero_btns { display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 30px; }
.dv_hero_btns > * {
  appearance: none; font-family: inherit; cursor: pointer; text-decoration: none;
  display: inline-flex; align-items: center; gap: 9px;
  height: 56px; padding: 0 30px; border-radius: 100px;
  font-size: 16.5px; font-weight: 700; border: 1px solid transparent;
  transition: background-color .2s ease, color .2s ease, border-color .2s ease, transform .2s ease;
}
.dv_hero_prim { background: #d71920; color: #fff; }
.dv_hero_prim:hover { background: #b9141a; transform: translateY(-2px); }
.dv_hero_sec { background: rgba(255,255,255,.08); color: #fff; border-color: rgba(255,255,255,.34); }
.dv_hero_sec:hover { background: rgba(255,255,255,.16); transform: translateY(-2px); }
.dv_hero_btns i { font-style: normal; transition: transform .2s ease; }
.dv_hero_btns > *:hover i { transform: translateX(3px); }
/* 숫자는 아래 「검증된 구축 역량」 칸에서 세는 것과 같은 것이다. */
.dv_hero_proof { display: flex; flex-wrap: wrap; gap: 10px 26px; }
.dv_hero_proof span {
  display: inline-flex; align-items: center; gap: 8px;
  font-size: 14.5px; font-weight: 600; color: rgba(255,255,255,.74);
}
.dv_hero_proof span::before {
  content: ''; width: 5px; height: 5px; border-radius: 50%; background: #d71920;
}
.dv_hero_proof b { color: #fff; font-weight: 800; }
.dv_hero_cue {
  position: absolute; left: 50%; bottom: 26px; z-index: 2; transform: translateX(-50%);
  display: flex; flex-direction: column; align-items: center; gap: 8px;
  font-size: 11.5px; font-weight: 700; letter-spacing: .14em; color: rgba(255,255,255,.55);
}
.dv_hero_cue i {
  display: block; width: 1px; height: 34px;
  background: linear-gradient(to bottom, rgba(255,255,255,.7), rgba(255,255,255,0));
  animation: dvCue 1.9s ease-in-out infinite;
}
@keyframes dvCue { 0%,100% { transform: translateY(-4px); opacity: .45; } 50% { transform: translateY(4px); opacity: 1; } }

/* 첫 화면 글자는 스크롤을 기다리지 않는다 — 뜨자마자 차례로 올라온다. */
.dv_hero .dv_hero_rise { animation: dvHeroRise .85s cubic-bezier(.22,.68,.24,1) both; }
.dv_hero .dv_hero_rise:nth-of-type(1) { animation-delay: .05s; }
@keyframes dvHeroRise { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: none; } }
.dv_hero h1 span:nth-child(1) { animation: dvHeroRise .9s cubic-bezier(.22,.68,.24,1) .12s both; }
.dv_hero h1 span:nth-child(2) { animation: dvHeroRise .9s cubic-bezier(.22,.68,.24,1) .24s both; }
.dv_hero p { animation: dvHeroRise .9s cubic-bezier(.22,.68,.24,1) .38s both; }
.dv_hero_btns { animation: dvHeroRise .9s cubic-bezier(.22,.68,.24,1) .48s both; }
.dv_hero_proof { animation: dvHeroRise .9s cubic-bezier(.22,.68,.24,1) .58s both; }
.dv_hero_cue { animation: dvHeroRise .9s ease 1.1s both; }

@media (max-width: 1024px) {
  .dv_hero { min-height: 560px; height: auto; padding: 130px 0 90px; }
  .dv_hero h1 { font-size: 42px; letter-spacing: -1.4px; }
  .dv_hero p { font-size: 17px; }
  .dv_hero_cue { display: none; }
}
@media (max-width: 560px) {
  .dv_hero { padding: 116px 0 74px; min-height: 0; }
  .dv_hero h1 { font-size: 33px; letter-spacing: -1px; }
  .dv_hero p { font-size: 15.5px; }
  .dv_hero_btns > * { height: 50px; padding: 0 22px; font-size: 15px; flex: 1 1 auto; justify-content: center; }
}

@media (prefers-reduced-motion: reduce) {
  .dv_hero_bg, .dv_hero_cue i, .dv_hero .dv_hero_rise,
  .dv_hero h1 span, .dv_hero p, .dv_hero_btns, .dv_hero_proof, .dv_hero_cue { animation: none; }
  .dv_hero_bg { transform: none; }
  .dv_hero_btns > * { transition: none; }
  .dv_hero_btns > *:hover { transform: none; }
}
`

/**
 * 메인 팝업(HomePopups). 팝업이 있을 때만 싣는다 — 없는 날의 메인 HTML 은 팝업 전과 같다.
 * 층: 머리글(10001~10002) 위, 문의 창(999999~) 아래.
 * 이 문자열도 템플릿 문자열이다 — 안에 역따옴표를 넣지 않는다.
 */
export const HOME_POPUP_CSS = `
.dvpop_back {
  position: fixed; inset: 0; z-index: 100000; background: rgba(8,11,16,.55);
  display: flex; align-items: center; justify-content: center; padding: 16px;
}
.dvpop {
  max-width: 100%; max-height: calc(100vh - 32px); max-height: calc(100dvh - 32px); overflow: auto;
  background: #fff; border-radius: 16px; box-shadow: 0 24px 60px rgba(0,0,0,.35);
  display: flex; flex-direction: column; text-align: left;
}
@media (prefers-reduced-motion: no-preference) {
  .dvpop { animation: dvpopIn .22s ease both; }
}
@keyframes dvpopIn { from { opacity: 0; transform: translateY(12px) scale(.98); } to { opacity: 1; transform: none; } }
.dvpop .dvpop_img { display: block; }
.dvpop .dvpop_img img { display: block; width: 100%; height: auto; }
.dvpop .dvpop_text { padding: 22px 22px 4px; }
.dvpop .dvpop_text h2 {
  margin: 0 0 8px; font-size: 20px; line-height: 1.4; font-weight: 800; color: #191f28;
  letter-spacing: -.4px; word-break: keep-all;
}
.dvpop .dvpop_body { font-size: 15px; line-height: 1.65; color: #4e5968; word-break: keep-all; overflow-wrap: anywhere; }
.dvpop .dvpop_body p { margin: 0 0 8px; }
.dvpop .dvpop_body a { color: #d71920; text-decoration: underline; }
.dvpop .dvpop_btns { display: flex; flex-direction: column; gap: 8px; padding: 16px 22px 14px; }
.dvpop .dvpop_go {
  display: flex; align-items: center; justify-content: center; min-height: 48px; padding: 0 18px;
  background: #d71920; color: #fff; font-weight: 800; font-size: 16px; border-radius: 10px; text-decoration: none;
}
.dvpop .dvpop_go:hover { background: #ef2630; }
.dvpop .dvpop_close { display: flex; align-items: center; gap: 8px; }
.dvpop .dvpop_close button {
  appearance: none; background: none; border: 0; font: inherit; font-size: 14px; color: #6b7684;
  padding: 10px 4px; min-height: 44px; cursor: pointer;
}
.dvpop .dvpop_close button:last-child { margin-left: auto; color: #191f28; font-weight: 700; }
.dvpop .dvpop_go:focus-visible, .dvpop .dvpop_close button:focus-visible, .dvpop .dvpop_img:focus-visible {
  outline: 3px solid #3d5a80; outline-offset: 2px;
}
`
