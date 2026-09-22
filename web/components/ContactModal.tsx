'use client'

import ClientAction from '@/components/ClientAction'

/**
 * header.php 의 문의 모달. 마크업을 그대로 옮긴 것이다 — 손으로 옮기면
 * 필드 하나가 조용히 빠진다.
 *
 * 열고 닫기와 전송은 headerAssets.ts 의 jQuery 가 맡는다(header.php 와 같다).
 * 전송 대상만 mail_send.php 에서 Nest 의 POST /api/inquiry 로 바뀌었다 —
 * 네이버 클라우드 서명은 브라우저로 옮길 수 없는 서버 코드다.
 */
export default function ContactModal() {
  return (
      <div id="dvModalOverlay" className="dv_modal_overlay" role="dialog" aria-modal="true" aria-hidden="true" aria-labelledby="contactModalTitle">
          <div className="dv_modal_window">
              <div className="dv_modal_head">
                  <h3 id="contactModalTitle">프로젝트 문의</h3>
                  <ClientAction type="button" className="dv_btn_close" aria-label="문의 모달 닫기" calls={[{ fn: 'closeContactModal' }]}>{"\u00d7"}</ClientAction>
              </div>
              <form id="dvContactForm" className="dv_contact_form">
                  <div className="form_group">
                      <label htmlFor="dvq_name">회사명 / 성함</label>
                      <input id="dvq_name" type="text" name="user_name" autoComplete="organization" placeholder="디알밸류 / 홍길동" required={true} />
                  </div>
                  <div className="form_group">
                      <label htmlFor="dvq_tel">연락처</label>
                      <input id="dvq_tel" type="tel" inputMode="tel" name="user_tel" autoComplete="tel" placeholder="010-0000-0000" required={true} />
                  </div>
                  <div className="form_group">
                      <label htmlFor="dvq_email">이메일</label>
                      <input id="dvq_email" type="email" inputMode="email" name="user_email" autoComplete="email" placeholder="name@company.com" required={true} />
                  </div>
                  <div className="form_group">
                      <label htmlFor="dvq_type">문의 유형</label>
                      {/* 원본은 <option selected> 다. React 는 그것을 오류로 막고
                          <select defaultValue> 를 쓰라고 한다 — 내보내는 HTML 은
                          같고(선택 표시는 브라우저가 상태로 들고 있다) 콘솔만
                          조용해진다. */}
                      <select id="dvq_type" name="user_type" required={true} defaultValue="">
                          <option value="" disabled={true}>문의 유형을 선택해주세요.</option>
                          <option value="지원사업">지원사업</option>
                          <option value="CutON(레이저 견적)">CutON (레이저 견적)</option>
                          <option value="growchat(채팅 솔루션)">growchat (채팅 솔루션)</option>
                          <option value="솔루션 도입 문의">솔루션 도입 문의</option>
                          <option value="기타">기타</option>
                      </select>
                  </div>
                  <div className="form_group">
                      <label htmlFor="dvq_msg">문의 내용</label>
                      <textarea id="dvq_msg" name="user_msg" rows={4} placeholder="문의하실 내용을 입력해주세요." required={true}></textarea>
                  </div>
                  <button type="submit" id="dvSubmitBtn" className="dv_btn_submit">메일 발송하기</button>
              </form>
          </div>
      </div>
  )
}
