import { ApiProperty } from '@nestjs/swagger';
import {
  ADMIN_ROLES,
  AdminUserEntity,
} from '../../../common/entity/admin-user.entity';
import {
  INQUIRY_STATUSES,
  InquiryEntity,
} from '../../../common/entity/inquiry.entity';

/** 관리 화면이 보는 문의 한 건. 칸 이름은 다른 관리 API 와 같이 snake_case. 변경 이력의 before·after 도 이 모양. */
export class ControllerAdminInquiryDefaultResponseDto {
  @ApiProperty() id!: number;
  @ApiProperty({ example: '솔루션 도입 문의' }) type!: string;
  @ApiProperty({ enum: INQUIRY_STATUSES }) status!: string;
  @ApiProperty() name!: string;
  @ApiProperty({ nullable: true, type: String }) email!: string | null;
  @ApiProperty({ nullable: true, type: String }) company!: string | null;
  @ApiProperty({ nullable: true, type: String }) phone!: string | null;
  @ApiProperty() message!: string;
  @ApiProperty() consent!: boolean;
  @ApiProperty({ nullable: true, type: String }) source_path!: string | null;
  @ApiProperty({ nullable: true, type: String }) assignee_email!: string | null;
  @ApiProperty({ nullable: true, type: String }) note!: string | null;
  @ApiProperty({ type: String, format: 'date-time' }) created_on!: Date;
  @ApiProperty({ type: String, format: 'date-time' }) updated_on!: Date;

  static from(r: InquiryEntity): ControllerAdminInquiryDefaultResponseDto {
    return {
      id: r.id,
      type: r.type,
      status: r.status,
      name: r.name,
      email: r.email,
      company: r.company,
      phone: r.phone,
      message: r.message,
      consent: r.consent,
      source_path: r.sourcePath,
      assignee_email: r.assigneeEmail,
      note: r.note,
      created_on: r.createdOn,
      updated_on: r.updatedOn,
    };
  }
}

/** 담당자로 고를 수 있는 사람(admin_users 중 켜진 계정). */
export class ControllerAdminInquiryAssigneeResponseDto {
  @ApiProperty() email!: string;
  @ApiProperty({ nullable: true, type: String }) name!: string | null;
  @ApiProperty({ enum: ADMIN_ROLES }) role!: string;

  static from(u: AdminUserEntity): ControllerAdminInquiryAssigneeResponseDto {
    return { email: u.email, name: u.name, role: u.role };
  }
}
