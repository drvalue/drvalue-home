import { Injectable } from '@nestjs/common';
import { FindOptionsWhere, Repository } from 'typeorm';
import { RevisionEntity } from '../../../common/entity/revision.entity';
import { BaseRepository } from '../../../common/typeorm/base.repository';
import type { ITransactionContext } from '../../../common/typeorm/transaction-context';

export interface RevisionFilter {
  collection?: string;
  actor?: string;
  skip: number;
  take: number;
}

/** admin_revisions 읽기. 쓰기(한 줄 남기기)는 common/revision 의 RevisionService 가 한다. */
@Injectable()
export class RevisionDefaultRepository extends BaseRepository<RevisionEntity> {
  override repository(ctx: ITransactionContext): Repository<RevisionEntity> {
    return super.repository(ctx, RevisionEntity);
  }

  /** 최신순 한 쪽과 전체 수. */
  findPage(
    ctx: ITransactionContext,
    f: RevisionFilter,
  ): Promise<[RevisionEntity[], number]> {
    const where: FindOptionsWhere<RevisionEntity> = {};
    if (f.collection) where.collection = f.collection;
    if (f.actor) where.actor = f.actor;
    return this.repository(ctx).findAndCount({
      where,
      order: { id: 'DESC' },
      skip: f.skip,
      take: f.take,
    });
  }

  /** 한 항목(글 하나·장 하나…)의 이력, 최신순. */
  findFor(
    ctx: ITransactionContext,
    collection: string,
    itemId: string,
    limit: number,
  ): Promise<RevisionEntity[]> {
    return this.repository(ctx).find({
      where: { collection, itemId },
      order: { id: 'DESC' },
      take: limit,
    });
  }

  findById(
    ctx: ITransactionContext,
    id: number,
  ): Promise<RevisionEntity | null> {
    return this.repository(ctx).findOne({ where: { id } });
  }
}
