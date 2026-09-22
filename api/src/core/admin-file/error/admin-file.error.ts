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
    message: 'png · jpg · webp · gif · pdf · txt · mp4 · webm 만 올릴 수 있다',
    status: HttpStatus.BAD_REQUEST,
  } as ICommonErrorCode,

  TOO_LARGE: {
    code: 'ADMIN_FILE_TOO_LARGE',
    message: '그림·PDF 는 20MB, 영상은 200MB 까지',
    status: HttpStatus.PAYLOAD_TOO_LARGE,
  } as ICommonErrorCode,

  NOT_FOUND: {
    code: 'ADMIN_FILE_NOT_FOUND',
    message: '없는 파일이다',
    status: HttpStatus.NOT_FOUND,
  } as ICommonErrorCode,

  IN_USE: {
    code: 'ADMIN_FILE_IN_USE',
    message:
      '글에서 쓰는 파일이다. 그래도 지우려면 force=1 — 그 글들의 그림·첨부에서 빠진다',
    status: HttpStatus.CONFLICT,
  } as ICommonErrorCode,
};
