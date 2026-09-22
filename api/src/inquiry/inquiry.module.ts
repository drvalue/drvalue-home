import { Module } from '@nestjs/common'
import { ThrottlerModule } from '@nestjs/throttler'
import { ContentModule } from '../content/content.module'
import { InquiryController } from './inquiry.controller'
import { MailService } from './mail.service'

/**
 * mail_send.php 는 IP 별로 분·시 두 창을 세고 넘으면 429 + Retry-After 를
 * 줬다. 그 방어가 Nest 에 없으면 문의 창구가 그대로 열린 채 이관된다 —
 * 메일은 네이버 클라우드에서 건당 과금되는 자원이다.
 * 기본값과 환경변수 이름 모두 PHP 쪽과 같게 뒀다.
 *
 * 가드는 InquiryController 에 직접 건다. APP_GUARD 로 넣으면 **어느 모듈에
 * 선언하든 전역**이라 게시판 조회까지 함께 묶인다 — 실제로 그렇게 두었다가
 * 목록을 몇 번 넘기는 것만으로 429 가 나는 것을 검증에서 잡았다.
 */
const perMinute = Number(process.env.MAIL_RL_PER_MINUTE ?? 5)
const perHour = Number(process.env.MAIL_RL_PER_HOUR ?? 30)

@Module({
  imports: [
    ContentModule,
    ThrottlerModule.forRoot([
      { name: 'minute', ttl: 60_000, limit: perMinute },
      { name: 'hour', ttl: 3_600_000, limit: perHour },
    ]),
  ],
  controllers: [InquiryController],
  providers: [MailService],
})
export class InquiryModule {}
