import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { PostEntity } from '../../../common/entity/post.entity';
import { BaseRepository } from '../../../common/typeorm/base.repository';
import type { ITransactionContext } from '../../../common/typeorm/transaction-context';

/** 초안 + publish_at 지남 (+ unpublish_at 안 지남) → 공개할 때가 됐다. */
const DUE_PUBLISH = `status = 'draft' AND publish_at IS NOT NULL AND publish_at <= now()
  AND (unpublish_at IS NULL OR unpublish_at > now())`;
/** 공개 + unpublish_at 지남 → 내릴 때가 됐다. */
const DUE_UNPUBLISH = `status = 'published' AND unpublish_at IS NOT NULL AND unpublish_at <= now()`;

/** 예약 게시가 읽고 바꾸는 posts. 조건부 UPDATE 라 프로세스가 둘이어도 같은 글을 두 번 바꾸지 않는다. */
@Injectable()
export class ScheduledPostDefaultRepository extends BaseRepository<PostEntity> {
  override repository(ctx: ITransactionContext): Repository<PostEntity> {
    return super.repository(ctx, PostEntity);
  }

  findDueToPublish(ctx: ITransactionContext): Promise<number[]> {
    return this.dueIds(ctx, DUE_PUBLISH);
  }

  findDueToUnpublish(ctx: ITransactionContext): Promise<number[]> {
    return this.dueIds(ctx, DUE_UNPUBLISH);
  }

  /** 아직 때가 맞으면 공개하고 publish_at 을 지운다(소진). 바꿨으면 true. */
  publishIfDue(ctx: ITransactionContext, id: number): Promise<boolean> {
    return this.flipIf(ctx, id, DUE_PUBLISH, {
      status: 'published',
      publishAt: null,
    });
  }

  /** 아직 때가 맞으면 초안으로 내리고 unpublish_at 을 지운다(소진). 바꿨으면 true. */
  unpublishIfDue(ctx: ITransactionContext, id: number): Promise<boolean> {
    return this.flipIf(ctx, id, DUE_UNPUBLISH, {
      status: 'draft',
      unpublishAt: null,
    });
  }

  private async dueIds(
    ctx: ITransactionContext,
    where: string,
  ): Promise<number[]> {
    const rows = await this.repository(ctx)
      .createQueryBuilder('p')
      .select('p.id', 'id')
      .where(where.replace(/\b(status|publish_at|unpublish_at)\b/g, 'p.$1'))
      .getRawMany<{ id: number }>();
    return rows.map((r) => r.id);
  }

  private async flipIf(
    ctx: ITransactionContext,
    id: number,
    where: string,
    set: Partial<PostEntity>,
  ): Promise<boolean> {
    const res = await this.repository(ctx)
      .createQueryBuilder()
      .update(PostEntity)
      .set(set)
      .where(`id = :id AND ${where}`, { id })
      .execute();
    return Boolean(res.affected);
  }
}
