import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

/** 파일 이름 고치기. 디스크 이름(uuid)은 그대로 — 이미 박힌 주소가 안 깨진다. */
export class ControllerAdminFileDefaultUpdateDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title!: string;
}
