import { HttpStatus } from '@nestjs/common';

/**
 * 에러 코드 한 건. `message` 는 화면에 그대로 뜬다 — 사용자에게 하는 말(합니다체, 마침표).
 * `detail` 은 개발자용 원인이다. 응답에 싣지 않고 5xx 로그에만 남긴다.
 * 환경변수·칸 이름·플래그·테이블 이름은 message 가 아니라 detail 에 적는다.
 */
export interface ICommonErrorCode {
  code: string;
  message: string;
  detail?: string;
  status: HttpStatus;
}
