import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { INQUIRY_STATUSES } from '../../../common/entity/inquiry.entity';

/**
 * 문의 고치기. 보낸 칸만 바꾼다.
 * assignee_email · note 는 null 을 보내면 비운다(없으면 그대로 둔다).
 */
export class ControllerAdminInquiryDefaultUpdateDto {
  @IsOptional()
  @IsIn(INQUIRY_STATUSES as unknown as string[])
  status?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  assignee_email?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  note?: string | null;
}
