import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { SearchSettingsEntity } from '../../../common/entity/search-settings.entity';
import { BaseRepository } from '../../../common/typeorm/base.repository';
import type { ITransactionContext } from '../../../common/typeorm/transaction-context';

/** 설정 행의 id. 표에 한 행뿐이다(CHECK id = 1). */
export const SEARCH_SETTINGS_ID = 1;

@Injectable()
export class SearchSettingsDefaultRepository extends BaseRepository<SearchSettingsEntity> {
  override repository(
    ctx: ITransactionContext,
  ): Repository<SearchSettingsEntity> {
    return super.repository(ctx, SearchSettingsEntity);
  }

  /** 하나뿐인 설정 행. 마이그레이션이 넣지만 누가 지웠으면 null. */
  findSite(ctx: ITransactionContext): Promise<SearchSettingsEntity | null> {
    return this.repository(ctx).findOne({ where: { id: SEARCH_SETTINGS_ID } });
  }
}
