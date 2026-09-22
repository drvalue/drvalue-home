import { Injectable } from '@nestjs/common';
import { AdminRole } from '../../../common/entity/admin-user.entity';
import { CommonError } from '../../../common/error/common-error';
import { ServiceException } from '../../../common/error/service-exception.decorator';
import { RevisionService } from '../../../common/revision/revision.service';
import type { SessionPayload } from '../../../common/session/session-token';
import type { ITransactionContext } from '../../../common/typeorm/transaction-context';
import { Transactional } from '../../../common/typeorm/transactional.decorator';
import { ControllerAdminUserDefaultResponseDto } from '../dto/controller-admin-user-default-response.dto';
import { AdminUserError } from '../error/admin-user.error';
import { AdminUserDefaultRepository } from '../repository/admin-user-default.repository';
import { wouldLockOut } from './last-admin';

/**
 * 권한 화면의 뒤. 사람은 IAM 이 정한다 — IAM 관리자(PLATFORM_ADMIN)가 로그인하면 행이
 * 생기거나 다시 켜지고, 관리자에서 빠지면 다음 로그인·재검에서 꺼진다. 여기서는 각자의
 * 「고칠 수 있는 범위」(role)만 바꾼다. 추가·삭제·사용 여부는 API 에 없다.
 * 모든 변경은 admin_revisions(collection admin_users)에 남는다.
 */
@Injectable()
export class AdminUserDefaultService {
  constructor(
    private readonly adminUserDefaultRepository: AdminUserDefaultRepository,
    private readonly revisionService: RevisionService,
  ) {}

  /** 권한 목록 — 켜진 사람 먼저. */
  @ServiceException({ errorCode: AdminUserError.LIST_UNKNOWN })
  async list(
    ctx: ITransactionContext,
  ): Promise<ControllerAdminUserDefaultResponseDto[]> {
    const rows = await this.adminUserDefaultRepository.findAllForList(ctx);
    return rows.map((u) => ControllerAdminUserDefaultResponseDto.from(u));
  }

  /**
   * 한 사람의 범위를 바꾼다. 켜져 있는 마지막 「전체 권한」을 내리면 아무도 범위를 못 고치게 되므로 409.
   * 같은 값이면 아무것도 안 하고 그대로 돌려준다(이력도 안 남긴다).
   */
  @ServiceException({ errorCode: AdminUserError.ROLE_UNKNOWN })
  @Transactional()
  async setRole(
    ctx: ITransactionContext,
    email: string,
    role: string,
    who: SessionPayload,
  ): Promise<ControllerAdminUserDefaultResponseDto> {
    const row = await this.adminUserDefaultRepository.findByEmail(ctx, email);
    if (!row) throw CommonError.createByErrorCode(AdminUserError.NOT_FOUND);
    const next = role as AdminRole;
    const before = ControllerAdminUserDefaultResponseDto.from(row);
    if (row.enabled && row.role === 'admin' && next !== 'admin') {
      const admins =
        await this.adminUserDefaultRepository.countEnabledAdmins(ctx);
      if (wouldLockOut(row, next, admins))
        throw CommonError.createByErrorCode(AdminUserError.LAST_ADMIN);
    }
    if (row.role === next) return before;
    row.role = next;
    row.updatedOn = new Date();
    const after = ControllerAdminUserDefaultResponseDto.from(
      await this.adminUserDefaultRepository.save(ctx, row),
    );
    await this.revisionService.record(
      {
        actor: who.email,
        action: 'update',
        collection: 'admin_users',
        itemId: row.email,
        before,
        after,
      },
      ctx,
    );
    return after;
  }
}
