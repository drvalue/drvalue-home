/** footer.php 의 <footer> 부분. 내용이 전부 고정값이라 그대로 옮긴다. */
export default function SiteFooter() {
  return (
    <footer id="toss_footer">
      <div className="footer_inner">
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
