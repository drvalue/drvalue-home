import {
  IsEmail,
  IsIn,
  IsString,
} from '../../../common/dto/validator-with-swagger.decorator';

/** 문의 모달 select 의 선택지와 같게 둔다. */
export const INQUIRY_TYPES = [
  '지원사업',
  'CutON(레이저 견적)',
  'growchat(채팅 솔루션)',
  '솔루션 도입 문의',
  '기타',
] as const;

/**
 * 공개 문의 폼(web components/headerAssets.ts)이 보내는 칸. 이름은 PHP 시절 그대로다.
 * 길이 한도(200/50/5000)는 좁히지 않는다 — 받던 문의가 거절된다.
 */
export class ControllerInquiryDefaultCreateDto {
  @IsString({
    propertyName: '이름',
    description: '회사명 / 성함',
    example: '디알밸류 홍길동',
    max: 200,
  })
  user_name!: string;

  @IsString({
    propertyName: '연락처',
    description: '연락처',
    example: '010-0000-0000',
    max: 50,
  })
  user_tel!: string;

  /** 답장 주소. 담당자가 관리 화면에서 바로 답장한다. */
  @IsEmail({
    propertyName: '이메일',
    description: '답장 받을 이메일',
    max: 255,
    message: '이메일 주소를 확인해 주세요.',
  })
  user_email!: string;

  @IsIn({
    propertyName: '문의 유형',
    description: '문의 유형',
    values: INQUIRY_TYPES,
    message: '문의 유형을 골라 주세요.',
  })
  user_type!: string;

  @IsString({
    propertyName: '문의 내용',
    description: '문의 내용',
    example: 'MES 도입 견적을 받고 싶습니다.',
    max: 5000,
  })
  user_msg!: string;
}
