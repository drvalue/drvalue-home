import { ApiProperty } from '@nestjs/swagger';
import type { PageEntity } from '../../../common/entity/page.entity';
import type { PageSchema } from '../schema/page-schema';

const iso = (d: Date | string | null | undefined): string | null =>
  d ? new Date(d).toISOString() : null;

/** 관리 목록 한 줄. */
export class ControllerPageDefaultRowResponseDto {
  @ApiProperty({ example: 'company-location' }) key!: string;
  @ApiProperty({ example: '찾아오시는 길' }) label!: string;
  @ApiProperty({ example: '/page/company/location' }) path!: string;
  @ApiProperty({
    example: '/admin/pages/company-location',
    description: '관리 화면에서 이 장을 고치는 주소',
  })
  admin_path!: string;
  @ApiProperty({ nullable: true, type: String, format: 'date-time' })
  updated_on!: string | null;
  @ApiProperty({ nullable: true, type: String }) updated_by!: string | null;

  static from(
    schema: PageSchema,
    latest: PageEntity | undefined,
  ): ControllerPageDefaultRowResponseDto {
    return {
      key: schema.key,
      label: schema.label,
      path: schema.path,
      admin_path: schema.adminPath ?? `/admin/pages/${schema.key}`,
      updated_on: iso(latest?.updatedOn),
      updated_by: latest?.updatedBy ?? null,
    };
  }
}

/** 한 언어의 글과 마지막으로 고친 때. 행이 없으면 content 는 빈 글이고 updated_on 은 null. */
export class ControllerPageDefaultLangResponseDto {
  @ApiProperty({ type: 'object', additionalProperties: true })
  content!: Record<string, unknown>;
  @ApiProperty({ nullable: true, type: String, format: 'date-time' })
  updated_on!: string | null;
  @ApiProperty({ nullable: true, type: String }) updated_by!: string | null;

  static from(
    row: PageEntity | null,
    empty: Record<string, unknown>,
  ): ControllerPageDefaultLangResponseDto {
    return {
      content: row?.content ?? empty,
      updated_on: iso(row?.updatedOn),
      updated_by: row?.updatedBy ?? null,
    };
  }
}

/** 편집 화면 — 칸 구조와 언어별 글. 화면은 schema 로 폼을 그린다. */
export class ControllerPageDefaultDetailResponseDto {
  @ApiProperty({ type: 'object', additionalProperties: true })
  schema!: PageSchema;
  @ApiProperty({
    type: 'object',
    additionalProperties: {
      $ref: '#/components/schemas/ControllerPageDefaultLangResponseDto',
    },
    example: { 'ko-KR': { content: {}, updated_on: null, updated_by: null } },
  })
  languages!: Record<string, ControllerPageDefaultLangResponseDto>;
}

/** 공개 읽기. 요청 언어가 없으면 기본 언어의 글이고 language 가 그 언어다. */
export class ControllerPageDefaultPublicResponseDto {
  @ApiProperty({ type: 'object', additionalProperties: true })
  data!: Record<string, unknown>;
  @ApiProperty({ example: 'ko-KR' }) language!: string;
}
