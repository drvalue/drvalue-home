import { HttpStatus, Injectable } from '@nestjs/common';
import { ILike } from 'typeorm';
import { INQUIRY_STATUSES } from '../../../common/entity/inquiry.entity';
import {
  CommonError,
  ICommonErrorCode,
} from '../../../common/error/common-error';
import { InquiryDefaultRepository } from '../repository/inquiry-default.repository';

const PAGE = 30;

export const AdminInquiryError = {
  NOT_FOUND: {
    code: 'ADMIN_INQUIRY_NOT_FOUND',
    message: '없는 문의다',
    status: HttpStatus.NOT_FOUND,
  } as ICommonErrorCode,
  BAD_STATUS: {
    code: 'ADMIN_INQUIRY_BAD_STATUS',
    message: `상태는 ${INQUIRY_STATUSES.join(' · ')} 중 하나`,
    status: HttpStatus.BAD_REQUEST,
  } as ICommonErrorCode,
};

@Injectable()
export class AdminInquiryDefaultService {
  constructor(
    private readonly inquiryDefaultRepository: InquiryDefaultRepository,
  ) {}

  async list(options: { status?: string; q?: string; page?: number }) {
    const page = Math.max(1, options.page ?? 1);
    const where: Record<string, unknown> = {};
    if (options.status) where.status = options.status;
    if (options.q) where.name = ILike(`%${options.q}%`);
    const [rows, total] =
      await this.inquiryDefaultRepository.repository.findAndCount({
        where,
        order: { id: 'DESC' },
        skip: (page - 1) * PAGE,
        take: PAGE,
      });
    return { data: rows, total, page, pageSize: PAGE };
  }

  async setStatus(id: number, status: string) {
    if (!(INQUIRY_STATUSES as readonly string[]).includes(status))
      throw new CommonError(AdminInquiryError.BAD_STATUS);
    const row = await this.inquiryDefaultRepository.repository.findOne({
      where: { id },
    });
    if (!row) throw new CommonError(AdminInquiryError.NOT_FOUND);
    row.status = status;
    return this.inquiryDefaultRepository.repository.save(row);
  }

  async remove(id: number): Promise<void> {
    const row = await this.inquiryDefaultRepository.repository.findOne({
      where: { id },
    });
    if (!row) throw new CommonError(AdminInquiryError.NOT_FOUND);
    await this.inquiryDefaultRepository.repository.remove(row);
  }
}
