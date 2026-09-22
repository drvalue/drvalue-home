import {
  CanActivate,
  createParamDecorator,
  ExecutionContext,
  Injectable,
  Logger,
} from '@nestjs/common';
import type { Request } from 'express';
import { IamUserService } from '@drvalue-oss/iam-nestjs';
import { CommonError } from '../../../common/error/common-error';
import {
  parseCookies,
  readSession,
  SessionPayload,
} from '../../../common/session/session-token';
import { AdminAuthError } from '../error/admin-auth.error';
import { MaxRootService } from '../service/max-root.service';

export const ADMIN_COOKIE = 'dv_admin';
/** IAM 에 사용자 상태를 다시 묻는 간격. 그 사이에 비활성화되면 이만큼 늦게 막힌다. */
const RECHECK_MS = 60_000;

/**
 * 관리 API 의 문.
 *
 * 1) 세션 쿠키(dv_admin)가 유효해야 한다. 30분짜리라 만료되면 IAM 을 다시 다녀온다 —
 *    그때 그룹·역할이 새로 온다. 우리 DB 에 IAM 사용자를 저장하지 않는다.
 * 2) IAM 내부 API 가 설정돼 있으면 60초마다 그 사람이 아직 살아 있는지(enabled) 묻는다.
 *    IAM 에서 지우거나 비활성화하면 세션이 남아 있어도 막힌다 — PHP 때 없던 것.
 * 3) ADMIN_API_TOKEN 이 있고 `Authorization: Bearer <값>` 이 오면 통과 — 검사 스크립트용.
 */
@Injectable()
export class AdminSessionGuard implements CanActivate {
  private readonly log = new Logger(AdminSessionGuard.name);
  private readonly checked = new Map<string, number>();
  private lookupAvailable: boolean | null = null;

  constructor(
    private readonly iamUserService: IamUserService,
    private readonly maxRootService: MaxRootService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx
      .switchToHttp()
      .getRequest<Request & { admin?: SessionPayload }>();
    const secret = process.env.ADMIN_SESSION_SECRET ?? '';
    const session = readSession(
      secret,
      parseCookies(req.headers.cookie)[ADMIN_COOKIE],
    );
    if (session) {
      await this.assertStillRoot(session);
      await this.assertStillEnabled(session.email);
      req.admin = session;
      return true;
    }
    const token = process.env.ADMIN_API_TOKEN;
    const given = String(req.headers.authorization ?? '').replace(
      /^Bearer\s+/i,
      '',
    );
    if (token && given && given === token) {
      req.admin = { email: 'script@local', exp: Number.MAX_SAFE_INTEGER };
      return true;
    }
    throw new CommonError(AdminAuthError.UNAUTHORIZED);
  }

  /** M.AX root 표에서 빠지면 세션이 남아 있어도 60초 안에 막힌다. */
  private async assertStillRoot(session: SessionPayload): Promise<void> {
    if (!this.maxRootService.configured) return;
    const key = `max:${session.email}`;
    if (Date.now() - (this.checked.get(key) ?? 0) < RECHECK_MS) return;
    const root = await this.maxRootService.isTenantRoot(
      session.sub ?? '',
      session.email,
    );
    if (root === false) {
      this.log.warn('M.AX root 표에서 빠진 사용자: 세션 거부');
      throw new CommonError(AdminAuthError.NOT_ALLOWED);
    }
    // 'unavailable' 은 로그인 때와 달리 세션을 끊지 않는다 — 이미 통과한 사람을 DB 장애로
    // 쫓아내지는 않되, 캐시를 안 늘려 다음 요청에 다시 본다.
    if (root === true) this.checked.set(key, Date.now());
  }

  private async assertStillEnabled(email: string): Promise<void> {
    if (this.lookupAvailable === false) return;
    const last = this.checked.get(email) ?? 0;
    if (Date.now() - last < RECHECK_MS) return;
    try {
      const user = await this.iamUserService.lookup({ email });
      this.lookupAvailable = true;
      if (!user.enabled) {
        this.log.warn(`iam user disabled: session rejected`);
        throw new CommonError(AdminAuthError.NOT_ALLOWED);
      }
      this.checked.set(email, Date.now());
    } catch (e) {
      if (e instanceof CommonError) throw e;
      const status = (e as { status?: number })?.status;
      if (status === 404) {
        this.log.warn(`iam user not found: session rejected`);
        throw new CommonError(AdminAuthError.NOT_ALLOWED);
      }
      // 내부 API 가 설정 안 됐거나 안 닿는다. 한 번만 알리고 30분 재검만 남긴다.
      if (this.lookupAvailable === null) {
        this.lookupAvailable = false;
        this.log.warn(
          `IAM 내부 API 로 사용자 상태를 못 본다 (${(e as Error)?.message ?? e}). 세션 만료(30분) 재검만 동작한다.`,
        );
      }
    }
  }
}

export const AdminUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): SessionPayload => {
    return ctx.switchToHttp().getRequest<Request & { admin: SessionPayload }>()
      .admin;
  },
);
