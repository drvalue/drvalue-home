import { HttpStatus } from '@nestjs/common';
import { ICommonErrorCode } from '../../../common/error/common-error-code';

export const AdminPostError = {
  NOT_FOUND: {
    code: 'ADMIN_POST_NOT_FOUND',
    message: '글을 찾을 수 없습니다. 이미 지워졌을 수 있습니다.',
    status: HttpStatus.NOT_FOUND,
  } as ICommonErrorCode,

  SLUG_TAKEN: {
    code: 'ADMIN_POST_SLUG_TAKEN',
    message: '같은 주소를 쓰는 글이 이미 있습니다. 주소를 바꿔 주세요.',
    detail: 'posts.slug 중복',
    status: HttpStatus.CONFLICT,
  } as ICommonErrorCode,

  NEED_KO: {
    code: 'ADMIN_POST_NEED_KO',
    message: '한국어 제목을 입력해 주세요.',
    detail: 'posts_translations 에 ko-KR 제목이 없다',
    status: HttpStatus.BAD_REQUEST,
  } as ICommonErrorCode,
};
