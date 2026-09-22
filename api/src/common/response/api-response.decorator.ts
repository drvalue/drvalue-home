import { applyDecorators, Type } from '@nestjs/common';
import {
  ApiExtraModels,
  ApiOkResponse,
  ApiResponse,
  getSchemaPath,
} from '@nestjs/swagger';

/**
 * 응답 모양을 Swagger 에 적는 데코레이터. 웹의 타입은 이 문서에서 만든다(C1) — 실제로 나가는 JSON 과
 * 문서가 같아야 한다. 이 api 는 성공 응답을 bmes 의 successResponse 로 감싸지 않으므로
 * `{ data }` · 목록 `{ data, total, page, pageSize }` · `{ ok: true }` 를 그대로 적는다.
 */

type Opts = { description?: string };

/**
 * `{ data: T }` — 하나. `nullable` 이면 data 가 null 일 수 있다.
 * `language` 면 `{ data, language }` — 공개 읽기가 실제로 고른 언어를 같이 낸다.
 * `status` 는 `@HttpCode` 없는 `@Post()` 처럼 201 로 나가는 곳에 준다.
 */
export function ApiDataResponse(
  model: Type<unknown>,
  {
    description,
    nullable,
    language,
    status = 200,
  }: Opts & { nullable?: boolean; language?: boolean; status?: 200 | 201 } = {},
) {
  const ref = { $ref: getSchemaPath(model) };
  return applyDecorators(
    ApiExtraModels(model),
    ApiResponse({
      status,
      description,
      schema: {
        type: 'object',
        required: language ? ['data', 'language'] : ['data'],
        properties: {
          data: nullable ? { nullable: true, allOf: [ref] } : ref,
          ...(language && { language: { type: 'string', example: 'ko-KR' } }),
        },
      },
    }),
  );
}

/** `{ data: T[] }` — 쪽 없는 목록. */
export function ApiDataListResponse(
  model: Type<unknown>,
  { description }: Opts = {},
) {
  return applyDecorators(
    ApiExtraModels(model),
    ApiOkResponse({
      description,
      schema: {
        type: 'object',
        required: ['data'],
        properties: {
          data: { type: 'array', items: { $ref: getSchemaPath(model) } },
        },
      },
    }),
  );
}

/** `{ data: T[], total, page, pageSize }` — 쪽 목록. */
export function ApiPageResponse(
  model: Type<unknown>,
  { description }: Opts = {},
) {
  return applyDecorators(
    ApiExtraModels(model),
    ApiOkResponse({
      description,
      schema: {
        type: 'object',
        required: ['data', 'total', 'page', 'pageSize'],
        properties: {
          data: { type: 'array', items: { $ref: getSchemaPath(model) } },
          total: { type: 'integer' },
          page: { type: 'integer' },
          pageSize: { type: 'integer' },
        },
      },
    }),
  );
}

/** `{ data: string[] }` — 고를 값 목록(분류·담당자 등). */
export function ApiDataStringsResponse({ description }: Opts = {}) {
  return ApiOkResponse({
    description,
    schema: {
      type: 'object',
      required: ['data'],
      properties: { data: { type: 'array', items: { type: 'string' } } },
    },
  });
}

/** `{ ok: true }` — 지우기·순서·로그아웃처럼 돌려줄 것이 없는 쓰기. `@HttpCode` 없는 `@Post()` 는 status 201. */
export function ApiOkFlagResponse({
  description,
  status = 200,
}: Opts & { status?: 200 | 201 } = {}) {
  return ApiResponse({
    status,
    description,
    schema: {
      type: 'object',
      required: ['ok'],
      properties: { ok: { type: 'boolean', enum: [true] } },
    },
  });
}
