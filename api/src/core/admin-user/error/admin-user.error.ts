import { HttpStatus } from '@nestjs/common';
import { ICommonErrorCode } from '../../../common/error/common-error-code';

export const AdminUserError = {
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

  NOT_RESTORABLE: {
    code: 'ADMIN_USER_NOT_RESTORABLE',
    message: '이 항목은 되돌릴 수 없습니다. 권한은 권한 화면에서 바꿔 주세요.',
    detail: '마지막 전체 권한 규칙을 거치게 권한 화면에서만 바꾼다',
    status: HttpStatus.BAD_REQUEST,
  } as ICommonErrorCode,

  // ── 예상 못 한 실패(@ServiceException 이 바꾼다). 원인은 로그의 스택을 본다.
  LIST_UNKNOWN: {
    code: 'ADMIN_USER_LIST_UNKNOWN',
    message: '권한 목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  } as ICommonErrorCode,

  ROLE_UNKNOWN: {
    code: 'ADMIN_USER_ROLE_UNKNOWN',
    message: '권한 범위를 바꾸지 못했습니다. 잠시 후 다시 시도해 주세요.',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  } as ICommonErrorCode,
};
