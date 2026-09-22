import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ServiceException } from '../../../common/error/service-exception.decorator';
import { RevisionService } from '../../../common/revision/revision.service';
import type { ITransactionContext } from '../../../common/typeorm/transaction-context';
import { TransactionContextFactory } from '../../../common/typeorm/transaction-context.factory';
import { Transactional } from '../../../common/typeorm/transactional.decorator';
import { AdminPostDefaultService } from '../../admin-post/service/admin-post-default.service';
import { AdminScheduleError } from '../error/admin-schedule.error';
import { ScheduledPostDefaultRepository } from '../repository/scheduled-post-default.repository';

const ACTOR = 'schedule@system';

export interface AdminScheduleRun {
  published: number[];
  unpublished: number[];
}

/**
 * 예약 게시. 1분마다 상태를 시각에 맞춘다.
 *
 *   초안 + publish_at 지남 (+ unpublish_at 안 지남) → 공개. publish_at 은 지운다(소진).
 *   공개 + unpublish_at 지남                          → 초안. unpublish_at 은 지운다(소진).
 *
 * 공개 API 는 이 작업을 기다리지 않는다 — content 가 시각을 직접 보므로 1분 사이에도
 * 새지 않는다. 여기서는 관리 화면의 상태 표시와 이력을 맞출 뿐이다.
 * 소진한 시각을 지우는 이유: 남겨 두면, 자동으로 내려간 글에서 편집자가 내림 시각만 지웠을
 * 때 지난 공개 시각 때문에 다음 1분에 다시 올라간다.
 */
@Injectable()
export class AdminScheduleDefaultService {
  private readonly logger = new Logger(AdminScheduleDefaultService.name);

  constructor(
    private readonly scheduledPostDefaultRepository: ScheduledPostDefaultRepository,
    private readonly adminPostDefaultService: AdminPostDefaultService,
    private readonly revisionService: RevisionService,
    private readonly transactionContextFactory: TransactionContextFactory,
  ) {}

  /** cron 입구. 요청 밖이라 문맥을 직접 만든다. 실패해도 다음 틱이 다시 한다 — 던지지 않고 로그만. */
  @Cron(CronExpression.EVERY_MINUTE)
  async tick(): Promise<void> {
    try {
      await this.run(this.transactionContextFactory.create());
    } catch {
      // @ServiceException 이 스택을 이미 남겼다.
    }
  }

  /**
   * 때가 된 글을 공개하고, 때가 된 글을 내린다. 글 하나마다 한 트랜잭션(상태 + 변경 이력).
   * 조건부 UPDATE 라 다른 프로세스가 먼저 바꾼 글은 건너뛴다.
   */
  @ServiceException({ errorCode: AdminScheduleError.RUN_UNKNOWN })
  async run(ctx: ITransactionContext): Promise<AdminScheduleRun> {
    const published: number[] = [];
    for (const id of await this.scheduledPostDefaultRepository.findDueToPublish(
      ctx,
    ))
      if (await this.flip(ctx, id, 'publish')) published.push(id);
    const unpublished: number[] = [];
    for (const id of await this.scheduledPostDefaultRepository.findDueToUnpublish(
      ctx,
    ))
      if (await this.flip(ctx, id, 'unpublish')) unpublished.push(id);
    if (published.length || unpublished.length)
      this.logger.log(
        `예약 게시: 공개 ${published.length} · 내림 ${unpublished.length}`,
      );
    return { published, unpublished };
  }

  @Transactional()
  private async flip(
    ctx: ITransactionContext,
    id: number,
    kind: 'publish' | 'unpublish',
  ): Promise<boolean> {
    const before = await this.adminPostDefaultService
      .get(ctx, id)
      .catch(() => null);
    const changed =
      kind === 'publish'
        ? await this.scheduledPostDefaultRepository.publishIfDue(ctx, id)
        : await this.scheduledPostDefaultRepository.unpublishIfDue(ctx, id);
    if (!changed) return false; // 다른 프로세스가 먼저 바꿨다
    const after = await this.adminPostDefaultService
      .get(ctx, id)
      .catch(() => null);
    await this.revisionService.record(
      {
        actor: ACTOR,
        action: 'update',
        collection: 'posts',
        itemId: id,
        before,
        after,
      },
      ctx,
    );
    return true;
  }
}
