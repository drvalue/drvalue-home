import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { validationExceptionFactory } from '../error/validation-exception.factory';

/**
 * 변경 이력의 스냅샷을 저장 DTO 로 바꾸고 요청과 같은 규칙으로 검사한다(ValidationPipe 와 같은 설정).
 * 요청 본문에 없던 칸(id·updated_on 등)은 whitelist 로 버린다. 틀리면 첫 한국어 문구로 400.
 */
export async function snapshotToDto<T extends object>(
  cls: new () => T,
  plain: unknown,
): Promise<T> {
  const dto = plainToInstance(cls, plain);
  const errors = await validate(dto, { whitelist: true });
  if (errors.length) throw validationExceptionFactory(errors);
  return dto;
}
