import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

/**
 * 사내 IAM 로그인 다리.
 *
 *   GET /iam-bridge/login     → state 를 서명해 쿠키에 두고 IAM 으로 보낸다
 *   GET /iam-bridge/callback  → code 를 IAM 토큰으로 바꾸고, 인가를 통과하면
 *                                Directus 계정으로 세션을 발급한다
 *   GET /iam-bridge/status    → 켜짐 여부와 설정 유무만 (값은 안 내보낸다)
 *
 * 인가 — 셋 중 하나라도 통과하면 된다. 아무것도 설정하지 않으면 전부 거부한다.
 *   1) IAM_BRIDGE_GROUP: IAM 토큰의 groups 에 그 그룹이 있고 역할이
 *      IAM_BRIDGE_GROUP_ROLES(기본 OWNER,ADMIN) 안에 있다. PLATFORM_ADMIN 은 통과.
 *      = 「drvalue 테넌트의 root 사용자」. 게이트웨이를 안 거친다.
 *   2) IAM_BRIDGE_ROUTE_BASE: 게이트웨이 root/iam · tenant/by-root 가 성공한다.
 *      지금 닿는 게이트웨이는 x-user-* 를 요구해 403 이라 비워 둔다.
 *   3) IAM_BRIDGE_ACCOUNTS 에 이메일이 있다.
 *
 * 계정 — 통과한 사람은 IAM_BRIDGE_ACCOUNTS 의 매핑, 없으면
 * IAM_BRIDGE_DEFAULT_ACCOUNT 로 들어간다. Directus 는 seat 가 3이라 여러 사람이
 * 한 계정을 쓴다. 활동 기록은 그 계정으로 찍힌다.
 *
 * 비밀번호는 HMAC-SHA256(SECRET, "iam-bridge:<이메일>") 이다
 * (scripts/iam_bridge_sync.py 가 같은 값으로 맞춰 둔다). 로그인은 Directus 의
 * AuthenticationService 를 그대로 쓴다 — 세션·활동 기록·정지 처리가 로컬과 같다.
 *
 * 토큰·코드는 로그에 남기지 않는다. 거부할 때 그룹 id·역할은 남긴다 —
 * 처음 붙일 때 어떤 값을 IAM_BRIDGE_GROUP 에 넣을지 그걸로 안다.
 */

const STATE_COOKIE = 'iam_bridge_state';
const STATE_TTL_MS = 10 * 60 * 1000;

