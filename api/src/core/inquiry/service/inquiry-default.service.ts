import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InquiryEntity } from '../../../common/entity/inquiry.entity';
import { CommonError } from '../../../common/error/common-error';
import { NcpMailService } from '../../../common/ncp-mail/ncp-mail.service';
import { ControllerInquiryDefaultCreateDto } from '../dto/controller-inquiry-default.dto';
import { InquiryError } from '../error/inquiry.error';

@Injectable()
export class InquiryDefaultService {
  private readonly log = new Logger(InquiryDefaultService.name);

  constructor(
    private readonly ncpMailService: NcpMailService,
    @InjectRepository(InquiryEntity)
    private readonly inquiries: Repository<InquiryEntity>,
  ) {}

  /**
   * 메일과 DB 저장을 둘 다 시도한다. 하나가 실패해도 나머지는 간다 —
   * 메일이 안 가도 문의는 남아야 하고, DB 가 죽어도 담당자에게는 알려야 한다.
   * 둘 다 실패했을 때만 502. 어느 쪽이 실패했는지는 로그에만 남긴다.
   */
  async create(dto: ControllerInquiryDefaultCreateDto): Promise<void> {
    const [mailed, stored] = await Promise.allSettled([
      this.ncpMailService.configured
        ? this.ncpMailService.send(dto)
        : Promise.resolve(),
      this.inquiries.save(
        this.inquiries.create({
          name: dto.user_name,
          phone: dto.user_tel,
          email: dto.user_email,
          type: dto.user_type,
          message: dto.user_msg,
          status: 'new',
        }),
      ),
    ]);
    if (mailed.status === 'rejected')
      this.log.error('메일 발송 실패', mailed.reason);
    if (stored.status === 'rejected')
      this.log.error('DB 저장 실패', stored.reason);
    if (mailed.status === 'rejected' && stored.status === 'rejected') {
      throw CommonError.createByErrorCode(InquiryError.SUBMIT_FAILED);
    }
  }
}
