import { Injectable, Logger } from '@nestjs/common';
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { CommonError } from '../../../common/error/common-error';
import {
  issueSession,
  SessionPayload,
} from '../../../common/session/session-token';
import { AdminAuthError } from '../error/admin-auth.error';
import { authorize, describeGroups, IamClaims } from './authorize';

const STATE_TTL_MS = 10 * 60 * 1000;
// 30분. 만료되면 IAM 을 다시 다녀오며 그룹·역할이 새로 온다 — IAM 쪽 변경이 여기서 따라온다.
const SESSION_TTL_MS = 30 * 60 * 1000;

/**
 * 사내 IAM 으로 관리 화면에 로그인한다. Directus 확장 iam-bridge 를 옮긴 것.
 *
 *   login()    → IAM 로그인 주소 (state 를 서명해 같이 보낸다)
 *   callback() → code 를 IAM 토큰으로 바꾸고 claim(email·role·groups)으로 인가 → 세션
 *
 * state 는 `nonce.exp.sig`. IAM 이 되돌려주는 쿼리와 우리 쿠키 둘 중 하나만 맞으면
 * 된다 — IAM 은 state 를 되돌려주기도 안 주기도 하고, 호스트가 다르면 쿠키가 못
 * 따라온다(둘 다 실측). 토큰·code 는 로그에 남기지 않는다.
 */
@Injectable()
export class AdminAuthDefaultService {
  private readonly log = new Logger(AdminAuthDefaultService.name);

  readonly secret = process.env.ADMIN_SESSION_SECRET ?? '';
  private readonly iamBase = (process.env.ADMIN_IAM_BASE ?? '').replace(
    /\/+$/,
    '',
  );
  private readonly callbackUrl = process.env.ADMIN_IAM_CALLBACK_URL ?? '';
  private readonly rule = {
    group: process.env.ADMIN_IAM_GROUP ?? '',
    roles: (process.env.ADMIN_IAM_GROUP_ROLES ?? 'OWNER,ADMIN').split(','),
  };

  get configured(): boolean {
    return Boolean(this.iamBase && this.callbackUrl && this.secret);
  }

  /** IAM 로그인 주소와, 쿠키에 둘 서명된 state. */
  login(): { url: string; state: string; ttlMs: number } {
    if (!this.configured) throw new CommonError(AdminAuthError.NOT_CONFIGURED);
    const state = this.signState(
      `${randomBytes(24).toString('hex')}.${Date.now() + STATE_TTL_MS}`,
    );
    const url = new URL(`${this.iamBase}/auth/login`);
    url.searchParams.set('redirect_url', this.callbackUrl);
    url.searchParams.set('state', state);
    return { url: url.toString(), state, ttlMs: STATE_TTL_MS };
  }

  async callback(
    code: string,
    stateFromQuery: string,
    stateFromCookie: string,
  ): Promise<string> {
    if (!this.configured) throw new CommonError(AdminAuthError.NOT_CONFIGURED);
    if (
      !this.verifyState(stateFromQuery) &&
      !this.verifyState(stateFromCookie)
    ) {
      this.log.warn(
        `bad state (cookie=${stateFromCookie ? 'yes' : 'no'} query=${stateFromQuery ? 'yes' : 'no'})`,
      );
      throw new CommonError(AdminAuthError.BAD_STATE);
    }
    if (!code) throw new CommonError(AdminAuthError.EXCHANGE_FAILED);

    const [st, json] = await this.call(
      `${this.iamBase}/auth/token/exchange`,
      'POST',
      {
        code,
        redirectUri: this.callbackUrl,
      },
    );
    const iamToken: string | null =
      json?.access_token ?? json?.data?.access_token ?? null;
    if (!iamToken) {
      this.log.warn(`exchange ${st} keys=${this.keys(json)}`);
      throw new CommonError(AdminAuthError.EXCHANGE_FAILED);
    }

    // 사람: 토큰 claim 이 email·role·groups 를 들고 온다(실측). /api/v1/me 는 Bearer 로 302.
    const claims = this.decodeClaims(iamToken) ?? {};
    const email = String(claims.email ?? '')
      .trim()
      .toLowerCase();
    if (!email) {
      this.log.warn(`no email (claim keys=${this.keys(claims)})`);
      throw new CommonError(AdminAuthError.NO_EMAIL);
    }
    if (!authorize(claims, this.rule)) {
      this.log.warn(
        `denied role=${claims.role ?? '-'} groups=[${describeGroups(claims)}]`,
      );
      throw new CommonError(AdminAuthError.NOT_ALLOWED);
    }
    const payload: SessionPayload = {
      email,
      name:
        typeof (claims as { name?: unknown }).name === 'string'
          ? (claims as { name: string }).name
          : undefined,
      exp: Date.now() + SESSION_TTL_MS,
    };
    return issueSession(this.secret, payload);
  }

  sessionTtlMs(): number {
    return SESSION_TTL_MS;
  }

  private signState(state: string): string {
    return `${state}.${createHmac('sha256', this.secret).update(state).digest('hex')}`;
  }

  private verifyState(value: string | undefined): boolean {
    const [nonce, exp, sig] = String(value ?? '').split('.');
    if (!nonce || !exp || !sig) return false;
    if (!/^\d+$/.test(exp) || Number(exp) < Date.now()) return false;
    const a = Buffer.from(sig);
    const b = Buffer.from(
      createHmac('sha256', this.secret).update(`${nonce}.${exp}`).digest('hex'),
    );
    return a.length === b.length && timingSafeEqual(a, b);
  }

  private decodeClaims(jwt: string): IamClaims | null {
    try {
      return JSON.parse(
        Buffer.from(jwt.split('.')[1], 'base64url').toString(),
      ) as IamClaims;
    } catch {
      return null;
    }
  }

  private async call(
    url: string,
    method: string,
    body: unknown,
  ): Promise<[number, any]> {
    try {
      const res = await fetch(url, {
        method,
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(15_000),
      });
      const text = await res.text();
      try {
        return [res.status, text ? JSON.parse(text) : null];
      } catch {
        return [res.status, null];
      }
    } catch {
      return [0, null];
    }
  }

  private keys(obj: unknown): string {
    return obj && typeof obj === 'object'
      ? Object.keys(obj as object).join(',')
      : typeof obj;
  }
}
