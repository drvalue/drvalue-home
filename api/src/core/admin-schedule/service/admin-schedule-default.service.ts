import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { PostEntity } from '../../../common/entity/post.entity';
import { RevisionService } from '../../../common/revision/revision.service';
import { createTransactionContext } from '../../../common/typeorm/transaction-context';
import { AdminPostDefaultService } from '../../admin-post/service/admin-post-default.service';

const ACTOR = 'schedule@system';

/**
 * 예약 게시. 1분마다 상태를 시각에 맞춘다.
 *
 *   초안 + publish_at 지남 (+ unpublish_at 안 지남) → 공개. publish_at 은 지운다(소진).
 *   공개 + unpublish_at 지남                          → 초안. unpublish_at 은 지운다(소진).
 *
 * 공개 API 는 이 작업을 기다리지 않는다 — content 서비스가 시각을 직접 보므로 1분 사이에도
 * 새지 않는다. 여기서는 관리 화면의 상태 표시와 이력을 맞출 뿐이다.
 * 소진한 시각을 지우는 이유: 남겨 두면, 자동으로 내려간 글에서 편집자가 내림 시각만 지웠을
 * 때 지난 공개 시각 때문에 다음 1분에 다시 올라간다.
 * 조건부 UPDATE 라 프로세스가 둘이어도 같은 글을 두 번 바꾸지 않는다.
 */
@Injectable()
export class AdminScheduleDefaultService {
  private readonly log = new Logger(AdminScheduleDefaultService.name);

  constructor(
    @InjectRepository(PostEntity)
    private readonly posts: Repository<PostEntity>,
    private readonly adminPostDefaultService: AdminPostDefaultService,
    private readonly revisionService: RevisionService,
    private readonly dataSource: DataSource,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async tick(): Promise<{ published: number[]; unpublished: number[] }> {
    const published = await this.flip(
      `status = 'draft' AND publish_at IS NOT NULL AND publish_at <= now()
       AND (unpublish_at IS NULL OR unpublish_at > now())`,
      { status: 'published', publishAt: null },
    );
    const unpublished = await this.flip(
      `status = 'published' AND unpublish_at IS NOT NULL AND unpublish_at <= now()`,
      { status: 'draft', unpublishAt: null },
    );
    if (published.length || unpublished.length) {
      this.log.log(
        `예약 게시: 공개 ${published.length} · 내림 ${unpublished.length}`,
      );
    }
    return { published, unpublished };
  }

  private async flip(
    where: string,
    set: Partial<PostEntity>,
  ): Promise<number[]> {
    const due = await this.posts
      .createQueryBuilder('p')
      .select('p.id', 'id')
      .where(where.replace(/\b(status|publish_at|unpublish_at)\b/g, 'p.$1'))
      .getRawMany<{ id: number }>();
    const done: number[] = [];
    for (const { id } of due) {
      const ctx = createTransactionContext(this.dataSource);
      const before = await this.adminPostDefaultService
        .get(ctx, id)
        .catch(() => null);
      const res = await this.posts
        .createQueryBuilder()
        .update(PostEntity)
        .set(set)
        .where(`id = :id AND ${where}`, { id })
        .execute();
      if (!res.affected) continue; // 다른 프로세스가 먼저 바꿨다
      const after = await this.adminPostDefaultService
        .get(ctx, id)
        .catch(() => null);
      await this.revisionService.record({
        actor: ACTOR,
        action: 'update',
        collection: 'posts',
        itemId: id,
        before,
        after,
      });
      done.push(id);
    }
    return done;
  }
}
