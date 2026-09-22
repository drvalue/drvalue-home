import { ApiProperty } from '@nestjs/swagger';

/** 게시판 하나의 수. */
export class ControllerAdminDashboardBoardCountResponseDto {
  @ApiProperty({ example: 'notice' }) board!: string;
  @ApiProperty({ example: 2 }) count!: number;
}

/** 문의 수. hr 에는 오지 않는다(문의를 못 본다). */
export class ControllerAdminDashboardInquiryResponseDto {
  @ApiProperty({ description: '「접수」 상태 그대로인 문의' }) new!: number;
  @ApiProperty({ description: '내가 맡아 아직 끝나지 않은(접수·진행중) 문의' })
  mine_open!: number;
}

/** 최근 변경 한 줄. `/api/admin/revisions` 목록과 같은 모양. */
export class ControllerAdminDashboardRevisionResponseDto {
  @ApiProperty() id!: number;
  @ApiProperty() actor!: string;
  @ApiProperty({ enum: ['create', 'update', 'delete', 'restore'] })
  action!: string;
  @ApiProperty({ example: 'posts' }) collection!: string;
  @ApiProperty() item_id!: string;
  @ApiProperty({ format: 'date-time' }) created_on!: Date;
  @ApiProperty() label!: string;
  @ApiProperty({ nullable: true, type: String }) board!: string | null;
}

/**
 * 홈 요약 한 번에. 범위가 못 보는 것은 비운다 — 문의는 hr 에 null, 최근 변경은 전체 권한이 아니면 null,
 * 게시판 수는 이 범위가 만질 수 있는 게시판만(`/me` 의 boards 와 같다). 0 인 게시판은 빠진다.
 */
export class ControllerAdminDashboardDefaultResponseDto {
  @ApiProperty({
    type: ControllerAdminDashboardInquiryResponseDto,
    nullable: true,
  })
  inquiries!: ControllerAdminDashboardInquiryResponseDto | null;

  @ApiProperty({ type: [ControllerAdminDashboardBoardCountResponseDto] })
  drafts!: ControllerAdminDashboardBoardCountResponseDto[];

  @ApiProperty({
    type: [ControllerAdminDashboardBoardCountResponseDto],
    description: '예약 공개 대기(publish_at 이 아직 안 왔다)',
  })
  scheduled!: ControllerAdminDashboardBoardCountResponseDto[];

  @ApiProperty({
    type: [ControllerAdminDashboardRevisionResponseDto],
    nullable: true,
  })
  recent!: ControllerAdminDashboardRevisionResponseDto[] | null;
}
