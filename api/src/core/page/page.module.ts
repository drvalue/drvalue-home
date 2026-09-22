import { Module } from '@nestjs/common';
import { RevisionModule } from '../../common/revision/revision.module';
import { AdminAuthModule } from '../admin-auth/admin-auth.module';
import { AdminPageDefaultController } from './controller/admin-page-default.controller';
import { PageDefaultController } from './controller/page-default.controller';
import { PageDefaultRepository } from './repository/page-default.repository';
import { PageFileDefaultRepository } from './repository/page-file-default.repository';
import { PageRevisionHandler } from './revision/page-revision.handler';
import { PageDefaultService } from './service/page-default.service';

/** 페이지 글 — 관리(admin/pages)와 공개(content/pages)가 같은 서비스를 쓴다. */
@Module({
  imports: [AdminAuthModule, RevisionModule],
  controllers: [AdminPageDefaultController, PageDefaultController],
  providers: [
    PageDefaultRepository,
    PageFileDefaultRepository,
    PageDefaultService,
    PageRevisionHandler,
  ],
})
export class PageModule {}
