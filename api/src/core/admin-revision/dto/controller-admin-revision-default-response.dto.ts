import { ApiProperty } from '@nestjs/swagger';
import type { RevisionEntity } from '../../../common/entity/revision.entity';

/** 이력 목록 한 줄. before/after 는 싣지 않는다 — 한 건 조회에서만. */
export class ControllerAdminRevisionDefaultRowResponseDto {
  @ApiProperty() id!: number;
  @ApiProperty({ description: '바꾼 사람(예약 게시는 schedule@system)' })
  actor!: string;
  @ApiProperty({ enum: ['create', 'update', 'delete', 'restore'] })
  action!: string;
  @ApiProperty({ example: 'posts' }) collection!: string;
  @ApiProperty({
    description: '항목 id(글 번호 · 장 key/언어 · 주소 · list …)',
  })
  item_id!: string;
  @ApiProperty({ type: String, format: 'date-time' }) created_on!: Date;
  @ApiProperty({ description: '사람이 읽는 이름(제목·문의한 분·장 이름 …)' })
  label!: string;
  @ApiProperty({
    nullable: true,
    type: String,
    description: '게시판 글이면 게시판 키',
  })
  board!: string | null;

  static from(
    rev: RevisionEntity,
    label: string,
    board: string | null,
  ): ControllerAdminRevisionDefaultRowResponseDto {
    return {
      id: Number(rev.id),
      actor: rev.actor,
      action: rev.action,
      collection: rev.collection,
      item_id: rev.itemId,
      created_on: rev.createdOn,
      label,
      board,
    };
  }
}

/** 이력 한 건. before·after 는 그 기능의 관리 화면 응답 모양(객체 또는 목록) 그대로. */
export class ControllerAdminRevisionDefaultDetailResponseDto extends ControllerAdminRevisionDefaultRowResponseDto {
  @ApiProperty({
    nullable: true,
    description: '바꾸기 전(만들기는 null)',
    oneOf: [{ type: 'object' }, { type: 'array', items: { type: 'object' } }],
  })
  before!: unknown;
  @ApiProperty({
    nullable: true,
    description: '바꾼 뒤(지우기는 null)',
    oneOf: [{ type: 'object' }, { type: 'array', items: { type: 'object' } }],
  })
  after!: unknown;
  @ApiProperty({ description: '이 이력의 「바꾸기 전」으로 되돌릴 수 있나' })
  restorable!: boolean;
  @ApiProperty({
    nullable: true,
    type: String,
    description:
      '되돌릴 수 없을 때 화면에 보일 까닭(되돌리기를 누르면 나갈 문구와 같다)',
  })
  restore_note!: string | null;
}

/** 되돌리기 결과. data 는 되돌린 뒤의 모양(그 기능의 관리 화면 응답). */
export class ControllerAdminRevisionDefaultRestoreResponseDto {
  @ApiProperty({
    nullable: true,
    oneOf: [{ type: 'object' }, { type: 'array', items: { type: 'object' } }],
  })
  data!: unknown;
  @ApiProperty({
    type: [String],
    description: '되돌리며 뺀 것(지워진 파일 등) — 화면이 알림 옆에 보여 준다',
  })
  warnings!: string[];
}
