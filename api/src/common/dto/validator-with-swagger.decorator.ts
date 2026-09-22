import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray as IsArrayValidator,
  IsBoolean as IsBooleanValidator,
  IsIn as IsInValidator,
  IsInt as IsIntValidator,
  IsISO8601 as IsISO8601Validator,
  IsNotEmpty,
  IsOptional,
  IsString as IsStringValidator,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

/**
 * 검증 + Swagger 를 한 번에 붙이는 DTO 데코레이터. bmes 의 `IsString({ propertyName, … })` 모양이다.
 *
 * 검증 문구는 화면에 그대로 뜬다(`validationExceptionFactory` 가 첫 한국어 문구를 고른다).
 * 그래서 합니다체이고, `propertyName` 은 화면에 보이는 칸 이름으로 적는다(「제목」, 「표시 날짜」).
 * bmes 는 「는(은)」 처럼 조사를 둘 다 적는다 — 여기는 받침을 보고 고른다.
 */

type Josa = [withBatchim: string, withoutBatchim: string];
function josa(word: string, [a, b]: Josa): string {
  const last = word.charCodeAt(word.length - 1);
  if (last < 0xac00 || last > 0xd7a3) return `${word}${b}(${a})`;
  return `${word}${(last - 0xac00) % 28 ? a : b}`;
}
const eun = (w: string) => josa(w, ['은', '는']);
const eul = (w: string) => josa(w, ['을', '를']);

interface Common {
  /** 화면에 보이는 칸 이름. 검증 문구에 쓴다. */
  propertyName: string;
  description: string;
  example?: unknown;
  /** 없어도 되면 true. null 도 받는다(비운 칸은 null 로 저장하는 약속). */
  optional?: boolean;
  nullable?: boolean;
}

function optionality(
  target: object,
  key: string,
  { propertyName, optional }: Common,
): void {
  if (optional) IsOptional()(target, key);
  else
    IsNotEmpty({ message: `${eul(propertyName)} 입력해 주세요.` })(target, key);
}

export function IsString(
  opts: Common & {
    min?: number;
    max?: number;
    pattern?: RegExp;
    /** pattern 이 틀렸을 때 문구. 없으면 「○○ 형식이 올바르지 않습니다.」 */
    patternMessage?: string;
  },
): PropertyDecorator {
  return (target, propertyKey) => {
    const key = propertyKey as string;
    const { propertyName: name, min, max, pattern } = opts;
    optionality(target, key, opts);
    IsStringValidator({ message: `${name} 형식이 올바르지 않습니다.` })(
      target,
      key,
    );
    if (min !== undefined && min > 0)
      MinLength(min, {
        message: `${eun(name)} ${min}자 이상 입력해 주세요.`,
      })(target, key);
    if (max !== undefined)
      MaxLength(max, {
        message: `${eun(name)} ${max}자까지 입력할 수 있습니다.`,
      })(target, key);
    if (pattern)
      Matches(pattern, {
        message: opts.patternMessage ?? `${name} 형식이 올바르지 않습니다.`,
      })(target, key);
    ApiProperty({
      description: opts.description,
      example: opts.example,
      type: String,
      required: !opts.optional,
      nullable: opts.nullable,
      ...(min !== undefined && { minLength: min }),
      ...(max !== undefined && { maxLength: max }),
      ...(pattern && { pattern: pattern.source }),
    })(target, key);
  };
}

/** 'YYYY-MM-DD' 날짜 문자열. */
export function IsDateString(opts: Common): PropertyDecorator {
  return (target, propertyKey) => {
    const key = propertyKey as string;
    optionality(target, key, opts);
    Matches(/^\d{4}-\d{2}-\d{2}$/, {
      message: `${opts.propertyName} 날짜 형식이 올바르지 않습니다.`,
    })(target, key);
    ApiProperty({
      description: opts.description,
      example: opts.example ?? '2026-09-22',
      type: String,
      format: 'date',
      required: !opts.optional,
      nullable: opts.nullable,
    })(target, key);
  };
}

