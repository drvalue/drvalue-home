import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppConfig } from '../config/app-config';
import { TransactionContextMiddleware } from '../typeorm/transaction-context.middleware';
import { FileEntity } from '../entity/file.entity';
import { InquiryEntity } from '../entity/inquiry.entity';
import { AdminUserEntity } from '../entity/admin-user.entity';
import {
  PageMetaEntity,
  PageMetaTranslationEntity,
} from '../entity/page-meta.entity';
import { RevisionEntity } from '../entity/revision.entity';
import { PostFileEntity } from '../entity/post-file.entity';
import { PostTranslationEntity } from '../entity/post-translation.entity';
import { PostEntity } from '../entity/post.entity';
import { MenuItemEntity } from '../entity/menu-item.entity';
import { MenuItemTranslationEntity } from '../entity/menu-item-translation.entity';
import { PageEntity } from '../entity/page.entity';
import { HomeBannerEntity } from '../entity/home-banner.entity';
import { HomeBannerTranslationEntity } from '../entity/home-banner-translation.entity';
import { HomePopupEntity } from '../entity/home-popup.entity';
import { HomePopupTranslationEntity } from '../entity/home-popup-translation.entity';

export const ENTITIES = [
  PostEntity,
  PostTranslationEntity,
  PostFileEntity,
  FileEntity,
  InquiryEntity,
  AdminUserEntity,
  RevisionEntity,
  MenuItemEntity,
  MenuItemTranslationEntity,
  PageEntity,
  PageMetaEntity,
  PageMetaTranslationEntity,
  HomeBannerEntity,
  HomeBannerTranslationEntity,
  HomePopupEntity,
  HomePopupTranslationEntity,
];

/**
 * PostgreSQL. 테이블은 Directus 가 만든 것을 그대로 쓴다 — synchronize 는 절대
 * 켜지 않는다(엔티티와 다른 칸을 지운다). 스키마 변경은 마이그레이션 파일로.
 *
 * forRootAsync 인 이유: forRoot({...}) 는 이 파일을 불러올 때 값을 읽는데, 그때는 AppModule 의
 * ConfigModule 이 아직 `.env` 를 안 읽었다 — compose 처럼 환경변수를 직접 주지 않으면 비밀번호가 빈다.
 */
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: 'postgres',
        host: AppConfig.db.host,
        port: AppConfig.db.port,
        database: 'drvalue_cms',
        username: 'drvalue',
        password: AppConfig.db.password,
        entities: ENTITIES,
        synchronize: false,
      }),
    }),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule implements NestModule {
  /** 모든 요청에 DB 문맥(`@TransactionContext()`)을 싣는다. */
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(TransactionContextMiddleware).forRoutes('*path');
  }
}
