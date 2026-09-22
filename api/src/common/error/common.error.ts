import { HttpStatus } from '@nestjs/common';
import { ICommonErrorCode } from './common-error-code';

/** 기능 에러 코드가 없는 실패. 필터가 HTTP 상태로 고른다. */
export const CommonErrorCode = {
  INVALID_INPUT: {
    code: 'COMMON_INVALID_INPUT',
    message: '입력한 내용을 다시 확인해 주세요.',
    detail: 'ValidationPipe 가 막았다',
    status: HttpStatus.BAD_REQUEST,
  } as ICommonErrorCode,

  FORBIDDEN: {
    code: 'COMMON_FORBIDDEN',
    message: '이 작업을 할 권한이 없습니다.',
    status: HttpStatus.FORBIDDEN,
  } as ICommonErrorCode,

  NOT_FOUND: {
    code: 'COMMON_NOT_FOUND',
    message: '요청한 주소를 찾을 수 없습니다.',
    detail: '없는 경로',
    status: HttpStatus.NOT_FOUND,
  } as ICommonErrorCode,

  PAYLOAD_TOO_LARGE: {
    code: 'COMMON_PAYLOAD_TOO_LARGE',
    message: '보낸 파일이나 내용이 너무 큽니다.',
    detail: 'multer fileSize 또는 body 한도를 넘었다',
    status: HttpStatus.PAYLOAD_TOO_LARGE,
  } as ICommonErrorCode,

  TOO_MANY_REQUESTS: {
    code: 'COMMON_TOO_MANY_REQUESTS',
    message: '요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.',
    detail: 'ThrottlerGuard 한도',
    status: HttpStatus.TOO_MANY_REQUESTS,
  } as ICommonErrorCode,

  REQUEST_FAILED: {
    code: 'COMMON_REQUEST_FAILED',
    message: '요청을 처리하지 못했습니다. 다시 시도해 주세요.',
    status: HttpStatus.BAD_REQUEST,
  } as ICommonErrorCode,

  INTERNAL: {
    code: 'COMMON_INTERNAL',
    message: '일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  } as ICommonErrorCode,
};
