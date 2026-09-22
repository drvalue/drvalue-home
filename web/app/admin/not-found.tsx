import Link from 'next/link'

/** 관리 화면의 없는 주소·없는 글. 관리 화면 껍데기(메뉴) 안에 그린다 — 상태는 404. */
export default function AdminNotFound() {
  return (
    <>
      <div className="dva_head">
        <h1>화면을 찾을 수 없습니다</h1>
      </div>
      <div className="dva_card dva_empty_card">
        <p>주소가 바뀌었거나 지워진 글일 수 있습니다. 왼쪽 메뉴나 아래 단추로 이동해 주세요.</p>
        <div className="dva_actions">
          <Link href="/admin" className="dva_btn is-primary">
            관리 홈으로
          </Link>
        </div>
      </div>
    </>
  )
}
