import { HttpStatus } from '@nestjs/common';
import { ICommonErrorCode } from '../../../common/error/common-error';

export const AdminRevisionError = {
  NOT_FOUND: {
    code: 'ADMIN_REVISION_NOT_FOUND',
    message: '없는 이력이다',
    status: HttpStatus.NOT_FOUND,
  } as ICommonErrorCode,

  NO_BEFORE: {
    code: 'ADMIN_REVISION_NO_BEFORE',
    message: '만들기 이전 상태는 없다 — 없애려면 글을 지운다',
    status: HttpStatus.BAD_REQUEST,
  } as ICommonErrorCode,

  FILE_NOT_RESTORABLE: {
    code: 'ADMIN_REVISION_FILE_NOT_RESTORABLE',
    message:
      '파일은 되돌릴 수 없다 — 지운 파일의 본체는 남아 있지 않다. 다시 올린다',
    status: HttpStatus.BAD_REQUEST,
  } as ICommonErrorCode,

  NOT_RESTORABLE: {
    code: 'ADMIN_REVISION_NOT_RESTORABLE',
    message:
      '이 대상은 되돌리기를 지원하지 않는다 — 권한은 권한 화면에서 바꾼다',
    status: HttpStatus.BAD_REQUEST,
  } as ICommonErrorCode,

  SLUG_TAKEN: {
    code: 'ADMIN_REVISION_SLUG_TAKEN',
    message:
      '같은 주소(slug)의 다른 글이 이미 있다 — 그 글의 주소를 바꾼 뒤 되돌린다',
    status: HttpStatus.CONFLICT,
  } as ICommonErrorCode,

  TARGET_GONE: {
    code: 'ADMIN_REVISION_TARGET_GONE',
    message: '되돌릴 문의가 없다(지워졌다)',
    status: HttpStatus.NOT_FOUND,
  } as ICommonErrorCode,
};
