import { HttpStatus } from '@nestjs/common';
import { INQUIRY_STATUSES } from '../../../common/entity/inquiry.entity';
import { ICommonErrorCode } from '../../../common/error/common-error';

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

  BAD_ASSIGNEE: {
    code: 'ADMIN_INQUIRY_BAD_ASSIGNEE',
    message: '담당자는 권한 목록(admin_users)에 있는 켜진 계정이어야 한다',
    status: HttpStatus.BAD_REQUEST,
  } as ICommonErrorCode,
};
