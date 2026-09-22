import { HttpStatus } from '@nestjs/common';
import { ICommonErrorCode } from '../../../common/error/common-error-code';

export const AdminInquiryError = {
  NOT_FOUND: {
    code: 'ADMIN_INQUIRY_NOT_FOUND',
    message: '문의를 찾을 수 없습니다. 이미 지워졌을 수 있습니다.',
    status: HttpStatus.NOT_FOUND,
  } as ICommonErrorCode,

  BAD_ASSIGNEE: {
    code: 'ADMIN_INQUIRY_BAD_ASSIGNEE',
    message:
      '담당자로 지정할 수 없는 계정입니다. 권한 목록에 있는 계정만 지정할 수 있습니다.',
    detail: 'admin_users 에 있고 enabled 여야 한다',
    status: HttpStatus.BAD_REQUEST,
  } as ICommonErrorCode,

  RESTORE_TARGET_GONE: {
    code: 'ADMIN_INQUIRY_RESTORE_TARGET_GONE',
    message: '문의가 지워져 되돌릴 수 없습니다.',
    detail: '지운 문의는 되살리지 않는다 — 상태·담당자·메모만 되돌린다',
    status: HttpStatus.NOT_FOUND,
  } as ICommonErrorCode,

  // ── 예상 못 한 실패(@ServiceException 이 바꾼다). 원인은 로그의 스택을 본다.
  RESTORE_UNKNOWN: {
    code: 'ADMIN_INQUIRY_RESTORE_UNKNOWN',
    message: '문의를 되돌리지 못했습니다. 잠시 후 다시 시도해 주세요.',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  } as ICommonErrorCode,

  LIST_UNKNOWN: {
    code: 'ADMIN_INQUIRY_LIST_UNKNOWN',
    message: '문의 목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  } as ICommonErrorCode,

  GET_UNKNOWN: {
    code: 'ADMIN_INQUIRY_GET_UNKNOWN',
    message: '문의를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  } as ICommonErrorCode,

  ASSIGNEES_UNKNOWN: {
    code: 'ADMIN_INQUIRY_ASSIGNEES_UNKNOWN',
    message: '담당자 목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  } as ICommonErrorCode,

  UPDATE_UNKNOWN: {
    code: 'ADMIN_INQUIRY_UPDATE_UNKNOWN',
    message: '문의를 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  } as ICommonErrorCode,

  DELETE_UNKNOWN: {
    code: 'ADMIN_INQUIRY_DELETE_UNKNOWN',
    message: '문의를 지우지 못했습니다. 잠시 후 다시 시도해 주세요.',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  } as ICommonErrorCode,
};
