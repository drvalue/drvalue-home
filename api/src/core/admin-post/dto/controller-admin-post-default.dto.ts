import { BOARDS } from '../../../common/entity/post.entity';
import { LANGUAGES } from '../../../common/entity/post-translation.entity';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsDateTimeString,
  IsIn,
  IsInt,
  IsString,
} from '../../../common/dto/validator-with-swagger.decorator';

/** 채용 고용 형태. */
export const EMPLOYMENT_TYPES = ['fulltime', 'contract', 'intern'] as const;
export const POST_STATUSES = ['published', 'draft'] as const;
export const POST_SCHEDULES = ['scheduled', 'unpublishing'] as const;

/** 목록 거름. 쪽 크기는 서비스가 정한다(30). */
export class ControllerAdminPostDefaultListQueryDto {
  @IsIn({
    propertyName: '게시판',
    description: '게시판 키. 안 주면 이 범위로 볼 수 있는 게시판 전부',
    values: BOARDS,
    optional: true,
  })
  board?: string;

  @IsString({
    propertyName: '검색어',
    description: '제목(모든 언어)·주소(slug) 부분 일치',
    example: '보도',
    optional: true,
    max: 100,
  })
  q?: string;

  @IsIn({
    propertyName: '상태',
    description: '공개 · 초안',
    values: POST_STATUSES,
    optional: true,
  })
  status?: string;

  @IsIn({
    propertyName: '예약',
    description:
      'scheduled = 예약 공개 시각이 아직 안 온 글 · unpublishing = 자동 내림 시각이 정해진 글',
    values: POST_SCHEDULES,
    optional: true,
  })
  schedule?: 'scheduled' | 'unpublishing';

  @IsInt({
    propertyName: '쪽',
    description: '1부터',
    example: 1,
    optional: true,
    min: 1,
    query: true,
  })
  page?: number;
}

export class ControllerAdminPostTranslationDto {
  @IsIn({
    propertyName: '언어',
    description: '언어 코드',
    values: LANGUAGES,
  })
  languages_code!: string;

  @IsString({
    propertyName: '제목',
    description: '제목(FAQ 는 질문). 한국어는 저장할 때 필수',
    example: '2026 스마트공장 보급 사업 선정',
    optional: true,
    max: 255,
  })
  title?: string;

  @IsString({
    propertyName: '요약',
    description: '목록에 나오는 한두 줄(연혁은 부연)',
    optional: true,
    max: 5000,
  })
  summary?: string;

  @IsString({
    propertyName: '본문',
    description: '편집기 HTML. 그림은 /api/content/assets/<id>',
    optional: true,
  })
  body?: string;

  @IsString({
    propertyName: '구분',
    description: '수행실적 구분(발주·사업 유형)',
    optional: true,
    max: 255,
  })
  case_category_label?: string;

  @IsString({
    propertyName: 'FAQ 분류',
    description: 'FAQ 분류',
    optional: true,
    max: 255,
  })
  faq_category?: string;

  @IsString({
    propertyName: '검색 제목',
    description: '검색 결과 제목(비우면 글 제목)',
    optional: true,
    max: 255,
  })
  seo_title?: string;

  @IsString({
    propertyName: '검색 설명',
    description: '검색 결과 설명(비우면 요약)',
    optional: true,
    max: 1000,
  })
  seo_description?: string;
}

/** 만들기와 고치기가 같은 모양이다. 비운 칸은 null 로 저장한다 — 보내지 않은 칸은 손대지 않는다. */
export class ControllerAdminPostDefaultSaveDto {
  @IsIn({ propertyName: '게시판', description: '게시판 키', values: BOARDS })
  board!: string;

  @IsString({
    propertyName: '주소',
    description: '사이트 주소 끝부분. 비우면 자동',
    example: 'notice-2026-open',
    optional: true,
    pattern: /^[a-z0-9][a-z0-9-]{0,200}$/,
    patternMessage: '주소는 영문 소문자·숫자·하이픈(-)으로만 적어 주세요.',
  })
  slug?: string;

  @IsIn({
    propertyName: '상태',
    description: '공개 · 초안',
    values: POST_STATUSES,
    optional: true,
  })
  status?: string;

  @IsDateString({
    propertyName: '표시 날짜',
    description: '목록에 보이는 날짜',
  })
  published_date!: string;

  @IsBoolean({
    propertyName: '상단 고정',
    description: '공지·보도·뉴스 목록 맨 위',
    optional: true,
  })
  is_pinned?: boolean;

