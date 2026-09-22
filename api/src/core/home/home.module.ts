import { Module } from '@nestjs/common';
import { RevisionModule } from '../../common/revision/revision.module';
import { AdminAuthModule } from '../admin-auth/admin-auth.module';
import { AdminHomeDefaultController } from './controller/admin-home-default.controller';
import { HomeDefaultController } from './controller/home-default.controller';
import { HomeBannerDefaultRepository } from './repository/home-banner-default.repository';
import { HomeBannerTranslationDefaultRepository } from './repository/home-banner-translation-default.repository';
import { HomeFileDefaultRepository } from './repository/home-file-default.repository';
import { HomePopupDefaultRepository } from './repository/home-popup-default.repository';
import { HomePopupTranslationDefaultRepository } from './repository/home-popup-translation-default.repository';
import { HomeDefaultService } from './service/home-default.service';
import {
  HomeBannerRevisionHandler,
  HomePopupRevisionHandler,
} from './revision/home-revision.handler';

/**
 * 메인 화면의 기간 배너·팝업(E8). 공개 읽기(`/api/content/home`)와 관리(`/api/admin/home/*`)가
 * 같은 서비스를 쓴다. 메인 글(문구·구역 차례·카드)은 페이지 글 엔진(core/page, key `home`)이다.
 */
@Module({
  imports: [AdminAuthModule, RevisionModule],
  controllers: [HomeDefaultController, AdminHomeDefaultController],
  providers: [
    HomeBannerDefaultRepository,
    HomeBannerTranslationDefaultRepository,
    HomePopupDefaultRepository,
    HomePopupTranslationDefaultRepository,
    HomeFileDefaultRepository,
    HomeDefaultService,
    HomeBannerRevisionHandler,
    HomePopupRevisionHandler,
  ],
})
export class HomeModule {}
