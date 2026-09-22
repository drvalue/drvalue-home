import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { AdminUserEntity } from '../../../common/entity/admin-user.entity';
import { BaseRepository } from '../../../common/typeorm/base.repository';
import type { ITransactionContext } from '../../../common/typeorm/transaction-context';

/** 권한 화면이 읽고 고치는 admin_users. 행을 만들고 켜고 끄는 것은 IAM 로그인 동기화(admin-auth)다. */
@Injectable()
export class AdminUserDefaultRepository extends BaseRepository<AdminUserEntity> {
  override repository(ctx: ITransactionContext): Repository<AdminUserEntity> {
    return super.repository(ctx, AdminUserEntity);
  }

  /** 켜진 사람 먼저, 그 안에서 이메일 순. */
  findAllForList(ctx: ITransactionContext): Promise<AdminUserEntity[]> {
    return this.repository(ctx).find({
      order: { enabled: 'DESC', email: 'ASC' },
    });
  }

  findByEmail(
    ctx: ITransactionContext,
    email: string,
  ): Promise<AdminUserEntity | null> {
    return this.repository(ctx).findOne({
      where: { email: email.trim().toLowerCase() },
    });
  }

  countEnabledAdmins(ctx: ITransactionContext): Promise<number> {
    return this.repository(ctx).count({
      where: { enabled: true, role: 'admin' },
    });
  }

  save(
    ctx: ITransactionContext,
    row: AdminUserEntity,
  ): Promise<AdminUserEntity> {
    return this.repository(ctx).save(row);
  }
}
