import { ApiProperty } from '@nestjs/swagger';
import { ADMIN_ROLES } from '../../../common/entity/admin-user.entity';
import { BOARDS } from '../../../common/entity/post.entity';
import type { SessionPayload } from '../../../common/session/session-token';
import { visibleBoards } from '../service/board-access';

/** 지금 로그인한 사람. 화면(사이드바·홈)은 게시판 규칙을 따로 들지 않고 `boards` 만 본다. */
export class ControllerAdminAuthDefaultMeResponseDto {
  @ApiProperty({ example: 'name@drvalue.co.kr' }) email!: string;
  @ApiProperty({ nullable: true, type: String }) name!: string | null;
  @ApiProperty({
    nullable: true,
    enum: ADMIN_ROLES,
    description: '고칠 수 있는 범위',
  })
  role!: string | null;
  @ApiProperty({
    type: [String],
    example: ['notice', 'press'],
    description: '이 범위로 만질 수 있는 게시판 키',
  })
  boards!: string[];

  static from(s: SessionPayload): ControllerAdminAuthDefaultMeResponseDto {
    return {
      email: s.email,
      name: s.name ?? null,
      role: s.role ?? null,
      boards: visibleBoards(s.role, BOARDS),
    };
  }
}
