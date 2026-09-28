import { Module } from '@nestjs/common';
import { IndexNowModule } from '../../common/indexnow/indexnow.module';
import { RevisionModule } from '../../common/revision/revision.module';
import { AdminAuthModule } from '../admin-auth/admin-auth.module';
import { AdminSearchSettingsDefaultController } from './controller/admin-search-settings-default.controller';
import { SearchSettingsDefaultController } from './controller/search-settings-default.controller';
import { SearchSettingsDefaultRepository } from './repository/search-settings-default.repository';
import { SearchSettingsRevisionHandler } from './revision/search-settings-revision.handler';
import { SearchSettingsDefaultService } from './service/search-settings-default.service';

/** 검색엔진 설정(site_search_settings 한 행). 공개 읽기 + 관리 읽기·저장. IndexNow 는 상태만 읽는다. */
@Module({
  imports: [AdminAuthModule, RevisionModule, IndexNowModule],
  controllers: [
    SearchSettingsDefaultController,
    AdminSearchSettingsDefaultController,
  ],
  providers: [
    SearchSettingsDefaultRepository,
    SearchSettingsDefaultService,
    SearchSettingsRevisionHandler,
  ],
})
export class SearchSettingsModule {}
