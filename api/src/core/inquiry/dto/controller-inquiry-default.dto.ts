import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsString,
  MaxLength,
} from 'class-validator';

/** 문의 모달 select 의 선택지와 같게 둔다. */
export const INQUIRY_TYPES = [
  '지원사업',
  'CutON(레이저 견적)',
  'growchat(채팅 솔루션)',
  '솔루션 도입 문의',
  '기타',
] as const;

/** 길이 한도(200/50/5000)는 좁히지 않는다 — 받던 문의가 거절된다. */
export class ControllerInquiryDefaultCreateDto {
  @IsString()
  @IsNotEmpty({ message: '이름을 입력해 주세요.' })
  @MaxLength(200, { message: '이름은 200자까지 입력할 수 있습니다.' })
  user_name!: string;

  @IsString()
  @IsNotEmpty({ message: '연락처를 입력해 주세요.' })
  @MaxLength(50, { message: '연락처는 50자까지 입력할 수 있습니다.' })
  user_tel!: string;

  /** 답장 주소. 담당자가 관리 화면에서 바로 답장한다. */
  @IsEmail({}, { message: '이메일 주소를 확인해 주세요.' })
  @MaxLength(255, { message: '이메일은 255자까지 입력할 수 있습니다.' })
  user_email!: string;

  @IsString()
  @IsIn(INQUIRY_TYPES as unknown as string[], {
    message: '문의 유형을 골라 주세요.',
  })
  user_type!: string;

  @IsString()
  @IsNotEmpty({ message: '문의 내용을 입력해 주세요.' })
  @MaxLength(5000, { message: '문의 내용은 5000자까지 입력할 수 있습니다.' })
  user_msg!: string;
}
