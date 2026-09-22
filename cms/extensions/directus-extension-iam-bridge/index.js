import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

/**
 * 사내 IAM 로그인 다리.
 *
 *   GET /iam-bridge/login     → state 를 서명해 쿠키에 두고 IAM 으로 보낸다
 *   GET /iam-bridge/callback  → code 를 IAM 토큰으로 바꾸고, 이메일이 허용 목록에
 *                                있으면 그 Directus 계정으로 세션을 발급한다
 *   GET /iam-bridge/status    → 켜짐 여부와 설정 유무만 (값은 안 내보낸다)
 *
 * 인가는 IAM_BRIDGE_ACCOUNTS 목록이다. IAM_BRIDGE_ROUTE_BASE 를 채우면
 * 게이트웨이의 root/iam · tenant/by-root 로 테넌트 root 권한까지 확인한다.
 *
 * Directus 계정 비밀번호는 HMAC-SHA256(SECRET, "iam-bridge:<이메일>") 이다
 * (scripts/iam_bridge_sync.py 가 같은 값으로 맞춰 둔다). 그래서 로그인은
 * Directus 의 AuthenticationService 를 그대로 쓴다 — 세션·활동 기록·정지 처리가
 * 로컬 로그인과 같다.
 *
 * 토큰·코드는 로그에 남기지 않는다. 실패는 IAM 응답의 키 이름까지만 남긴다.
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
        configured: Boolean(c.iamBase && c.callbackUrl && c.accounts.size),
        tenant_check: Boolean(c.routeBase),
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

      // 1) state — 우리가 보낸 것이어야 하고, 아직 유효해야 한다.
      const cookie = parseCookie(req.headers.cookie)[STATE_COOKIE] ?? '';
      const given = String(req.query.state ?? '');
      if (!verifyState(c.secret, cookie, given)) return fail('bad state');

      const code = String(req.query.code ?? '');
      if (!code) return fail('missing code', 400);

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

      // 3) 이메일 — 토큰 안에 있으면 그것, 없으면 /auth/me
      let email = claim(iamToken, 'email');
      if (!email) {
        const [st2, j2] = await call(`${c.iamBase}/auth/me`, 'GET', null, iamToken);
        email = j2?.email ?? j2?.data?.email ?? null;
        if (!email) {
          logger.warn(`iam-bridge: me ${st2} keys=${keys(j2)}`);
          return fail('no email');
        }
      }
      email = String(email).trim().toLowerCase();

      // 4) (선택) 게이트웨이로 테넌트 root 권한 확인
      if (c.routeBase) {
        const [st3, j3] = await call(`${c.routeBase}/auth/v1/login/root/iam`, 'POST', {}, iamToken);
        const appToken = j3?.data?.accessToken ?? null;
        if (!appToken || st3 < 200 || st3 >= 300) {
          logger.warn(`iam-bridge: root/iam ${st3} keys=${keys(j3)}`);
          return fail('tenant check failed');
        }
        const headers = c.tenantCode ? { 'X-Tenant-Code': c.tenantCode } : {};
        const [st4, j4] = await call(
          `${c.routeBase}/auth/v1/login/tenant/by-root`,
          'POST',
          {},
          appToken,
          headers,
        );
        if (!j4?.data?.accessToken || st4 < 200 || st4 >= 300) {
          logger.warn(`iam-bridge: by-root ${st4} keys=${keys(j4)}`);
          return fail('tenant denied');
        }
      }

      // 5) 허용 목록 → Directus 계정
      const directusEmail = c.accounts.get(email);
      if (!directusEmail) {
        logger.warn(`iam-bridge: unmapped iam user`);
        return fail('not allowed');
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
  if (given !== state) return false;
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

function claim(jwt, name) {
  try {
    const payload = JSON.parse(Buffer.from(String(jwt).split('.')[1], 'base64url').toString());
    return payload?.[name] ?? null;
  } catch {
    return null;
  }
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
