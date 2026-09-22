import { HttpStatus } from '@nestjs/common';
import { ICommonErrorCode } from '../../../common/error/common-error';

export const InquiryError = {
  SUBMIT_FAILED: {
    code: 'INQUIRY_SUBMIT_FAILED',
    message: '문의를 접수하지 못했다',
    status: HttpStatus.BAD_GATEWAY,
  } as ICommonErrorCode,
};
