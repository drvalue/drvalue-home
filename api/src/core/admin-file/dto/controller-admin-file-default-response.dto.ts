import { ApiProperty } from '@nestjs/swagger';
import type { FileEntity } from '../../../common/entity/file.entity';

/** 미디어 파일 하나. 변경 이력의 before·after 도 이 모양. */
export class ControllerAdminFileDefaultResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ nullable: true, type: String }) title!: string | null;
  @ApiProperty({ description: '원본 파일 이름' }) filename_download!: string;
  @ApiProperty({ nullable: true, type: String, example: 'image/png' })
  type!: string | null;
  @ApiProperty({ nullable: true, type: Number, description: '바이트' })
  filesize!: number | null;
  @ApiProperty({ nullable: true, type: Number }) width!: number | null;
  @ApiProperty({ nullable: true, type: Number }) height!: number | null;
  @ApiProperty({ type: String, format: 'date-time' }) created_on!: Date;
  @ApiProperty({
    description:
      '공개 주소 — 공개된 곳이 가리켜야 열린다(/api/content/assets 관문)',
  })
  url!: string;
  @ApiProperty({
    description: '관리 화면 미리보기 — 가리키는 곳과 상관없이 열린다',
  })
  preview_url!: string;
  @ApiProperty({ description: '쓰는 곳의 수(글·페이지·SEO·메인 배너·팝업)' })
  used!: number;

  static from(
    r: FileEntity,
    used: number,
  ): ControllerAdminFileDefaultResponseDto {
    return {
      id: r.id,
      title: r.title,
      filename_download: r.filenameDownload,
      type: r.type,
      filesize: r.filesize === null ? null : Number(r.filesize),
      width: r.width,
      height: r.height,
      created_on: r.createdOn,
      url: `/api/content/assets/${r.id}`,
      preview_url: `/api/admin/files/${r.id}`,
      used,
    };
  }
}

/** 미리보기로 보낼 파일(응답 본문이 아니라 컨트롤러가 sendFile 로 쓴다). */
export interface AdminFilePreview {
  type: string;
  path: string;
}
