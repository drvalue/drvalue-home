import { Module } from '@nestjs/common'
import { ChatStore } from './chat-store.service'
import { NotifyConfig } from './notify.config'
import { NotifyController } from './notify.controller'
import { UpstreamService } from './upstream.service'

@Module({
  controllers: [NotifyController],
  providers: [NotifyConfig, UpstreamService, ChatStore],
})
export class NotifyModule {}