export default {
  id: 'iam-bridge',
  handler(router, { services, getSchema, env, logger }) {
    const cfg = () => ({
      enabled: String(env.IAM_BRIDGE_ENABLED ?? '').toLowerCase() === 'true',
      iamBase: String(env.IAM_BRIDGE_IAM_BASE ?? '').replace(/\/+$/, ''),
      routeBase: String(env.IAM_BRIDGE_ROUTE_BASE ?? '').replace(/\/+$/, ''),
      callbackUrl: String(env.IAM_BRIDGE_CALLBACK_URL ?? ''),
      tenantCode: String(env.IAM_BRIDGE_TENANT_CODE ?? ''),
      accounts: parseAccounts(String(env.IAM_BRIDGE_ACCOUNTS ?? '')),
      defaultAccount: String(env.IAM_BRIDGE_DEFAULT_ACCOUNT ?? '').trim().toLowerCase(),
      group: String(env.IAM_BRIDGE_GROUP ?? '').trim().toLowerCase(),
      groupRoles: String(env.IAM_BRIDGE_GROUP_ROLES ?? 'OWNER,ADMIN')
        .split(',').map((r) => r.trim().toUpperCase()).filter(Boolean),
      secret: String(env.SECRET ?? ''),
    });

    const cookieOpts = () => ({
      httpOnly: true,
      sameSite: 'lax',
      secure: Boolean(env.SESSION_COOKIE_SECURE),
      domain: env.SESSION_COOKIE_DOMAIN || undefined,
      path: '/',
    });

    router.get('/status', (_req, res) => {
      const c = cfg();
      res.json({
        enabled: c.enabled,
        configured: Boolean(c.iamBase && c.callbackUrl && (c.defaultAccount || c.accounts.size)),
        authz: { group: Boolean(c.group), gateway: Boolean(c.routeBase), allowlist: c.accounts.size > 0 },
      });
    });

    router.get('/login', (req, res) => {
      const c = cfg();
      if (!c.enabled || !c.iamBase || !c.callbackUrl) {
        return res.status(503).json({ error: 'iam bridge is off' });
      }
      const nonce = randomBytes(24).toString('hex');
      const exp = Date.now() + STATE_TTL_MS;
      const state = `${nonce}.${exp}`;
      res.cookie(STATE_COOKIE, `${state}.${sign(c.secret, state)}`, {
        ...cookieOpts(),
        maxAge: STATE_TTL_MS,
      });
      const url = new URL(`${c.iamBase}/auth/login`);
      url.searchParams.set('redirect_url', c.callbackUrl);
      url.searchParams.set('state', state);
      return res.redirect(url.toString());
    });

    router.get('/callback', async (req, res) => {
      const c = cfg();
      if (!c.enabled) return res.status(503).json({ error: 'iam bridge is off' });

      const fail = (why, status = 403) => {
        res.clearCookie(STATE_COOKIE, cookieOpts());
        return res.status(status).json({ error: why });
      };

      try {
      // 1) state — 우리가 보낸 쿠키가 유효해야 한다. IAM 이 state 를 되돌려주면
      //    그것까지 맞아야 하고, 안 돌려주면(PHP 는 redirect_url 만 보냈다) 쿠키만 본다.
      const cookie = parseCookie(req.headers.cookie)[STATE_COOKIE] ?? '';
      const given = String(req.query.state ?? '');
      const stateOk = verifyState(c.secret, cookie, given || null);
      if (!stateOk) {
        logger.warn(`iam-bridge: bad state (cookie=${cookie ? 'yes' : 'no'} query=${given ? 'yes' : 'no'})`);
        return fail('bad state');
      }
      if (!given) logger.warn('iam-bridge: IAM did not echo state; cookie only');

      const code = String(req.query.code ?? '');
      if (!code) {
        logger.warn(`iam-bridge: callback without code (query keys=${Object.keys(req.query).join(',')})`);
        return fail('missing code', 400);
      }

      // 2) code → IAM 토큰
      const [st1, j1] = await call(`${c.iamBase}/auth/token/exchange`, 'POST', {
        code,
        redirectUri: c.callbackUrl,
      });
      const iamToken = j1?.access_token ?? j1?.data?.access_token ?? null;
      if (!iamToken) {
        logger.warn(`iam-bridge: exchange ${st1} keys=${keys(j1)}`);
        return fail('exchange failed');
      }

      // 3) 사람 — 토큰 claim 을 읽고, IAM 의 me 로 서버 쪽에서 한 번 더 확인한다.
      //    (claim 만으로 인가하지 않는다 — iam-core 문서: 서명 검증은 게이트웨이 몫)
      const claims = decodeClaims(iamToken) ?? {};
      let me = null;
      for (const path of ['/api/v1/me', '/auth/me']) {
        const [st, j] = await call(`${c.iamBase}${path}`, 'GET', null, iamToken);
        if (st === 200 && j && typeof j === 'object') { me = j.data && typeof j.data === 'object' ? j.data : j; break; }
        if (st === 401 || st === 403) { logger.warn(`iam-bridge: me ${st} at ${path} — 방금 교환한 토큰이라 claim 으로 진행`); break; }
      }
      if (!me) logger.warn(`iam-bridge: me unavailable, using token claims (keys=${keys(claims)})`);
      const user = me ?? claims;
      const email = String(user.email ?? claims.email ?? '').trim().toLowerCase();
      if (!email) {
        logger.warn(`iam-bridge: no email (me keys=${keys(me)} claim keys=${keys(claims)})`);
        return fail('no email');
      }
      const groups = Array.isArray(user.groups) ? user.groups : Array.isArray(claims.groups) ? claims.groups : [];
      const role = String(user.role ?? claims.role ?? '').toUpperCase();

      // 4) 인가
      let allowed = false;
      if (c.group) {
        const hit = groups.find((g) => [g?.id, g?.name, g?.slug, g?.code].some((v) => String(v ?? '').toLowerCase() === c.group));
        allowed = role === 'PLATFORM_ADMIN' || (Boolean(hit) && c.groupRoles.includes(String(hit.role ?? '').toUpperCase()));
      }
      if (!allowed && c.routeBase) allowed = await gatewayCheck(c, iamToken, logger);
      if (!allowed && c.accounts.has(email)) allowed = true;
      if (!allowed) {
        // 값이 아니라 모양만 — 처음 붙일 때 IAM_BRIDGE_GROUP 에 무엇을 넣을지 여기서 본다.
        const shape = groups.map((g) => `${g?.id ?? '?'}${g?.name ? '(' + g.name + ')' : ''}:${g?.role ?? '?'}`).join(' ');
        logger.warn(`iam-bridge: denied role=${role || '-'} groups=[${shape}] authz=${c.group ? 'group' : ''}${c.routeBase ? '+gateway' : ''}${c.accounts.size ? '+allowlist' : ''}`);
        return fail('not allowed');
      }

      // 5) Directus 계정
      const directusEmail = c.accounts.get(email) ?? c.defaultAccount;
      if (!directusEmail) {
        logger.warn(`iam-bridge: no directus account — set IAM_BRIDGE_DEFAULT_ACCOUNT`);
        return fail('no account');
      }

      // 6) 파생 비밀번호로 Directus 로그인 (session 모드)
      const accountability = {
        ip: req.ip,
        userAgent: req.get('user-agent') ?? null,
        origin: req.get('origin') ?? null,
        role: null,
      };
      const auth = new services.AuthenticationService({
        accountability,
        schema: await getSchema(),
      });
      let accessToken;
      try {
        ({ accessToken } = await auth.login(
          'default',
          { email: directusEmail, password: derive(c.secret, directusEmail) },
          { session: true },
        ));
      } catch (e) {
        // 파생값이 안 맞으면 iam_bridge_sync.py 를 안 돌린 것이다.
        logger.warn(`iam-bridge: directus login failed (${e?.code ?? e?.name ?? 'error'}) — scripts/iam_bridge_sync.py 를 돌렸나`);
        return fail('directus login failed');
      }

      res.clearCookie(STATE_COOKIE, cookieOpts());
      res.cookie(env.SESSION_COOKIE_NAME || 'directus_session_token', accessToken, {
        httpOnly: true,
        domain: env.SESSION_COOKIE_DOMAIN || undefined,
        maxAge: ms(env.SESSION_COOKIE_TTL || '1d'),
        secure: Boolean(env.SESSION_COOKIE_SECURE),
        sameSite: env.SESSION_COOKIE_SAME_SITE || 'strict',
      });
      return res.redirect('/admin');
      } catch (e) {
        // Express 4 는 async 예외를 못 잡는다. 안 잡으면 요청이 매달린다.
        logger.error(`iam-bridge: callback failed (${e?.message ?? e})`);
        return fail('internal', 500);
      }
    });
  },
};

