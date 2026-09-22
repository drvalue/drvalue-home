import { HttpStatus } from '@nestjs/common';
import { ICommonErrorCode } from '../../../common/error/common-error';

export const AdminPostError = {
  NOT_FOUND: {
    code: 'ADMIN_POST_NOT_FOUND',
    message: '없는 글이다',
    status: HttpStatus.NOT_FOUND,
  } as ICommonErrorCode,

  SLUG_TAKEN: {
    code: 'ADMIN_POST_SLUG_TAKEN',
    message: '같은 주소(slug)의 글이 이미 있다',
    status: HttpStatus.CONFLICT,
  } as ICommonErrorCode,

  NEED_KO: {
    code: 'ADMIN_POST_NEED_KO',
    message: '한국어 제목은 있어야 한다',
    status: HttpStatus.BAD_REQUEST,
  } as ICommonErrorCode,
};
