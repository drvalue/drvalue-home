import { HttpStatus } from '@nestjs/common';
import { ICommonErrorCode } from '../../../common/error/common-error';

export const AdminAuthError = {
  NOT_CONFIGURED: {
    code: 'ADMIN_AUTH_NOT_CONFIGURED',
    message: 'ADMIN_IAM_BASE / ADMIN_IAM_CALLBACK_URL 이 비어 있다',
    status: HttpStatus.SERVICE_UNAVAILABLE,
  } as ICommonErrorCode,

  BAD_STATE: {
    code: 'ADMIN_AUTH_BAD_STATE',
    message: '로그인 요청이 우리가 보낸 것이 아니거나 10분이 지났다',
    status: HttpStatus.FORBIDDEN,
  } as ICommonErrorCode,

  EXCHANGE_FAILED: {
    code: 'ADMIN_AUTH_EXCHANGE_FAILED',
    message: 'IAM 이 code 를 거부했다',
    status: HttpStatus.FORBIDDEN,
  } as ICommonErrorCode,

  NO_EMAIL: {
    code: 'ADMIN_AUTH_NO_EMAIL',
    message: 'IAM 토큰에 이메일이 없다',
    status: HttpStatus.FORBIDDEN,
  } as ICommonErrorCode,

  NOT_ALLOWED: {
    code: 'ADMIN_AUTH_NOT_ALLOWED',
    message: '관리 화면에 들어올 권한이 없다',
    status: HttpStatus.FORBIDDEN,
  } as ICommonErrorCode,

  UNAUTHORIZED: {
    code: 'ADMIN_AUTH_UNAUTHORIZED',
    message: '로그인이 필요하다',
    status: HttpStatus.UNAUTHORIZED,
  } as ICommonErrorCode,
};
