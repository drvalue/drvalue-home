/**
 * 로그인은 사내 IAM 만. 버튼 하나. 자동으로 보내지 않는다 — 로그아웃 직후 IAM 세션이
 * 살아 있으면 자동 이동은 곧 재로그인이다.
 */
export default async function AdminLogin({
  searchParams,
}: {
  searchParams: Promise<{ signed_out?: string }>
}) {
  const { signed_out } = await searchParams
  return (
    <div className="dva_login">
      <div className="dva_login_box">
        <h1>디알밸류 관리</h1>
        {signed_out === '1' ? <p>로그아웃됐습니다.</p> : <p>사내 IAM 계정으로 들어갑니다.</p>}
        <a className="dva_btn is-primary" href="/api/admin/auth/login">사내 IAM 으로 로그인</a>
      </div>
    </div>
  )
}
