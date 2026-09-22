import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { AdminUserEntity } from '../../../common/entity/admin-user.entity';
import { BaseRepository } from '../../../common/typeorm/base.repository';
import type { ITransactionContext } from '../../../common/typeorm/transaction-context';

/** admin_users — IAM 관리자 판정의 거울. 이메일은 소문자로 적고 소문자로 찾는다. */
@Injectable()
export class AdminUserDefaultRepository extends BaseRepository<AdminUserEntity> {
  override repository(ctx: ITransactionContext): Repository<AdminUserEntity> {
    return super.repository(ctx, AdminUserEntity);
  }

  findByEmail(
    ctx: ITransactionContext,
    email: string,
  ): Promise<AdminUserEntity | null> {
    return this.repository(ctx).findOne({
      where: { email: email.toLowerCase() },
    });
  }

  /** 들어온 차례대로(처음 로그인한 사람이 앞). */
  findAllByJoined(ctx: ITransactionContext): Promise<AdminUserEntity[]> {
    return this.repository(ctx).find({ order: { createdOn: 'ASC' } });
  }

  /** 켜진 사람만(담당자 목록). */
  findEnabled(ctx: ITransactionContext): Promise<AdminUserEntity[]> {
    return this.repository(ctx).find({
      where: { enabled: true },
      order: { createdOn: 'ASC' },
    });
  }

  countEnabledAdmins(ctx: ITransactionContext): Promise<number> {
    return this.repository(ctx).count({
      where: { enabled: true, role: 'admin' },
    });
  }

  newRow(
    ctx: ITransactionContext,
    row: Partial<AdminUserEntity>,
  ): AdminUserEntity {
    return this.repository(ctx).create(row);
  }

  save(
    ctx: ITransactionContext,
    row: AdminUserEntity,
  ): Promise<AdminUserEntity> {
    return this.repository(ctx).save(row);
  }
}
