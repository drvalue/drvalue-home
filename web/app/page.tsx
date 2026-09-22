import ClientAction from '@/components/ClientAction'
import SiteFooter from '@/components/SiteFooter'
import SiteHeader from '@/components/SiteHeader'
import HomeBiz from './home/HomeBiz'
import HomeHero from './home/HomeHero'
import HomeNews from './home/HomeNews'
import HomeProof from './home/HomeProof'
import { HOME_ADD_CSS } from './home/homeStyles'
import { latestNews } from './home/news'
import { pageMeta } from '@/lib/seo'

/** 소식 카드가 CMS 저장 즉시 보이게 요청마다 그린다(home/news.ts). */
export const dynamic = 'force-dynamic'


/**
 * /index.php 를 옮긴 것. 화면은 뿌리(`/`)에 둔다 — `app/index.php/` 로
 * 만들면 파일이 리다이렉트를 이겨서 홈이 조용히 두 개가 된다.
 * 옛 주소는 lib/dvRoutes.mjs 의 308 이 받는다.
 *
 * 페이지 전용 CSS 는 원본의 <style> 블록을 문자열로 들고 있다. 파일로 빼면
 * 로드 순서가 바뀌어 우선순위가 달라진다. 이관 판정이 끝난 뒤에 정리한다.
 *
 * **원본에 없는 것이 둘 붙어 있다** — 소식(CMS) 카드와 신뢰의 근거 카드다.
 * 그래서 이 화면만은 PHP 원본과 글자 단위로 같지 않다. 대신 원본에 있던
 * 것이 그대로 남아 있는지는 scripts/check-home.py 가 따로 잰다.
 */

const PATH = '/'

export const metadata = pageMeta({
  title: '제조 AI·DX 구축',
  description:
    'MES/ERP 구축, 제조 AI 자동화, LLM/RAG 기반 AI Chat, 상담 솔루션. 특허·출원 6건·저작권 5건·수행실적 9건으로 검증된 제조 AI·DX 파트너, 디알밸류.',
  path: PATH,
})

