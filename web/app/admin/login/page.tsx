import './login.css'

/**
 * 로그인은 사내 IAM 만. 버튼 하나. 자동으로 보내지 않는다 — 로그아웃 직후 IAM 세션이
 * 살아 있으면 자동 이동은 곧 재로그인이다.
 *
 * 왼쪽은 「무엇을 관리하는 화면인가」, 오른쪽은 행동 하나. 꾸밈은 login.css 뿐이고
 * 그림은 브랜드 로고 두 장(public/brand)만 쓴다.
 */
const YEAR = new Date().getFullYear()

export default async function AdminLogin({
  searchParams,
}: {
  searchParams: Promise<{ signed_out?: string }>
}) {
  const { signed_out } = await searchParams
  return (
    <main className="dva_auth">
      <section className="dva_auth_brand" aria-label="디알밸류 관리 화면 소개">
        <img
          className="dva_auth_logo"
          src="/brand/logo-drvalue-white.png"
          alt="디알밸류"
          width={592}
          height={140}
        />
        <div>
          <h2>홈페이지에 올라가는 글과 문의를 여기서 다룹니다.</h2>
          <p>저장하면 사이트에 바로 반영됩니다. 로그인은 사내 IAM 계정으로만 합니다.</p>
          <ul className="dva_auth_scope" aria-label="관리하는 것">
            <li>공지사항</li>
            <li>보도자료</li>
            <li>특허</li>
            <li>저작권</li>
            <li>수행실적</li>
            <li>연혁</li>
            <li>문의</li>
          </ul>
        </div>
        <p className="dva_auth_foot">© {YEAR} 디알밸류 · 관리 화면</p>
      </section>

      <section className="dva_auth_side" aria-label="로그인">
        <div className="dva_auth_card">
          <img
            className="dva_auth_logo"
            src="/brand/logo-drvalue-red.png"
            alt=""
            width={592}
            height={137}
            aria-hidden="true"
          />
          {signed_out === '1' && <span className="dva_auth_badge">로그아웃됐습니다</span>}
          <h1>디알밸류 관리</h1>
          <p>사내 IAM 계정으로 들어갑니다. 아이디·비밀번호는 IAM 에서 묻습니다.</p>
          <a className="dva_auth_btn" href="/api/admin/auth/login">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="11" width="18" height="10" rx="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            사내 IAM 으로 로그인
          </a>
          <p className="dva_auth_note">
            사내 IAM 계정이 있고 관리 권한이 있어야 들어올 수 있습니다. 권한이 없다고 나오면
            담당자에게 알려 주세요.
          </p>
        </div>
      </section>
    </main>
  )
}
