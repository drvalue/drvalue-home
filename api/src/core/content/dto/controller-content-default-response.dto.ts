import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { PostEntity } from '../../../common/entity/post.entity';
import type { PublicPostRow } from '../repository/post-default.repository';

const asset = (id: string | null | undefined): string | null =>
  id ? `/api/content/assets/${id}` : null;

export class ControllerContentThumbnailSizeDto {
  @ApiProperty() w!: number;
  @ApiProperty() h!: number;
}

/**
 * 공개 글 한 줄. 칸 이름은 DB 칸 그대로(snake_case) — 옛 게시판 JS 와 웹이 이 이름을 읽는다.
 * 예외: `thumbnail`·`og_image` 는 파일 id 가 아니라 우리 공개 주소이고, 치수는 `thumbnail_size` 에.
 */
export class ControllerContentDefaultPostResponseDto {
  @ApiProperty() id!: number;
  @ApiProperty({ example: 'notice' }) board!: string;
  @ApiProperty() slug!: string;
  @ApiProperty({ format: 'date' }) published_date!: string;
  @ApiProperty({ nullable: true, type: String, format: 'date-time' })
  publish_at!: Date | null;
  @ApiProperty({ nullable: true, type: String, format: 'date-time' })
  unpublish_at!: Date | null;
  @ApiProperty() is_pinned!: boolean;
  @ApiProperty({ nullable: true, type: Number }) sort!: number | null;
  @ApiProperty({
    nullable: true,
    type: String,
    description: '공개 주소 /api/content/assets/<id>',
  })
  thumbnail!: string | null;
  @ApiProperty({ nullable: true, type: ControllerContentThumbnailSizeDto })
  thumbnail_size!: ControllerContentThumbnailSizeDto | null;
  @ApiProperty({ nullable: true, enum: ['registered', 'applied'] })
  cert_state!: string | null;
  @ApiProperty({ nullable: true, type: String }) cert_no!: string | null;
  @ApiProperty({ nullable: true, type: String }) cert_date!: string | null;
  @ApiProperty({ nullable: true, type: String }) cert_made_date!: string | null;
  @ApiProperty({ nullable: true, type: String }) cert_kind!: string | null;
  @ApiProperty({ nullable: true, type: String }) history_year!: string | null;
  @ApiProperty({ nullable: true, type: String }) period_start!: string | null;
  @ApiProperty({ nullable: true, type: String }) period_end!: string | null;
  @ApiProperty({ nullable: true, type: String }) press_media!: string | null;
  @ApiProperty({ nullable: true, type: String }) employment_type!:
    string | null;
  @ApiProperty() is_open_ended!: boolean;
  @ApiProperty({ nullable: true, type: String }) deadline!: string | null;
  @ApiProperty({ nullable: true, type: String }) title!: string | null;
  @ApiProperty({ nullable: true, type: String }) summary!: string | null;
  @ApiProperty({ nullable: true, type: String }) case_category_label!:
    string | null;
  @ApiProperty({ nullable: true, type: String }) faq_category!: string | null;
  @ApiProperty({ nullable: true, type: String }) seo_title!: string | null;
  @ApiProperty({ nullable: true, type: String }) seo_description!:
    string | null;
  @ApiProperty({
    nullable: true,
    type: String,
    description:
      '공유 카드 그림 공개 주소(없으면 화면이 대표 이미지 → 사이트 기본 그림)',
  })
  og_image!: string | null;
  @ApiProperty({ description: '검색에서 제외' }) no_index!: boolean;
  @ApiProperty({
    nullable: true,
    type: String,
    format: 'date-time',
    description: '사이트맵 lastmod',
  })
  updated_on!: string | null;
  @ApiPropertyOptional({
    nullable: true,
    type: String,
    description: '본문 HTML — 글 하나와 FAQ 목록에만 싣는다',
  })
  body?: string | null;

