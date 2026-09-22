import { Module } from '@nestjs/common';
import { ContentDefaultController } from './controller/content-default.controller';
import { ContentFileDefaultRepository } from './repository/file-default.repository';
import { ContentPostDefaultRepository } from './repository/post-default.repository';
import { ContentDefaultService } from './service/content-default.service';

@Module({
  controllers: [ContentDefaultController],
  providers: [
    ContentDefaultService,
    ContentPostDefaultRepository,
    ContentFileDefaultRepository,
  ],
})
export class ContentModule {}
