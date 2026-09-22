import { Injectable } from '@nestjs/common';
import { In, Not, Repository } from 'typeorm';
import { HomePopupEntity } from '../../../common/entity/home-popup.entity';
import { BaseRepository } from '../../../common/typeorm/base.repository';
import type { ITransactionContext } from '../../../common/typeorm/transaction-context';

/** 고치거나 새로 넣을 팝업 칸(언어별 글은 번역 저장소가 따로 쓴다). */
export interface HomePopupWrite {
  sort: number;
  visible: boolean;
  image: string | null;
  linkHref: string | null;
  startsAt: Date | null;
  endsAt: Date | null;
  width: number;
  dismissDays: number;
  updatedBy: string;
}

@Injectable()
export class HomePopupDefaultRepository extends BaseRepository<HomePopupEntity> {
  override repository(ctx: ITransactionContext): Repository<HomePopupEntity> {
    return super.repository(ctx, HomePopupEntity);
  }

  /** 전부(꺼진 것·기간 밖 포함) — 관리 목록. */
  findAllWithTranslations(
    ctx: ITransactionContext,
  ): Promise<HomePopupEntity[]> {
    return this.repository(ctx).find({
      relations: { translations: true },
      order: { sort: 'ASC', id: 'ASC' },
    });
  }

  /** 지금 살아 있는 것(보이기 · 기간 안), 뜨는 차례대로. */
  findLive(ctx: ITransactionContext, now: Date): Promise<HomePopupEntity[]> {
    return this.repository(ctx)
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.translations', 't')
      .where('p.visible = true')
      .andWhere('(p.starts_at IS NULL OR p.starts_at <= :now)', { now })
      .andWhere('(p.ends_at IS NULL OR p.ends_at > :now)', { now })
      .orderBy('p.sort', 'ASC')
      .addOrderBy('p.id', 'ASC')
      .getMany();
  }

  /** 있는 팝업 id 들. 받은 id 가 여기 없으면 새로 만든다. */
  async findIds(ctx: ITransactionContext): Promise<Set<number>> {
    const rows = await this.repository(ctx).find({ select: { id: true } });
    return new Set(rows.map((r) => r.id));
  }

  /** 고친다. */
  async updateOne(
    ctx: ITransactionContext,
    id: number,
    input: HomePopupWrite,
  ): Promise<void> {
    await this.repository(ctx).update(
      { id },
      { ...input, updatedOn: new Date() },
    );
  }

  /** 새로 넣고 id 를 돌려준다. */
  async insertOne(
    ctx: ITransactionContext,
    input: HomePopupWrite,
  ): Promise<number> {
    const repo = this.repository(ctx);
    const saved = await repo.save(
      repo.create({ ...input, updatedOn: new Date() }),
    );
    return saved.id;
  }

  /** 목록에서 빠진 팝업을 지운다(글은 FK 로 같이). */
  async deleteExcept(ctx: ITransactionContext, keep: number[]): Promise<void> {
    const repo = this.repository(ctx);
    // TypeORM 은 빈 조건의 delete 를 거부한다 — 다 지울 때는 질의로.
    if (keep.length) await repo.delete({ id: Not(In(keep)) });
    else
      await repo.createQueryBuilder().delete().from(HomePopupEntity).execute();
  }
}
