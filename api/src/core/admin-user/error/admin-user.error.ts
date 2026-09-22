import { HttpStatus } from '@nestjs/common';
import { ICommonErrorCode } from '../../../common/error/common-error';

export const AdminUserError = {
  BAD_ROLE: {
    code: 'ADMIN_USER_BAD_ROLE',
    message: '범위는 admin · marketing · hr 중 하나',
    status: HttpStatus.BAD_REQUEST,
  } as ICommonErrorCode,

  NOT_FOUND: {
    code: 'ADMIN_USER_NOT_FOUND',
    message: '없는 사람이다 — IAM 관리자가 한 번 로그인하면 생긴다',
    status: HttpStatus.NOT_FOUND,
  } as ICommonErrorCode,

  LAST_ADMIN: {
    code: 'ADMIN_USER_LAST_ADMIN',
    message: '마지막 「전부」 권한이다 — 내리면 아무도 권한을 못 고친다',
    status: HttpStatus.CONFLICT,
  } as ICommonErrorCode,
};
