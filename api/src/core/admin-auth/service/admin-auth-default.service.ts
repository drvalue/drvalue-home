import { Injectable, Logger } from '@nestjs/common';
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { AppConfig } from '../../../common/config/app-config';
import { CommonError } from '../../../common/error/common-error';
import { ServiceException } from '../../../common/error/service-exception.decorator';
import {
  issueSession,
  SessionPayload,
} from '../../../common/session/session-token';
import type { ITransactionContext } from '../../../common/typeorm/transaction-context';
import { AdminAuthError } from '../error/admin-auth.error';
import { AdminUserService } from './admin-user.service';
import { describeGroups, IamClaims, isIamAdmin } from './authorize';

const IAM_BASE = 'https://iam.drvalue.co.kr';
const STATE_TTL_MS = 10 * 60 * 1000;
// 30분. 만료되면 IAM 을 다시 다녀오며 그룹·역할이 새로 온다 — IAM 쪽 변경이 여기서 따라온다.
const SESSION_TTL_MS = 30 * 60 * 1000;

/** IAM 으로 보낼 주소와, 쿠키에 둘 서명된 state. */
export interface AdminAuthLoginStart {
  url: string;
  state: string;
  ttlMs: number;
}

/** 콜백이 만든 세션 토큰(쿠키 값)과 수명. */
export interface AdminAuthSession {
  token: string;
  ttlMs: number;
}

/**
 * 사내 IAM 으로 관리 화면에 로그인한다.
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
  private readonly logger = new Logger(AdminAuthDefaultService.name);

  constructor(private readonly adminUserService: AdminUserService) {}

  /** IAM 로그인 주소와 서명된 state. 설정(콜백 주소·세션 비밀)이 비면 503. */
  @ServiceException({ errorCode: AdminAuthError.LOGIN_UNKNOWN })
  async login(): Promise<AdminAuthLoginStart> {
    this.assertConfigured();
    const state = this.signState(
      `${randomBytes(24).toString('hex')}.${Date.now() + STATE_TTL_MS}`,
    );
    const url = new URL(`${IAM_BASE}/auth/login`);
    url.searchParams.set('redirect_url', AppConfig.iamCallbackUrl);
    url.searchParams.set('state', state);
    return { url: url.toString(), state, ttlMs: STATE_TTL_MS };
  }

  /**
   * IAM 이 돌려보낸 code 를 토큰으로 바꾸고, 토큰 최상위 role 로 입장을 정한다(결정 0015).
   * 관리자면 admin_users 를 받아 적고 세션을 만든다. 아니면 행을 끄고 403.
   * 트랜잭션으로 묶지 않는다 — 「관리자 아님」 반영(행 끄기)은 입장을 거부하며 던져도 남아야 한다.
   */
  @ServiceException({ errorCode: AdminAuthError.CALLBACK_UNKNOWN })
  async callback(
    ctx: ITransactionContext,
    code: string,
    stateFromQuery: string,
    stateFromCookie: string,
  ): Promise<AdminAuthSession> {
    this.assertConfigured();
    if (
      !this.verifyState(stateFromQuery) &&
      !this.verifyState(stateFromCookie)
    ) {
      this.logger.warn(
        `bad state (cookie=${stateFromCookie ? 'yes' : 'no'} query=${stateFromQuery ? 'yes' : 'no'})`,
      );
      throw CommonError.createByErrorCode(AdminAuthError.BAD_STATE);
    }
    if (!code)
      throw CommonError.createByErrorCode(AdminAuthError.EXCHANGE_FAILED);

    const claims = await this.exchange(code);
    const email = String(claims.email ?? '')
      .trim()
      .toLowerCase();
    if (!email) {
      this.logger.warn(`no email (claim keys=${this.keys(claims)})`);
      throw CommonError.createByErrorCode(AdminAuthError.NO_EMAIL);
    }
    const sub = String(claims.sub ?? '');
    const name = typeof claims.name === 'string' ? claims.name : undefined;

    // 입장은 IAM 이 정한다 — 최상위 role 이 ADMIN·PLATFORM_ADMIN 만. 그 판정을 admin_users 에 받아 적는다.
    if (!isIamAdmin(claims)) {
      await this.adminUserService.markNotAdmin(ctx, email);
      this.logger.warn(
        `denied: IAM 관리자가 아니다 role=${claims.role ?? '-'} groups=[${describeGroups(claims)}]`,
      );
      throw CommonError.createByErrorCode(AdminAuthError.NOT_ALLOWED);
    }
    const row = await this.adminUserService.syncAdmin(ctx, email, name, sub);
    this.logger.log(`admin login iamRole=${claims.role} scope=${row.role}`);
    const payload: SessionPayload = {
      email,
      sub: sub || undefined,
      role: row.role,
      name,
      exp: Date.now() + SESSION_TTL_MS,
    };
    return {
      token: issueSession(AppConfig.sessionSecret, payload),
      ttlMs: SESSION_TTL_MS,
    };
  }

  private assertConfigured(): void {
    if (!AppConfig.iamCallbackUrl || !AppConfig.sessionSecret)
      throw CommonError.createByErrorCode(AdminAuthError.NOT_CONFIGURED);
  }

  /**
   * code → IAM access_token → claim. 사람 정보는 토큰 claim 이 들고 온다(실측 — /api/v1/me 는 Bearer 로 302).
   * 교환이 안 되면 403 EXCHANGE_FAILED. 응답 본문은 로그에 싣지 않고 키 이름만.
   */
  private async exchange(code: string): Promise<IamClaims> {
    const [status, json] = await this.post(`${IAM_BASE}/auth/token/exchange`, {
      code,
      redirectUri: AppConfig.iamCallbackUrl,
    });
    const token = this.accessToken(json);
    if (!token) {
      this.logger.warn(`exchange ${status} keys=${this.keys(json)}`);
      throw CommonError.createByErrorCode(AdminAuthError.EXCHANGE_FAILED);
    }
    return this.decodeClaims(token) ?? {};
  }

  private accessToken(json: unknown): string | null {
    if (!json || typeof json !== 'object') return null;
    const j = json as {
      access_token?: unknown;
      data?: { access_token?: unknown };
    };
    const t = j.access_token ?? j.data?.access_token;
    return typeof t === 'string' && t ? t : null;
  }

  private signState(state: string): string {
    return `${state}.${createHmac('sha256', AppConfig.sessionSecret).update(state).digest('hex')}`;
  }

  private verifyState(value: string | undefined): boolean {
    const [nonce, exp, sig] = String(value ?? '').split('.');
    if (!nonce || !exp || !sig) return false;
    if (!/^\d+$/.test(exp) || Number(exp) < Date.now()) return false;
    const a = Buffer.from(sig);
    const b = Buffer.from(
      createHmac('sha256', AppConfig.sessionSecret)
        .update(`${nonce}.${exp}`)
        .digest('hex'),
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

  /** IAM 에 JSON POST. 네트워크 실패는 [0, null] — 호출자가 EXCHANGE_FAILED 로 바꾼다. */
  private async post(url: string, body: unknown): Promise<[number, unknown]> {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(15_000),
      });
      const text = await res.text();
      try {
        return [res.status, text ? (JSON.parse(text) as unknown) : null];
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
