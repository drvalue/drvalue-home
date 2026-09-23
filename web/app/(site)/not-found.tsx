import ClientAction from '@/components/ClientAction'
import type { Metadata } from 'next'
import SiteFooter from '@/components/SiteFooter'
import SiteHeader from '@/components/SiteHeader'
import { SITE_NAME } from '@/lib/seo'

/**
 * 없는 주소·없는 글(notFound). 상태는 404 이고 Next 가 noindex 를 붙인다 — 여기서 robots 를 또 적으면
 * robots 메타가 두 줄이 된다(실측).
 * 기본 영어 화면(「This page could not be found.」) 대신 사이트 껍데기 안에서 한국어로 —
 * 막다른 길이 아니라 갈 곳 셋을 준다.
 */
export const metadata: Metadata = {
  title: `페이지를 찾을 수 없습니다 | ${SITE_NAME}`,
}

/* 이 장 전용 CSS — 이름이 PAGE_CSS 여야 check-src 가 본다. */
const PAGE_CSS = `
.nf_wrap { max-width: 720px; margin: 0 auto; padding: 180px 20px 120px; text-align: center; }
.nf_code { font-size: 15px; font-weight: 700; color: #d71920; letter-spacing: 2px; }
.nf_wrap h1 { margin: 12px 0 14px; font-size: 36px; font-weight: 800; line-height: 1.3; letter-spacing: -1px; color: #191f28; word-break: keep-all; }
.nf_wrap p { font-size: 17px; line-height: 1.65; color: #4e5968; word-break: keep-all; }
.nf_act { display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; margin-top: 30px; }
.nf_act a { display: inline-flex; align-items: center; min-height: 46px; padding: 0 20px; border-radius: 999px; border: 1px solid #d1d6db; color: #333d4b; font-weight: 700; text-decoration: none; }
.nf_act a.is-main { background: #d71920; border-color: #d71920; color: #fff; }
@media (max-width: 700px) { .nf_wrap { padding: 140px 16px 96px; } .nf_wrap h1 { font-size: 28px; } }
`

export default function NotFound() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PAGE_CSS }} />
      <SiteHeader currentPath="" />
      <main className="nf_wrap">
        <p className="nf_code">404</p>
        <h1>페이지를 찾을 수 없습니다</h1>
        <p>주소가 바뀌었거나 글이 내려갔을 수 있습니다. 아래에서 찾던 곳으로 가 보세요.</p>
        <div className="nf_act">
          <a className="is-main" href="/">홈으로</a>
          <a href="/page/support/notice">공지사항</a>
          <ClientAction as="a" calls={[{ fn: 'openContactModal' }]}>문의하기</ClientAction>
        </div>
      </main>
      <SiteFooter />
    </>
  )
}
