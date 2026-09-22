import { BadGatewayException, Body, Controller, Logger, Post, UseGuards } from '@nestjs/common'
import { ThrottlerGuard } from '@nestjs/throttler'
import { Public, SkipGatewaySignature } from '@drvalue-oss/iam-nestjs'
import { DirectusService } from '../content/directus.service'
import { CreateInquiryDto } from './inquiry.dto'
import { MailService } from './mail.service'

/**
 * 홈페이지 문의. mail_send.php 를 대신한다.
 *
 * PHP 는 메일만 보내고 끝이라 기록이 남지 않았다. 여기서는 CMS 에도 넣는다 —
 * 담당자가 관리 화면에서 상태와 담당자를 관리할 수 있어야 한다(요구사항 7번).
 * 둘 중 하나가 실패해도 나머지는 진행한다. 메일이 안 가도 문의는 남아야 하고,
 * CMS 가 죽어도 담당자에게는 알려야 한다.
 */
/**
 * 이 컨트롤러는 **공개 홈페이지가 직접 부르는 자리**다. 게이트웨이를 거치지
 * 않으므로 서명이 없다. `@Public()` 은 인증만 면제할 뿐 게이트웨이 가드는
 * 그대로 통과 못 하므로, 여기에 `@SkipGatewaySignature()` 를 명시한다.
 *
 * 이렇게 해 두면 enforceGatewayOnly 의 기본값을 켠 쪽으로 둘 수 있다 —
 * 표시하지 않은 새 경로는 자동으로 게이트웨이 뒤에 서게 된다.
 */
@SkipGatewaySignature()
@UseGuards(ThrottlerGuard)
@Controller('inquiry')
export class InquiryController {
  private readonly log = new Logger(InquiryController.name)

  constructor(
    private readonly mail: MailService,
    private readonly directus: DirectusService,
  ) {}

  @Public()
  @Post()
  async create(@Body() dto: CreateInquiryDto) {
    const results = await Promise.allSettled([
      this.mail.configured ? this.mail.send(dto) : Promise.resolve('메일 설정 없음'),
      this.directus.configured
        ? this.directus.post('/items/inquiries', {
            name: dto.user_name,
            phone: dto.user_tel,
            type: dto.user_type,
            message: dto.user_msg,
          })
        : Promise.resolve('CMS 설정 없음'),
    ])

    const [mailed, stored] = results
    if (mailed.status === 'rejected') this.log.error('메일 발송 실패', mailed.reason)
    if (stored.status === 'rejected') this.log.error('CMS 저장 실패', stored.reason)

    if (mailed.status === 'rejected' && stored.status === 'rejected') {
      throw new BadGatewayException('문의를 접수하지 못했다')
    }
    // 어느 쪽이 실패했는지는 로그에만 남긴다. 익명으로 글을 넣는 사람에게
    // "CMS 가 죽었다" 를 알려 줄 이유가 없다.
    return { ok: true }
  }
}
