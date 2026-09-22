import {
  CanActivate,
  createParamDecorator,
  ExecutionContext,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ADMIN_ROLES_KEY } from './roles.decorator';
import type { Request } from 'express';
import { AppConfig } from '../../../common/config/app-config';
import { CommonError } from '../../../common/error/common-error';
import {
  parseCookies,
  readSession,
  SessionPayload,
} from '../../../common/session/session-token';
import {
  ITransactionContext,
  TX_CONTEXT_KEY,
} from '../../../common/typeorm/transaction-context';
import { AdminAuthError } from '../error/admin-auth.error';
import { AdminUserService } from '../service/admin-user.service';

export const ADMIN_COOKIE = 'dv_admin';
/** admin_users 를 다시 보는 간격. 그 사이에 바꾸면 이만큼 늦게 따라온다. */
const RECHECK_MS = 60_000;

/**
 * 관리 API 의 문. 들어오는 길은 IAM 로그인이 만든 세션(dv_admin) 하나뿐이다.
 *
 * 1) 세션 쿠키가 서명·만료 모두 유효해야 한다(30분 — 만료되면 IAM 을 다시 다녀온다).
 * 2) 60초마다 admin_users(IAM 판정의 거울)를 다시 본다. 꺼지면 막히고 범위 변경도 따라온다.
 * 3) @AdminRoles() 가 붙은 곳은 그 역할만(admin 은 항상).
 */
@Injectable()
export class AdminSessionGuard implements CanActivate {
  private readonly logger = new Logger(AdminSessionGuard.name);
  private readonly checked = new Map<string, number>();

  constructor(
    private readonly adminUserService: AdminUserService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx
      .switchToHttp()
      .getRequest<Request & { admin?: SessionPayload }>();
    const session = readSession(
      AppConfig.sessionSecret,
      parseCookies(req.headers.cookie)[ADMIN_COOKIE],
    );
    if (session) {
      // 문맥은 미들웨어(DatabaseModule)가 가드보다 먼저 요청에 싣는다.
      const tx = (req as unknown as Record<string, unknown>)[
        TX_CONTEXT_KEY
      ] as ITransactionContext;
      await this.assertStillRegistered(tx, session);
      this.assertRole(ctx, session.role);
      req.admin = session;
      return true;
    }
    throw CommonError.createByErrorCode(AdminAuthError.UNAUTHORIZED);
  }

  /** @AdminRoles() 가 붙은 핸들러는 그 역할만. admin 은 항상. */
  private assertRole(ctx: ExecutionContext, role: string | undefined): void {
    const need = this.reflector.getAllAndOverride<string[] | undefined>(
      ADMIN_ROLES_KEY,
      [ctx.getHandler(), ctx.getClass()],
    );
    if (!need || need.length === 0) return;
    // 역할 없는 세션(옛 세션)은 아무 데도 못 간다 — 조용히 admin 으로 올리지 않는다.
    if (role === 'admin' || (role && need.includes(role))) return;
    throw CommonError.createByErrorCode(AdminAuthError.FORBIDDEN);
  }

  /** admin_users 행이 없거나 꺼지면(IAM 관리자 해제) 세션이 남아 있어도 60초 안에 막힌다. 범위 변경도 여기서 따라온다. */
  private async assertStillRegistered(
    tx: ITransactionContext,
    session: SessionPayload,
  ): Promise<void> {
    const key = `users:${session.email}`;
    if (Date.now() - (this.checked.get(key) ?? 0) < RECHECK_MS) return;
    const row = await this.adminUserService.find(tx, session.email);
    if (!row || !row.enabled) {
      this.logger.warn('admin_users 에서 빠진 사용자: 세션 거부');
      throw CommonError.createByErrorCode(AdminAuthError.NOT_ALLOWED);
    }
    session.role = row.role;
    this.checked.set(key, Date.now());
  }
}

export const AdminUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): SessionPayload => {
    return ctx.switchToHttp().getRequest<Request & { admin: SessionPayload }>()
      .admin;
  },
);
