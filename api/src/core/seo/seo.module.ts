import { Module } from '@nestjs/common';
import { RevisionModule } from '../../common/revision/revision.module';
import { AdminAuthModule } from '../admin-auth/admin-auth.module';
import { AdminSeoDefaultController } from './controller/admin-seo-default.controller';
import { SeoDefaultController } from './controller/seo-default.controller';
import { SeoFileDefaultRepository } from './repository/file-default.repository';
import { PageMetaDefaultRepository } from './repository/page-meta-default.repository';
import { PageMetaTranslationDefaultRepository } from './repository/page-meta-translation-default.repository';
import { SeoDefaultService } from './service/seo-default.service';

/** 정적 장의 검색 정보(page_meta). 공개 읽기 + 관리 저장. 글의 검색 정보는 admin-post 에 있다. */
@Module({
  imports: [AdminAuthModule, RevisionModule],
  controllers: [SeoDefaultController, AdminSeoDefaultController],
  providers: [
    PageMetaDefaultRepository,
    PageMetaTranslationDefaultRepository,
    SeoFileDefaultRepository,
    SeoDefaultService,
  ],
})
export class SeoModule {}
