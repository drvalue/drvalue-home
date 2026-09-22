import { Module } from '@nestjs/common';
import { RevisionModule } from '../../common/revision/revision.module';
import { AdminAuthModule } from '../admin-auth/admin-auth.module';
import { AdminPostDefaultController } from './controller/admin-post-default.controller';
import { FileDefaultRepository } from './repository/file-default.repository';
import { PostDefaultRepository } from './repository/post-default.repository';
import { PostFileDefaultRepository } from './repository/post-file-default.repository';
import { PostTranslationDefaultRepository } from './repository/post-translation-default.repository';
import { AdminPostDefaultService } from './service/admin-post-default.service';

@Module({
  imports: [AdminAuthModule, RevisionModule],
  controllers: [AdminPostDefaultController],
  providers: [
    PostDefaultRepository,
    PostTranslationDefaultRepository,
    PostFileDefaultRepository,
    FileDefaultRepository,
    AdminPostDefaultService,
  ],
  // 예약 게시(admin-schedule)가 이력의 before/after 를 같은 모양으로 남기려고 서비스를 쓴다.
  exports: [AdminPostDefaultService],
})
export class AdminPostModule {}
