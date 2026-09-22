import { Injectable } from '@nestjs/common';
import { In, Repository } from 'typeorm';
import { PageEntity } from '../../../common/entity/page.entity';
import { BaseRepository } from '../../../common/typeorm/base.repository';
import type { ITransactionContext } from '../../../common/typeorm/transaction-context';

@Injectable()
export class PageDefaultRepository extends BaseRepository<PageEntity> {
  override repository(ctx: ITransactionContext): Repository<PageEntity> {
    return super.repository(ctx, PageEntity);
  }

  /** 한 장의 언어별 행 전부. */
  findByKey(ctx: ITransactionContext, key: string): Promise<PageEntity[]> {
    return this.repository(ctx).find({ where: { key } });
  }

  findOne(
    ctx: ITransactionContext,
    key: string,
    languagesCode: string,
  ): Promise<PageEntity | null> {
    return this.repository(ctx).findOne({ where: { key, languagesCode } });
  }

  /** 관리 목록용 — 장마다 가장 늦게 고친 행. */
  async findLatestByKeys(
    ctx: ITransactionContext,
    keys: string[],
  ): Promise<Map<string, PageEntity>> {
    const out = new Map<string, PageEntity>();
    if (keys.length === 0) return out;
    const rows = await this.repository(ctx).find({
      where: { key: In(keys) },
      order: { updatedOn: 'DESC' },
    });
    for (const r of rows) if (!out.has(r.key)) out.set(r.key, r);
    return out;
  }
}
