import { HttpStatus } from '@nestjs/common';
import { IApiCommonResponse } from '../response/api-common-response';
import { ICommonErrorCode } from './common-error-code';

/** 서비스·가드가 던지는 에러. `CommonExceptionFilter` 가 응답으로 바꾼다. */
export class CommonError {
  constructor(
    public readonly _status: HttpStatus,
    public readonly _resultCode: string,
    public readonly _message: string,
    public readonly _detail?: string,
  ) {}

  getApiResponseNoData(): IApiCommonResponse<null> {
    return {
      data: null,
      status: this._status,
      resultCode: this._resultCode,
      message: this._message,
    };
  }

  getStatus(): HttpStatus {
    return this._status;
  }

  getResultCode(): string {
    return this._resultCode;
  }

  static createByErrorCode(
    errorCode: ICommonErrorCode,
    customMessage?: string,
  ): CommonError {
    return new CommonError(
      errorCode.status || HttpStatus.INTERNAL_SERVER_ERROR,
      errorCode.code,
      customMessage || errorCode.message,
      errorCode.detail,
    );
  }
}
