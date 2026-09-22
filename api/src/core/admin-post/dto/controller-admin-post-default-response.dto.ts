import { ApiProperty } from '@nestjs/swagger';
import type { PostEntity } from '../../../common/entity/post.entity';

/**
 * 관리 화면이 받는 글의 모양. 칸 이름은 DB 칸 그대로(snake_case) — 웹이 이 이름을 쓴다.
 * 엔티티 → 응답 변환은 여기서만 한다(`from`). 서비스는 규칙만 본다.
 */

const iso = (d: Date | string | null | undefined): string | null =>
  d ? new Date(d).toISOString() : null;
const adminFileUrl = (id: string | null): string | null =>
  id ? `/api/admin/files/${id}` : null;
const koOf = (r: PostEntity) =>
  r.translations?.find((t) => t.languagesCode === 'ko-KR') ??
  r.translations?.[0];

/** 목록 한 줄. */
export class ControllerAdminPostDefaultRowResponseDto {
  @ApiProperty() id!: number;
  @ApiProperty({ example: 'notice' }) board!: string;
  @ApiProperty() slug!: string;
  @ApiProperty({ enum: ['published', 'draft'] }) status!: string;
  @ApiProperty({ description: '한국어 제목(없으면 첫 번역)' }) title!: string;
  @ApiProperty({ format: 'date' }) published_date!: string;
  @ApiProperty({ nullable: true, type: Number }) sort!: number | null;
  @ApiProperty() is_pinned!: boolean;
  @ApiProperty({
    nullable: true,
    type: String,
    description: '관리 미리보기 주소',
  })
  thumbnail!: string | null;
  @ApiProperty({ nullable: true, type: String }) history_year!: string | null;
  @ApiProperty({ nullable: true, type: String }) cert_no!: string | null;
  @ApiProperty({ nullable: true, type: String }) press_media!: string | null;
  @ApiProperty({ nullable: true, type: String }) period_start!: string | null;
  @ApiProperty({ nullable: true, type: String }) period_end!: string | null;
  @ApiProperty({ nullable: true, type: String }) employment_type!:
    string | null;
  @ApiProperty() is_open_ended!: boolean;
  @ApiProperty({ nullable: true, type: String }) deadline!: string | null;
  @ApiProperty({ nullable: true, type: String }) faq_category!: string | null;
  @ApiProperty({ nullable: true, type: String, format: 'date-time' })
  publish_at!: string | null;
  @ApiProperty({ nullable: true, type: String, format: 'date-time' })
  unpublish_at!: string | null;

  static from(r: PostEntity): ControllerAdminPostDefaultRowResponseDto {
    const ko = koOf(r);
    return {
      id: r.id,
      board: r.board,
      slug: r.slug,
      status: r.status,
      title: ko?.title ?? '',
      published_date: r.publishedDate,
      sort: r.sort,
      is_pinned: r.isPinned,
      thumbnail: adminFileUrl(r.thumbnail),
      history_year: r.historyYear,
      cert_no: r.certNo,
      press_media: r.pressMedia,
      period_start: r.periodStart,
      period_end: r.periodEnd,
      employment_type: r.employmentType,
      is_open_ended: r.isOpenEnded,
      deadline: r.deadline,
      faq_category: ko?.faqCategory ?? null,
      publish_at: iso(r.publishAt),
      unpublish_at: iso(r.unpublishAt),
    };
  }
}

export class ControllerAdminPostDefaultPageResponseDto {
  @ApiProperty({ type: [ControllerAdminPostDefaultRowResponseDto] })
  data!: ControllerAdminPostDefaultRowResponseDto[];
  @ApiProperty() total!: number;
  @ApiProperty() page!: number;
  @ApiProperty({ example: 30 }) pageSize!: number;
}

export class ControllerAdminPostTranslationResponseDto {
  @ApiProperty({ example: 'ko-KR' }) languages_code!: string;
  @ApiProperty({ nullable: true, type: String }) title!: string | null;
  @ApiProperty({ nullable: true, type: String }) summary!: string | null;
  @ApiProperty({ nullable: true, type: String }) body!: string | null;
  @ApiProperty({ nullable: true, type: String })
  case_category_label!: string | null;
  @ApiProperty({ nullable: true, type: String }) faq_category!: string | null;
  @ApiProperty({ nullable: true, type: String }) seo_title!: string | null;
  @ApiProperty({ nullable: true, type: String }) seo_description!:
    string | null;
}

