/**
 * M.AX 계열 화면이 같이 쓰는 CSS.
 *
 * 왜 파일로 뺐나: 업종별 화면을 각자 주소를 가진 페이지로 쪼개면서 같은
 * `mx_` 규칙을 여러 장이 쓰게 됐다. 장마다 복사하면 한 곳을 고칠 때 나머지가
 * 조용히 어긋난다.
 *
 * 파일로 빼도 `<style>` 로 심는 방식은 그대로다. 원본의 <style> 블록과 같은
 * 자리에서 같은 순서로 들어가야 우선순위가 안 바뀐다.
 */
import { PATTERN_CSS, PATTERN_CSS2, PATTERN_CSS3 } from './patternStyles'

export const PAGE_CSS = `
/* 헤더(80px)만큼 밀어 두지 않는다. 히어로가 헤더 **밑으로** 들어가야
   맨 위에서 헤더가 투명해졌을 때 사진이 이어져 보인다. 그 자리는 히어로가
   자기 안쪽 여백으로 비운다. 밀어 두면 투명해진 자리에 흰 여백만 남는다. */
#dvmax { color: #191f28; font-family: 'Pretendard', sans-serif; background: #f7f9fa; }
#dvmax .mx_wrap { max-width: 1280px; margin: 0 auto; padding: 0 20px; width: 100%; }

/* 히어로 — 다른 하위 페이지와 같은 골조(높이 320, 어둡게 깐 사진)를 쓴다.
   이 페이지만 다른 모양이면 메뉴를 옮겨 다닐 때 다른 사이트처럼 느껴진다.

   그림은 운영 main_bg_02 사진을 줄인 것이다. 원본은 8000x4114, 9.7MB 다 —
   320px 높이 띠에 쓰려고 9.7MB 를 받게 할 수는 없다. 운영 파일을 고치면 PHP
   쪽도 같이 바뀌므로 건드리지 않고 public/opt/ 에 줄인 것을 따로 뒀다
   (1920px, 295KB, 32배 작다).

   이 블록은 템플릿 문자열 안이다 — 주석에 백틱을 쓰면 문자열이 거기서
   끊겨서 페이지가 통째로 문법 오류가 된다(실제로 그렇게 깨뜨렸다). */
#dvmax .mx_hero { position: relative; min-height: 400px; padding-top: 80px; display: flex; align-items: center;
  background: url('/opt/main_bg_02.jpg') no-repeat center center / cover; background-color: #152238; }
#dvmax .mx_hero::before { content: ''; position: absolute; inset: 0; z-index: 1;
  background: linear-gradient(100deg, rgba(21,34,56,.88) 0%, rgba(21,34,56,.72) 55%, rgba(21,34,56,.55) 100%); }
/* 머리말 아래 얇은 붉은 선 — 메뉴의 현재 표시(빨강)와 같은 색. */
#dvmax .mx_hero::after { content: ''; position: absolute; left: 0; right: 0; bottom: 0; height: 3px; z-index: 2;
  background: linear-gradient(90deg, #d71920 0 18%, transparent 18%); }
#dvmax .mx_hero .mx_wrap { position: relative; z-index: 2; color: #fff; }
#dvmax .mx_kicker { font-size: 16px; font-weight: 800; color: #ff5b66; margin-bottom: 10px; letter-spacing: .02em; }
#dvmax .mx_hero h2 { font-size: 42px; font-weight: 800; line-height: 1.25; letter-spacing: -1.5px; margin: 0; color: #fff; }
#dvmax .mx_hero h2 b { color: #a9c4dd; font-weight: 800; }
#dvmax .mx_hero p { margin-top: 16px; font-size: 17px; line-height: 1.75; color: #d6e2ee;
  max-width: 820px; word-break: keep-all; }

#dvmax .mx_sec { padding: 90px 0 0; }
/* 「어디부터 보시겠습니까」 칸. 위는 앞 구역과 가깝게, 아래는 띄운다 —
   안 띄우면 칸이 바로 아래 어두운 문의 띠에 붙어 잘린 것처럼 보였다
   (사용자 지적). :last-of-type 은 여기서 안 통한다. 그 뒤의 문의 띠도
   <section> 이라 그쪽이 「마지막」 이다. */
#dvmax .mx_sec_nav { padding: 56px 0 104px; }
#dvmax .mx_sec_title { font-size: 32px; font-weight: 800; letter-spacing: -1px; margin-bottom: 10px; }
#dvmax .mx_sec_desc { font-size: 17px; color: #4e5968; margin-bottom: 34px; word-break: keep-all; }

/* KPI 띠 */
#dvmax .mx_kpi { display: flex; align-items: stretch; background: #fff; border: 1px solid #e5eaef;
  border-radius: 16px; overflow: hidden; margin-bottom: 34px; }
#dvmax .mx_kpi_tag { background: #3d5a80; color: #fff; display: flex; align-items: center; justify-content: center;
  font-weight: 800; font-size: 18px; padding: 0 38px; flex: 0 0 auto; letter-spacing: .06em; }
#dvmax .mx_kpi_items { display: grid; grid-template-columns: repeat(3, 1fr); flex: 1; }
#dvmax .mx_kpi_items > div { padding: 22px 26px; border-left: 1px solid #e5eaef; }
#dvmax .mx_kpi_items h3 { font-size: 16px; font-weight: 700; margin: 0 0 4px; }
#dvmax .mx_kpi_items p { font-size: 15px; color: #6b7684; line-height: 1.55; margin: 0; }

/* MES 흐름. 6칸이라 좁은 화면에서는 가로로 민다 — 줄바꿈하면 순서가 흐름으로 안 읽힌다. */
#dvmax .mx_flow_scroll { overflow-x: auto; padding-bottom: 10px; }
/* 칸 너비를 186px 로 박아 두어 그림이 1,196px 을 요구했다. 옆 차례표가
   생기면서 본문 칸이 976px 로 줄어 가로 스크롤이 생겼다(사용자 지적).
   칸은 남는 만큼 나눠 쓰게 두고, 더는 못 줄이는 선만 min-width 로 잡는다.
   940px 이면 옆 차례표가 있는 1025px 이상에서 스크롤이 안 난다. */
#dvmax .mx_flow { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 14px; min-width: 940px; }
#dvmax .mx_stage { display: flex; flex-direction: column; gap: 10px; }
#dvmax .mx_note { font-size: 13.5px; color: #4e5968; line-height: 1.55; list-style: none; padding: 0; margin: 0; }
#dvmax .mx_stage > .mx_note:first-child { min-height: 118px; }
#dvmax .mx_stage > .mx_note_empty:first-child { min-height: 118px; }
#dvmax .mx_note li { list-style: none; position: relative; padding-left: 10px; margin-bottom: 2px; }
#dvmax .mx_note li::before { content: ''; position: absolute; left: 0; top: 8px; width: 4px; height: 4px;
  border-radius: 50%; background: #3d5a80; }
#dvmax .mx_note li.is-ai { color: #c2410c; }
#dvmax .mx_note li.is-ai::before { background: #e06a00; }
#dvmax .mx_note li.is-ai em { font-style: normal; display: inline-block; background: #e06a00; color: #fff;
  font-size: 10.5px; font-weight: 800; border-radius: 3px; padding: 0 5px; line-height: 16px;
  margin-right: 5px; vertical-align: 1px; }
#dvmax .mx_pbox { position: relative; background: #3d5a80; color: #fff; border-radius: 8px; text-align: center;
  font-weight: 800; font-size: 16px; padding: 14px 6px; box-shadow: 0 2px 8px rgba(21,34,56,.18);
  width: 100%; border: 0; font-family: inherit; }
/* 주공정은 누를 수 있다. 보조공정(is-sub)은 div 라 그대로 둔다. */
#dvmax button.mx_pbox { cursor: pointer; transition: transform .16s, box-shadow .16s, background .16s; }
#dvmax button.mx_pbox:hover { background: #33507a; transform: translateY(-2px); box-shadow: 0 8px 18px rgba(21,34,56,.28); }
#dvmax button.mx_pbox:focus-visible { outline: 3px solid #d71920; outline-offset: 3px; }

/* 한 단계를 고르면 나머지는 흐려진다. 고르기 전에는 전부 또렷하다. */
#dvmax .mx_flow.is-picked .mx_stage { opacity: .28; filter: saturate(.4); transition: opacity .24s, filter .24s; }
#dvmax .mx_flow.is-picked .mx_stage.is-on { opacity: 1; filter: none; }
#dvmax .mx_stage.is-on button.mx_pbox { background: #d71920; box-shadow: 0 10px 22px rgba(215,25,32,.34); }
#dvmax .mx_stage.is-on .mx_arrow { border-left-color: #d71920; }

/* 흐름 위의 단추줄 */
#dvmax .mx_flow_bar { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; margin-bottom: 18px; }
#dvmax .mx_aionly { appearance: none; font-family: inherit; cursor: pointer; font-size: 14.5px; font-weight: 700;
  border: 1.5px solid #e06a00; background: #fff; color: #c2410c; padding: 9px 16px; border-radius: 100px;
  display: inline-flex; align-items: center; gap: 8px; transition: background .16s, color .16s; }
#dvmax .mx_aionly.is-on { background: #e06a00; color: #fff; }
#dvmax .mx_aionly:focus-visible { outline: 3px solid #d71920; outline-offset: 2px; }
#dvmax .mx_aicount { font-size: 12px; font-weight: 800; background: rgba(224,106,0,.14); border-radius: 100px; padding: 1px 8px; }
#dvmax .mx_aionly.is-on .mx_aicount { background: rgba(255,255,255,.24); }
#dvmax .mx_clear { appearance: none; font-family: inherit; cursor: pointer; font-size: 14.5px; font-weight: 700;
  border: 1px solid #cfd8e0; background: #fff; color: #4e5968; padding: 9px 16px; border-radius: 100px; }
#dvmax .mx_clear:hover { border-color: #191f28; color: #191f28; }
#dvmax .mx_flow_hint { margin: 0; font-size: 13.5px; color: #8b97a4; }
/* AI 만 볼 때 빈 칸이 생겨도 칸 높이가 무너지지 않게 자리를 지킨다. */
#dvmax .mx_note_empty { min-height: 0; }
#dvmax .mx_pbox.is-sub { background: #fff; color: #191f28; border: 1.5px solid #3d5a80; font-weight: 700; box-shadow: none; }
#dvmax .mx_arrow { position: absolute; right: -14px; top: 50%; transform: translateY(-50%); width: 0; height: 0;
  border-top: 7px solid transparent; border-bottom: 7px solid transparent; border-left: 9px solid #3d5a80; }
#dvmax .mx_vlink { align-self: center; width: 2px; height: 12px; background: #3d5a80; opacity: .55; }

/* 업종 탭 */
#dvmax .mx_tabsec { padding: 0 0 100px; }
#dvmax .mx_tabs { display: flex; gap: 10px; border-bottom: 2px solid #191f28; flex-wrap: wrap; }
#dvmax .mx_tabbtn { appearance: none; border: 1px solid #e5eaef; border-bottom: none; background: #fff;
  padding: 15px 32px; font-size: 16px; font-weight: 700; color: #6b7684; cursor: pointer;
  border-radius: 10px 10px 0 0; font-family: inherit; transition: background .16s, color .16s, transform .16s; }
#dvmax .mx_tabbtn:hover { background: #eef3f8; transform: translateY(-2px); }
#dvmax .mx_tabbtn.is-on { background: #191f28; color: #fff; border-color: #191f28; transform: none; }
#dvmax .mx_tabbtn:focus-visible { outline: 3px solid #d71920; outline-offset: 2px; }
#dvmax .mx_panel { background: #fff; border: 1px solid #e5eaef; border-top: none; padding: 48px 44px 60px;
  border-radius: 0 0 16px 16px; animation: mxfade .34s ease both; }
/* 끝 상태(to)에 transform 을 적지 않는다. fill-mode: both 로 끝난 뒤에도 그 값이
   남는데, transform 이 남아 있으면(단위행렬이라도) 그 요소가 position:fixed
   의 기준이 되어 버린다 — 화면 전체를 덮어야 할 창이 패널 안에 갇힌다. */
@keyframes mxfade { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; } }
#dvmax .mx_panel_intro { margin-bottom: 36px; }
#dvmax .mx_panel_intro h3 { font-size: 26px; font-weight: 800; letter-spacing: -.8px; margin: 0; }
#dvmax .mx_panel_intro h3 b { color: #3d5a80; }
#dvmax .mx_panel_intro p { margin: 8px 0 0; font-size: 16px; color: #4e5968; word-break: keep-all; }

/* 기능 한 덩어리 */
/* 시안 비율이다 — 글이 좁고 화면이 넓다. 제품 화면이 주인공이기 때문이다. */
#dvmax .mx_feat { display: grid; grid-template-columns: minmax(300px, 5fr) minmax(360px, 7fr); gap: 40px;
  padding: 40px 0; border-top: 1px solid #eef1f4; align-items: center; }
#dvmax .mx_feat:first-of-type { border-top: none; padding-top: 10px; }
/* 번갈아 뒤집는다. 칸 너비도 같이 뒤집어야 글이 좁은 칸으로 안 들어간다.

   자리를 명시한다. order 로만 바꾸면 자동 배치와 싸워서
   글과 화면이 같은 칸에 겹쳐 버린다(실측: 둘 다 x=698). */
#dvmax .mx_feat.mx_rev { grid-template-columns: minmax(360px, 7fr) minmax(300px, 5fr); }
#dvmax .mx_feat_txt { grid-column: 1; grid-row: 1; }
#dvmax .mx_feat_side { grid-column: 2; grid-row: 1; }
#dvmax .mx_feat.mx_rev .mx_feat_txt { grid-column: 2; }
#dvmax .mx_feat.mx_rev .mx_feat_side { grid-column: 1; }
/* 화면이 없는 기능은 글이 한 칸을 다 쓴다. 빈 상자를 띄우지 않는다. */
#dvmax .mx_feat:not(:has(.mx_feat_side)) { grid-template-columns: 1fr; }
#dvmax .mx_feat:not(:has(.mx_feat_side)) .mx_feat_txt { grid-column: 1; }
#dvmax .mx_feat_no { display: inline-flex; align-items: center; gap: 9px; font-size: 15px; font-weight: 800;
  color: #d71920; margin-bottom: 10px; }
#dvmax .mx_feat_no i { font-style: normal; display: inline-flex; width: 28px; height: 28px; border-radius: 50%;
  background: #d71920; color: #fff; align-items: center; justify-content: center; font-size: 14px; flex: 0 0 auto; }
#dvmax .mx_feat_txt h4 { font-size: 21px; font-weight: 800; letter-spacing: -.5px; margin: 0 0 12px;
  word-break: keep-all; line-height: 1.4; }
#dvmax .mx_feat_txt ul { font-size: 15px; color: #4e5968; line-height: 1.75; list-style: none; padding: 0; margin: 0; }
#dvmax .mx_feat_txt li { position: relative; padding-left: 15px; margin-bottom: 5px; word-break: keep-all; }
#dvmax .mx_feat_txt li::before { content: ''; position: absolute; left: 0; top: 12px; width: 7px; height: 2px; background: #3d5a80; }
/* 강조는 굵기로만 한다. 색 띠를 여러 개 넣으면 본문이 얼룩져 되레 안 읽힌다. */
#dvmax .mx_hl { font-style: normal; font-weight: 800; color: #141b26; }
#dvmax .mx_steps .mx_hl { color: #fff; }
#dvmax .mx_callout { margin-top: 20px; background: rgba(215,25,32,.05); border-left: 3px solid #d71920;
  padding: 16px 20px 17px; }
#dvmax .mx_callout p { margin: 0; word-break: keep-all; }
#dvmax .mx_callout_lead { font-size: 14px; font-weight: 600; color: #566577; line-height: 1.55; }
#dvmax .mx_callout_res { margin-top: 6px; font-size: 16.5px; font-weight: 800; color: #141b26; line-height: 1.5; }
#dvmax .mx_feat_side { min-width: 0; transition: transform .22s; }
#dvmax .mx_feat:hover .mx_feat_side { transform: translateY(-3px); }
/* 시안의 해시태그다. 앞에 # 가 붙어 있어 누르는 것으로 안 읽힌다. */
#dvmax .mx_chips { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 18px; }
#dvmax .mx_chip { font-size: 12.5px; font-weight: 700; color: #1c1c1e; background: #eef4f8;
  border: 1px solid #cfdfe8; border-radius: 7px; padding: 4px 12px; }

/* 실제 제품 화면 */
#dvmax .dvshot_grid { display: grid; gap: 14px; }
.dvshot_more { display: inline-flex; align-items: center; gap: 5px; margin-top: 12px; padding: 8px 2px; min-height: 44px; border: 0; background: none; font: inherit; font-size: 14px; font-weight: 700; color: #d71920; cursor: pointer; }
.dvshot_more:hover { text-decoration: underline; }
.dvshot_more:focus-visible { outline: 3px solid #d71920; outline-offset: 2px; }
/* 첫 장이 대표다. 나머지는 아래에 두 칸으로 깔린다. */
/* 두 장뿐이면 둘째도 한 줄을 다 쓴다. 반 칸짜리 하나만 남으면 어색하다. */
#dvmax .dvshot { margin: 0; }
#dvmax .dvshot img {
  display: block; width: 100%; height: auto; border: 1px solid #e2e9f0; border-radius: 12px;
  background: #fff; }
/* 그림 칸. 「크게 보기」 단추와 돋보기가 이 안에 겹쳐 놓인다.
   돋보기가 그림 밖으로 안 나가게 여기서 자른다. */
#dvmax .dvshot_frame { position: relative; line-height: 0; border-radius: 12px; overflow: hidden;
  box-shadow: 0 10px 26px rgba(21,34,56,.08); }
#dvmax .dvshot figcaption { margin-top: 9px; font-size: 13px; color: #8b97a4; word-break: keep-all; }
#dvmax .dvshot_open {
  position: absolute; inset: 0; width: 100%; padding: 0; border: 0; background: none;
  cursor: zoom-in; border-radius: 12px; }
#dvmax .dvshot_open:focus-visible { outline: 3px solid #d71920; outline-offset: -3px; }

/* 돋보기. 배경 그림을 밀어서 확대한다 — 그림을 한 장 더 받지 않는다. */
#dvmax .dvshot_lens {
  position: absolute; width: 200px; height: 200px; margin: -100px 0 0 -100px;
  border-radius: 50%; border: 2px solid #fff;
  box-shadow: 0 10px 28px rgba(21,34,56,.3), 0 0 0 1px rgba(21,34,56,.12);
  background-repeat: no-repeat; background-color: #fff;
  pointer-events: none; z-index: 3; }
/* 돋보기가 떠 있는 동안에는 「크게 보기」 알약을 감춘다. 둘이 겹치면 시끄럽다. */
#dvmax .dvshot_frame.is-lens .dvshot_zoom { opacity: 0 !important; }
/* 손으로 쓰는 화면에는 hover 가 없다. 거기서는 눌러서 큰 창을 여는 것만 남는다. */
@media (hover: none), (pointer: coarse) {
  #dvmax .dvshot_lens { display: none; }
}
#dvmax .dvshot_zoom {
  position: absolute; right: 12px; bottom: 12px; display: inline-flex; align-items: center; gap: 6px;
  background: rgba(21,34,56,.82); color: #fff; font-size: 13px; font-weight: 700;
  padding: 7px 13px; border-radius: 100px; opacity: 0; transition: opacity .18s; }
#dvmax .dvshot_open:hover .dvshot_zoom,
#dvmax .dvshot_open:focus-visible .dvshot_zoom { opacity: 1; }

@media (max-width: 700px) {
  #dvmax .dvshot_zoom { opacity: 1; }
  .dvshot_bar p { font-size: 13px; }
}
/* AI 패널 안에서는 글 칸 밖으로 나가지 않는다 — 거기는 격자가 다르다. */
#dvmax .mx_aipanel .dvshot_grid { grid-column: auto; }

/* 제조 특화 AI */
#dvmax .mx_aisub { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 28px; }
#dvmax .mx_aibtn { appearance: none; font-family: inherit; cursor: pointer; font-size: 14px; font-weight: 700;
  border: 1.5px solid #3d5a80; background: #fff; color: #191f28; padding: 10px 18px; border-radius: 8px;
  transition: background .16s, color .16s; }
#dvmax .mx_aibtn.is-on { background: #3d5a80; color: #fff; }
#dvmax .mx_aibtn:focus-visible { outline: 3px solid #d71920; outline-offset: 2px; }
#dvmax .mx_aipanel { animation: mxfade .3s ease both; }
#dvmax .mx_aipanel h4 { font-size: 21px; font-weight: 800; margin: 0 0 14px; letter-spacing: -.5px; }
#dvmax .mx_steps { background: #152238; color: #eaf3f8; border-radius: 14px; padding: 26px 30px;
  font-size: 15px; line-height: 1.85; list-style: none; margin: 0; }
#dvmax .mx_steps li { position: relative; padding-left: 32px; margin-bottom: 4px; word-break: keep-all; }
#dvmax .mx_steps li i { font-style: normal; position: absolute; left: 0; top: 4px; width: 22px; height: 22px;
  border-radius: 50%; background: rgba(255,255,255,.14); display: flex; align-items: center;
  justify-content: center; font-size: 12px; font-weight: 800; }

/* 하단 문의 유도 */
/* 문의 띠 — 왼쪽 위에 파란 빛 하나, 얇은 점 격자. 요약 칸과 같은 재료라 한 시스템으로 읽힌다. */
#dvmax .mx_cta { color: #fff; padding: 64px 0; text-align: center; position: relative; overflow: hidden;
  background:
    radial-gradient(640px 320px at 12% 0%, rgba(49,130,246,.35), transparent 70%),
    radial-gradient(rgba(255,255,255,.07) 1px, transparent 1.2px) 0 0/22px 22px,
    #152238; }
#dvmax .mx_cta h3 { font-size: 28px; font-weight: 800; letter-spacing: -.8px; margin: 0; }
#dvmax .mx_cta p { margin: 10px 0 0; font-size: 16px; color: #b9d2df; }
#dvmax .mx_cta button { margin-top: 26px; background: #fff; color: #191f28; border: 0; font-family: inherit;
  font-weight: 800; font-size: 16px; padding: 15px 40px; border-radius: 8px; cursor: pointer;
  transition: transform .16s, box-shadow .16s; }
#dvmax .mx_cta button:hover { transform: translateY(-3px); box-shadow: 0 12px 26px rgba(0,0,0,.28); }

@media (max-width: 900px) {
  #dvmax .mx_hero h2 { font-size: 28px; }
  #dvmax .mx_sec_title { font-size: 26px; }
  #dvmax .mx_kpi { flex-direction: column; }
  #dvmax .mx_kpi_tag { padding: 14px; }
  #dvmax .mx_kpi_items { grid-template-columns: 1fr; }
  #dvmax .mx_kpi_items > div { border-left: none; border-top: 1px solid #e5eaef; }
  /* 한 칸으로 접힌다. 명시해 둔 자리를 여기서 풀어 준다 — 안 그러면
     글과 요약이 한 칸 안에서 다시 겹친다. */
  #dvmax .mx_feat, #dvmax .mx_feat.mx_rev { grid-template-columns: 1fr; gap: 22px; }
  #dvmax .mx_feat_txt, #dvmax .mx_feat.mx_rev .mx_feat_txt { grid-column: 1; grid-row: auto; }
  #dvmax .mx_feat_side, #dvmax .mx_feat.mx_rev .mx_feat_side { grid-column: 1; grid-row: auto; }
  #dvmax .dvshot_grid { grid-column: 1; grid-row: auto; }
  #dvmax .mx_panel { padding: 30px 20px 44px; }
}
@media (max-width: 900px) {
  #dvmax .mx_flow_hint { width: 100%; }
}
@media (prefers-reduced-motion: reduce) {
  #dvmax .mx_panel, #dvmax .mx_aipanel { animation: none; }
  #dvmax .mx_tabbtn, #dvmax .mx_feat_side, #dvmax .mx_cta button,
  #dvmax button.mx_pbox, #dvmax .mx_flow.is-picked .mx_stage { transition: none; }
}
/* 크게 보는 창 — body 로 옮겨 그리므로 #dvmax 로 감싸지 않는다.
   이름에 dvshot 을 붙여 운영 css/style.css 와 겹치지 않게 한다. */
@keyframes dvshotfade { from { opacity: 0; } to { opacity: 1; } }
.dvshot_view {
  position: fixed; inset: 0; z-index: 9000; background: rgba(12,18,28,.93);
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 18px; gap: 12px; animation: dvshotfade .18s ease both; }
.dvshot_bar {
  width: 100%; max-width: 1600px; display: flex; align-items: center; justify-content: space-between;
  gap: 16px; color: #e6edf4; }
.dvshot_bar p { margin: 0; font-size: 14.5px; font-weight: 700; word-break: keep-all; }
.dvshot_bar > div { display: flex; align-items: center; gap: 12px; flex: 0 0 auto; }
.dvshot_n { font-size: 13px; color: #9fb0c2; }
.dvshot_bar button {
  width: 38px; height: 38px; border-radius: 10px; border: 1px solid rgba(255,255,255,.28);
  background: transparent; color: #fff; font-size: 17px; cursor: pointer; font-family: inherit; }
.dvshot_bar button:hover { background: rgba(255,255,255,.14); }
.dvshot_body {
  position: relative; max-width: 1600px; width: 100%; max-height: calc(100vh - 150px);
  overflow: auto; border-radius: 12px; background: #fff; }
.dvshot_body img { display: block; width: 100%; height: auto; }
.dvshot_prev, .dvshot_next {
  position: sticky; top: 50%; z-index: 2; width: 44px; height: 44px; border-radius: 50%;
  border: 0; background: rgba(21,34,56,.78); color: #fff; font-size: 26px; line-height: 1;
  cursor: pointer; font-family: inherit; }
.dvshot_prev { float: left; margin-left: 10px; }
.dvshot_next { float: right; margin-right: 10px; }
.dvshot_hint { margin: 0; font-size: 13px; color: #8ea0b3; }

/* 소개 장에서 하위 네 장으로 보내는 칸. 헤더의 큰 메뉴판과 같은 모양이라
   눌러서 가는 자리라는 것이 한눈에 읽힌다. */
/* auto-fit 이 쓰이지 않는 4번째 칸을 0px 로 하나 더 만들고 있었다(실측:
   grid-template-columns 가 "405 405 405 0px"). 폭이 새지는 않았지만 칸이
   몇이냐가 화면 폭에 따라 달라져 예측이 안 된다. 최대 셋이므로 셋으로 박는다. */
.mx_navgrid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:26px}
@media (max-width:900px){.mx_navgrid{grid-template-columns:repeat(2,1fr)}}
@media (max-width:620px){.mx_navgrid{grid-template-columns:1fr}}
.mx_ext{display:flex;align-items:center;justify-content:space-between;gap:20px;flex-wrap:wrap;margin-top:28px;padding:26px 28px;border:1px solid #e5e8eb;border-radius:14px;background:#f9fafb}
.mx_ext b{display:block;font-size:19px;font-weight:800;color:#191f28;letter-spacing:-.4px}
.mx_ext span{display:block;margin-top:6px;font-size:15px;color:#6b7684;word-break:keep-all}
.mx_ext a{display:inline-flex;align-items:center;gap:8px;min-height:48px;padding:0 22px;border-radius:10px;background:#d71920;color:#fff;font-weight:700;text-decoration:none;transition:background-color .18s ease}
.mx_ext a:hover{background:#b3141a}
.mx_navcard{display:flex;flex-direction:column;gap:7px;padding:0 22px 24px;overflow:hidden;border:1px solid #e5e8eb;border-radius:14px;background:#fff;transition:border-color .18s ease,box-shadow .18s ease,transform .18s ease}
.mx_navcard:hover{border-color:#d71920;box-shadow:0 10px 24px rgba(0,0,0,.06);transform:translateY(-2px)}
/* 대표 화면. 글만 있던 칸이라 무엇을 사는지 열기 전엔 몰랐다. 잘라 쓰되
   위쪽을 남긴다 — 제품 화면은 위가 제목·요약이라 거기가 제일 말이 된다. */
/* 그림만 칸 밖으로 빼낸다. 안쪽 여백은 칸의 padding 이 맡는다 — 예전엔
   아이마다 margin-left 를 주었는데 뒤에 오는 .mx_navcard ul 의 margin 줄임
   표기가 그걸 지워서 **글머리 점이 칸 테두리에 붙어 있었다**(사용자 지적).
   이 파일은 템플릿 문자열이라 안에 역따옴표를 쓰면 문자열이 끊긴다. */
.mx_navshot{display:block;margin:0 -22px;aspect-ratio:16/9;overflow:hidden;background:#f2f4f6;border-bottom:1px solid #f2f4f6}
.mx_navshot img{width:100%;height:100%;object-fit:cover;object-position:top center;display:block;transition:transform .45s cubic-bezier(.22,.68,.24,1)}
.mx_navcard:hover .mx_navshot img{transform:scale(1.04)}
.mx_navcard>b{margin-top:20px}
.mx_navcard b{font-size:18px;font-weight:700;color:#191f28;word-break:keep-all}
.mx_navcard:hover b{color:#d71920}
.mx_navcard span{font-size:14.5px;line-height:1.55;color:#8b95a1;word-break:keep-all}
/* 실제 기능 이름. 칸이 무엇을 담고 있는지 열기 전에 보인다. */
.mx_navcard ul{margin:14px -22px 0;padding:16px 22px 0;border-top:1px solid #f2f4f6;display:flex;flex-direction:column;gap:7px}
.mx_navcard li{position:relative;padding-left:13px;font-size:14px;line-height:1.5;color:#4e5968;word-break:keep-all}
.mx_navcard li::before{content:"";position:absolute;left:0;top:8px;width:5px;height:5px;border-radius:50%;background:#cfd6dd}
.mx_navcard:hover li::before{background:#d71920}
.mx_navcard em{margin-top:auto;padding-top:16px;display:flex;align-items:center;gap:6px;font-style:normal;font-size:13px;font-weight:600;color:#8b95a1;font-variant-numeric:tabular-nums}
.mx_navcard em i{font-style:normal;margin-left:auto;font-size:15px;color:#cfd6dd;transition:transform .18s ease,color .18s ease}
.mx_navcard:hover em i{color:#d71920;transform:translateX(3px)}
@media (prefers-reduced-motion: reduce){.mx_navcard em i{transition:none}.mx_navcard:hover em i{transform:none}}
@media (prefers-reduced-motion: reduce){.mx_navcard{transition:none}.mx_navcard:hover{transform:none}.mx_navshot img{transition:none}.mx_navcard:hover .mx_navshot img{transform:none}}


/* 머리말 바로 아래 요약 칸. 링크가 아니라 설명이라 눌리는 느낌을 안 준다. */
.mx_keygrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,280px),1fr));gap:12px;margin-top:24px}
.mx_key{padding:22px 24px 24px;border-radius:14px;background:#f7f9fb;border:1px solid #eef1f4}
.mx_key b{display:block;font-size:17px;font-weight:700;color:#191f28;margin-bottom:8px;word-break:keep-all}
.mx_key span{display:block;font-size:14.8px;line-height:1.65;color:#4e5968;word-break:keep-all}



/* ── 왼쪽 옆 차례표 ─────────────────────────────────────────────── */
/* 본문을 두 칸으로 나눈다. 좁아지면 한 칸으로 돌아가고 차례표는 사라진다 —
   그 자리는 현재 위치 줄의 펼침 목록이 이미 맡고 있다. */
/* align-items:start 를 주면 안 된다. 옆 칸이 제 내용 높이로 줄어들어서
   그 안의 sticky 가 붙어 있을 자리가 없어진다(실측: 스크롤하니 top 이
   -1190 까지 따라 올라가 화면 밖으로 나갔다). 기본값 stretch 로 둔다. */
#dvmax .mx_split{display:grid;grid-template-columns:212px minmax(0,1fr);gap:52px}
#dvmax .mx_main{min-width:0}
#dvmax .mx_sec_body{padding:56px 0 0}
#dvmax .mx_gap{height:34px}
@media (max-width:1024px){
  #dvmax .mx_split{display:block}
  #dvmax .mx_side{display:none}
}
/* 헤더(80px)에 살짝 여유를 둔다. 붙여 두면 글자가 막대에 닿는다. */
#dvmax .mx_side_in{position:sticky;top:104px}
#dvmax .mx_side_tab{
  display:block;font-size:13px;font-weight:800;letter-spacing:.1em;color:#8b95a1;
  text-decoration:none;padding-bottom:14px;margin-bottom:6px;border-bottom:1px solid #e5e8eb;
  transition:color .18s ease}
#dvmax .mx_side_tab:hover{color:#d71920}
#dvmax .mx_side ul{list-style:none;margin:0;padding:0}
#dvmax .mx_side li{
  /* 들어올 때 위에서 차례로. --i 는 컴포넌트가 넣는 줄 번호다. */
  animation:mxSideIn .5s cubic-bezier(.22,.68,.24,1) both;
  animation-delay:calc(var(--i, 0) * .05s + .1s)}
@keyframes mxSideIn{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:none}}
#dvmax .mx_side a{
  position:relative;display:block;padding:11px 0 11px 15px;text-decoration:none;
  transition:padding-left .2s cubic-bezier(.22,.68,.24,1)}
/* 왼쪽 막대. 켜졌다 꺼지는 게 아니라 **자란다.** */
#dvmax .mx_side a::before{
  content:"";position:absolute;left:0;top:50%;width:2px;height:0;
  background:#d71920;border-radius:2px;transform:translateY(-50%);
  transition:height .28s cubic-bezier(.22,.68,.24,1)}
#dvmax .mx_side a:hover::before{height:16px;background:#cfd6dd}
#dvmax .mx_side a.on::before{height:28px}
#dvmax .mx_side a:hover{padding-left:19px}
#dvmax .mx_side a b{
  display:block;font-size:15px;font-weight:600;color:#4e5968;letter-spacing:-.2px;
  transition:color .18s ease}
#dvmax .mx_side a em{
  display:block;margin-top:3px;font-style:normal;font-size:12.5px;line-height:1.45;
  color:#b0b8c1;word-break:keep-all;
  /* 지금 줄만 설명을 보여 준다. 다 보여 주면 목록이 아니라 글 덩어리가 된다. */
  max-height:0;opacity:0;overflow:hidden;
  transition:max-height .28s ease,opacity .2s ease,margin-top .28s ease}
#dvmax .mx_side a:hover b{color:#191f28}
#dvmax .mx_side a.on b{color:#d71920;font-weight:700}
#dvmax .mx_side a.on em,#dvmax .mx_side a:hover em{max-height:48px;opacity:1}
@media (prefers-reduced-motion: reduce){
  #dvmax .mx_side li{animation:none}
  #dvmax .mx_side a,#dvmax .mx_side a::before,#dvmax .mx_side a b,#dvmax .mx_side a em{transition:none}
  #dvmax .mx_side a:hover{padding-left:15px}
}

/* ── 소개 장에 새로 붙인 두 구역 ─────────────────────────────────── */
/* 숫자 줄. 상자 넷으로 늘어놓았더니 어느 사이트에나 있는 모양이 됐다
   (사용자 지적). 상자를 없애고 한 줄로 읽히게 둔다. */
/* 요약 칸의 「숫자 하나 + 한 줄 셋」 꼴. 홈 dvproof 의 큰 숫자와 같은 무게로 맞춘다. */
#dvmax .mx_leadhero{display:grid;grid-template-columns:minmax(0,.8fr) minmax(0,1.2fr);gap:28px 40px;align-items:center;
  padding:30px 34px;border:1px solid #e5e8eb;border-radius:20px;position:relative;overflow:hidden;
  background:
    radial-gradient(520px 260px at 0% 0%, rgba(49,130,246,.13), transparent 70%),
    radial-gradient(#dde3ea 1px, transparent 1.2px) 0 0/18px 18px,
    #f9fafb}
#dvmax .mx_leadhero_n b{position:relative;background:linear-gradient(90deg,#3182f6,#7cb3ff) no-repeat left calc(100% - 2px)/100% 6px;
  padding-bottom:10px;box-decoration-break:clone;-webkit-box-decoration-break:clone}
#dvmax .mx_leadhero_n{margin:0}
#dvmax .mx_leadhero_n b{display:inline-block;font-size:64px;line-height:1;font-weight:800;letter-spacing:-2.4px;color:#191f28;
  font-variant-numeric:tabular-nums;word-break:keep-all}
#dvmax .mx_leadhero_n span{display:block;margin-top:12px;font-size:16px;font-weight:600;color:#4e5968;word-break:keep-all}
#dvmax .mx_leadhero_pts{list-style:none;margin:0;padding:0;display:grid;gap:14px}
#dvmax .mx_leadhero_pts li{padding-left:14px;border-left:2px solid #3182f6}
#dvmax .mx_leadhero_pts b{display:block;font-size:15px;font-weight:700;color:#191f28;margin-bottom:2px}
#dvmax .mx_leadhero_pts span{display:block;font-size:14px;line-height:1.55;color:#62707e;word-break:keep-all}
@media (max-width:768px){
  #dvmax .mx_leadhero{grid-template-columns:1fr;gap:22px;padding:24px 20px}
  #dvmax .mx_leadhero_n b{font-size:46px;letter-spacing:-1.6px}
}
#dvmax .mx_count{display:flex;flex-wrap:wrap;gap:10px 0;margin:22px 0 0;padding:0}
#dvmax .mx_count span{
  display:inline-flex;align-items:baseline;gap:7px;padding:0 20px;
  font-size:14px;font-weight:600;color:#8b95a1;border-left:1px solid #e5e8eb}
#dvmax .mx_count span:first-child{padding-left:0;border-left:0}
#dvmax .mx_count b{font-size:23px;font-weight:800;color:#191f28;letter-spacing:-.6px;
  font-variant-numeric:tabular-nums}

/* ── 결과 고르개 + 실제 화면 ──────────────────────────────────────
   자바스크립트를 안 쓴다. 라디오 단추 여섯이 상태를 들고, CSS 형제
   선택자가 고른 칸만 띄운다. 키보드 화살표로도 넘어가고, 스크립트가
   죽어도 첫 칸이 열린 채로 남는다. */
#dvmax .mx_pick{margin-top:26px}
#dvmax .mx_pick_radio{
  /* 눈에는 안 보이되 초점은 받는다. display:none 으로 숨기면 키보드가
     닿지 못해 고를 수가 없어진다. */
  position:absolute;width:1px;height:1px;margin:-1px;padding:0;
  overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0}
#dvmax .mx_pick_list{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
@media (max-width:760px){#dvmax .mx_pick_list{grid-template-columns:1fr}}
#dvmax .mx_pick_tab{
  display:flex;flex-direction:column;align-items:flex-start;gap:7px;cursor:pointer;
  padding:15px 16px 16px;border:1px solid #e5e8eb;border-radius:12px;background:#f9fafb;
  transition:background-color .2s ease,border-color .2s ease,box-shadow .2s ease,transform .2s ease}
#dvmax .mx_pick_tab:hover{background:#fff;transform:translateY(-2px)}
#dvmax .mx_pick_tag{
  font-size:11px;font-weight:800;letter-spacing:.04em;color:#8b95a1;
  background:#eef1f4;border-radius:100px;padding:3px 9px}
#dvmax .mx_pick_tab b{
  font-size:15.5px;font-weight:700;color:#4e5968;line-height:1.4;letter-spacing:-.3px;
  word-break:keep-all;transition:color .18s ease}
#dvmax .mx_pick_tab i{
  align-self:flex-end;margin-top:-18px;font-style:normal;font-size:15px;color:#d71920;
  opacity:0;transform:translateX(-4px);transition:opacity .2s ease,transform .2s ease}

/* 고른 칸이 뜨는 자리. 안 고른 칸은 자리를 안 차지하게 겹쳐 둔다. */
#dvmax .mx_pick_stage{margin-top:14px}
/* 안 고른 칸은 아예 안 그린다. 겹쳐 놓고 투명도로 가리면 높이를 아무도
   안 만들어서 자리를 따로 잡아 줘야 하고, 안 보이는 글이 DOM 에 살아 있어
   화면 읽개가 여섯 벌을 다 읽는다. */
#dvmax .mx_pick_panel{
  display:none;grid-template-columns:minmax(0,1.35fr) minmax(0,1fr);gap:0;
  border:1px solid #e5e8eb;border-radius:16px;overflow:hidden;background:#fff}
@keyframes mxPanelIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
@media (max-width:760px){#dvmax .mx_pick_panel{grid-template-columns:1fr}}
#dvmax .mx_pick_shot{display:block;background:#f2f4f6;overflow:hidden}
#dvmax .mx_pick_shot img{
  width:100%;height:100%;object-fit:cover;object-position:top left;display:block;
  transition:transform .5s cubic-bezier(.22,.68,.24,1)}
#dvmax .mx_pick_shot:hover img{transform:scale(1.03)}
#dvmax .mx_pick_body{padding:28px 30px 30px;display:flex;flex-direction:column;gap:14px}
#dvmax .mx_pick_body h3{
  font-size:21px;font-weight:800;color:#191f28;letter-spacing:-.6px;line-height:1.4;
  margin:0;word-break:keep-all}
#dvmax .mx_pick_body ul{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:9px}
#dvmax .mx_pick_body li{
  position:relative;padding-left:14px;font-size:14.5px;line-height:1.6;color:#4e5968;
  word-break:keep-all}
#dvmax .mx_pick_body li::before{
  content:"";position:absolute;left:0;top:9px;width:5px;height:5px;border-radius:50%;background:#d71920}
#dvmax .mx_pick_more{
  margin-top:auto;align-self:flex-start;display:inline-flex;align-items:center;gap:7px;
  text-decoration:none;font-size:14.5px;font-weight:700;color:#191f28;
  border-bottom:1px solid #c9d1d9;padding-bottom:3px;transition:color .18s,border-color .18s}
#dvmax .mx_pick_more:hover{color:#d71920;border-color:#d71920}
#dvmax .mx_pick_more i{font-style:normal;transition:transform .18s ease}
#dvmax .mx_pick_more:hover i{transform:translateX(3px)}
@media (pointer: coarse){#dvmax .mx_pick_more{min-height:44px}
  #dvmax .mx_pick_tab{min-height:44px}}

@media (max-width:760px){#dvmax .mx_pick_shot{aspect-ratio:16/10}}

/* 이미 만들어 돌린 과제. 수행실적 장과 같은 파일을 읽는다. */
#dvmax .mx_builtgrid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:26px}
@media (max-width:900px){#dvmax .mx_builtgrid{grid-template-columns:1fr}}
#dvmax .mx_built{
  display:flex;flex-direction:column;gap:11px;padding:22px;text-decoration:none;
  border:1px solid #e5e8eb;border-radius:14px;background:#f9fafb;
  transition:border-color .2s ease,background-color .2s ease}
#dvmax .mx_built:hover{border-color:#d71920;background:#fff}
#dvmax .mx_built_top{display:flex;align-items:center;gap:9px;flex-wrap:wrap}
#dvmax .mx_built_kind{font-size:11.5px;font-weight:800;color:#4e5968;background:#eef1f4;
  border-radius:100px;padding:4px 10px;letter-spacing:-.2px}
#dvmax .mx_built_when{font-size:12.5px;font-weight:700;color:#8b95a1;font-variant-numeric:tabular-nums}
#dvmax .mx_built b{font-size:15.5px;font-weight:600;line-height:1.5;color:#191f28;
  letter-spacing:-.3px;word-break:keep-all}
@media (prefers-reduced-motion: reduce){
  #dvmax .mx_built{transition:none}
  #dvmax .mx_pick_tab,#dvmax .mx_pick_tab b,#dvmax .mx_pick_tab i,
  #dvmax .mx_pick_shot img,#dvmax .mx_pick_more,#dvmax .mx_pick_more i{transition:none}
  #dvmax .mx_pick_tab:hover{transform:none}
  #dvmax .mx_pick_shot:hover img{transform:none}
  #dvmax .mx_pick_panel{animation:none}
}

/* ── v4 꾸밈 (SolutionShell look="v4") ─────────────────────────────── */
/* 2026-09-22. 사용자가 레퍼런스를 직접 지정: channel.io/kr/works (허브 골격) · alf-customer.
   실측(1280): wrap 1209 · h1 44/600 가운데 · h2 40 · h3 18 · 판 r25 · 알약 단추 r999 ·
   3열 상단 바 5px. 색은 안 가져온다 — 빨강 #d71920 · 남색 #152238 · 웜 그레이.
   움직임: 배경 덩어리는 늘 천천히(CSS), 내용은 뜰 때 왼쪽에서 오른쪽으로 「촤자작」
   (--i 지연 + 고리 파동), 판 안 화면은 스크롤에 맞춰 살짝 반대로(MotionFx.tsx).
   #dvmax.mx_v4 로만 건다. 이 파일은 템플릿 문자열이라 역따옴표 금지. */
#dvmax.mx_v4 { background: #fff; font-family: 'Pretendard Variable', 'Pretendard', sans-serif; letter-spacing: 0; word-break: keep-all; }
#dvmax.mx_v4 .mx_wrap { max-width: 1265px; padding: 0 28px; }
#dvmax.mx_v4 .mx_v4_top { padding-top: 80px; }
/* 단추 — 알약 */
#dvmax.mx_v4 .mx_pill { display: inline-flex; align-items: center; gap: 8px; min-height: 50px; padding: 0 24px; border: 0; border-radius: 999px;
  background: #191f28; color: #fff; font: inherit; font-weight: 600; font-size: 17px; cursor: pointer; text-decoration: none;
  transition: transform .16s cubic-bezier(.2,.7,.2,1), background-color .16s, color .16s; }
#dvmax.mx_v4 .mx_pill::after { content: '\\203A'; font-size: 20px; line-height: 1; }
#dvmax.mx_v4 .mx_pill.red { background: #d71920; }
#dvmax.mx_v4 .mx_pill.o { background: transparent; color: #191f28; border: 1px solid #191f28; font-weight: 500; }
#dvmax.mx_v4 .mx_pill:hover { transform: translateY(-1px); }
#dvmax.mx_v4 .mx_pill.red:hover { background: #b3141a; }
#dvmax.mx_v4 .mx_pill.o:hover { background: #191f28; color: #fff; }
/* 머리말 — 가운데. 뒤에 빛 하나 */
#dvmax.mx_v4 .mx_hero4 { position: relative; overflow: hidden; padding: 96px 0 0; text-align: center; }
/* 판이 없는 장(화면 없는 제품)은 밑 여백을 판이 못 맡는다 — 단추가 인증 띠에 붙었다(사용자 지적). */
#dvmax.mx_v4 .mx_hero4 { padding-bottom: 72px; }
#dvmax.mx_v4 .mx_glow { position: absolute; left: 50%; top: -140px; width: 900px; height: 520px; transform: translateX(-50%); pointer-events: none; border-radius: 50%;
  background: radial-gradient(closest-side, rgba(62,120,200,.22), rgba(215,25,32,.10) 55%, transparent 75%); filter: blur(30px); animation: mxGlow 9s ease-in-out infinite alternate; }
@keyframes mxGlow { from { transform: translateX(-56%) scale(1); } to { transform: translateX(-44%) scale(1.12); } }
#dvmax.mx_v4 .mx_hero4 .mx_wrap { position: relative; }
#dvmax.mx_v4 .mx_kicker { font-size: 15px; font-weight: 600; color: #62707e; margin: 0 0 14px; letter-spacing: 0; }
#dvmax.mx_v4 .mx_hero4 h2 { font-size: clamp(30px, 3.6vw, 44px); line-height: 1.27; letter-spacing: -.88px; font-weight: 700; color: #191f28; max-width: 22em; margin: 0 auto; overflow-wrap: anywhere; }
#dvmax.mx_v4 .mx_hero4 h2 b { color: inherit; font-weight: 700; }
#dvmax.mx_v4 .mx_hero4 p { font-size: 18px; line-height: 1.6; color: #333d4b; margin: 18px auto 30px; max-width: 40em; }
#dvmax.mx_v4 .mx_hero4_act { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
/* 낱말 등장 — MotionFx 가 h2 를 낱말로 쪼개고 --i 를 준다 */
#dvmax.mx_v4 .mx_w { display: inline-block; animation: mxWord .7s cubic-bezier(.22,.68,.24,1) both; animation-delay: calc(var(--i, 0) * .045s + .1s); }
@keyframes mxWord { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: none; } }
#dvmax.mx_v4 .mx_hero4 > .mx_wrap > p, #dvmax.mx_v4 .mx_hero4_act { animation: mxWord .6s cubic-bezier(.22,.68,.24,1) .55s both; }
#dvmax.mx_v4 .mx_hero4 .mx_plate { animation: mxPlate .9s cubic-bezier(.22,.68,.24,1) .7s both; }
@keyframes mxPlate { from { opacity: 0; transform: translateY(60px) scale(.96); } to { opacity: 1; transform: none; } }
/* 판 — r25 웜 판, 안쪽은 우리 남색 메쉬 + 점 격자 + 떠다니는 덩어리 셋 */
#dvmax.mx_v4 .mx_plate { position: relative; margin: 56px 0 0; border-radius: 25px; background: #f1efeb; overflow: hidden; }
#dvmax.mx_v4 .mx_plate_in { position: relative; margin: 14px 14px 0; border-radius: 18px 18px 0 0; overflow: hidden; min-height: 420px; padding: 64px 64px 0; isolation: isolate; }
#dvmax.mx_v4 .mx_plate_in::before { content: ''; position: absolute; inset: 0; z-index: 0; background: linear-gradient(160deg, #152238 0%, #1e2b3e 55%, #2c3f5c 100%); }
#dvmax.mx_v4 .mx_plate_in::after { content: ''; position: absolute; inset: 0; z-index: 2; pointer-events: none;
  background: radial-gradient(rgba(255,255,255,.14) 1px, transparent 1.3px) 0 0 / 22px 22px; mask-image: linear-gradient(#000 40%, transparent); animation: mxDots 40s linear infinite; }
@keyframes mxDots { from { background-position: 0 0; } to { background-position: 220px 220px; } }
#dvmax.mx_v4 .mx_blob { position: absolute; z-index: 1; border-radius: 50%; filter: blur(40px); opacity: .75; pointer-events: none; will-change: transform; }
#dvmax.mx_v4 .mx_b1 { width: 640px; height: 640px; left: -160px; top: -260px; background: #3e78c8; animation: mxDrift1 16s ease-in-out infinite alternate; }
#dvmax.mx_v4 .mx_b2 { width: 520px; height: 520px; right: -140px; bottom: -200px; background: #d71920; opacity: .35; animation: mxDrift2 19s ease-in-out infinite alternate; }
#dvmax.mx_v4 .mx_b3 { width: 420px; height: 420px; left: 40%; top: 30%; background: #7fb2ff; opacity: .35; animation: mxDrift3 23s ease-in-out infinite alternate; }
@keyframes mxDrift1 { to { transform: translate(120px, 80px) scale(1.15); } }
@keyframes mxDrift2 { to { transform: translate(-140px, -60px) scale(1.2); } }
@keyframes mxDrift3 { to { transform: translate(-90px, 110px); } }
#dvmax.mx_v4 .mx_plate.sand .mx_plate_in::before { background: linear-gradient(160deg, #f4efe6, #e8eef8); }
#dvmax.mx_v4 .mx_plate.sand .mx_plate_in::after { background-image: radial-gradient(rgba(21,34,56,.14) 1px, transparent 1.3px); }
#dvmax.mx_v4 .mx_plate.sand .mx_b1 { background: #ffb48a; } #dvmax.mx_v4 .mx_plate.sand .mx_b2 { background: #8fb3ff; opacity: .6; } #dvmax.mx_v4 .mx_plate.sand .mx_b3 { background: #fff; opacity: .7; }
#dvmax.mx_v4 .mx_plate.steel .mx_plate_in::before { background: linear-gradient(160deg, #dbe6f5, #b9cbe6); }
#dvmax.mx_v4 .mx_plate.steel .mx_plate_in::after { background-image: radial-gradient(rgba(21,34,56,.16) 1px, transparent 1.3px); }
#dvmax.mx_v4 .mx_plate.steel .mx_b1 { background: #7fb2ff; } #dvmax.mx_v4 .mx_plate.steel .mx_b2 { background: #fff; opacity: .7; } #dvmax.mx_v4 .mx_plate.steel .mx_b3 { background: #3e78c8; opacity: .35; }
#dvmax.mx_v4 .mx_browser { position: relative; z-index: 3; border-radius: 12px 12px 0 0; background: #fff; box-shadow: 0 30px 80px rgba(0,0,0,.28); overflow: hidden; will-change: transform; }
#dvmax.mx_v4 .mx_browser_bar { display: flex; align-items: center; gap: 6px; height: 34px; padding: 0 14px; background: #f2f4f6; border-bottom: 1px solid #e5e8eb; }
#dvmax.mx_v4 .mx_browser_bar i { width: 10px; height: 10px; border-radius: 50%; background: #d5dae0; display: block; }
#dvmax.mx_v4 .mx_browser_bar span { margin-left: 10px; font-size: 12px; color: #62707e; background: #fff; border-radius: 6px; padding: 3px 10px; flex: 1; max-width: 340px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
#dvmax.mx_v4 .mx_browser img { display: block; width: 100%; height: auto; }
#dvmax.mx_v4 .mx_phone { position: relative; z-index: 3; width: 340px; max-width: 100%; margin: 0 auto; border-radius: 36px 36px 0 0; border: 8px solid #101418; border-bottom: 0; background: #101418; overflow: hidden; box-shadow: 0 30px 80px rgba(0,0,0,.3); will-change: transform; }
#dvmax.mx_v4 .mx_phone img { display: block; width: 100%; height: auto; }
#dvmax.mx_v4 .mx_plate_tag { position: absolute; z-index: 4; left: 40px; top: 28px; background: #fff; color: #191f28; font-size: 13px; font-weight: 700; padding: 7px 12px; border-radius: 999px; box-shadow: 0 6px 18px rgba(0,0,0,.18); animation: mxFloat 5s ease-in-out infinite; }
@keyframes mxFloat { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
/* 「촤자작」 — 자식이 왼쪽부터 튀어나오고 고리가 퍼진다. Reveal 이 --i 를 준다.
   기본값은 다 보이는 상태. rv-wait 일 때만 숨겼다가 rv-in 에서 돈다. */
@keyframes mxPop { from { opacity: 0; transform: translateY(14px) scale(.86); } 60% { transform: translateY(-3px) scale(1.03); } to { opacity: 1; transform: none; } }
@keyframes mxRing { from { box-shadow: 0 0 0 0 rgba(215,25,32,.45); } to { box-shadow: 0 0 0 18px rgba(215,25,32,0); } }
#dvmax.mx_v4 [data-rv="pop"].rv-wait > * { opacity: 0; transform: none; transition: none; animation: none; }
#dvmax.mx_v4 [data-rv="pop"].rv-wait.rv-in > * { opacity: 1; transition: none; animation: mxPop .55s cubic-bezier(.22,.68,.24,1) both; animation-delay: calc(var(--i, 0) * .08s); }
#dvmax.mx_v4 [data-rv="pop"].rv-wait.rv-in > .mx_ring, #dvmax.mx_v4 [data-rv="pop"].rv-wait.rv-in > * > .mx_ring { animation: mxPop .55s cubic-bezier(.22,.68,.24,1) both, mxRing .9s ease-out both; animation-delay: calc(var(--i, 0) * .08s), calc(var(--i, 0) * .08s + .25s); }
/* 인증·선정 띠 */
#dvmax.mx_v4 .mx_proof { position: relative; overflow: hidden; padding: 88px 0 96px; color: #fff; background: radial-gradient(120% 90% at 85% 0%, #24365a 0%, #152238 55%, #0f1a2c 100%); }
#dvmax.mx_v4 .mx_proof .mx_blob { position: absolute; border-radius: 50%; filter: blur(60px); opacity: .5; pointer-events: none; }
#dvmax.mx_v4 .mx_proof .mx_b1 { width: 520px; height: 520px; left: -160px; top: -200px; background: #2a4a86; }
#dvmax.mx_v4 .mx_proof .mx_b2 { width: 420px; height: 420px; right: -120px; bottom: -220px; background: #7a1d24; }
#dvmax.mx_v4 .mx_proof .mx_wrap { position: relative; text-align: center; }
#dvmax.mx_v4 .mx_proof_pill { display: inline-block; margin: 0 0 18px; padding: 6px 14px; border-radius: 999px; background: rgba(255,255,255,.14); border: 1px solid rgba(255,255,255,.22); font-size: 13px; font-weight: 700; letter-spacing: .02em; }
#dvmax.mx_v4 .mx_proof_h { margin: 0 0 44px; font-size: clamp(26px, 3vw, 40px); font-weight: 700; line-height: 1.3; letter-spacing: -.02em; }
#dvmax.mx_v4 .mx_proof ul { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px; margin: 0; padding: 0; list-style: none; text-align: left; }
#dvmax.mx_v4 .mx_proof li { padding: 28px 26px 26px; border-radius: 20px; background: rgba(255,255,255,.07); border: 1px solid rgba(255,255,255,.12); backdrop-filter: blur(8px); transition: background .25s, transform .25s; }
#dvmax.mx_v4 .mx_proof li:hover { background: rgba(255,255,255,.12); transform: translateY(-3px); }
#dvmax.mx_v4 .mx_proof_ic { display: grid; place-items: center; width: 44px; height: 44px; margin-bottom: 22px; border-radius: 12px; background: rgba(255,255,255,.10); }
#dvmax.mx_v4 .mx_proof_ic svg { width: 24px; height: 24px; fill: none; stroke: #fff; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
#dvmax.mx_v4 .mx_proof li b { display: block; font-size: clamp(22px, 2vw, 26px); font-weight: 800; line-height: 1.15; color: #fff; white-space: nowrap; font-variant-numeric: tabular-nums; }
#dvmax.mx_v4 .mx_proof li b i { font-style: normal; color: rgba(255,255,255,.45); margin: 0 4px; }
#dvmax.mx_v4 .mx_proof li > span:last-child { display: block; margin-top: 10px; font-size: 14px; line-height: 1.55; color: rgba(255,255,255,.72); word-break: keep-all; }
/* 구역 · 큰 문장 · 3열 */
#dvmax.mx_v4 .mx_sec_body { padding: 0; }
#dvmax.mx_v4 .mx_sec4 { padding: 60px 0; }
#dvmax.mx_v4 .mx_sec4.big { padding: 96px 0 60px; }
#dvmax.mx_v4 .mx_state { font-size: clamp(28px, 3.6vw, 44px); line-height: 1.35; letter-spacing: -.88px; text-align: center; font-weight: 700; max-width: 20em; margin: 0 auto; color: #191f28; }
#dvmax.mx_v4 .mx_state_p { text-align: center; max-width: 44em; margin: 18px auto 0; font-size: 17px; color: #333d4b; }
#dvmax.mx_v4 .mx_cols { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 40px; margin: 64px 0 0; padding: 0; list-style: none; }
#dvmax.mx_v4 .mx_cols > * { position: relative; display: block; text-decoration: none; color: inherit; }
#dvmax.mx_v4 .mx_cols_ic { display: grid; place-items: center; width: 48px; height: 48px; margin-bottom: 20px; border-radius: 14px; background: #fff; border: 1px solid #e5e8eb; box-shadow: 0 4px 14px rgba(21,34,56,.06); font-style: normal; }
#dvmax.mx_v4 .mx_cols_ic svg { width: 22px; height: 22px; fill: none; stroke: #191f28; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
#dvmax.mx_v4 .mx_cols > .dim { opacity: .55; }
#dvmax.mx_v4 .mx_cols h3, #dvmax.mx_v4 .mx_cols b { position: relative; display: block; padding-right: 28px; font-size: 20px; font-weight: 700; line-height: 1.4; margin: 0; color: #191f28; word-break: keep-all; }
#dvmax.mx_v4 .mx_cols .mx_cols_go { position: absolute; right: 0; top: 0; font-style: normal; font-weight: 400; color: #8b95a1; font-size: 22px; transition: transform .2s, color .2s; }
#dvmax.mx_v4 .mx_cols p, #dvmax.mx_v4 .mx_cols span { display: block; font-size: 15px; line-height: 1.7; color: #4e5968; margin: 10px 0 0; word-break: keep-all; }
#dvmax.mx_v4 a.mx_cols_a:hover b { color: #d71920; } #dvmax.mx_v4 a.mx_cols_a:hover .mx_cols_go { color: #d71920; transform: translateX(4px); }
#dvmax.mx_v4 a.mx_cols_a:focus-visible { outline: 2px solid #191f28; outline-offset: 6px; border-radius: 6px; }
/* 판(화면) 바로 밑의 3열은 채널웍스처럼 얇은 막대 3열 — 아이콘 카드는 문장 밑에서만(사용자: 「이런 조합은 안 쓴다」). */
#dvmax.mx_v4 :is(.mx_plate, .hk_plate, .mx_gal, .mx_browser, .hk_show, .mx_stack, figure) + .mx_cols,
#dvmax.mx_v4 .mx_cols.bar { gap: 40px; margin-top: 28px; }
#dvmax.mx_v4 :is(.mx_plate, .hk_plate, .mx_gal, .mx_browser, .hk_show, .mx_stack, figure) + .mx_cols .mx_cols_ic,
#dvmax.mx_v4 .mx_cols.bar .mx_cols_ic { display: none; }
#dvmax.mx_v4 :is(.mx_plate, .hk_plate, .mx_gal, .mx_browser, .hk_show, .mx_stack, figure) + .mx_cols > *,
#dvmax.mx_v4 .mx_cols.bar > * { padding-top: 22px; border-top: 3px solid #e5e8eb; }
#dvmax.mx_v4 :is(.mx_plate, .hk_plate, .mx_gal, .mx_browser, .hk_show, .mx_stack, figure) + .mx_cols > :first-child,
#dvmax.mx_v4 .mx_cols.bar > :first-child { border-top-color: #191f28; }
#dvmax.mx_v4 :is(.mx_plate, .hk_plate, .mx_gal, .mx_browser, .hk_show, .mx_stack, figure) + .mx_cols b,
#dvmax.mx_v4 .mx_cols.bar b { font-size: 18px; }
/* 제품군 구역(허브) — 알약 탭 · 제목/설명/윤곽 단추 · 판 · 3열 · 과제 카드 */
#dvmax.mx_v4 .mx_tabs { display: inline-flex; max-width: 100%; overflow-x: auto; scrollbar-width: none; flex-wrap: nowrap; gap: 4px; padding: 4px; border: 1px solid #e5e8eb; border-radius: 999px; background: #fff; margin-bottom: 20px; }
#dvmax.mx_v4 .mx_tabs button { padding: 8px 22px; min-height: 44px; border: 0; border-radius: 999px; background: transparent; font: inherit; font-size: 14px; font-weight: 600; color: #333d4b; cursor: pointer; transition: background-color .18s, color .18s; }
#dvmax.mx_v4 .mx_tabs button:hover { background: #f2f4f6; }
#dvmax.mx_v4 .mx_tabs button.on { background: #191f28; color: #fff; }
#dvmax.mx_v4 .mx_tabpanel[hidden] { display: none; }
#dvmax.mx_v4 .mx_tabpanel .mx_grp { padding-top: 20px; }
/* 화면 밖 판의 덩어리는 멈춘다 — 판 여덟 개 × 흐린 층 셋을 다 돌릴 이유가 없다(MotionFx 가 표시) */
#dvmax.mx_v4 .mx_plate.is-off .mx_blob, #dvmax.mx_v4 .mx_plate.is-off .mx_plate_in::after { animation-play-state: paused; }
#dvmax.mx_v4 .mx_gal { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 20px; list-style: none; margin: 20px 0 0; padding: 0; }
#dvmax.mx_v4 .mx_gal figure { margin: 0; aspect-ratio: 4 / 3; border-radius: 20px; overflow: hidden; background: #eef0f3; }
#dvmax.mx_v4 .mx_gal img { width: 100%; height: 100%; object-fit: cover; object-position: top left; transform: scale(1.02); transition: transform .6s cubic-bezier(.2,.75,.2,1); }
#dvmax.mx_v4 .mx_gal li:hover img { transform: scale(1.06); }
#dvmax.mx_v4 .mx_gal h3 { margin: 18px 0 0; font-size: 18px; font-weight: 700; color: #191f28; } #dvmax.mx_v4 .mx_gal h3 a { color: inherit; text-decoration: none; }
#dvmax.mx_v4 .mx_gal p { margin: 8px 0 0; font-size: 15px; line-height: 1.65; color: #62707e; word-break: keep-all; }
#dvmax.mx_v4 .mx_road { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; margin: 56px 0 0; padding: 0; list-style: none; counter-reset: none; }
#dvmax.mx_v4 .mx_road li { position: relative; padding: 34px 30px 36px; border-radius: 24px; background: #f6f5f2; overflow: hidden; transition: transform .25s, box-shadow .25s; }
#dvmax.mx_v4 .mx_road li:nth-child(2) { background: #eef2f8; } #dvmax.mx_v4 .mx_road li:nth-child(3) { background: #fbeeee; }
#dvmax.mx_v4 .mx_road li:hover { transform: translateY(-4px); box-shadow: 0 18px 40px rgba(21,34,56,.10); }
#dvmax.mx_v4 .mx_road li i { display: block; font-style: normal; font-size: 13px; font-weight: 800; letter-spacing: .08em; color: #d71920; margin-bottom: 44px; }
#dvmax.mx_v4 .mx_road li b { display: block; font-size: 22px; font-weight: 700; line-height: 1.35; color: #191f28; word-break: keep-all; }
#dvmax.mx_v4 .mx_road li span { display: block; margin-top: 12px; font-size: 15px; line-height: 1.7; color: #4e5968; word-break: keep-all; }
#dvmax.mx_v4 .mx_ghead { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 48px; align-items: start; }
#dvmax.mx_v4 .mx_ghead h2 { font-size: clamp(26px, 3.2vw, 40px); line-height: 1.35; letter-spacing: -.8px; font-weight: 700; margin: 0; color: #191f28; }
#dvmax.mx_v4 .mx_ghead h2 b { color: #d71920; font-weight: 700; }
#dvmax.mx_v4 .mx_ghead p { font-size: 17px; color: #333d4b; margin: 6px 0 22px; max-width: 32em; }
#dvmax.mx_v4 .mx_grp .mx_plate { margin-top: 36px; }
#dvmax.mx_v4 .mx_grp .mx_cols { margin-top: 40px; }
#dvmax.mx_v4 .mx_case { margin-top: 40px; background: #f1efeb; border-radius: 35px; padding: 10px; display: grid; grid-template-columns: 288px minmax(0, 1fr); gap: 30px; align-items: center; }
#dvmax.mx_v4 .mx_case_k { position: relative; overflow: hidden; height: 100%; min-height: 240px; border-radius: 26px; background: #152238; color: #fff; padding: 28px; display: flex; flex-direction: column; justify-content: space-between; }
#dvmax.mx_v4 .mx_case_k::after { content: ''; position: absolute; inset: -40% -60%; background: linear-gradient(115deg, transparent 40%, rgba(255,255,255,.14) 50%, transparent 60%); transform: translateX(-60%); animation: mxSheen 6s ease-in-out infinite; }
@keyframes mxSheen { 0%, 60% { transform: translateX(-60%); } 100% { transform: translateX(60%); } }
#dvmax.mx_v4 .mx_case_k small { font-size: 13px; color: #b9c8d8; font-weight: 600; }
#dvmax.mx_v4 .mx_case_k b { font-size: 34px; font-weight: 800; line-height: 1.1; }
#dvmax.mx_v4 .mx_case_k b i { display: block; font-style: normal; font-size: 14px; color: #b9c8d8; font-weight: 500; margin-top: 8px; }
#dvmax.mx_v4 .mx_case_t { padding: 20px 30px 20px 0; }
#dvmax.mx_v4 .mx_case_t h3 { font-size: clamp(20px, 2vw, 24px); line-height: 1.35; margin: 0; }
#dvmax.mx_v4 .mx_case_t p { font-size: 15px; color: #333d4b; margin: 14px 0 0; }
#dvmax.mx_v4 .mx_case_t .mx_who { margin-top: 34px; font-size: 15px; color: #62707e; }
/* 기능 줄(낱장) — 글 옆에 판 위 화면. 얕은 화면·화면 없는 기능은 한 칸 */
#dvmax.mx_v4 .mx_feat { grid-template-columns: minmax(0, 1fr) minmax(0, 1.35fr); gap: 56px; padding: 88px 0; border-top: 1px solid #e5e8eb; align-items: center; }
#dvmax.mx_v4 .mx_feat:first-of-type, #dvmax.mx_v4 .mx_keys + .mx_feat { border-top: 0; }
#dvmax.mx_v4 .mx_feat.mx_rev { grid-template-columns: minmax(0, 1.35fr) minmax(0, 1fr); }
#dvmax.mx_v4 .mx_feat.mx_stack, #dvmax.mx_v4 .mx_feat.mx_stack.mx_rev, #dvmax.mx_v4 .mx_feat:not(:has(.mx_feat_side)) { grid-template-columns: 1fr; gap: 32px; }
#dvmax.mx_v4 .mx_feat.mx_stack .mx_feat_txt { grid-column: 1; grid-row: 1; max-width: 36em; }
#dvmax.mx_v4 .mx_feat.mx_stack .mx_feat_side { grid-column: 1; grid-row: 2; }
#dvmax.mx_v4 .mx_feat_side .mx_plate { margin: 0; }
#dvmax.mx_v4 .mx_feat_side .mx_plate_in { min-height: 0; padding: 40px 40px 0; }
#dvmax.mx_v4 .mx_feat_no { display: block; font-size: 14px; font-weight: 600; color: #62707e; margin-bottom: 8px; }
#dvmax.mx_v4 .mx_feat_txt h3 { font-size: clamp(24px, 2.6vw, 32px); line-height: 1.3; font-weight: 700; letter-spacing: -.4px; margin: 0 0 14px; }
#dvmax.mx_v4 .mx_feat_txt ul { font-size: 16px; line-height: 1.8; color: #333d4b; }
#dvmax.mx_v4 .mx_feat_txt li { padding-left: 16px; margin-bottom: 4px; }
#dvmax.mx_v4 .mx_feat_txt li::before { top: 12px; width: 6px; height: 6px; border-radius: 50%; background: #191f28; }
#dvmax.mx_v4 .mx_feat_side { transition: none; }
#dvmax.mx_v4 .mx_feat:hover .mx_feat_side { transform: none; }
#dvmax.mx_v4 .mx_callout { background: #fff; border: 1px solid #e5e8eb; border-left: 3px solid #d71920; border-radius: 0 10px 10px 0; }
#dvmax.mx_v4 .mx_hl { color: #c8161d; font-weight: 800; }
#dvmax.mx_v4 .mx_feat_txt h3 .mx_hl, #dvmax.mx_v4 .mx_ghead h2 .mx_hl, #dvmax.mx_v4 .mx_cols .mx_hl { font-weight: inherit; }
#dvmax.mx_v4 .rv-wait .mx_hl { color: inherit; }
#dvmax.mx_v4 .rv-wait.rv-in .mx_hl { color: #c8161d; transition: color .6s ease .45s; }
#dvmax.mx_v4 .mx_steps .mx_hl { color: #fff; }
#dvmax.mx_v4 .mx_keys { padding: 80px 0 0; }
#dvmax.mx_v4 .mx_keys .mx_sec_title { font-size: clamp(24px, 2.6vw, 32px); letter-spacing: 0; margin-bottom: 10px; }
#dvmax.mx_v4 .mx_keys .mx_sec_desc { font-size: 17px; color: #333d4b; max-width: 40em; margin-bottom: 8px; }
#dvmax.mx_v4 .mx_aipanel:first-of-type { margin-top: 80px; }
#dvmax.mx_v4 .dvshot_grid img, #dvmax.mx_v4 .dvshot_one img { height: auto; }
/* 공정 흐름(허브 MaxFlow) — 단계 단추가 왼쪽부터 튀어나오고 고리가 퍼진다 */
#dvmax.mx_v4 .mx_flow[data-rv="pop"].rv-wait .mx_stage { opacity: 0; }
#dvmax.mx_v4 .mx_flow[data-rv="pop"].rv-wait.rv-in .mx_stage { animation: mxPop .55s cubic-bezier(.22,.68,.24,1) both; animation-delay: calc(var(--i, 0) * .1s); }
#dvmax.mx_v4 .mx_flow[data-rv="pop"].rv-wait.rv-in .mx_stage > button { animation: mxRing 1s ease-out both; animation-delay: calc(var(--i, 0) * .1s + .3s); }
/* 문의 — 가운데, 알약, 고리 */
#dvmax.mx_v4 .mx_cta { background: none; color: #191f28; padding: 110px 0 120px; text-align: center; overflow: visible; }
#dvmax.mx_v4 .mx_cta h3 { font-size: clamp(28px, 3.6vw, 44px); line-height: 1.3; letter-spacing: -.88px; font-weight: 700; margin: 0; }
#dvmax.mx_v4 .mx_cta p { color: #62707e; font-size: 17px; margin: 14px 0 30px; }
#dvmax.mx_v4 .mx_cta .mx_pill { position: relative; margin: 0; }
#dvmax.mx_v4 .mx_cta .mx_pill::before { content: ''; position: absolute; inset: -6px; border-radius: 999px; border: 2px solid rgba(215,25,32,.5); animation: mxRing2 2.4s ease-out infinite; }
@keyframes mxRing2 { from { transform: scale(.9); opacity: 1; } to { transform: scale(1.25); opacity: 0; } }
@media (max-width: 900px) {
  #dvmax.mx_v4 .mx_hero4 { padding-top: 56px; }
  #dvmax.mx_v4 .mx_hero4:not(:has(.mx_plate)) { padding-bottom: 48px; }
  #dvmax.mx_v4 .mx_plate_in { padding: 60px 20px 0; min-height: 0; }
  #dvmax.mx_v4 .mx_plate_tag { left: 20px; top: 16px; }
  #dvmax.mx_v4 .mx_proof ul { grid-template-columns: 1fr 1fr; } #dvmax.mx_v4 .mx_gal, #dvmax.mx_v4 .mx_road { grid-template-columns: 1fr; }
  #dvmax.mx_v4 .mx_cols, #dvmax.mx_v4 .mx_ghead, #dvmax.mx_v4 .mx_case { grid-template-columns: 1fr; }
  #dvmax.mx_v4 .mx_cols { gap: 32px; margin-top: 40px; }
  #dvmax.mx_v4 .mx_case_k { min-height: 0; }
  #dvmax.mx_v4 .mx_feat, #dvmax.mx_v4 .mx_feat.mx_rev { grid-template-columns: 1fr; gap: 28px; padding: 64px 0; }
  #dvmax.mx_v4 .mx_feat_side .mx_plate_in { padding: 20px 16px 0; }
  #dvmax.mx_v4 .mx_cta { padding: 72px 0 80px; }
}
@media (max-width: 480px) {
  /* 탭 다섯이 한 줄에 다 보이게 — 잘리면 뒤에 더 있는지 모른다(390 실측: 셋만 보임). */
  #dvmax.mx_v4 .mx_tabs { display: flex; width: 100%; padding: 3px; gap: 0; }
  #dvmax.mx_v4 .mx_tabs button { flex: 1 1 0; padding: 8px 4px; font-size: 13px; min-height: 44px; white-space: nowrap; }
  #dvmax.mx_v4 .mx_proof { padding: 56px 0 64px; } #dvmax.mx_v4 .mx_proof ul { grid-template-columns: 1fr; }
  #dvmax.mx_v4 .mx_proof li b { white-space: normal; }
}
@media (prefers-reduced-motion: reduce) {
  #dvmax.mx_v4 .mx_glow, #dvmax.mx_v4 .mx_blob, #dvmax.mx_v4 .mx_plate_in::after, #dvmax.mx_v4 .mx_plate_tag, #dvmax.mx_v4 .mx_case_k::after,
  #dvmax.mx_v4 .mx_cta .mx_pill::before, #dvmax.mx_v4 .mx_w, #dvmax.mx_v4 .mx_hero4 > .mx_wrap > p, #dvmax.mx_v4 .mx_hero4_act, #dvmax.mx_v4 .mx_hero4 .mx_plate,
  #dvmax.mx_v4 [data-rv="pop"].rv-wait.rv-in > *, #dvmax.mx_v4 .mx_flow[data-rv="pop"].rv-wait.rv-in .mx_stage { animation: none; }
  #dvmax.mx_v4 .mx_pill, #dvmax.mx_v4 .mx_hl { transition: none; }
  #dvmax.mx_v4 .mx_pill:hover { transform: none; }
}

/* ── 한건 장 (app/page/service/hangeon) — channel.io/kr/cos 의 두 구역 ── */
#dvmax.mx_v4 .hk_center { text-align: center; }
#dvmax.mx_v4 .hk_sec .mx_state_p { margin-bottom: 40px; }
/* 대화 시연 판 — 밝은 배경 그림(사용자 제공) 위에 창 하나 */
#dvmax.mx_v4 .hk_plate { position: relative; border-radius: 25px; padding: 48px; overflow: hidden;
  background: #e9eef7 url('/bg/hangeon-light.jpg') center / cover no-repeat; }
#dvmax.mx_v4 .hk_demo { max-width: 900px; margin: 0 auto; }
#dvmax.mx_v4 .hk_win { background: #fff; border-radius: 16px; box-shadow: 0 30px 80px rgba(21,34,56,.22); overflow: hidden; }
#dvmax.mx_v4 .hk_bar { display: flex; align-items: center; gap: 6px; height: 36px; padding: 0 14px; background: #f2f4f6; border-bottom: 1px solid #e5e8eb; }
#dvmax.mx_v4 .hk_bar i { width: 10px; height: 10px; border-radius: 50%; background: #d5dae0; display: block; }
#dvmax.mx_v4 .hk_bar span { margin-left: 10px; font-size: 12px; color: #62707e; }
#dvmax.mx_v4 .hk_body { padding: 26px 28px 28px; min-height: 420px; }
#dvmax.mx_v4 .hk_q { display: inline-block; max-width: 92%; margin: 0 0 18px auto; background: #111; color: #fff; border-radius: 12px 12px 4px 12px; padding: 14px 18px; font-size: 15px; line-height: 1.6; float: right; clear: both; }
#dvmax.mx_v4 .hk_caret { display: inline-block; width: 2px; height: 1em; background: #fff; margin-left: 2px; vertical-align: -2px; animation: hkCaret .8s steps(2) infinite; }
@keyframes hkCaret { to { opacity: 0; } }
#dvmax.mx_v4 .hk_steps { clear: both; list-style: none; margin: 0 0 18px; padding: 12px 16px; border: 1px solid #e5e8eb; border-radius: 10px; background: #fafbfc; font-size: 13px; color: #62707e; display: grid; gap: 6px; }
#dvmax.mx_v4 .hk_steps li { display: flex; gap: 8px; align-items: baseline; opacity: 0; transform: translateX(-6px); transition: opacity .35s ease, transform .35s ease; }
#dvmax.mx_v4 .hk_steps li.on { opacity: 1; transform: none; color: #191f28; }
#dvmax.mx_v4 .hk_steps li b { display: inline-block; width: 14px; color: #1a9e5c; font-weight: 800; }
#dvmax.mx_v4 .hk_p0 .hk_steps, #dvmax.mx_v4 .hk_p1 .hk_steps { display: none; }
#dvmax.mx_v4 .hk_ans p { margin: 0 0 12px; font-size: 15px; line-height: 1.7; color: #333d4b; }
#dvmax.mx_v4 .hk_verdict { font-weight: 700; color: #191f28; }
#dvmax.mx_v4 .hk_cites { list-style: none; margin: 10px 0 0; padding: 0; display: flex; flex-wrap: wrap; gap: 8px; }
#dvmax.mx_v4 .hk_cites li { font-size: 12.5px; font-weight: 700; color: #1f3f7a; background: #e8f0fb; border-radius: 6px; padding: 5px 10px; font-family: ui-monospace, Menlo, monospace; }
#dvmax.mx_v4 .hk_cites .hk_ev { background: #191f28; color: #fff; font-family: inherit; }
/* 답 단락·조문은 3단계부터 차례로 뜬다. 끝 상태(hk_p4)와 스크립트 없음은 다 보임 */
#dvmax.mx_v4 .hk_p1 .hk_ans, #dvmax.mx_v4 .hk_p2 .hk_ans { display: none; }
#dvmax.mx_v4 .hk_p3 .hk_ans p, #dvmax.mx_v4 .hk_p3 .hk_cites li { animation: mxPop .5s cubic-bezier(.22,.68,.24,1) both; animation-delay: calc(var(--i, 0) * .22s); }
#dvmax.mx_v4 .hk_p3 .hk_cites li { animation-delay: calc(var(--i, 0) * .12s + .7s); }
#dvmax.mx_v4 .hk_ctl { display: flex; justify-content: space-between; align-items: center; margin-top: 14px; font-size: 13px; color: #4e5968; }
#dvmax.mx_v4 .hk_ctl button { border: 1px solid #191f28; background: transparent; border-radius: 999px; padding: 8px 16px; min-height: 44px; font: inherit; font-size: 13px; font-weight: 600; cursor: pointer; color: #191f28; }
#dvmax.mx_v4 .hk_ctl button:hover { background: #191f28; color: #fff; }
/* 전/후 */
#dvmax.mx_v4 .hk_pair { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 0; }
#dvmax.mx_v4 .hk_card { margin: 0; border-radius: 20px; overflow: hidden; min-height: 460px; position: relative; }
#dvmax.mx_v4 .hk_dark { background: #152238 url('/bg/hangeon-dark.jpg') center / cover no-repeat; display: flex; align-items: center; padding: 40px; }
#dvmax.mx_v4 .hk_light { background: #f1efeb url('/bg/hangeon-light.jpg') center / cover no-repeat; padding: 40px 0 0 40px; }
/* 머리말 판과 같은 캡처지만 답 본문 쪽을 확대해 다른 부분을 보여 준다. */
#dvmax.mx_v4 .hk_light img { display: block; width: 100%; height: 420px; object-fit: cover; object-position: 62% 38%; border-radius: 12px 0 0 0; box-shadow: 0 24px 60px rgba(21,34,56,.25); }
#dvmax.mx_v4 .hk_bubbles { display: grid; gap: 14px; width: 100%; }
#dvmax.mx_v4 .hk_bb { margin: 0; max-width: 78%; padding: 14px 18px; border-radius: 14px; font-size: 15px; line-height: 1.55; word-break: keep-all; }
#dvmax.mx_v4 .hk_bb.me { background: #fff; color: #191f28; justify-self: end; border-bottom-right-radius: 4px; }
#dvmax.mx_v4 .hk_bb.them { background: #3e6fd8; color: #fff; justify-self: start; border-bottom-left-radius: 4px; }
#dvmax.mx_v4 .hk_pair.rv-wait .hk_bb { opacity: 0; } 
#dvmax.mx_v4 .hk_pair.rv-wait.rv-in .hk_bb { animation: mxPop .5s cubic-bezier(.22,.68,.24,1) both; animation-delay: calc(var(--i, 0) * .35s + .3s); }
#dvmax.mx_v4 .hk_lists { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 28px; }
#dvmax.mx_v4 .hk_lists h3 { display: flex; align-items: center; gap: 10px; font-size: 20px; font-weight: 700; margin: 0 0 6px; }
#dvmax.mx_v4 .hk_lists h3 i { display: inline-flex; width: 26px; height: 26px; border-radius: 50%; align-items: center; justify-content: center; font-size: 13px; font-style: normal; color: #fff; }
#dvmax.mx_v4 .hk_x { background: #191f28; } #dvmax.mx_v4 .hk_ok { background: #3e6fd8; }
#dvmax.mx_v4 .hk_lists ul { list-style: none; margin: 0; padding: 0; }
#dvmax.mx_v4 .hk_lists li { position: relative; padding: 16px 0 16px 34px; border-bottom: 1px solid #e5e8eb; font-size: 15px; color: #333d4b; }
#dvmax.mx_v4 .hk_lists li::before { position: absolute; left: 4px; top: 15px; font-weight: 800; }
#dvmax.mx_v4 .hk_no::before { content: '\\2715'; color: #191f28; } #dvmax.mx_v4 .hk_yes::before { content: '\\2713'; color: #3e6fd8; }
/* 모르면 모른다 */
#dvmax.mx_v4 .hk_honest { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.3fr); gap: 48px; align-items: center; padding: 48px; border-radius: 25px; background: #f1efeb; }
#dvmax.mx_v4 .hk_honest h3 { font-size: clamp(22px, 2.4vw, 30px); line-height: 1.3; margin: 0 0 12px; }
#dvmax.mx_v4 .hk_honest > div > p:last-child { font-size: 15px; color: #333d4b; margin: 0; }
#dvmax.mx_v4 .hk_honest blockquote { margin: 0; background: #fff; border-radius: 16px; padding: 24px 26px; box-shadow: 0 20px 50px rgba(21,34,56,.10); }
#dvmax.mx_v4 .hk_hq { margin: 0 0 14px; font-size: 14px; color: #62707e; padding-left: 12px; border-left: 3px solid #d5dae0; }
#dvmax.mx_v4 .hk_ha { margin: 0 0 10px; font-size: 16px; font-weight: 700; color: #191f28; line-height: 1.6; }
#dvmax.mx_v4 .hk_hn { margin: 0; font-size: 13.5px; color: #b3141a; }
/* Biz 수치·예시 */
#dvmax.mx_v4 .hk_show { margin: 40px 0 0; }
#dvmax.mx_v4 .hk_show_plate { position: relative; border-radius: 28px; overflow: hidden; display: grid; grid-template-columns: 320px 72px minmax(0, 520px); justify-content: center; align-items: center; padding: 72px 48px; min-height: 480px;
  background: #d9d3c6 url('/bg/hangeon-light.jpg') center/cover no-repeat; }
#dvmax.mx_v4 .hk_show_plate::before { content: ''; position: absolute; inset: 0; background: linear-gradient(180deg, rgba(36,42,52,.08), rgba(36,42,52,.40)); backdrop-filter: blur(6px); }
#dvmax.mx_v4 .hk_show_plate > * { position: relative; }
#dvmax.mx_v4 .hk_show_me { padding: 22px 24px; border-radius: 16px; background: rgba(255,255,255,.86); backdrop-filter: blur(10px); box-shadow: 0 14px 40px rgba(0,0,0,.14); }
#dvmax.mx_v4 .hk_show_me_t { margin: 0 0 12px; font-size: 13px; font-weight: 700; color: #62707e; }
#dvmax.mx_v4 .hk_show_me ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 10px; }
#dvmax.mx_v4 .hk_show_me li { display: grid; grid-template-columns: 40px 1fr; gap: 10px; font-size: 14px; align-items: baseline; }
#dvmax.mx_v4 .hk_show_me li span { color: #8b95a1; } #dvmax.mx_v4 .hk_show_me li b { color: #191f28; font-weight: 700; word-break: keep-all; }
#dvmax.mx_v4 .hk_show_link { display: block; height: 2px; background: repeating-linear-gradient(90deg, rgba(255,255,255,.9) 0 6px, transparent 6px 12px); }
#dvmax.mx_v4 .hk_show_link::after { content: ''; position: absolute; right: -4px; top: -4px; width: 10px; height: 10px; border-radius: 50%; background: #fff; box-shadow: 0 0 0 4px rgba(255,255,255,.35); }
#dvmax.mx_v4 .hk_show_plate .hk_bid { animation: hkSwap .38s cubic-bezier(.2,.75,.2,1); box-shadow: 0 24px 60px rgba(0,0,0,.22); }
@keyframes hkSwap { from { opacity: 0; transform: translateY(14px) scale(.98); } to { opacity: 1; transform: none; } }
#dvmax.mx_v4 .hk_show_tabs { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 40px; margin: 28px 0 0; align-items: start; }
#dvmax.mx_v4 .hk_show_tabs button { display: block; align-self: start; text-align: left; padding: 0; border: 0; background: transparent; cursor: pointer; color: #8b95a1; transition: color .25s; }
#dvmax.mx_v4 .hk_show_tabs button > b { display: block; margin-top: 18px; font-size: 20px; font-weight: 700; line-height: 1.35; word-break: keep-all; }
#dvmax.mx_v4 .hk_show_tabs button > span { display: block; margin-top: 10px; font-size: 15px; line-height: 1.65; color: #8b95a1; word-break: keep-all; transition: color .25s; }
#dvmax.mx_v4 .hk_show_tabs button.on { color: #191f28; } #dvmax.mx_v4 .hk_show_tabs button.on span { color: #4e5968; }
#dvmax.mx_v4 .hk_show_tabs button:hover { color: #4e5968; }
#dvmax.mx_v4 .hk_show_tabs button:focus-visible { outline: 2px solid #191f28; outline-offset: 4px; border-radius: 4px; }
#dvmax.mx_v4 .mx_showtabs .hk_show_tabs { margin-top: 24px; }
#dvmax.mx_v4 .mx_showtabs_plate { animation: hkSwap .45s cubic-bezier(.2,.75,.2,1); }
#dvmax.mx_v4 .hk_show_bar { display: block; height: 4px; border-radius: 999px; background: #e5e8eb; overflow: hidden; }
#dvmax.mx_v4 .hk_show_bar b { display: block; height: 100%; width: 0; margin: 0; border-radius: 999px; background: #191f28; animation: hkBar linear forwards; }
@keyframes hkBar { from { width: 0 } to { width: 100% } }
#dvmax.mx_v4 .hk_show_tabs button.on .hk_show_bar { background: #d7dce2; }
@media (hover: hover) { #dvmax.mx_v4 .hk_show:hover .hk_show_bar b { animation-play-state: paused; } }
#dvmax.mx_v4 .hk_bid { position: relative; padding: 22px 24px 22px 28px; border-radius: 12px; background: #fff; border: 1px solid #e5e8eb; box-shadow: 0 6px 24px rgba(21,34,56,.06); }
#dvmax.mx_v4 .hk_bid::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 5px; border-radius: 12px 0 0 12px; background: #1a9e5c; }
#dvmax.mx_v4 .hk_bid.no::before { background: #d71920; }
#dvmax.mx_v4 .hk_bid p, #dvmax.mx_v4 .hk_bid h4 { margin: 0; }
#dvmax.mx_v4 .hk_bid_src { font-size: 12px; font-weight: 700; color: #4e5968; display: flex; align-items: center; gap: 6px; }
#dvmax.mx_v4 .hk_bid_src i { width: 8px; height: 8px; border-radius: 2px; background: #1a9e5c; } #dvmax.mx_v4 .hk_bid.no .hk_bid_src i { background: #d71920; }
#dvmax.mx_v4 .hk_bid h4 { margin-top: 10px; font-size: 18px; font-weight: 700; color: #191f28; line-height: 1.4; }
#dvmax.mx_v4 .hk_bid_org { margin-top: 4px !important; font-size: 13px; color: #62707e; }
#dvmax.mx_v4 .hk_bid_price { margin-top: 12px !important; display: flex; align-items: baseline; gap: 8px; }
#dvmax.mx_v4 .hk_bid_price span { font-size: 12px; color: #62707e; } #dvmax.mx_v4 .hk_bid_price b { font-size: 22px; font-weight: 800; color: #191f28; font-variant-numeric: tabular-nums; }
#dvmax.mx_v4 .hk_bid_price em { margin-left: auto; font-style: normal; font-size: 12px; color: #4e5968; border: 1px solid #d7dce2; border-radius: 4px; padding: 2px 8px; }
#dvmax.mx_v4 .hk_bid_verdict { margin-top: 16px !important; padding: 10px 14px; border-radius: 8px; background: #f2fbf6; font-size: 14px; color: #333d4b; display: flex; gap: 12px; align-items: center; }
#dvmax.mx_v4 .hk_bid_verdict b { flex: none; padding: 3px 10px; border-radius: 6px; background: #fff; border: 1px solid #1a9e5c; color: #1a9e5c; font-size: 13px; }
#dvmax.mx_v4 .hk_bid.no .hk_bid_verdict { background: #fdf3f3; } #dvmax.mx_v4 .hk_bid.no .hk_bid_verdict b { border-color: #d71920; color: #b3141a; }
@media (max-width: 900px) {
  #dvmax.mx_v4 .hk_plate { padding: 16px; border-radius: 16px; }
  #dvmax.mx_v4 .hk_body { padding: 18px 16px 20px; min-height: 0; }
  #dvmax.mx_v4 .hk_pair, #dvmax.mx_v4 .hk_lists, #dvmax.mx_v4 .hk_honest { grid-template-columns: 1fr; }
  #dvmax.mx_v4 .hk_card { min-height: 320px; } #dvmax.mx_v4 .hk_dark { padding: 24px; } #dvmax.mx_v4 .hk_light { padding: 24px 0 0 24px; }
  #dvmax.mx_v4 .hk_honest { padding: 28px 20px; }
  #dvmax.mx_v4 .hk_show_plate { grid-template-columns: 1fr; gap: 18px; min-height: 0; padding: 24px 18px; border-radius: 18px; } #dvmax.mx_v4 .hk_show_link { display: none; }
  #dvmax.mx_v4 .hk_show_tabs { grid-template-columns: 1fr; gap: 18px; } #dvmax.mx_v4 .hk_show_tabs button > b { margin-top: 12px; font-size: 17px; }
}
@media (prefers-reduced-motion: reduce) {
  #dvmax.mx_v4 .hk_caret, #dvmax.mx_v4 .hk_p3 .hk_ans p, #dvmax.mx_v4 .hk_p3 .hk_cites li, #dvmax.mx_v4 .hk_pair.rv-wait.rv-in .hk_bb { animation: none; }
  #dvmax.mx_v4 .hk_steps li { transition: none; }
  #dvmax.mx_v4 .hk_show_plate .hk_bid { animation: none; }
}
` + PATTERN_CSS + PATTERN_CSS2 + PATTERN_CSS3
