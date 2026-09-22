import { HttpStatus } from '@nestjs/common';

/** 응답 본문. bmes 와 같은 모양이지만 HTTP 상태는 실제 값을 쓴다(200 으로 덮지 않는다). */
export interface IApiCommonResponse<T> {
  data: T;
  status: HttpStatus;
  resultCode: string;
  message: string;
  path?: string;
  timestamp?: string;
}
