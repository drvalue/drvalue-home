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

  // ── 묶음을 받는 입구(/api/autopost/*). 사람이 아니라 예약 실행이 읽는다.
  UNAUTHORIZED: {
    code: 'AUTOPOST_UNAUTHORIZED',
    message: '인증이 필요합니다.',
    detail:
      'Authorization: Bearer 토큰이 없거나 틀렸다. 서버에 AUTOPOST_SUBMIT_TOKEN 이 없어도 같은 답이다',
    status: HttpStatus.UNAUTHORIZED,
  } as ICommonErrorCode,
};
