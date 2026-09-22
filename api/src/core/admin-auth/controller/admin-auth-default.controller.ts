import {
  Controller,
  Get,
  HttpCode,
  Post,
  Query,
  Req,
  Res,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { sessionCookieOptions } from '../../../common/session/session-cookie';
import {
  parseCookies,
  SessionPayload,
} from '../../../common/session/session-token';
import { AdminLoginRedirectFilter } from '../filter/admin-login-redirect.filter';
import {
  ADMIN_COOKIE,
  AdminSessionGuard,
  AdminUser,
} from '../guard/admin-session.guard';
import { AdminAuthDefaultService } from '../service/admin-auth-default.service';

const STATE_COOKIE = 'dv_admin_state';

/**
 * 관리 화면 로그인. login·callback 은 브라우저가 이동해 오는 주소라
 * 실패하면 JSON 대신 로그인 화면(`/admin/login?error=<코드>`)으로 돌려보낸다.
 */
@Controller('admin/auth')
export class AdminAuthDefaultController {
  constructor(
    private readonly adminAuthDefaultService: AdminAuthDefaultService,
  ) {}

  @Get('login')
  @UseFilters(AdminLoginRedirectFilter)
  login(@Res() res: Response) {
    const { url, state, ttlMs } = this.adminAuthDefaultService.login();
    res.cookie(STATE_COOKIE, state, sessionCookieOptions(ttlMs));
    return res.redirect(url);
  }

  @Get('callback')
  @UseFilters(AdminLoginRedirectFilter)
  async callback(
    @Req() req: Request,
    @Res() res: Response,
    @Query('code') code?: string,
    @Query('state') state?: string,
  ) {
    const cookies = parseCookies(req.headers.cookie);
    res.clearCookie(STATE_COOKIE, { path: '/' });
    const session = await this.adminAuthDefaultService.callback(
      String(code ?? ''),
      String(state ?? ''),
      cookies[STATE_COOKIE] ?? '',
    );
    res.cookie(
      ADMIN_COOKIE,
      session,
      sessionCookieOptions(this.adminAuthDefaultService.sessionTtlMs()),
    );
    return res.redirect('/admin');
  }

  @Get('me')
  @UseGuards(AdminSessionGuard)
  me(@AdminUser() admin: SessionPayload) {
    return {
      data: {
        email: admin.email,
        name: admin.name ?? null,
        role: admin.role ?? null,
      },
    };
  }

  @Post('logout')
  @HttpCode(200)
  logout(@Res() res: Response) {
    res.clearCookie(ADMIN_COOKIE, { path: '/' });
    return res.json({ ok: true });
  }
}
