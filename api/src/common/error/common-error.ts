import { HttpException, HttpStatus } from '@nestjs/common';

export interface ICommonErrorCode {
  code: string;
  message: string;
  status: HttpStatus;
}

/** 응답 본문은 `{ statusCode, code, message }` 로 고정한다. */
export class CommonError extends HttpException {
  constructor(errorCode: ICommonErrorCode) {
    super(
      {
        statusCode: errorCode.status,
        code: errorCode.code,
        message: errorCode.message,
      },
      errorCode.status,
    );
  }
}
