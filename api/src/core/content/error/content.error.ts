import { HttpStatus } from '@nestjs/common'
import { ICommonErrorCode } from '../../../common/error/common-error'

export const ContentError = {
  POST_NOT_FOUND: {
    code: 'CONTENT_POST_NOT_FOUND',
    message: '없는 글이다',
    status: HttpStatus.NOT_FOUND,
  } as ICommonErrorCode,

  FILE_ID_INVALID: {
    code: 'CONTENT_FILE_ID_INVALID',
    message: '잘못된 파일 주소',
    status: HttpStatus.BAD_REQUEST,
  } as ICommonErrorCode,

  FILE_NOT_FOUND: {
    code: 'CONTENT_FILE_NOT_FOUND',
    message: '없는 파일이다',
    status: HttpStatus.NOT_FOUND,
  } as ICommonErrorCode,

  FILE_UPSTREAM_ERROR: {
    code: 'CONTENT_FILE_UPSTREAM_ERROR',
    message: '파일을 가져오지 못했다',
    status: HttpStatus.BAD_GATEWAY,
  } as ICommonErrorCode,
}
