/**
 * 관리 화면 입구를 IAM 로그인으로 돌린다.
 *
 * Directus 는 로그인 화면을 못 바꾼다(Core). 대신 세션 쿠키 없이 /admin 이나
 * /admin/login 을 열면 /iam-bridge/login 으로 보낸다. 관리 화면은 SPA 라
 * 첫 로드만 서버를 거친다 — 로그아웃 뒤 SPA 안에서 옮겨 간 /login 은 로컬 폼이
 * 보이고, 새로고침하면 다시 IAM 으로 간다.
 *
 * 로컬 폼이 필요할 때(스크립트·비상): /admin/login?local=1
 * IAM_BRIDGE_ENABLED 가 아니면 아무것도 안 한다.
 *
 * middlewares.before 여야 한다 — /admin 정적 핸들러가 routes.before 보다 먼저 붙는다.
 */
export default ({ init }, { env, logger }) => {
  init('middlewares.before', ({ app }) => {
    app.get(['/admin', '/admin/', '/admin/login'], (req, res, next) => {
      if (String(env.IAM_BRIDGE_ENABLED ?? '').toLowerCase() !== 'true') return next();
      if (req.query.local !== undefined) return next();
      const name = env.SESSION_COOKIE_NAME || 'directus_session_token';
      const cookies = String(req.headers.cookie ?? '');
      if (cookies.split(';').some((c) => c.trim().startsWith(`${name}=`))) return next();
      return res.redirect('/iam-bridge/login');
    });
    logger.info('iam-bridge-entry: /admin → IAM 로그인 (세션 없을 때)');
  });
};
