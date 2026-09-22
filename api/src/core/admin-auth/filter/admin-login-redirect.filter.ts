import { ArgumentsHost, Catch, ExceptionFilter, Logger } from '@nestjs/common';
import type { Request, Response } from 'express';
import { toCommonError } from '../../../common/error/common-exception.filter';

/**
 * 로그인·콜백은 브라우저가 이동해 오는 주소라 JSON 을 보여 줄 화면이 없다.
 * 실패하면 로그인 화면으로 돌려보내고 에러 코드만 넘긴다 — 문구는 로그인 화면이 코드로 고른다
 * (주소에 문구를 실으면 누구나 로그인 화면에 아무 말이나 띄울 수 있다).
 */
@Catch()
export class AdminLoginRedirectFilter implements ExceptionFilter {
  private readonly logger = new Logger(AdminLoginRedirectFilter.name);

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
    response.redirect(
      `/admin/login?error=${encodeURIComponent(error.getResultCode())}`,
    );
  }
}
