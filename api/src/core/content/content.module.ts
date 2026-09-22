import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FileEntity } from '../../common/entity/file.entity';
import { PostFileEntity } from '../../common/entity/post-file.entity';
import { PostTranslationEntity } from '../../common/entity/post-translation.entity';
import { PostEntity } from '../../common/entity/post.entity';
import { ContentDefaultController } from './controller/content-default.controller';
import { ContentDefaultService } from './service/content-default.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PostEntity,
      PostTranslationEntity,
      PostFileEntity,
      FileEntity,
    ]),
  ],
  controllers: [ContentDefaultController],
  providers: [ContentDefaultService],
})
export class ContentModule {}
