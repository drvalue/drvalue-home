import { Logger } from '@nestjs/common';
import { ICommonErrorCode } from './common-error-code';
import { CommonError } from './common-error';

export interface ServiceExceptionMetadata {
  /** 예상 못 한 실패를 이 코드로 바꾼다(보통 `<기능>Error.<동작>_UNKNOWN`, 5xx). */
  errorCode: ICommonErrorCode;
}

/**
 * 서비스 메서드의 예외를 에러 코드로 바꾼다. bmes 의 `@ServiceException` 과 같은 역할.
 * - 이미 `CommonError` 면 그대로 다시 던진다(없는 글 404 같은 예상된 실패).
 * - 그 밖은 원래 스택을 로그에 남기고 `errorCode` 로 바꿔 던진다. 화면에는 코드의 message 만 간다.
 *   bmes 는 원래 에러의 message 를 응답 문구로 싣는다 — 여기는 싣지 않는다(SQL·내부 문구가 화면에 샌다).
 * - 로그에는 메서드 이름과 코드, 스택만. 인자(요청 본문·이메일·토큰)는 찍지 않는다.
 */
export function ServiceException({
  errorCode,
}: ServiceExceptionMetadata): MethodDecorator {
  return (target, key, descriptor: PropertyDescriptor) => {
    const original = descriptor.value as (...args: unknown[]) => unknown;
    const logger = new Logger(target.constructor.name);
    descriptor.value = async function (this: unknown, ...args: unknown[]) {
      try {
        return await original.apply(this, args);
      } catch (error) {
        if (error instanceof CommonError) throw error;
        logger.error(
          `${String(key)} 실패 → ${errorCode.code}`,
          error instanceof Error ? error.stack : String(error),
        );
        throw CommonError.createByErrorCode(errorCode);
      }
    };
    return descriptor;
  };
}
