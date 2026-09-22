import type { ValidationError } from 'class-validator';
import { CommonError } from './common-error';
import { CommonErrorCode } from './common.error';

const HANGUL = /[가-힣]/;
/** 칸이 비었을 때는 길이·형식보다 「입력해 주세요」가 먼저다. */
const FIRST = ['isDefined', 'isNotEmpty'];

function rank(key: string): number {
  const i = FIRST.indexOf(key);
  return i === -1 ? FIRST.length : i;
}

function messages(errors: ValidationError[]): string[] {
  return errors.flatMap((e) => [
    ...Object.entries(e.constraints ?? {})
      .sort(([a], [b]) => rank(a) - rank(b))
      .map(([, m]) => m),
    ...messages(e.children ?? []),
  ]);
}

/**
 * ValidationPipe 의 실패를 400 한 건으로. DTO 에 한국어 message 를 적은 칸은 그 말을,
 * 아니면(class-validator 기본 영어 문구) 「입력한 내용을 다시 확인해 주세요.」를 보낸다.
 */
export function validationExceptionFactory(
  errors: ValidationError[],
): CommonError {
  const custom = messages(errors).find((m) => HANGUL.test(m));
  return CommonError.createByErrorCode(CommonErrorCode.INVALID_INPUT, custom);
}
