import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsISO8601,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { BOARDS } from '../../../common/entity/post.entity';
import { LANGUAGES } from '../../../common/entity/post-translation.entity';

const DATE = /^\d{4}-\d{2}-\d{2}$/;

/** 채용 고용 형태. */
export const EMPLOYMENT_TYPES = ['fulltime', 'contract', 'intern'] as const;

export class ControllerAdminPostTranslationDto {
  @IsString()
  @IsIn(LANGUAGES as unknown as string[])
  languages_code!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  summary?: string;

  @IsOptional()
  @IsString()
  body?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  case_category_label?: string;

  /** FAQ 분류 */
  @IsOptional()
  @IsString()
  @MaxLength(255)
  faq_category?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  seo_title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  seo_description?: string;
}

/** 만들기와 고치기가 같은 모양이다. 비운 칸은 null 로 저장한다 — 없는 칸은 손대지 않는다. */
export class ControllerAdminPostDefaultSaveDto {
  @IsString()
  @IsIn(BOARDS as unknown as string[])
  board!: string;

  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9][a-z0-9-]{0,200}$/, {
    message: '주소는 영문 소문자·숫자·하이픈(-)으로만 적어 주세요.',
  })
  slug?: string;

  @IsOptional()
  @IsIn(['published', 'draft'])
  status?: string;

  @IsString()
  @Matches(DATE)
  published_date!: string;

  @IsOptional()
  @IsBoolean()
  is_pinned?: boolean;

  @IsOptional()
  @IsBoolean()
  is_featured?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(36)
  thumbnail?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  press_media?: string | null;

  @IsOptional()
  @Matches(DATE)
  period_start?: string | null;

  @IsOptional()
  @Matches(DATE)
  period_end?: string | null;

  @IsOptional()
  @IsIn(['registered', 'applied'])
  cert_state?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  cert_no?: string | null;

  @IsOptional()
  @Matches(DATE)
  cert_date?: string | null;

  @IsOptional()
  @Matches(DATE)
  cert_made_date?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  cert_kind?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(4)
  history_year?: string | null;

  /** 채용 */
  @IsOptional()
  @IsIn([...EMPLOYMENT_TYPES, null])
  employment_type?: string | null;

  @IsOptional()
  @IsBoolean()
  is_open_ended?: boolean;

  /** 채용 마감일 */
  @IsOptional()
  @Matches(DATE)
  deadline?: string | null;

  /**
   * 예약 공개 · 자동 내림(ISO 8601). 비우면(null) 없음.
   * 공개 API 는 이 둘을 보고 거른다 — 상태를 1분마다 바꾸는 일은 admin-schedule 이 한다.
   */
  @IsOptional()
  @IsISO8601()
  publish_at?: string | null;

  @IsOptional()
  @IsISO8601()
  unpublish_at?: string | null;

  @IsArray()
  @ArrayMaxSize(2)
  @ValidateNested({ each: true })
  @Type(() => ControllerAdminPostTranslationDto)
  translations!: ControllerAdminPostTranslationDto[];

  /** 첨부 파일 id 목록. 순서대로. */
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  file_ids?: string[];
}

export class ControllerAdminPostDefaultReorderDto {
  @IsArray()
  @ArrayMaxSize(500)
  @IsInt({ each: true })
  ids!: number[];
}
