import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { RevisionModule } from '../../common/revision/revision.module';
import { TransactionContextFactory } from '../../common/typeorm/transaction-context.factory';
import { AdminPostModule } from '../admin-post/admin-post.module';
import { ScheduledPostDefaultRepository } from './repository/scheduled-post-default.repository';
import { AdminScheduleDefaultService } from './service/admin-schedule-default.service';

/** 예약 게시(1분 틱). ScheduleModule.forRoot() 는 앱 전체에 한 번 — 여기서 건다. */
@Module({
  imports: [ScheduleModule.forRoot(), RevisionModule, AdminPostModule],
  providers: [
    AdminScheduleDefaultService,
    ScheduledPostDefaultRepository,
    TransactionContextFactory,
  ],
  exports: [AdminScheduleDefaultService],
})
export class AdminScheduleModule {}
