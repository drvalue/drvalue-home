import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import {
  AutopostRunEntity,
  AutopostRunStatus,
} from '../../../common/entity/autopost-run.entity';
import { BaseRepository } from '../../../common/typeorm/base.repository';
import type { ITransactionContext } from '../../../common/typeorm/transaction-context';
import { MAX_ATTEMPTS } from '../service/autopost-plan';

export interface AutopostRunFinish {
  status: Exclude<AutopostRunStatus, 'running'>;
  reason?: string | null;
  postId?: number | null;
  article?: object | null;
  inputTokens?: number | null;
  outputTokens?: number | null;
}

/** 주 단위 기록. 잡기는 조건부 INSERT·UPDATE 라 프로세스가 둘이어도 같은 주를 두 번 만들지 않는다. */
@Injectable()
export class AutopostRunDefaultRepository extends BaseRepository<AutopostRunEntity> {
  override repository(ctx: ITransactionContext): Repository<AutopostRunEntity> {
    return super.repository(ctx, AutopostRunEntity);
  }

  findByWeek(
    ctx: ITransactionContext,
    weekKey: string,
  ): Promise<AutopostRunEntity | null> {
    return this.repository(ctx).findOneBy({ weekKey });
  }

  /** 이번 주를 처음 잡는다. 다른 프로세스가 먼저 잡았으면 false. */
  async claim(ctx: ITransactionContext, weekKey: string): Promise<boolean> {
    // RETURNING 으로 「넣었나」를 본다 — ON CONFLICT DO NOTHING 은 겹치면 행을 안 돌려준다.
    const rows: unknown[] = await this.repository(ctx).query(
      `INSERT INTO autopost_runs (week_key, status) VALUES ($1, 'running')
       ON CONFLICT (week_key) DO NOTHING RETURNING week_key`,
      [weekKey],
    );
    return rows.length > 0;
  }

  /** 오류로 끝난 주를 한 번 더 잡는다. 한도를 넘었거나 다른 프로세스가 먼저 잡았으면 false. */
  async claimRetry(
    ctx: ITransactionContext,
    weekKey: string,
  ): Promise<boolean> {
    const result = await this.repository(ctx)
      .createQueryBuilder()
      .update()
      .set({
        status: 'running',
        attempts: () => 'attempts + 1',
        startedOn: () => 'now()',
        finishedOn: null,
      })
      .where('week_key = :weekKey AND status = :status AND attempts < :max', {
        weekKey,
        status: 'error',
        max: MAX_ATTEMPTS,
      })
      .execute();
    return (result.affected ?? 0) > 0;
  }

  /** 죽은 「진행 중」을 오류로 닫는다. 그사이 끝났으면(상태가 바뀌었으면) 건드리지 않는다. */
  async reap(ctx: ITransactionContext, weekKey: string): Promise<boolean> {
    const result = await this.repository(ctx)
      .createQueryBuilder()
      .update()
      .set({
        status: 'error',
        reason: '만드는 도중에 멈췄습니다',
        finishedOn: () => 'now()',
      })
      .where('week_key = :weekKey AND status = :status', {
        weekKey,
        status: 'running',
      })
      .execute();
    return (result.affected ?? 0) > 0;
  }

  /** 잡은 주를 닫는다. 「진행 중」일 때만 — 닫힌 주를 덮어쓰지 않는다. */
  async finish(
    ctx: ITransactionContext,
    weekKey: string,
    patch: AutopostRunFinish,
  ): Promise<void> {
    await this.repository(ctx)
      .createQueryBuilder()
      .update()
      .set({ ...patch, finishedOn: () => 'now()' })
      .where('week_key = :weekKey AND status = :status', {
        weekKey,
        status: 'running',
      })
      .execute();
  }

  /** 이미 공개한 자동 글들(최근 순) — 제목과 출처 주소를 다음 글이 피한다. */
  async findPublishedArticles(
    ctx: ITransactionContext,
    limit = 30,
  ): Promise<object[]> {
    const rows = await this.repository(ctx).find({
      where: { status: 'published' },
      order: { startedOn: 'DESC' },
      take: limit,
      select: { weekKey: true, article: true },
    });
    return rows.flatMap((r) => (r.article ? [r.article] : []));
  }
}
