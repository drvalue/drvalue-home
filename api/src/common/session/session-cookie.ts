import type { CookieOptions } from 'express';
import { AppConfig } from '../config/app-config';

/**
 * 관리자 세션·state 쿠키의 옵션. HttpOnly · SameSite=Lax · Path=/ —
 * IAM 에서 돌아오는 콜백(최상위 이동)에도 실린다. Secure 는 콜백 주소가 https 일 때.
 */
export function sessionCookieOptions(maxAgeMs: number): CookieOptions {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: AppConfig.secureCookies,
    path: '/',
    maxAge: maxAgeMs,
  };
}