// ── helpers ────────────────────────────────────────────────────────────

function parseAccounts(raw) {
  const map = new Map();
  for (const entry of raw.split(',')) {
    const [iam, directus] = entry.split(':').map((s) => s.trim().toLowerCase());
    if (iam && directus) map.set(iam, directus);
  }
  return map;
}

function sign(secret, value) {
  return createHmac('sha256', secret).update(value).digest('hex');
}

function derive(secret, email) {
  return createHmac('sha256', secret).update(`iam-bridge:${email.trim().toLowerCase()}`).digest('hex');
}

function verifyState(secret, cookie, given) {
  const [nonce, exp, sig] = cookie.split('.');
  if (!nonce || !exp || !sig) return false;
  const state = `${nonce}.${exp}`;
  if (given !== null && given !== state) return false;
  if (Number(exp) < Date.now()) return false;
  const a = Buffer.from(sig);
  const b = Buffer.from(sign(secret, state));
  return a.length === b.length && timingSafeEqual(a, b);
}

function parseCookie(header) {
  const out = {};
  for (const part of String(header ?? '').split(';')) {
    const i = part.indexOf('=');
    if (i > 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}

function decodeClaims(jwt) {
  try {
    return JSON.parse(Buffer.from(String(jwt).split('.')[1], 'base64url').toString());
  } catch {
    return null;
  }
}

/** 게이트웨이로 테넌트 root 권한 확인. PHP notice_login_callback.php 의 2)·3) 그대로. */
async function gatewayCheck(c, iamToken, logger) {
  const [st3, j3] = await call(`${c.routeBase}/auth/v1/login/root/iam`, 'POST', {}, iamToken);
  const appToken = j3?.data?.accessToken ?? null;
  if (!appToken || st3 < 200 || st3 >= 300) {
    logger.warn(`iam-bridge: root/iam ${st3} keys=${keys(j3)}`);
    return false;
  }
  const headers = c.tenantCode ? { 'X-Tenant-Code': c.tenantCode } : {};
  const [st4, j4] = await call(`${c.routeBase}/auth/v1/login/tenant/by-root`, 'POST', {}, appToken, headers);
  if (!j4?.data?.accessToken || st4 < 200 || st4 >= 300) {
    logger.warn(`iam-bridge: by-root ${st4} keys=${keys(j4)}`);
    return false;
  }
  return true;
}

async function call(url, method, body = null, token = null, extra = {}) {
  const headers = { Accept: 'application/json', ...extra };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== null) headers['Content-Type'] = 'application/json';
  try {
    const res = await fetch(url, {
      method,
      headers,
      body: body === null ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(15_000),
    });
    const text = await res.text();
    let json = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      json = null;
    }
    return [res.status, json];
  } catch {
    return [0, null];
  }
}

function keys(obj) {
  return obj && typeof obj === 'object' ? Object.keys(obj).join(',') : typeof obj;
}

function ms(ttl) {
  const m = /^(\d+)([smhd])$/.exec(String(ttl).trim());
  if (!m) return 24 * 60 * 60 * 1000;
  return Number(m[1]) * { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 }[m[2]];
}
