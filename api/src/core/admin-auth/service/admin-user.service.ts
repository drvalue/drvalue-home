import { Injectable, Logger } from '@nestjs/common';
import { AdminUserEntity } from '../../../common/entity/admin-user.entity';
import { ServiceException } from '../../../common/error/service-exception.decorator';
import type { ITransactionContext } from '../../../common/typeorm/transaction-context';
import { AdminAuthError } from '../error/admin-auth.error';
import { AdminUserDefaultRepository } from '../repository/admin-user-default.repository';

/**
 * admin_users — IAM 관리자 판정의 거울. 로그인 때마다 IAM 이 준 판정을 받아 적는다.
 *
 *   IAM 관리자(PLATFORM_ADMIN) 로그인 → 행을 만들거나 갱신(enabled=true, 이름, IAM id, 시각).
 *                                         처음이면 범위 role='admin'. 이미 있으면 범위는 그대로.
 *   IAM 관리자가 아닌 로그인           → 행이 있으면 enabled=false. 입장은 거부(호출자가).
 *
 * 입장은 IAM 이 정하고, 여기의 role 은 CMS 안에서 고칠 수 있는 범위만 정한다.
 * 가드는 60초마다 이 행을 다시 본다 — 범위를 바꾸면 곧 따라오고, 꺼진 행은 막힌다.
 * 다른 모듈(가드 · 문의 담당자)이 이 서비스로 읽는다.
 */
@Injectable()
export class AdminUserService {
  private readonly logger = new Logger(AdminUserService.name);

  constructor(
    private readonly adminUserDefaultRepository: AdminUserDefaultRepository,
  ) {}

  /** 이메일로 한 사람(대소문자 무시). 없으면 null. */
  @ServiceException({ errorCode: AdminAuthError.USER_UNKNOWN })
  async find(
    ctx: ITransactionContext,
    email: string,
  ): Promise<AdminUserEntity | null> {
    return this.adminUserDefaultRepository.findByEmail(ctx, email);
  }

  /** 켜진 사람 전부 — 문의 담당자로 고를 수 있는 사람. */
  @ServiceException({ errorCode: AdminAuthError.USER_UNKNOWN })
  async listEnabled(ctx: ITransactionContext): Promise<AdminUserEntity[]> {
    return this.adminUserDefaultRepository.findEnabled(ctx);
  }

  /** IAM 관리자로 들어왔다. 행을 만들거나 갱신한다. 범위(role)는 처음에만 admin. */
  @ServiceException({ errorCode: AdminAuthError.USER_UNKNOWN })
  async syncAdmin(
    ctx: ITransactionContext,
    email: string,
    name: string | undefined,
    sub: string,
  ): Promise<AdminUserEntity> {
    const e = email.toLowerCase();
    const row =
      (await this.adminUserDefaultRepository.findByEmail(ctx, e)) ??
      this.adminUserDefaultRepository.newRow(ctx, {
        email: e,
        role: 'admin',
        enabled: true,
        name: null,
      });
    row.enabled = true;
    if (name) row.name = name;
    row.iamSub = sub || row.iamSub || null;
    row.lastLoginOn = new Date();
    row.updatedOn = new Date();
    return this.adminUserDefaultRepository.save(ctx, row);
  }

  /** IAM 이 관리자가 아니라고 했다. 행이 있으면 끈다(다음 가드 재검에서 세션도 막힌다). */
  @ServiceException({ errorCode: AdminAuthError.USER_UNKNOWN })
  async markNotAdmin(ctx: ITransactionContext, email: string): Promise<void> {
    const row = await this.adminUserDefaultRepository.findByEmail(ctx, email);
    if (!row || !row.enabled) return;
    row.enabled = false;
    row.updatedOn = new Date();
    await this.adminUserDefaultRepository.save(ctx, row);
    this.logger.warn('IAM 관리자 해제를 admin_users 에 반영했다');
  }
}
