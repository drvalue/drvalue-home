import { IsIn, IsNotEmpty, IsString, MaxLength } from 'class-validator'

/** header.php 의 문의 모달이 보내는 필드. select 의 선택지까지 같게 둔다. */
export const INQUIRY_TYPES = [
  '지원사업',
  'CutON(레이저 견적)',
  'growchat(채팅 솔루션)',
  '솔루션 도입 문의',
  '기타',
] as const

export class CreateInquiryDto {
  // 길이는 mail_send.php 와 같게 둔다(200/50/5000). 더 좁히면 PHP 로는
  // 들어가던 문의가 이관 뒤에 거절된다.
  @IsString() @IsNotEmpty() @MaxLength(200)
  user_name!: string

  @IsString() @IsNotEmpty() @MaxLength(50)
  user_tel!: string

  @IsString() @IsIn(INQUIRY_TYPES as unknown as string[])
  user_type!: string

  @IsString() @IsNotEmpty() @MaxLength(5000)
  user_msg!: string
}
