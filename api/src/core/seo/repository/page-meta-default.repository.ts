import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { PageMetaEntity } from '../../../common/entity/page-meta.entity';
import { BaseRepository } from '../../../common/typeorm/base.repository';
import type { ITransactionContext } from '../../../common/typeorm/transaction-context';

@Injectable()
export class PageMetaDefaultRepository extends BaseRepository<PageMetaEntity> {
  override repository(ctx: ITransactionContext): Repository<PageMetaEntity> {
    return super.repository(ctx, PageMetaEntity);
  }

  /** 전부(장 수만큼, 수십 줄). 언어별 줄까지. */
  findAllFull(ctx: ITransactionContext): Promise<PageMetaEntity[]> {
    return this.repository(ctx).find({
      relations: { translations: true },
      order: { path: 'ASC' },
    });
  }

  findOneFull(
    ctx: ITransactionContext,
    path: string,
  ): Promise<PageMetaEntity | null> {
    return this.repository(ctx).findOne({
      where: { path },
      relations: { translations: true },
    });
  }
}