/** ISO 8601 시각(예약 공개처럼 시·분까지 있는 것). */
export function IsDateTimeString(opts: Common): PropertyDecorator {
  return (target, propertyKey) => {
    const key = propertyKey as string;
    optionality(target, key, opts);
    IsISO8601Validator(
      {},
      { message: `${opts.propertyName} 시각 형식이 올바르지 않습니다.` },
    )(target, key);
    ApiProperty({
      description: opts.description,
      example: opts.example ?? '2026-09-30T01:00:00.000Z',
      type: String,
      format: 'date-time',
      required: !opts.optional,
      nullable: opts.nullable,
    })(target, key);
  };
}

export function IsBoolean(opts: Common): PropertyDecorator {
  return (target, propertyKey) => {
    const key = propertyKey as string;
    optionality(target, key, opts);
    IsBooleanValidator({
      message: `${opts.propertyName} 값이 올바르지 않습니다.`,
    })(target, key);
    ApiProperty({
      description: opts.description,
      example: opts.example ?? false,
      type: Boolean,
      required: !opts.optional,
      nullable: opts.nullable,
    })(target, key);
  };
}

/** 정수. 쿼리 문자열이면 `query: true` — 숫자로 바꿔 받는다. */
export function IsInt(
  opts: Common & { min?: number; max?: number; query?: boolean },
): PropertyDecorator {
  return (target, propertyKey) => {
    const key = propertyKey as string;
    const { propertyName: name, min, max } = opts;
    if (opts.query) Type(() => Number)(target, key);
    optionality(target, key, opts);
    IsIntValidator({ message: `${eun(name)} 숫자로 입력해 주세요.` })(
      target,
      key,
    );
    if (min !== undefined)
      Min(min, { message: `${eun(name)} ${min} 이상이어야 합니다.` })(
        target,
        key,
      );
    if (max !== undefined)
      Max(max, { message: `${eun(name)} ${max} 이하여야 합니다.` })(
        target,
        key,
      );
    ApiProperty({
      description: opts.description,
      example: opts.example ?? 1,
      type: Number,
      required: !opts.optional,
      nullable: opts.nullable,
      ...(min !== undefined && { minimum: min }),
      ...(max !== undefined && { maximum: max }),
    })(target, key);
  };
}

/** 정해진 값 중 하나. */
export function IsIn(
  opts: Common & { values: readonly (string | null)[]; message?: string },
): PropertyDecorator {
  return (target, propertyKey) => {
    const key = propertyKey as string;
    optionality(target, key, opts);
    IsInValidator(opts.values as unknown[], {
      message: opts.message ?? `${opts.propertyName} 값이 올바르지 않습니다.`,
    })(target, key);
    ApiProperty({
      description: opts.description,
      example: opts.example ?? opts.values.find((v) => v !== null),
      enum: opts.values.filter((v): v is string => v !== null),
      required: !opts.optional,
      nullable: opts.nullable ?? opts.values.includes(null),
    })(target, key);
  };
}

/**
 * 배열. `itemType` 이 클래스면 안쪽까지 검증한다(ValidateNested).
 * 문자열·정수 목록이면 `each: 'string' | 'int'`.
 */
export function IsArray(
  opts: Common & {
    maxSize?: number;
    itemType?: new () => object;
    each?: 'string' | 'int';
  },
): PropertyDecorator {
  return (target, propertyKey) => {
    const key = propertyKey as string;
    const { propertyName: name, maxSize, itemType, each } = opts;
    optionality(target, key, opts);
    IsArrayValidator({ message: `${name} 형식이 올바르지 않습니다.` })(
      target,
      key,
    );
    if (maxSize !== undefined)
      ArrayMaxSize(maxSize, {
        message: `${eun(name)} ${maxSize}개까지 넣을 수 있습니다.`,
      })(target, key);
    if (itemType) {
      ValidateNested({ each: true })(target, key);
      Type(() => itemType)(target, key);
    }
    if (each === 'string')
      IsStringValidator({
        each: true,
        message: `${name} 형식이 올바르지 않습니다.`,
      })(target, key);
    if (each === 'int')
      IsIntValidator({
        each: true,
        message: `${name} 형식이 올바르지 않습니다.`,
      })(target, key);
    ApiProperty({
      description: opts.description,
      example: opts.example,
      type: itemType ?? (each === 'int' ? Number : String),
      isArray: true,
      required: !opts.optional,
      ...(maxSize !== undefined && { maxItems: maxSize }),
    })(target, key);
  };
}