export class ControllerAdminPostFileResponseDto {
  @ApiProperty({ description: '파일 id' }) id!: string;
  @ApiProperty({ description: '보이는 이름' }) name!: string;
  @ApiProperty({ description: '관리 미리보기 주소' }) url!: string;
}

/**
 * 글 하나 전부. 변경 이력의 before/after 도 이 모양이다 — 되돌리기가 이 칸 이름을 읽는다.
 */
export class ControllerAdminPostDefaultDetailResponseDto {
  @ApiProperty() id!: number;
  @ApiProperty() board!: string;
  @ApiProperty() slug!: string;
  @ApiProperty({ enum: ['published', 'draft'] }) status!: string;
  @ApiProperty({ format: 'date' }) published_date!: string;
  @ApiProperty({ nullable: true, type: Number }) sort!: number | null;
  @ApiProperty() is_pinned!: boolean;
  @ApiProperty() is_featured!: boolean;
  @ApiProperty({ nullable: true, type: String, description: '파일 id' })
  thumbnail!: string | null;
  @ApiProperty({
    nullable: true,
    type: String,
    description: '관리 미리보기 주소',
  })
  thumbnail_url!: string | null;
  @ApiProperty({ nullable: true, type: String }) press_media!: string | null;
  @ApiProperty({ nullable: true, type: String }) period_start!: string | null;
  @ApiProperty({ nullable: true, type: String }) period_end!: string | null;
  @ApiProperty({ nullable: true, type: String }) cert_state!: string | null;
  @ApiProperty({ nullable: true, type: String }) cert_no!: string | null;
  @ApiProperty({ nullable: true, type: String }) cert_date!: string | null;
  @ApiProperty({ nullable: true, type: String }) cert_made_date!: string | null;
  @ApiProperty({ nullable: true, type: String }) cert_kind!: string | null;
  @ApiProperty({ nullable: true, type: String }) history_year!: string | null;
  @ApiProperty({ nullable: true, type: String }) employment_type!:
    string | null;
  @ApiProperty() is_open_ended!: boolean;
  @ApiProperty({ nullable: true, type: String }) deadline!: string | null;
  @ApiProperty({ nullable: true, type: String, format: 'date-time' })
  publish_at!: string | null;
  @ApiProperty({ nullable: true, type: String, format: 'date-time' })
  unpublish_at!: string | null;
  @ApiProperty({ type: [ControllerAdminPostTranslationResponseDto] })
  translations!: ControllerAdminPostTranslationResponseDto[];
  @ApiProperty({ type: [ControllerAdminPostFileResponseDto] })
  files!: ControllerAdminPostFileResponseDto[];

  static from(r: PostEntity): ControllerAdminPostDefaultDetailResponseDto {
    return {
      id: r.id,
      board: r.board,
      slug: r.slug,
      status: r.status,
      published_date: r.publishedDate,
      sort: r.sort,
      is_pinned: r.isPinned,
      is_featured: r.isFeatured,
      thumbnail: r.thumbnail,
      thumbnail_url: adminFileUrl(r.thumbnail),
      press_media: r.pressMedia,
      period_start: r.periodStart,
      period_end: r.periodEnd,
      cert_state: r.certState,
      cert_no: r.certNo,
      cert_date: r.certDate,
      cert_made_date: r.certMadeDate,
      cert_kind: r.certKind,
      history_year: r.historyYear,
      employment_type: r.employmentType,
      is_open_ended: r.isOpenEnded,
      deadline: r.deadline,
      publish_at: iso(r.publishAt),
      unpublish_at: iso(r.unpublishAt),
      translations: (r.translations ?? []).map((t) => ({
        languages_code: t.languagesCode,
        title: t.title,
        summary: t.summary,
        body: t.body,
        case_category_label: t.caseCategoryLabel,
        faq_category: t.faqCategory,
        seo_title: t.seoTitle,
        seo_description: t.seoDescription,
      })),
      files: (r.files ?? [])
        .filter((f) => f.fileId)
        .map((f) => ({
          id: f.fileId as string,
          name: f.file?.title || f.file?.filenameDownload || '첨부파일',
          url: `/api/admin/files/${f.fileId}`,
        })),
    };
  }
}
