import { HttpStatus } from '@nestjs/common';
import { ICommonErrorCode } from '../../../common/error/common-error-code';

export const ContentError = {
  POST_NOT_FOUND: {
    code: 'CONTENT_POST_NOT_FOUND',
    message: '글을 찾을 수 없습니다.',
    status: HttpStatus.NOT_FOUND,
  } as ICommonErrorCode,

  FILE_ID_INVALID: {
    code: 'CONTENT_FILE_ID_INVALID',
    message: '파일 주소가 올바르지 않습니다.',
    status: HttpStatus.BAD_REQUEST,
  } as ICommonErrorCode,

  FILE_NOT_FOUND: {
    code: 'CONTENT_FILE_NOT_FOUND',
    message: '파일을 찾을 수 없습니다.',
    status: HttpStatus.NOT_FOUND,
  } as ICommonErrorCode,

  // ── 예상 못 한 실패(@ServiceException 이 바꾼다). 원인은 로그의 스택을 본다.
  POSTS_UNKNOWN: {
    code: 'CONTENT_POSTS_UNKNOWN',
    message: '글 목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  } as ICommonErrorCode,

  POST_UNKNOWN: {
    code: 'CONTENT_POST_UNKNOWN',
    message: '글을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  } as ICommonErrorCode,

  FILE_UNKNOWN: {
    code: 'CONTENT_FILE_UNKNOWN',
    message: '파일을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  } as ICommonErrorCode,
};
