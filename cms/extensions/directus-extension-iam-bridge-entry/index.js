/**
 * 관리 화면 로그인을 IAM 으로만 되게 한다.
 *
 * Directus 는 로그인 화면을 못 바꾼다(Core). 그래서 두 가지를 한다.
 *   1) 세션 쿠키 없이 /admin · /admin/login 을 열면 /iam-bridge/login 으로 보낸다.
 *   2) 브라우저에서 오는 POST /auth/login(이메일·비밀번호 폼)을 403 으로 막는다.
 *      브라우저 요청은 Origin 헤더가 붙는다. 스크립트(curl·python)는 안 붙어
 *      그대로 통과한다 — smoke·seed·service_account 가 그 길로 들어간다.
 *
 *   3) 관리 앱에 스크립트를 심는다(embed). SPA 가 자기 안에서 /admin/login 으로
 *      옮겨 가도(세션 만료·로그아웃) 폼을 그리기 전에 IAM 으로 보낸다.
 *      1)·2) 는 서버가 받는 요청만 잡고, 이 경우는 서버를 안 거치기 때문이다.
 *
 * IAM 이 죽어 아무도 못 들어가면: IAM_BRIDGE_ENABLED=false 로 재기동 → 로컬 폼.
 * (계정 비밀번호는 파생값이라 관리 화면에서 다시 정하려면 scripts 로 바꾼다.)
 *
 * middlewares.before 여야 한다 — /admin 정적 핸들러가 routes.before 보다 먼저 붙는다.
 */
const EMBED = `<script>
(function () {
  // 관리 앱 안에서 /admin/login 으로 가면 폼 대신 IAM 으로. 서버 훅이 못 보는 자리다.
  var last = '';
  function check() {
    var p = location.pathname;
    if (p === last) return;
    last = p;
    if (/\/admin\/login\/?$/.test(p)) location.replace('/iam-bridge/login');
  }
  check();
  setInterval(check, 200);
  window.addEventListener('popstate', check);
})();
</script>`;

export default ({ init, embed }, { env, logger }) => {
  if (String(env.IAM_BRIDGE_ENABLED ?? '').toLowerCase() === 'true') embed('head', EMBED);

  init('middlewares.before', ({ app }) => {
    const enabled = () => String(env.IAM_BRIDGE_ENABLED ?? '').toLowerCase() === 'true';
    const hasSession = (req) => {
      const name = env.SESSION_COOKIE_NAME || 'directus_session_token';
      return String(req.headers.cookie ?? '')
        .split(';')
        .some((c) => c.trim().startsWith(`${name}=`));
    };

    app.get(['/admin', '/admin/'], (req, res, next) => {
      if (!enabled() || hasSession(req)) return next();
      return res.redirect('/iam-bridge/login');
    });
    // 세션이 있어도 /admin/login 을 여는 경우는 죽은 쿠키(로그아웃 실패·세션 만료)뿐이다.
    // 쿠키를 보고 통과시키면 폼이 계속 뜬다 — 무조건 IAM 으로.
    app.get('/admin/login', (_req, res, next) => {
      if (!enabled()) return next();
      return res.redirect('/iam-bridge/login');
    });

    app.post('/auth/login', (req, res, next) => {
      if (!enabled() || !req.headers.origin) return next();
      logger.warn('iam-bridge-entry: 브라우저 비밀번호 로그인 시도를 막았다');
      return res.status(403).json({
        errors: [{ message: '사내 IAM 으로 로그인하세요. 새로고침하면 IAM 로그인으로 갑니다.', extensions: { code: 'IAM_ONLY' } }],
      });
    });

    logger.info('iam-bridge-entry: /admin → IAM, 브라우저 비밀번호 로그인 차단');
  });
};
