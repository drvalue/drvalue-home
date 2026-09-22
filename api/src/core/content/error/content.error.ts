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
};