  /** 번역 한 벌을 본문 옆에 편다. 요청 언어가 없으면 첫 번역(기본 언어)으로 떨어뜨린다. */
  static from(
    r: PublicPostRow,
    language: string,
    withBody = false,
  ): ControllerContentDefaultPostResponseDto {
    const t =
      r.translations?.find((x) => x.languagesCode === language) ??
      r.translations?.[0];
    const out: ControllerContentDefaultPostResponseDto = {
      id: r.id,
      board: r.board,
      slug: r.slug,
      published_date: r.publishedDate,
      publish_at: r.publishAt,
      unpublish_at: r.unpublishAt,
      is_pinned: r.isPinned,
      sort: r.sort,
      thumbnail: asset(r.thumbnail),
      thumbnail_size:
        r.thumb && r.thumb.width && r.thumb.height
          ? { w: r.thumb.width, h: r.thumb.height }
          : null,
      cert_state: r.certState,
      cert_no: r.certNo,
      cert_date: r.certDate,
      cert_made_date: r.certMadeDate,
      cert_kind: r.certKind,
      history_year: r.historyYear,
      period_start: r.periodStart,
      period_end: r.periodEnd,
      press_media: r.pressMedia,
      employment_type: r.employmentType,
      is_open_ended: r.isOpenEnded,
      deadline: r.deadline,
      title: t?.title ?? null,
      summary: t?.summary ?? null,
      case_category_label: t?.caseCategoryLabel ?? null,
      faq_category: t?.faqCategory ?? null,
      seo_title: t?.seoTitle ?? null,
      seo_description: t?.seoDescription ?? null,
      og_image: asset(r.ogImage),
      no_index: r.noIndex,
      updated_on: r.updatedOn ? new Date(r.updatedOn).toISOString() : null,
    };
    if (withBody) out.body = t?.body ?? null;
    return out;
  }
}

export class ControllerContentAttachmentResponseDto {
  @ApiProperty({ description: '파일 id' }) id!: string;
  @ApiProperty({ description: '보이는 이름(제목 → 원래 파일 이름)' })
  name!: string;
  @ApiProperty({ description: '공개 주소' }) url!: string;

  static fromPost(r: PostEntity): ControllerContentAttachmentResponseDto[] {
    return (r.files ?? [])
      .filter((f) => f.fileId)
      .map((f) => ({
        id: f.fileId as string,
        name: f.file?.title || f.file?.filenameDownload || '첨부파일',
        url: `/api/content/assets/${f.fileId}`,
      }));
  }
}

export class ControllerContentDefaultPostDetailResponseDto extends ControllerContentDefaultPostResponseDto {
  @ApiProperty({ type: [ControllerContentAttachmentResponseDto] })
  attachments!: ControllerContentAttachmentResponseDto[];
}

/** 공개 목록 `{ data, total, pageSize, language }` — 쪽 번호(page)는 싣지 않는다(옛 약속). */
export class ControllerContentDefaultPostListResponseDto {
  @ApiProperty({ type: [ControllerContentDefaultPostResponseDto] })
  data!: ControllerContentDefaultPostResponseDto[];
  @ApiProperty() total!: number;
  @ApiProperty({ example: 10 }) pageSize!: number;
  @ApiProperty({ example: 'ko-KR', description: '실제로 쓰인 언어' })
  language!: string;
}

/** 공개 글 하나 `{ data, language }`. */
export class ControllerContentDefaultPostDetailEnvelopeDto {
  @ApiProperty({ type: ControllerContentDefaultPostDetailResponseDto })
  data!: ControllerContentDefaultPostDetailResponseDto;
  @ApiProperty({ example: 'ko-KR', description: '실제로 쓰인 언어' })
  language!: string;
}

/** 파일 관문이 흘려보낼 원본 한 벌. 응답 본문이 아니라 컨트롤러가 헤더와 함께 쓴다. */
export interface ContentPublicFile {
  type: string;
  size: number;
  stream: NodeJS.ReadableStream;
}
