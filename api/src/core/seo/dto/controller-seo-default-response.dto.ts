import { ApiProperty } from '@nestjs/swagger';
import type { PageMetaEntity } from '../../../common/entity/page-meta.entity';

export class ControllerSeoPageTranslationResponseDto {
  @ApiProperty({ example: 'ko-KR' }) languages_code!: string;
  @ApiProperty({ nullable: true, type: String }) title!: string | null;
  @ApiProperty({ nullable: true, type: String }) description!: string | null;
}

/**
 * 한 장의 덮어쓰기. 관리 화면과 변경 이력(before/after)이 이 모양을 쓴다.
 * `og_image_url` 은 관리 미리보기 주소 — 공개 쪽은 `/api/content/assets/<id>`.
 */
export class ControllerSeoDefaultPageResponseDto {
  @ApiProperty({ example: '/page/company/intro' }) path!: string;
  @ApiProperty() no_index!: boolean;
  @ApiProperty({ nullable: true, type: String, description: '파일 id' })
  og_image!: string | null;
  @ApiProperty({ nullable: true, type: String }) og_image_url!: string | null;
  @ApiProperty({ nullable: true, type: String, format: 'date-time' })
  updated_on!: string | null;
  @ApiProperty({ nullable: true, type: String }) updated_by!: string | null;
  @ApiProperty({ type: [ControllerSeoPageTranslationResponseDto] })
  translations!: ControllerSeoPageTranslationResponseDto[];

  static from(r: PageMetaEntity): ControllerSeoDefaultPageResponseDto {
    return {
      path: r.path,
      no_index: r.noIndex,
      og_image: r.ogImage,
      og_image_url: r.ogImage ? `/api/admin/files/${r.ogImage}` : null,
      updated_on: r.updatedOn ? new Date(r.updatedOn).toISOString() : null,
      updated_by: r.updatedBy,
      translations: (r.translations ?? [])
        .map((t) => ({
          languages_code: t.languagesCode,
          title: t.title,
          description: t.description,
        }))
        .sort((a, b) => a.languages_code.localeCompare(b.languages_code)),
    };
  }
}

/** 공개 사이트가 읽는 한 장(언어 하나로 편 것). 비운 칸은 null — 화면이 코드의 값을 쓴다. */
export class ControllerSeoPublicPageResponseDto {
  @ApiProperty() path!: string;
  @ApiProperty() no_index!: boolean;
  @ApiProperty({ nullable: true, type: String, description: '공개 주소' })
  og_image!: string | null;
  @ApiProperty({ nullable: true, type: String }) title!: string | null;
  @ApiProperty({ nullable: true, type: String }) description!: string | null;

  static from(
    r: PageMetaEntity,
    language: string,
  ): ControllerSeoPublicPageResponseDto {
    const t =
      r.translations?.find((x) => x.languagesCode === language) ??
      r.translations?.find((x) => x.languagesCode === 'ko-KR');
    return {
      path: r.path,
      no_index: r.noIndex,
      og_image: r.ogImage ? `/api/content/assets/${r.ogImage}` : null,
      title: t?.title?.trim() || null,
      description: t?.description?.trim() || null,
    };
  }
}
