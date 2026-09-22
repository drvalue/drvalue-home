import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { PageMetaTranslationEntity } from '../../../common/entity/page-meta.entity';
import { BaseRepository } from '../../../common/typeorm/base.repository';
import type { ITransactionContext } from '../../../common/typeorm/transaction-context';

@Injectable()
export class PageMetaTranslationDefaultRepository extends BaseRepository<PageMetaTranslationEntity> {
  override repository(
    ctx: ITransactionContext,
  ): Repository<PageMetaTranslationEntity> {
    return super.repository(ctx, PageMetaTranslationEntity);
  }

  async deleteByPath(ctx: ITransactionContext, path: string): Promise<void> {
    await this.repository(ctx).delete({ path });
  }
}
