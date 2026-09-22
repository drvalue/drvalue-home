import { Module } from '@nestjs/common'
import { DirectusModule } from '../../common/directus/directus.module'
import { ContentDefaultController } from './controller/content-default.controller'
import { ContentDefaultService } from './service/content-default.service'

@Module({
  imports: [DirectusModule],
  controllers: [ContentDefaultController],
  providers: [ContentDefaultService],
})
export class ContentModule {}
