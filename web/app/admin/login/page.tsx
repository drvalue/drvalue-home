import './login.css'

/**
 * 로그인은 사내 IAM 만. 버튼 하나. 자동으로 보내지 않는다 — 로그아웃 직후 IAM 세션이
 * 살아 있으면 자동 이동은 곧 재로그인이다.
 *
 * 왼쪽은 「무엇을 관리하는 화면인가」, 오른쪽은 행동 하나. 꾸밈은 login.css 뿐이고
 * 그림은 브랜드 로고 두 장(public/brand)만 쓴다.
 */
const YEAR = new Date().getFullYear()

/**
 * 로그인이 실패하면 api 가 `?error=<에러 코드>` 로 돌려보낸다. 문구는 여기서 코드로 고른다 —
 * 주소에 실린 문구를 그대로 띄우면 누구나 이 화면에 아무 말이나 쓸 수 있다.
 */
const LOGIN_ERRORS: Record<string, string> = {
  ADMIN_AUTH_NOT_ALLOWED:
    '관리자 계정이 아닙니다. 사내 IAM 에서 관리자로 지정된 계정만 들어올 수 있습니다. 권한이 필요하면 IAM 담당자에게 요청해 주세요.',
  ADMIN_AUTH_BAD_STATE: '로그인 요청 시간이 지났습니다. 다시 로그인해 주세요.',
  ADMIN_AUTH_EXCHANGE_FAILED: 'IAM 로그인을 확인하지 못했습니다. 다시 로그인해 주세요.',
  ADMIN_AUTH_NO_EMAIL: 'IAM 계정에 이메일이 없어 들어올 수 없습니다. IAM 담당자에게 문의해 주세요.',
  ADMIN_AUTH_NOT_CONFIGURED: '로그인 설정이 끝나지 않았습니다. 사이트 담당자에게 알려 주세요.',
}
const LOGIN_ERROR_DEFAULT = '로그인하지 못했습니다. 잠시 후 다시 시도해 주세요.'

export default async function AdminLogin({
  searchParams,
}: {
  searchParams: Promise<{ signed_out?: string; error?: string }>
}) {
  const { signed_out, error } = await searchParams
  const errorText = error ? (LOGIN_ERRORS[error] ?? LOGIN_ERROR_DEFAULT) : null
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
            <li>뉴스</li>
            <li>보도자료</li>
            <li>채용</li>
            <li>FAQ</li>
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
          {signed_out === '1' && !errorText && <span className="dva_auth_badge">로그아웃되었습니다.</span>}
          {errorText && (
            <p className="dva_auth_alert" role="alert">
              {errorText}
            </p>
          )}
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
