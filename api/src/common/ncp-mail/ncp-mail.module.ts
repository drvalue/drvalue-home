import { Module } from '@nestjs/common'
import { NcpMailService } from './ncp-mail.service'

@Module({
  providers: [NcpMailService],
  exports: [NcpMailService],
})
export class NcpMailModule {}
