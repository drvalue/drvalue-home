import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { HomePopupTranslationEntity } from '../../../common/entity/home-popup-translation.entity';
import { BaseRepository } from '../../../common/typeorm/base.repository';
import type { ITransactionContext } from '../../../common/typeorm/transaction-context';

export interface HomePopupTextWrite {
  languagesCode: string;
  title: string | null;
  body: string | null;
  alt: string | null;
  linkLabel: string | null;
}

@Injectable()
export class HomePopupTranslationDefaultRepository extends BaseRepository<HomePopupTranslationEntity> {
  override repository(
    ctx: ITransactionContext,
  ): Repository<HomePopupTranslationEntity> {
    return super.repository(ctx, HomePopupTranslationEntity);
  }

  /** 한 팝업의 언어별 글을 통째로 바꾼다(빈 언어는 행을 안 만든다). */
  async replaceFor(
    ctx: ITransactionContext,
    popupId: number,
    rows: HomePopupTextWrite[],
  ): Promise<void> {
    const repo = this.repository(ctx);
    await repo.delete({ popupId });
    if (rows.length) await repo.insert(rows.map((r) => ({ ...r, popupId })));
  }
}
