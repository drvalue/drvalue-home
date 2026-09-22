import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FileEntity } from '../entity/file.entity';
import { InquiryEntity } from '../entity/inquiry.entity';
import { AdminUserEntity } from '../entity/admin-user.entity';
import { RevisionEntity } from '../entity/revision.entity';
import { PostFileEntity } from '../entity/post-file.entity';
import { PostTranslationEntity } from '../entity/post-translation.entity';
import { PostEntity } from '../entity/post.entity';

export const ENTITIES = [
  PostEntity,
  PostTranslationEntity,
  PostFileEntity,
  FileEntity,
  InquiryEntity,
  AdminUserEntity,
  RevisionEntity,
];

/**
 * PostgreSQL. 테이블은 Directus 가 만든 것을 그대로 쓴다 — synchronize 는 절대
 * 켜지 않는다(엔티티와 다른 칸을 지운다). 스키마 변경은 마이그레이션 파일로.
 */
@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST ?? 'localhost',
      port: Number(process.env.DB_PORT ?? 3330),
      database: process.env.DB_NAME ?? 'drvalue_cms',
      username: process.env.DB_USER ?? 'drvalue',
      password: process.env.DB_PASSWORD ?? '',
      entities: ENTITIES,
      synchronize: false,
      logging: process.env.DB_LOGGING === 'true',
    }),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
