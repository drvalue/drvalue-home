import {
  IsEmail,
  IsIn,
  IsInt,
  IsString,
} from '../../../common/dto/validator-with-swagger.decorator';
import { INQUIRY_STATUSES } from '../../../common/entity/inquiry.entity';

/** 문의 목록 쿼리. 화면이 아는 값만 보낸다 — 모르는 상태·쪽 번호는 400. */
export class ControllerAdminInquiryDefaultListQueryDto {
  @IsIn({
    propertyName: '상태',
    description: '처리 상태',
    values: INQUIRY_STATUSES,
    optional: true,
  })
  status?: string;

  @IsString({
    propertyName: '검색어',
    description: '이름·회사·이메일·연락처·내용',
    optional: true,
    max: 200,
  })
  q?: string;

  @IsString({
    propertyName: '담당자',
    description: "'me'(나) · 'none'(미지정) · 담당자 이메일",
    example: 'me',
    optional: true,
    max: 255,
  })
  assignee?: string;

  @IsInt({
    propertyName: '쪽',
    description: '1 부터',
    optional: true,
    min: 1,
    query: true,
  })
  page?: number;
}

/**
 * 문의 고치기. 보낸 칸만 바꾼다.
 * assignee_email · note 는 null 을 보내면 비운다(없으면 그대로 둔다).
 */
export class ControllerAdminInquiryDefaultUpdateDto {
  @IsIn({
    propertyName: '상태',
    description: '처리 상태',
    values: INQUIRY_STATUSES,
    optional: true,
  })
  status?: string;

  @IsEmail({
    propertyName: '담당자',
    description: '담당자 이메일(권한 목록에 있는 켜진 계정). null 이면 비운다',
    optional: true,
    nullable: true,
    max: 255,
    message: '담당자 이메일을 확인해 주세요.',
  })
  assignee_email?: string | null;

  @IsString({
    propertyName: '메모',
    description: '담당자 메모(문의한 분에게는 안 보인다). null 이면 비운다',
    optional: true,
    nullable: true,
    max: 5000,
  })
  note?: string | null;
}
