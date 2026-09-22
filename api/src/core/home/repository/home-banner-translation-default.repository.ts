import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { HomeBannerTranslationEntity } from '../../../common/entity/home-banner-translation.entity';
import { BaseRepository } from '../../../common/typeorm/base.repository';
import type { ITransactionContext } from '../../../common/typeorm/transaction-context';

export interface HomeBannerTextWrite {
  languagesCode: string;
  title: string | null;
  description: string | null;
  alt: string | null;
  linkLabel: string | null;
}

@Injectable()
export class HomeBannerTranslationDefaultRepository extends BaseRepository<HomeBannerTranslationEntity> {
  override repository(
    ctx: ITransactionContext,
  ): Repository<HomeBannerTranslationEntity> {
    return super.repository(ctx, HomeBannerTranslationEntity);
  }

  /** 한 배너의 언어별 글을 통째로 바꾼다(빈 언어는 행을 안 만든다 — 공개 읽기가 한국어로 떨어진다). */
  async replaceFor(
    ctx: ITransactionContext,
    bannerId: number,
    rows: HomeBannerTextWrite[],
  ): Promise<void> {
    const repo = this.repository(ctx);
    await repo.delete({ bannerId });
    if (rows.length) await repo.insert(rows.map((r) => ({ ...r, bannerId })));
  }
}
