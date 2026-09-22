import { Module } from '@nestjs/common';
import { RevisionModule } from '../../common/revision/revision.module';
import { AdminAuthModule } from '../admin-auth/admin-auth.module';
import { AdminRevisionDefaultController } from './controller/admin-revision-default.controller';
import { RevisionDefaultRepository } from './repository/revision-default.repository';
import { AdminRevisionDefaultService } from './service/admin-revision-default.service';

/**
 * 표마다 다른 이름·범위·되돌리기는 각 기능 모듈이 RevisionModule 의 RevisionRestoreRegistry 에
 * 핸들러로 건다(`<기능>/revision/*.handler.ts`). 이 모듈은 그 표들을 import 하지 않는다.
 */
@Module({
  imports: [AdminAuthModule, RevisionModule],
  controllers: [AdminRevisionDefaultController],
  providers: [RevisionDefaultRepository, AdminRevisionDefaultService],
  // 홈(admin-dashboard)이 최근 변경을 같은 모양으로 보여 주려고 쓴다.
  exports: [AdminRevisionDefaultService],
})
export class AdminRevisionModule {}