  @IsBoolean({
    propertyName: '대표 글',
    description: '홈 소식에 먼저',
    optional: true,
  })
  is_featured?: boolean;

  @IsString({
    propertyName: '증서 그림',
    description:
      '증서(특허·저작권) 그림 파일 id. 공지·보도·뉴스는 보내도 무시한다 — 본문 첫 그림이 대표 이미지다',
    optional: true,
    nullable: true,
    max: 36,
  })
  thumbnail?: string | null;

  @IsString({
    propertyName: '공유 그림',
    description:
      '공유 카드(og:image) 파일 id. 비우면 대표 이미지 → 사이트 기본 그림',
    optional: true,
    nullable: true,
    pattern: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    patternMessage: '공유 그림을 다시 골라 주세요.',
  })
  og_image?: string | null;

  @IsBoolean({
    propertyName: '검색에서 제외',
    description:
      '공개 장에 noindex, 사이트맵에서 뺀다. 사이트에는 그대로 보인다',
    optional: true,
  })
  no_index?: boolean;

  @IsString({
    propertyName: '매체명',
    description: '보도·뉴스의 매체',
    optional: true,
    nullable: true,
    max: 255,
  })
  press_media?: string | null;

  @IsDateString({
    propertyName: '시작',
    description: '수행실적 기간 시작(월의 1일)',
    optional: true,
    nullable: true,
  })
  period_start?: string | null;

  @IsDateString({
    propertyName: '종료',
    description: '수행실적 기간 끝(월의 1일)',
    optional: true,
    nullable: true,
  })
  period_end?: string | null;

  @IsIn({
    propertyName: '등록 상태',
    description: '특허 등록 · 출원',
    values: ['registered', 'applied'],
    optional: true,
    nullable: true,
  })
  cert_state?: string | null;

  @IsString({
    propertyName: '번호',
    description: '등록·출원 번호',
    optional: true,
    nullable: true,
    max: 255,
  })
  cert_no?: string | null;

  @IsDateString({
    propertyName: '등록일',
    description: '등록·출원일',
    optional: true,
    nullable: true,
  })
  cert_date?: string | null;

  @IsDateString({
    propertyName: '창작일',
    description: '저작권 창작일',
    optional: true,
    nullable: true,
  })
  cert_made_date?: string | null;

  @IsString({
    propertyName: '저작물 종류',
    description: '등록증 그대로',
    optional: true,
    nullable: true,
    max: 255,
  })
  cert_kind?: string | null;

  @IsString({
    propertyName: '연도',
    description: '연혁 연도',
    example: '2025',
    optional: true,
    nullable: true,
    max: 4,
  })
  history_year?: string | null;

  @IsIn({
    propertyName: '고용 형태',
    description: '채용',
    values: [...EMPLOYMENT_TYPES, null],
    optional: true,
  })
  employment_type?: string | null;

  @IsBoolean({
    propertyName: '상시 채용',
    description: '마감일 없음',
    optional: true,
  })
  is_open_ended?: boolean;

  @IsDateString({
    propertyName: '마감일',
    description: '채용 마감일',
    optional: true,
    nullable: true,
  })
  deadline?: string | null;

  /**
   * 예약 공개 · 자동 내림. 비우면(null) 없음.
   * 공개 API 는 이 둘을 보고 거른다 — 상태를 1분마다 바꾸는 일은 admin-schedule 이 한다.
   */
  @IsDateTimeString({
    propertyName: '예약 공개',
    description: '이 시각에 사이트에 나온다',
    optional: true,
    nullable: true,
  })
  publish_at?: string | null;

  @IsDateTimeString({
    propertyName: '자동 내림',
    description: '이 시각에 초안으로 돌아간다',
    optional: true,
    nullable: true,
  })
  unpublish_at?: string | null;

  @IsArray({
    propertyName: '번역',
    description: '언어별 제목·본문. 한국어는 꼭',
    maxSize: 2,
    itemType: ControllerAdminPostTranslationDto,
  })
  translations!: ControllerAdminPostTranslationDto[];

  @IsArray({
    propertyName: '첨부 파일',
    description: '첨부 파일 id. 이 순서대로 보인다',
    optional: true,
    maxSize: 20,
    each: 'string',
  })
  file_ids?: string[];
}

export class ControllerAdminPostDefaultReorderDto {
  @IsArray({
    propertyName: '순서',
    description: '글 id 를 보일 순서대로',
    example: [12, 7, 3],
    maxSize: 500,
    each: 'int',
  })
  ids!: number[];
}
