import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostFileEntity } from '../../common/entity/post-file.entity';
import { PostTranslationEntity } from '../../common/entity/post-translation.entity';
import { PostEntity } from '../../common/entity/post.entity';
import { AdminAuthModule } from '../admin-auth/admin-auth.module';
import { RevisionModule } from '../../common/revision/revision.module';
import { AdminPostDefaultController } from './controller/admin-post-default.controller';
import { PostDefaultRepository } from './repository/post-default.repository';
import { AdminPostDefaultService } from './service/admin-post-default.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PostEntity,
      PostTranslationEntity,
      PostFileEntity,
    ]),
    AdminAuthModule,
    RevisionModule,
  ],
  controllers: [AdminPostDefaultController],
  providers: [PostDefaultRepository, AdminPostDefaultService],
  exports: [PostDefaultRepository],
})
export class AdminPostModule {}
