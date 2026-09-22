import { IsIn, IsNotEmpty, IsString, MaxLength } from 'class-validator'

/** 문의 모달 select 의 선택지와 같게 둔다. */
export const INQUIRY_TYPES = [
  '지원사업',
  'CutON(레이저 견적)',
  'growchat(채팅 솔루션)',
  '솔루션 도입 문의',
  '기타',
] as const

/** 길이 한도(200/50/5000)는 좁히지 않는다 — 받던 문의가 거절된다. */
export class ControllerInquiryDefaultCreateDto {
  @IsString() @IsNotEmpty() @MaxLength(200)
  user_name!: string

  @IsString() @IsNotEmpty() @MaxLength(50)
  user_tel!: string

  @IsString() @IsIn(INQUIRY_TYPES as unknown as string[])
  user_type!: string

  @IsString() @IsNotEmpty() @MaxLength(5000)
  user_msg!: string
}
