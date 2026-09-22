import { Injectable, Logger } from '@nestjs/common';
import { CommonError } from '../../../common/error/common-error';
import { ServiceException } from '../../../common/error/service-exception.decorator';
import { NcpMailService } from '../../../common/ncp-mail/ncp-mail.service';
import type { ITransactionContext } from '../../../common/typeorm/transaction-context';
import { ControllerInquiryDefaultCreateDto } from '../dto/controller-inquiry-default.dto';
import { InquiryError } from '../error/inquiry.error';
import { InquiryDefaultRepository } from '../repository/inquiry-default.repository';

/** 공개 문의 접수. 메일(담당자에게)과 DB 저장(관리 화면 문의 목록)을 같이 한다. */
@Injectable()
export class InquiryDefaultService {
  private readonly logger = new Logger(InquiryDefaultService.name);

  constructor(
    private readonly ncpMailService: NcpMailService,
    private readonly inquiryDefaultRepository: InquiryDefaultRepository,
  ) {}

  /**
   * 문의 한 건을 받는다. 메일과 DB 저장을 둘 다 시도한다 — 하나가 실패해도 나머지는 간다.
   * 메일이 안 가도 문의는 남아야 하고, DB 가 죽어도 담당자에게는 알려야 한다.
   * 둘 다 실패했을 때만 502. 어느 쪽이 실패했는지는 로그에만 남긴다(익명 제출자가 내부 상태를 못 읽게).
   * 트랜잭션으로 묶지 않는다 — 저장 한 건이고, 메일 실패가 저장을 되돌리면 안 된다.
   */
  @ServiceException({ errorCode: InquiryError.SUBMIT_UNKNOWN })
  async create(
    ctx: ITransactionContext,
    dto: ControllerInquiryDefaultCreateDto,
  ): Promise<void> {
    const [mailed, stored] = await Promise.allSettled([
      this.ncpMailService.configured
        ? this.ncpMailService.send(dto)
        : Promise.resolve(),
      this.inquiryDefaultRepository.insertNew(ctx, {
        name: dto.user_name,
        phone: dto.user_tel,
        email: dto.user_email,
        type: dto.user_type,
        message: dto.user_msg,
      }),
    ]);
    if (mailed.status === 'rejected')
      this.logger.error('메일 발송 실패', mailed.reason);
    if (stored.status === 'rejected')
      this.logger.error('DB 저장 실패', stored.reason);
    if (mailed.status === 'rejected' && stored.status === 'rejected')
      throw CommonError.createByErrorCode(InquiryError.SUBMIT_FAILED);
  }
}
