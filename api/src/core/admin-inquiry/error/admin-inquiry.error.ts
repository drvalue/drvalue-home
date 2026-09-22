import { HttpStatus } from '@nestjs/common';
import { INQUIRY_STATUSES } from '../../../common/entity/inquiry.entity';
import { ICommonErrorCode } from '../../../common/error/common-error-code';

export const AdminInquiryError = {
  NOT_FOUND: {
    code: 'ADMIN_INQUIRY_NOT_FOUND',
    message: '문의를 찾을 수 없습니다. 이미 지워졌을 수 있습니다.',
    status: HttpStatus.NOT_FOUND,
  } as ICommonErrorCode,

  BAD_STATUS: {
    code: 'ADMIN_INQUIRY_BAD_STATUS',
    message: '문의 상태 값이 올바르지 않습니다.',
    detail: `상태는 ${INQUIRY_STATUSES.join(' · ')} 중 하나`,
    status: HttpStatus.BAD_REQUEST,
  } as ICommonErrorCode,

  BAD_ASSIGNEE: {
    code: 'ADMIN_INQUIRY_BAD_ASSIGNEE',
    message:
      '담당자로 지정할 수 없는 계정입니다. 권한 목록에 있는 계정만 지정할 수 있습니다.',
    detail: 'admin_users 에 있고 enabled 여야 한다',
    status: HttpStatus.BAD_REQUEST,
  } as ICommonErrorCode,
};
