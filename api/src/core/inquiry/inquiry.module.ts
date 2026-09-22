import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { DirectusModule } from '../../common/directus/directus.module';
import { NcpMailModule } from '../../common/ncp-mail/ncp-mail.module';
import { InquiryDefaultController } from './controller/inquiry-default.controller';
import { InquiryDefaultService } from './service/inquiry-default.service';

/** IP 당 분·시 한도. 메일은 건당 과금이라 창구를 열어 두면 안 된다. */
const perMinute = Number(process.env.MAIL_RL_PER_MINUTE ?? 5);
const perHour = Number(process.env.MAIL_RL_PER_HOUR ?? 30);

@Module({
  imports: [
    DirectusModule,
    NcpMailModule,
    ThrottlerModule.forRoot([
      { name: 'minute', ttl: 60_000, limit: perMinute },
      { name: 'hour', ttl: 3_600_000, limit: perHour },
    ]),
  ],
  controllers: [InquiryDefaultController],
  providers: [InquiryDefaultService],
})
export class InquiryModule {}
