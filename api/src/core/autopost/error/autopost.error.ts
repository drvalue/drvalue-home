import { HttpStatus } from '@nestjs/common';
import { ICommonErrorCode } from '../../../common/error/common-error-code';

export const AutopostError = {
  // ── 예상 못 한 실패(@ServiceException 이 바꾼다). cron·명령이라 화면에는 안 뜨고 로그에만 남는다.
  RUN_UNKNOWN: {
    code: 'AUTOPOST_RUN_UNKNOWN',
    message: '자동 글을 만들지 못했습니다.',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  } as ICommonErrorCode,

  NOT_CONFIGURED: {
    code: 'AUTOPOST_NOT_CONFIGURED',
    message: '자동 글 설정이 되어 있지 않습니다.',
    detail: 'ANTHROPIC_API_KEY 가 비었다',
    status: HttpStatus.SERVICE_UNAVAILABLE,
  } as ICommonErrorCode,
};
