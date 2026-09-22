import { HttpStatus } from '@nestjs/common';
import { ICommonErrorCode } from '../../../common/error/common-error-code';

export const AdminAuthError = {
  NOT_CONFIGURED: {
    code: 'ADMIN_AUTH_NOT_CONFIGURED',
    message: '로그인 설정이 끝나지 않았습니다. 사이트 담당자에게 알려 주세요.',
    detail: 'ADMIN_IAM_CALLBACK_URL 또는 ADMIN_SESSION_SECRET 이 비어 있다',
    status: HttpStatus.SERVICE_UNAVAILABLE,
  } as ICommonErrorCode,

  BAD_STATE: {
    code: 'ADMIN_AUTH_BAD_STATE',
    message: '로그인 요청 시간이 지났습니다. 다시 로그인해 주세요.',
    detail: 'state 서명이 틀렸거나 10분이 지났다(쿼리·쿠키 둘 다)',
    status: HttpStatus.FORBIDDEN,
  } as ICommonErrorCode,

  EXCHANGE_FAILED: {
    code: 'ADMIN_AUTH_EXCHANGE_FAILED',
    message: 'IAM 로그인을 확인하지 못했습니다. 다시 로그인해 주세요.',
    detail: 'IAM /auth/token/exchange 가 code 를 거부했다',
    status: HttpStatus.FORBIDDEN,
  } as ICommonErrorCode,

  NO_EMAIL: {
    code: 'ADMIN_AUTH_NO_EMAIL',
    message:
      'IAM 계정에 이메일이 없어 들어올 수 없습니다. IAM 담당자에게 문의해 주세요.',
    detail: 'access_token claim 에 email 이 없다',
    status: HttpStatus.FORBIDDEN,
  } as ICommonErrorCode,

  NOT_ALLOWED: {
    code: 'ADMIN_AUTH_NOT_ALLOWED',
    message:
      '관리자 계정이 아닙니다. 사내 IAM 에서 관리자로 지정된 계정만 들어올 수 있습니다.',
    detail:
      'IAM 최상위 role 이 ADMIN·PLATFORM_ADMIN 이 아니거나 admin_users 에서 꺼졌다',
    status: HttpStatus.FORBIDDEN,
  } as ICommonErrorCode,

  FORBIDDEN: {
    code: 'ADMIN_AUTH_FORBIDDEN',
    message: '이 작업을 할 권한이 없습니다.',
    detail: '세션 범위(admin·marketing·hr)가 @AdminRoles 에 없다',
    status: HttpStatus.FORBIDDEN,
  } as ICommonErrorCode,

  UNAUTHORIZED: {
    code: 'ADMIN_AUTH_UNAUTHORIZED',
    message: '로그인이 필요합니다.',
    detail: 'dv_admin 세션이 없거나 만료됐다',
    status: HttpStatus.UNAUTHORIZED,
  } as ICommonErrorCode,
};
