import {
  Controller,
  Get,
  HttpCode,
  Logger,
  Post,
  Query,
  Req,
  Res,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Request, Response } from 'express';
import {
  ApiDataResponse,
  ApiOkFlagResponse,
} from '../../../common/response/api-response.decorator';
import { sessionCookieOptions } from '../../../common/session/session-cookie';
import {
  parseCookies,
  SessionPayload,
} from '../../../common/session/session-token';
import type { ITransactionContext } from '../../../common/typeorm/transaction-context';
import { TransactionContext } from '../../../common/typeorm/transaction-context.decorator';
import { ControllerAdminAuthDefaultMeResponseDto } from '../dto/controller-admin-auth-default-response.dto';
import { AdminLoginRedirectFilter } from '../filter/admin-login-redirect.filter';
import {
  ADMIN_COOKIE,
  AdminSessionGuard,
  AdminUser,
} from '../guard/admin-session.guard';
import { AdminAuthDefaultService } from '../service/admin-auth-default.service';

const STATE_COOKIE = 'dv_admin_state';

/**
 * 관리 화면 로그인. login·callback 은 브라우저가 이동해 오는 주소라 쿠키를 싣고 넘긴다(@Res).
 * 실패하면 JSON 대신 로그인 화면(`/admin/login?error=<코드>`)으로 돌려보낸다(AdminLoginRedirectFilter).
 */
@ApiTags('Admin Auth Default - 관리 화면 로그인')
@Controller('admin/auth')
export class AdminAuthDefaultController {
  private readonly logger = new Logger(AdminAuthDefaultController.name);

  constructor(
    private readonly adminAuthDefaultService: AdminAuthDefaultService,
  ) {}

  @Get('login')
  @UseFilters(AdminLoginRedirectFilter)
  @ApiOperation({
    operationId: 'adminAuthDefaultLogin',
    summary: '사내 IAM 로그인으로 보낸다(state 쿠키를 싣는다)',
  })
  @ApiResponse({ status: 302, description: 'IAM 로그인 주소로 이동' })
  async login(@Res() res: Response): Promise<void> {
    const { url, state, ttlMs } = await this.adminAuthDefaultService.login();
    res.cookie(STATE_COOKIE, state, sessionCookieOptions(ttlMs));
    res.redirect(url);
  }

  @Get('callback')
  @UseFilters(AdminLoginRedirectFilter)
  @ApiOperation({
    operationId: 'adminAuthDefaultCallback',
    summary: 'IAM 이 돌려보낸 code 로 세션을 만들고 /admin 으로',
  })
  @ApiQuery({ name: 'code', required: false })
  @ApiQuery({ name: 'state', required: false })
  @ApiResponse({
    status: 302,
    description: '성공 /admin · 실패 /admin/login?error=<코드>',
  })
  async callback(
    @TransactionContext() ctx: ITransactionContext,
    @Req() req: Request,
    @Res() res: Response,
    @Query('code') code?: string,
    @Query('state') state?: string,
  ): Promise<void> {
    const cookies = parseCookies(req.headers.cookie);
    res.clearCookie(STATE_COOKIE, { path: '/' });
    const session = await this.adminAuthDefaultService.callback(
      ctx,
      String(code ?? ''),
      String(state ?? ''),
      cookies[STATE_COOKIE] ?? '',
    );
    res.cookie(
      ADMIN_COOKIE,
      session.token,
      sessionCookieOptions(session.ttlMs),
    );
    res.redirect('/admin');
  }

  @Get('me')
  @UseGuards(AdminSessionGuard)
  @ApiCookieAuth('dv_admin')
  @ApiOperation({
    operationId: 'adminAuthDefaultMe',
    summary: '지금 로그인한 사람과 만질 수 있는 게시판',
  })
  @ApiDataResponse(ControllerAdminAuthDefaultMeResponseDto)
  me(@AdminUser() admin: SessionPayload): {
    data: ControllerAdminAuthDefaultMeResponseDto;
  } {
    return { data: ControllerAdminAuthDefaultMeResponseDto.from(admin) };
  }

  @Post('logout')
  @HttpCode(200)
  @ApiOperation({
    operationId: 'adminAuthDefaultLogout',
    summary: '관리 세션 쿠키를 지운다(IAM 세션은 그대로)',
  })
  @ApiOkFlagResponse()
  logout(@Res({ passthrough: true }) res: Response): { ok: true } {
    res.clearCookie(ADMIN_COOKIE, { path: '/' });
    this.logger.log('로그아웃');
    return { ok: true };
  }
}
