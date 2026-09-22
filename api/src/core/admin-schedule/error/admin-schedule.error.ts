import { HttpStatus } from '@nestjs/common';
import { ICommonErrorCode } from '../../../common/error/common-error-code';

export const AdminScheduleError = {
  // ── 예상 못 한 실패(@ServiceException 이 바꾼다). cron 이라 화면에는 안 뜨고 로그에만 남는다.
  RUN_UNKNOWN: {
    code: 'ADMIN_SCHEDULE_RUN_UNKNOWN',
    message: '예약 게시를 처리하지 못했습니다.',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  } as ICommonErrorCode,
};
