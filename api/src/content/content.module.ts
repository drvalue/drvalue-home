import { Module } from '@nestjs/common'
import { ContentController } from './content.controller'
import { DirectusService } from './directus.service'

@Module({
  controllers: [ContentController],
  providers: [DirectusService],
  exports: [DirectusService],
})
export class ContentModule {}
