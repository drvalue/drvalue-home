import { HttpStatus } from '@nestjs/common';
import { ICommonErrorCode } from '../../../common/error/common-error-code';

export const AdminUserError = {
  BAD_ROLE: {
    code: 'ADMIN_USER_BAD_ROLE',
    message: '권한 범위 값이 올바르지 않습니다.',
    detail: 'admin · marketing · hr 중 하나',
    status: HttpStatus.BAD_REQUEST,
  } as ICommonErrorCode,

  NOT_FOUND: {
    code: 'ADMIN_USER_NOT_FOUND',
    message:
      '권한 목록에 없는 계정입니다. IAM 관리자가 한 번 로그인하면 목록에 나타납니다.',
    status: HttpStatus.NOT_FOUND,
  } as ICommonErrorCode,

  LAST_ADMIN: {
    code: 'ADMIN_USER_LAST_ADMIN',
    message:
      '마지막 남은 전체 권한 계정이라 바꿀 수 없습니다. 다른 사람에게 전체 권한을 먼저 주세요.',
    status: HttpStatus.CONFLICT,
  } as ICommonErrorCode,
};
