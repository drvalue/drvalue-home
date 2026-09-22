import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { PostEntity } from '../../../common/entity/post.entity';
import { BaseRepository } from '../../../common/typeorm/base.repository';
import type { ITransactionContext } from '../../../common/typeorm/transaction-context';

/** 게시판별 수. 0 인 게시판은 오지 않는다. */
export interface BoardCount {
  board: string;
  count: number;
}

@Injectable()
export class PostDefaultRepository extends BaseRepository<PostEntity> {
  override repository(ctx: ITransactionContext): Repository<PostEntity> {
    return super.repository(ctx, PostEntity);
  }

  /** 게시판별 초안 수. */
  countDraftsByBoard(
    ctx: ITransactionContext,
    boards: readonly string[],
  ): Promise<BoardCount[]> {
    return this.countByBoard(ctx, boards, "p.status = 'draft'");
  }

  /** 게시판별 예약 공개 대기 수(publish_at 이 아직 안 왔다). 관리 목록의 schedule=scheduled 와 같은 조건. */
  countScheduledByBoard(
    ctx: ITransactionContext,
    boards: readonly string[],
  ): Promise<BoardCount[]> {
    return this.countByBoard(ctx, boards, 'p.publishAt > now()');
  }

  private async countByBoard(
    ctx: ITransactionContext,
    boards: readonly string[],
    condition: string,
  ): Promise<BoardCount[]> {
    if (boards.length === 0) return [];
    const rows = await this.repository(ctx)
      .createQueryBuilder('p')
      .select('p.board', 'board')
      .addSelect('COUNT(*)', 'count')
      .where('p.board IN (:...boards)', { boards: [...boards] })
      .andWhere(condition)
      .groupBy('p.board')
      .getRawMany<{ board: string; count: string }>();
    return rows.map((r) => ({ board: r.board, count: Number(r.count) }));
  }
}
