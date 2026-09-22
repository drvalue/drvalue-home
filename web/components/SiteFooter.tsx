import { getMenu } from '@/lib/menu-cms'

const external = (href: string) => /^https?:\/\//.test(href)

/**
 * footer.php 의 <footer> 부분. 회사 정보는 고정값이라 그대로 옮긴다.
 * 링크 줄은 관리 화면 「메뉴 › 하단 링크」 값이다 — 비어 있으면(지금 기본값) 줄 자체를 안 그린다.
 * 클래스(footer_top · footer_links · footer_divider)는 PHP 시절 css/footer.css 에 있던 것을 쓴다.
 */
export default async function SiteFooter() {
  const { footer } = await getMenu()
  return (
    <footer id="toss_footer">
      <div className="footer_inner">
        {footer.length > 0 && (
          <>
            <nav className="footer_top" aria-label="하단 메뉴">
              <ul className="footer_links">
                {footer.map((l) => (
                  <li key={l.href + l.label}>
                    <a href={l.href} {...(external(l.href) ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
            <hr className="footer_divider" />
          </>
        )}
        <div className="footer_bottom">
          <address>
            <div className="addr_line">
              <span className="comp_name">(주)디알밸류</span>
              <span>대표자: 용미숙</span>
              <span>사업자등록번호: 491-87-02850</span>
            </div>
            <div className="addr_line">
              <span>경기도 안산시 상록구 한양대학로 55, 창업보육센터 318호</span>
              <span className="tel">전화: <a href="tel:031-400-3880">031-400-3880</a></span>
              <span className="email">이메일: <a href="mailto:hi@drvalue.co.kr">hi@drvalue.co.kr</a></span>
            </div>
          </address>
          <p className="copyright">
            Copyright © <strong>drvalue</strong>. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
