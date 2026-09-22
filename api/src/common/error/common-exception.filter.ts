import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { ICommonErrorCode } from './common-error-code';
import { CommonError } from './common-error';
import { CommonErrorCode } from './common.error';

const BY_STATUS: Partial<Record<number, ICommonErrorCode>> = {
  [HttpStatus.BAD_REQUEST]: CommonErrorCode.INVALID_INPUT,
  [HttpStatus.FORBIDDEN]: CommonErrorCode.FORBIDDEN,
  [HttpStatus.NOT_FOUND]: CommonErrorCode.NOT_FOUND,
  [HttpStatus.PAYLOAD_TOO_LARGE]: CommonErrorCode.PAYLOAD_TOO_LARGE,
  [HttpStatus.TOO_MANY_REQUESTS]: CommonErrorCode.TOO_MANY_REQUESTS,
};

/** 어떤 예외든 사용자에게 보일 말로 바꾼다. Nest 기본 영어 문구(`Cannot GET …`)가 화면에 나가지 않는다. */
export function toCommonError(exception: unknown): CommonError {
  if (exception instanceof CommonError) return exception;
  if (exception instanceof HttpException) {
    const status = exception.getStatus();
    const code =
      BY_STATUS[status] ??
      (status < 500
        ? { ...CommonErrorCode.REQUEST_FAILED, status }
        : CommonErrorCode.INTERNAL);
    return CommonError.createByErrorCode(code);
  }
  return CommonError.createByErrorCode(CommonErrorCode.INTERNAL);
}

/**
 * 응답은 `{ data: null, status, resultCode, message, path, timestamp }`.
 * 5xx 만 로그에 남긴다. 주소는 `path` 로 — 쿼리(IAM code 등)를 로그에 싣지 않는다.
 */
@Catch()
export class CommonExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(CommonExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();
    const error = toCommonError(exception);

    if (error.getStatus() >= 500) {
      this.logger.error(
        `${request.method} ${request.path} ${error.getResultCode()}${error._detail ? ' — ' + error._detail : ''}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }
    if (response.headersSent) return;
    response.status(error.getStatus()).json({
      ...error.getApiResponseNoData(),
      path: request.path,
      timestamp: new Date().toISOString(),
    });
  }
}
