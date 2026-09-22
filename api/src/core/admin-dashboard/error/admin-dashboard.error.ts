import { HttpStatus } from '@nestjs/common';
import { ICommonErrorCode } from '../../../common/error/common-error-code';

export const AdminDashboardError = {
  // ── 예상 못 한 실패(@ServiceException 이 바꾼다). 원인은 로그의 스택을 본다.
  SUMMARY_UNKNOWN: {
    code: 'ADMIN_DASHBOARD_SUMMARY_UNKNOWN',
    message: '홈 요약을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  } as ICommonErrorCode,
};