const PAGE_CSS = `
/* ── 새로 붙인 두 구역(소식·신뢰의 근거)의 꾸밈 ──────────────────────
   운영 css/style.css 는 층(layer)이 없어서 유틸리티 클래스보다 우선한다.
   그래서 여기 있는 규칙은 전부 구역 id/class 로 감싼다 — 감싸지 않으면
   이 화면의 규칙이 다른 화면까지 따라간다. */

.dvnews, .dvproof { padding: 90px 0; }
.dvnews { background: #f7f9fa; }
.dvproof { background: #fff; }
.dvnews .dvnews_head, .dvproof .dvnews_head, .dvbiz .dvnews_head {
  display: flex; align-items: flex-end; justify-content: space-between; gap: 20px; margin-bottom: 30px; }
.dvnews .dvnews_kicker, .dvproof .dvnews_kicker, .dvbiz .dvnews_kicker {
  display: block; font-size: 14px; font-weight: 800; color: #d71920; letter-spacing: .12em; margin-bottom: 8px; }
.dvnews .dvnews_head h3, .dvproof .dvnews_head h3, .dvbiz .dvnews_head h3 {
  font-size: 34px; font-weight: 800; letter-spacing: -1px; margin: 0; color: #191f28; }
.dvnews .dvnews_all, .dvproof .dvnews_all {
  flex: 0 0 auto; font-size: 15px; font-weight: 700; color: #4e5968; text-decoration: none;
  display: inline-flex; align-items: center; gap: 6px; padding-bottom: 4px; border-bottom: 1px solid #c9d1d9;
  transition: color .16s, border-color .16s; }
.dvnews .dvnews_all:hover, .dvproof .dvnews_all:hover { color: #d71920; border-color: #d71920; }

/* 고르개 — 소식과 신뢰의 근거가 같은 모양을 쓴다 */
.dvnews .dvnews_tabs, .dvproof .dvproof_tabs { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 26px; }
.dvnews .dvnews_tab, .dvproof .dvproof_tab {
  appearance: none; font-family: inherit; cursor: pointer; font-size: 15px; font-weight: 700;
  border: 1px solid #dfe5ea; background: #fff; color: #4e5968; padding: 9px 18px; border-radius: 100px;
  display: inline-flex; align-items: center; gap: 7px; transition: background .16s, color .16s, border-color .16s; }
.dvproof .dvproof_tab { background: #f7f9fa; }
.dvnews .dvnews_tab:hover, .dvproof .dvproof_tab:hover { border-color: #191f28; color: #191f28; }
.dvnews .dvnews_tab.is-on, .dvproof .dvproof_tab.is-on { background: #191f28; border-color: #191f28; color: #fff; }
.dvnews .dvnews_n, .dvproof .dvproof_n {
  font-size: 12px; font-weight: 800; background: rgba(0,0,0,.07); border-radius: 100px; padding: 1px 7px; }
.dvnews .dvnews_tab.is-on .dvnews_n, .dvproof .dvproof_tab.is-on .dvproof_n { background: rgba(255,255,255,.2); }
.dvnews .dvnews_tab:focus-visible, .dvproof .dvproof_tab:focus-visible { outline: 3px solid #d71920; outline-offset: 2px; }

/* 소식 목록 — 한 줄에 분류 · 제목 · 날짜. 카드는 세 장만 보여 답답했다. */
.dvnews .dvnews_list { list-style: none; padding: 0; margin: 0; border-top: 1px solid #dde5ec; }
.dvnews .dvnews_row { animation: dvrise .42s ease both; border-bottom: 1px solid #e8eef3; }
.dvnews .dvnews_row > a {
  display: grid; grid-template-columns: 92px minmax(0,1fr) auto 18px; align-items: center; gap: 18px;
  padding: 20px 6px; text-decoration: none; color: inherit; min-height: 64px;
  transition: background-color .16s; }
.dvnews .dvnews_row > a:hover { background: #fff; }
.dvnews .dvnews_badge {
  justify-self: start; font-size: 12.5px; font-weight: 800; border-radius: 100px; padding: 4px 12px; white-space: nowrap; }
.dvnews .dvnews_badge.is-notice { background: #eef2f7; color: #3d5a80; }
.dvnews .dvnews_badge.is-press { background: #fdeced; color: #d71920; }
.dvnews .dvnews_row h4 {
  font-size: 17.5px; font-weight: 700; line-height: 1.45; letter-spacing: -.4px; margin: 0;
  color: #191f28; word-break: keep-all; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dvnews .dvnews_row > a:hover h4 { color: #d71920; }
.dvnews .dvnews_date { font-size: 13.5px; color: #8b97a4; font-weight: 600; font-variant-numeric: tabular-nums; white-space: nowrap; }
.dvnews .dvnews_arrow { color: #b0bac5; font-size: 16px; transition: transform .16s, color .16s; }
.dvnews .dvnews_row > a:hover .dvnews_arrow { color: #d71920; transform: translateX(3px); }
.dvnews .dvnews_empty { color: #8b97a4; font-size: 16px; padding: 30px 0; margin: 0; }

/* 신뢰의 근거 카드 */
.dvproof .dvproof_grid {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 22px; list-style: none; padding: 0; margin: 0; }
.dvproof .dvproof_card {
  position: relative; background: #f9fafb; border: 1px solid #eef1f4; border-radius: 20px;
  padding: 30px 28px 26px; animation: dvrise .42s ease both;
  transition: transform .2s, box-shadow .2s, background .2s; }
.dvproof .dvproof_card::before {
  content: ''; position: absolute; left: 28px; right: 28px; top: 0; height: 3px; border-radius: 0 0 3px 3px;
  background: #3d5a80; transform: scaleX(0); transform-origin: left; transition: transform .26s ease; }
.dvproof .dvproof_card:hover { transform: translateY(-8px); background: #fff; box-shadow: 0 22px 44px rgba(25,31,40,.09); }
.dvproof .dvproof_card:hover::before { transform: scaleX(1); }
.dvproof .dvproof_card.is-cert::before { background: #3d5a80; }
.dvproof .dvproof_card.is-award::before { background: #d71920; }
.dvproof .dvproof_card.is-partner::before { background: #0f9d58; }
.dvproof .dvproof_ico {
  display: inline-flex; width: 48px; height: 48px; border-radius: 14px; align-items: center;
  justify-content: center; font-size: 21px; background: #fff; border: 1px solid #e5eaef; color: #3d5a80; }
.dvproof .dvproof_card.is-award .dvproof_ico { color: #d71920; }
.dvproof .dvproof_card.is-partner .dvproof_ico { color: #0f9d58; }
.dvproof .dvproof_kind {
  display: inline-block; margin-left: 10px; vertical-align: 14px; font-size: 12.5px; font-weight: 800;
  color: #6b7684; letter-spacing: .06em; }
.dvproof .dvproof_card h4 {
  font-size: 18px; font-weight: 800; line-height: 1.45; letter-spacing: -.5px; margin: 18px 0 0;
  color: #191f28; word-break: keep-all; }
.dvproof .dvproof_card p { margin: 9px 0 0; font-size: 15px; color: #6b7684; line-height: 1.6; word-break: keep-all; }

.dvproof .dvproof_card[hidden] { display: none !important; }

/* 사업영역 카드 — 메인에서 비즈니스로 가는 유일한 입구다 */
.dvbiz { background: #f7f9fa; }
.dvbiz .dvbiz_grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 22px; list-style: none; padding: 0; margin: 0; }
.dvbiz .dvbiz_card { animation: dvrise .42s ease both; }
.dvbiz .dvbiz_card > a {
  display: flex; flex-direction: column; height: 100%; background: #fff; border: 1px solid #eaeff3;
  border-radius: 20px; padding: 32px 30px 26px; text-decoration: none; color: inherit;
  transition: transform .22s, box-shadow .22s, border-color .22s; }
.dvbiz .dvbiz_card.is-on > a {
  transform: translateY(-10px); box-shadow: 0 26px 50px rgba(25,31,40,.12); border-color: #dde5ec; }
.dvbiz .dvbiz_ico {
  display: inline-flex; width: 54px; height: 54px; border-radius: 16px; align-items: center;
  justify-content: center; font-size: 23px; background: #f2f6fa; color: #3d5a80;
  transition: background .22s, color .22s; }
.dvbiz .dvbiz_card.is-on .dvbiz_ico { background: #d71920; color: #fff; }
.dvbiz .dvbiz_kicker {
  display: block; margin-top: 20px; font-size: 12px; font-weight: 800; letter-spacing: .1em; color: #8b97a4; }
.dvbiz .dvbiz_card h4 {
  font-size: 23px; font-weight: 800; letter-spacing: -.6px; margin: 6px 0 0; color: #191f28; }
.dvbiz .dvbiz_card > a > p {
  margin: 10px 0 0; font-size: 15px; color: #6b7684; line-height: 1.65; word-break: keep-all; }
.dvbiz .dvbiz_points { margin: 18px 0 0; padding: 0; list-style: none; }
.dvbiz .dvbiz_points li {
  position: relative; padding-left: 15px; margin-bottom: 5px; font-size: 14.5px; color: #4e5968; }
.dvbiz .dvbiz_points li::before {
  content: ''; position: absolute; left: 0; top: 10px; width: 7px; height: 2px; background: #3d5a80; }
.dvbiz .dvbiz_go {
  margin-top: auto; padding-top: 20px; font-size: 14px; font-weight: 700; color: #d71920;
  display: inline-flex; align-items: center; gap: 5px; }

/* 문의 유도 띠 — 원본은 여기서 끝나고 아무 행동도 안 시켰다 */
.dvcta { background: #191f28; color: #fff; padding: 72px 0; text-align: center; }
.dvcta h3 { font-size: 30px; font-weight: 800; letter-spacing: -.8px; margin: 0; word-break: keep-all; }
.dvcta p { margin: 12px 0 0; font-size: 16px; color: #aeb8c4; }
.dvcta .dvcta_btn {
  margin-top: 28px; background: #d71920; color: #fff; border: 0; font-family: inherit;
  font-weight: 800; font-size: 16px; padding: 16px 44px; border-radius: 10px; cursor: pointer;
  transition: transform .18s, box-shadow .18s, background .18s; }
.dvcta .dvcta_btn:hover { background: #ef2630; transform: translateY(-3px); box-shadow: 0 14px 30px rgba(215,25,32,.35); }
.dvcta .dvcta_btn:focus-visible { outline: 3px solid #fff; outline-offset: 3px; }

@keyframes dvrise { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }

@media (max-width: 1024px) {
  .dvproof .dvproof_grid, .dvbiz .dvbiz_grid { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 700px) {
  .dvnews, .dvproof, .dvbiz { padding: 60px 0; }
  .dvcta { padding: 56px 0; }
  .dvnews .dvnews_head, .dvproof .dvnews_head, .dvbiz .dvnews_head { flex-direction: column; align-items: flex-start; gap: 12px; }
  .dvnews .dvnews_head h3, .dvproof .dvnews_head h3, .dvbiz .dvnews_head h3 { font-size: 26px; }
  .dvcta h3 { font-size: 24px; }
  .dvproof .dvproof_grid, .dvbiz .dvbiz_grid { grid-template-columns: 1fr; }
  .dvnews .dvnews_row > a { grid-template-columns: minmax(0,1fr) 18px; grid-template-areas: "b a" "t a" "d a"; row-gap: 6px; }
  .dvnews .dvnews_badge { grid-area: b; } .dvnews .dvnews_row h4 { grid-area: t; white-space: normal; }
  .dvnews .dvnews_date { grid-area: d; } .dvnews .dvnews_arrow { grid-area: a; }
}
@media (prefers-reduced-motion: reduce) {
  .dvnews .dvnews_row, .dvproof .dvproof_card, .dvbiz .dvbiz_card { animation: none; }
  .dvnews .dvnews_row > a, .dvnews .dvnews_arrow, .dvproof .dvproof_card, .dvproof .dvproof_card::before,
  .dvbiz .dvbiz_card > a, .dvbiz .dvbiz_ico, .dvcta .dvcta_btn { transition: none; }
}
`

