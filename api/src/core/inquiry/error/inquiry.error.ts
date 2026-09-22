import { HttpStatus } from '@nestjs/common';
import { ICommonErrorCode } from '../../../common/error/common-error-code';

export const InquiryError = {
  SUBMIT_FAILED: {
    code: 'INQUIRY_SUBMIT_FAILED',
    message:
      '문의를 접수하지 못했습니다. 잠시 후 다시 시도하시거나 hi@drvalue.co.kr 로 보내 주세요.',
    detail: '메일 발송·DB 저장 둘 다 실패',
    status: HttpStatus.BAD_GATEWAY,
  } as ICommonErrorCode,
};
