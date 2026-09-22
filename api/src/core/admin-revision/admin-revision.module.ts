import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FileEntity } from '../../common/entity/file.entity';
import { InquiryEntity } from '../../common/entity/inquiry.entity';
import { PostFileEntity } from '../../common/entity/post-file.entity';
import { PostTranslationEntity } from '../../common/entity/post-translation.entity';
import { PostEntity } from '../../common/entity/post.entity';
import { RevisionModule } from '../../common/revision/revision.module';
import { AdminAuthModule } from '../admin-auth/admin-auth.module';
import { AdminRevisionDefaultController } from './controller/admin-revision-default.controller';
import { AdminRevisionDefaultService } from './service/admin-revision-default.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PostEntity,
      PostTranslationEntity,
      PostFileEntity,
      FileEntity,
      InquiryEntity,
    ]),
    AdminAuthModule,
    RevisionModule,
  ],
  controllers: [AdminRevisionDefaultController],
  providers: [AdminRevisionDefaultService],
  // 홈(admin-dashboard)이 최근 변경을 같은 모양으로 보여 주려고 쓴다.
  exports: [AdminRevisionDefaultService],
})
export class AdminRevisionModule {}
