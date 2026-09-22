import { HttpStatus } from '@nestjs/common';
import { ICommonErrorCode } from '../../../common/error/common-error-code';

export const AdminRevisionError = {
  NOT_FOUND: {
    code: 'ADMIN_REVISION_NOT_FOUND',
    message: '변경 이력을 찾을 수 없습니다.',
    status: HttpStatus.NOT_FOUND,
  } as ICommonErrorCode,

  NO_BEFORE: {
    code: 'ADMIN_REVISION_NO_BEFORE',
    message:
      '처음 만든 기록이라 되돌릴 이전 상태가 없습니다. 없애려면 글을 지워 주세요.',
    detail: 'action=create 이력은 before 가 null',
    status: HttpStatus.BAD_REQUEST,
  } as ICommonErrorCode,

  FILE_NOT_RESTORABLE: {
    code: 'ADMIN_REVISION_FILE_NOT_RESTORABLE',
    message: '파일은 되돌릴 수 없습니다. 필요하면 파일을 다시 올려 주세요.',
    detail: '지운 파일의 본체는 남지 않는다',
    status: HttpStatus.BAD_REQUEST,
  } as ICommonErrorCode,

  NOT_RESTORABLE: {
    code: 'ADMIN_REVISION_NOT_RESTORABLE',
    message: '이 항목은 되돌릴 수 없습니다. 권한은 권한 화면에서 바꿔 주세요.',
    detail: 'admin_users 이력은 되돌리기 대상이 아니다',
    status: HttpStatus.BAD_REQUEST,
  } as ICommonErrorCode,

  SLUG_TAKEN: {
    code: 'ADMIN_REVISION_SLUG_TAKEN',
    message:
      '같은 주소를 쓰는 다른 글이 있어 되돌릴 수 없습니다. 그 글의 주소를 먼저 바꿔 주세요.',
    detail: 'before.slug 가 다른 글과 겹친다',
    status: HttpStatus.CONFLICT,
  } as ICommonErrorCode,

  TARGET_GONE: {
    code: 'ADMIN_REVISION_TARGET_GONE',
    message: '문의가 지워져 되돌릴 수 없습니다.',
    status: HttpStatus.NOT_FOUND,
  } as ICommonErrorCode,
};
