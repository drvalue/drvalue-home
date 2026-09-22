import {
  Controller,
  Get,
  HttpCode,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { Public, SkipGatewaySignature } from '@drvalue-oss/iam-nestjs';
import {
  parseCookies,
  SessionPayload,
} from '../../../common/session/session-token';
import {
  ADMIN_COOKIE,
  AdminSessionGuard,
  AdminUser,
} from '../guard/admin-session.guard';
import { AdminAuthDefaultService } from '../service/admin-auth-default.service';

const STATE_COOKIE = 'dv_admin_state';

/**
 * 관리 화면 로그인. 브라우저가 직접 부른다(게이트웨이 없음).
 * 세션 쿠키는 HttpOnly · SameSite=Lax · Path=/ — IAM 에서 돌아오는 콜백에도 실린다.
 */
@SkipGatewaySignature()
@Public()
@Controller('admin/auth')
export class AdminAuthDefaultController {
  constructor(
    private readonly adminAuthDefaultService: AdminAuthDefaultService,
  ) {}

  private cookieOpts(maxAge: number) {
    return {
      httpOnly: true,
      sameSite: 'lax' as const,
      secure: process.env.ADMIN_COOKIE_SECURE !== 'false',
      path: '/',
      maxAge,
    };
  }

  @Get('login')
  login(@Res() res: Response) {
    const { url, state, ttlMs } = this.adminAuthDefaultService.login();
    res.cookie(STATE_COOKIE, state, this.cookieOpts(ttlMs));
    return res.redirect(url);
  }

  @Get('callback')
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
      this.cookieOpts(this.adminAuthDefaultService.sessionTtlMs()),
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
        role: admin.role ?? 'admin',
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