export default async function Page() {
  // CMS 가 죽어도 빈 배열이 온다. 메인이 같이 죽지 않는다.
  const news = await latestNews(6)

  return (
    <>
      <SiteHeader currentPath={PATH} />

<style dangerouslySetInnerHTML={{ __html: PAGE_CSS }} />
<style dangerouslySetInnerHTML={{ __html: HOME_ADD_CSS }} />

<div id="toss_container">
    {/* 원본 홈의 머리 그림은 swiper 두 장짜리로 들어 있다가 주석으로 꺼져
        있었다. 글은 그대로 살리고 슬라이드만 뺐다 — 자세한 이유는
        home/HomeHero.tsx 주석에 적었다. */}
    <HomeHero />

    <section className="t_section dvproof" aria-labelledby="dvproof_h">
        <div className="t_inner">
            <div className="dvnews_head">
                <div>
                    <span className="dvnews_kicker">CREDENTIALS</span>
                    <h3 id="dvproof_h">말보다 먼저 쌓아 온 것들</h3>
                </div>
                <a className="dvnews_all" href="/page/company/history">
                    연혁 전체 보기<i className="fa fa-angle-right" />
                </a>
            </div>
            <div data-rv>
                <HomeProof />
            </div>
        </div>
    </section>

    <section className="t_section dvbiz" aria-labelledby="dvbiz_h">
        <div className="t_inner">
            <div className="dvnews_head">
                <div>
                    <span className="dvnews_kicker">BUSINESS</span>
                    <h3 id="dvbiz_h">무엇을 만드는가</h3>
                </div>
            </div>
            <div data-rv>
                <HomeBiz />
            </div>
        </div>
    </section>

    <section className="t_section dvnews" aria-labelledby="dvnews_h">
        <div className="t_inner">
            <div className="dvnews_head">
                <div>
                    <span className="dvnews_kicker">NEWS</span>
                    <h3 id="dvnews_h">디알밸류의 최근 소식</h3>
                </div>
                <a className="dvnews_all" href="/page/support/notice">
                    전체 보기<i className="fa fa-angle-right" />
                </a>
            </div>
            <div data-rv>
                <HomeNews items={news} />
            </div>
        </div>
    </section>

    <section className="dvcta">
        <div className="t_inner">
            <h3>우리 공장에, 우리 업무에 맞는 구성이 궁금하신가요?</h3>
            <p>현장 상황을 알려주시면 맞는 방식을 제안해 드립니다.</p>
            <ClientAction type="button" className="dvcta_btn" calls={[{ fn: 'openContactModal' }]}>
                문의하기
            </ClientAction>
        </div>
    </section>
</div>


      <SiteFooter />
    </>
  )
}
