import { HttpStatus } from '@nestjs/common';
import { ICommonErrorCode } from '../../../common/error/common-error-code';

export const AdminFileError = {
  NO_FILE: {
    code: 'ADMIN_FILE_NO_FILE',
    message: '올릴 파일을 골라 주세요.',
    detail: 'multipart 필드 이름은 file',
    status: HttpStatus.BAD_REQUEST,
  } as ICommonErrorCode,

  TYPE_NOT_ALLOWED: {
    code: 'ADMIN_FILE_TYPE_NOT_ALLOWED',
    message:
      '올릴 수 없는 파일 형식입니다. 그림(png·jpg·webp·gif), PDF, 텍스트, 영상(mp4·webm)만 올릴 수 있습니다.',
    status: HttpStatus.BAD_REQUEST,
  } as ICommonErrorCode,

  TOO_LARGE: {
    code: 'ADMIN_FILE_TOO_LARGE',
    message:
      '파일이 너무 큽니다. 그림·PDF 는 20MB, 영상은 200MB 까지 올릴 수 있습니다.',
    status: HttpStatus.PAYLOAD_TOO_LARGE,
  } as ICommonErrorCode,

  NOT_FOUND: {
    code: 'ADMIN_FILE_NOT_FOUND',
    message: '파일을 찾을 수 없습니다. 이미 지워졌을 수 있습니다.',
    status: HttpStatus.NOT_FOUND,
  } as ICommonErrorCode,

  IN_USE: {
    code: 'ADMIN_FILE_IN_USE',
    message:
      '글에서 쓰고 있는 파일입니다. 지우면 그 글의 그림과 첨부에서도 빠집니다.',
    detail: 'force=1 이면 참조를 걷고 지운다',
    status: HttpStatus.CONFLICT,
  } as ICommonErrorCode,
};
