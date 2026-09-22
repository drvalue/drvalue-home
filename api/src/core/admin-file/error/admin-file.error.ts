import { HttpStatus } from '@nestjs/common';
import { ICommonErrorCode } from '../../../common/error/common-error';

export const AdminFileError = {
  NO_FILE: {
    code: 'ADMIN_FILE_NO_FILE',
    message: '파일이 없다 (multipart 필드 이름은 file)',
    status: HttpStatus.BAD_REQUEST,
  } as ICommonErrorCode,

  TYPE_NOT_ALLOWED: {
    code: 'ADMIN_FILE_TYPE_NOT_ALLOWED',
    message: 'png · jpg · webp · gif · pdf 만 올릴 수 있다',
    status: HttpStatus.BAD_REQUEST,
  } as ICommonErrorCode,

  NOT_FOUND: {
    code: 'ADMIN_FILE_NOT_FOUND',
    message: '없는 파일이다',
    status: HttpStatus.NOT_FOUND,
  } as ICommonErrorCode,
};
