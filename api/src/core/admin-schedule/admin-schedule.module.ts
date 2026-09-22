import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostEntity } from '../../common/entity/post.entity';
import { RevisionModule } from '../../common/revision/revision.module';
import { AdminPostModule } from '../admin-post/admin-post.module';
import { AdminScheduleDefaultService } from './service/admin-schedule-default.service';

/** 예약 게시(1분 틱). ScheduleModule.forRoot() 는 앱 전체에 한 번 — 여기서 건다. */
@Module({
  imports: [
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([PostEntity]),
    RevisionModule,
    AdminPostModule,
  ],
  providers: [AdminScheduleDefaultService],
  exports: [AdminScheduleDefaultService],
})
export class AdminScheduleModule {}
