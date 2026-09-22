import { ApiProperty } from '@nestjs/swagger';
import {
  ADMIN_ROLES,
  AdminUserEntity,
} from '../../../common/entity/admin-user.entity';

/** 권한 화면의 한 사람. 변경 이력(collection admin_users)의 before·after 도 이 모양. */
export class ControllerAdminUserDefaultResponseDto {
  @ApiProperty() email!: string;
  @ApiProperty({ nullable: true, type: String }) name!: string | null;
  @ApiProperty({ enum: ADMIN_ROLES, description: '고칠 수 있는 범위' })
  role!: string;
  @ApiProperty({ description: 'IAM 이 관리자라고 한 동안 true' })
  enabled!: boolean;
  @ApiProperty({ nullable: true, type: String, format: 'date-time' })
  last_login_on!: Date | null;

  static from(u: AdminUserEntity): ControllerAdminUserDefaultResponseDto {
    return {
      email: u.email,
      name: u.name,
      role: u.role,
      enabled: u.enabled,
      last_login_on: u.lastLoginOn ?? null,
    };
  }
}
