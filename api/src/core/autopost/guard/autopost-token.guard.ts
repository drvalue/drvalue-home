import { createHash, timingSafeEqual } from 'node:crypto';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { json } from 'express';
import type { NextFunction, Request, Response } from 'express';
import { AppConfig } from '../../../common/config/app-config';
import { CommonError } from '../../../common/error/common-error';
import { AutopostError } from '../error/autopost.error';

/** 묶음 한 건의 본문 한도 — 그림 다섯 장(장당 2MB, base64 로 1.34배)과 글. */
const BUNDLE_BODY_LIMIT = '16mb';

/**
 * `Authorization: Bearer <토큰>` 이 설정된 토큰과 같은가. 설정이 없으면(null) 무엇을 보내도 거짓 — 닫힌 쪽.
 * 길이가 달라도 같은 시간에 비교하도록 양쪽을 해시한 뒤 `timingSafeEqual` 로 본다.
 */
export function bearerMatches(
  expected: string | null,
  header: unknown,
): boolean {
  if (!expected || typeof header !== 'string') return false;
  const m = /^Bearer ([A-Za-z0-9_-]+)$/.exec(header);
  if (!m) return false;
  const digest = (s: string) => createHash('sha256').update(s).digest();
  return timingSafeEqual(digest(m[1]), digest(expected));
}

/**
 * 자동 글 묶음을 받는 입구의 문. 관리 화면의 문(IAM 세션)과 따로다 — 사람이 아니라 예약 실행이 부른다(결정 0021).
 * 토큰이 맞아야 하고, 서버에 토큰이 없으면 전부 401 이다. 어느 쪽인지 응답으로 구분해 주지 않는다.
 */
@Injectable()
export class AutopostTokenGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest<Request>();
    if (
      !bearerMatches(AppConfig.autopost.submitToken, req.headers.authorization)
    )
      throw CommonError.createByErrorCode(AutopostError.UNAUTHORIZED);
    return true;
  }
}

/**
 * 묶음 본문(그림이 base64 로 들어 있어 수 MB)을 읽는 미들웨어. `main.ts` 가 묶음 주소에만 건다.
 * **토큰이 맞는 요청만** 큰 한도로 읽는다 — 그 밖은 그냥 넘겨 전역 한도(100KB)에 걸리게 둔다.
 * 익명 요청이 16MB 씩 메모리에 올리지 못하게.
 */
export function bundleBody() {
  const parse = json({ limit: BUNDLE_BODY_LIMIT });
  return (req: Request, res: Response, next: NextFunction): void => {
    if (
      bearerMatches(AppConfig.autopost.submitToken, req.headers.authorization)
    )
      parse(req, res, next);
    else next();
  };
}
