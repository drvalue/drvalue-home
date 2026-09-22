import { HttpStatus } from '@nestjs/common';
import { ICommonErrorCode } from '../../../common/error/common-error-code';

/**
 * 변경 이력 공통 에러. 종류마다 다른 거절(파일은 되돌리지 않는다 · 권한은 권한 화면에서 · 주소 겹침 …)은
 * 그 기능의 에러 파일에 있고, 그 기능의 되돌리기 핸들러가 던진다.
 */
export const AdminRevisionError = {
  NOT_FOUND: {
    code: 'ADMIN_REVISION_NOT_FOUND',
    message: '변경 이력을 찾을 수 없습니다.',
    status: HttpStatus.NOT_FOUND,
  } as ICommonErrorCode,

  NO_BEFORE: {
    code: 'ADMIN_REVISION_NO_BEFORE',
    message: '처음 만든 기록이라 되돌릴 이전 상태가 없습니다.',
    detail: 'action=create 이력은 before 가 null',
    status: HttpStatus.BAD_REQUEST,
  } as ICommonErrorCode,

  NOT_RESTORABLE: {
    code: 'ADMIN_REVISION_NOT_RESTORABLE',
    message: '이 항목은 되돌릴 수 없습니다.',
    detail: '이 collection 에 되돌리기 핸들러가 없다(RevisionRestoreRegistry)',
    status: HttpStatus.BAD_REQUEST,
  } as ICommonErrorCode,

  // ── 예상 못 한 실패(@ServiceException 이 바꾼다). 원인은 로그의 스택을 본다.
  LIST_UNKNOWN: {
    code: 'ADMIN_REVISION_LIST_UNKNOWN',
    message: '변경 이력을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  } as ICommonErrorCode,

  GET_UNKNOWN: {
    code: 'ADMIN_REVISION_GET_UNKNOWN',
    message: '변경 이력을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  } as ICommonErrorCode,

  RESTORE_UNKNOWN: {
    code: 'ADMIN_REVISION_RESTORE_UNKNOWN',
    message: '되돌리지 못했습니다. 잠시 후 다시 시도해 주세요.',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  } as ICommonErrorCode,
};
