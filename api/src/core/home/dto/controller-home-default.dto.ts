import { LANGUAGES } from '../../../common/entity/post-translation.entity';
import {
  IsArray,
  IsBoolean,
  IsDateTimeString,
  IsIn,
  IsInt,
  IsString,
} from '../../../common/dto/validator-with-swagger.decorator';

/** 사이트 안 주소(`/`로 시작, `//` 은 아님) 또는 https 주소. `javascript:` 같은 것은 여기서 막힌다. */
export const HOME_HREF_RE = /^(\/(?!\/)[^\s<>"']*|https:\/\/[^\s<>"']+)$/;
const HREF_MESSAGE =
  '링크는 /로 시작하는 사이트 안 주소나 https:// 로 시작하는 주소로 적어 주세요.';
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** 공개 메인 읽기. */
export class ControllerHomeDefaultQueryDto {
  @IsIn({
    propertyName: '언어',
    description: '없으면 ko-KR. 그 언어 글이 없는 칸은 한국어로 나간다',
    values: LANGUAGES,
    optional: true,
  })
  lang?: string;
}

/** 배너의 언어별 글자. 비우면 머리 그림의 기본 글이 나온다. */
export class ControllerHomeDefaultBannerTextDto {
  @IsIn({ propertyName: '언어', description: '언어 코드', values: LANGUAGES })
  languages_code!: string;

  @IsString({
    propertyName: '배너 제목',
    description: '비우면 메인 화면 글의 제목이 나온다',
    example: '9월 스마트공장 설명회',
    optional: true,
    nullable: true,
    max: 120,
  })
  title?: string | null;

  @IsString({
    propertyName: '배너 설명',
    description: '비우면 메인 화면 글의 소개 문장이 나온다',
    optional: true,
    nullable: true,
    max: 300,
  })
  description?: string | null;

  @IsString({
    propertyName: '대체 글',
    description: '그림을 못 보는 사람에게 읽어 주는 글',
    optional: true,
    nullable: true,
    max: 200,
  })
  alt?: string | null;

  @IsString({
    propertyName: '버튼 글자',
    description: '링크가 있으면 첫째 버튼 글자. 비우면 「자세히 보기」',
    optional: true,
    nullable: true,
    max: 40,
  })
  link_label?: string | null;
}

/** 배너 한 줄. id 가 있으면 그 배너를 고치고, 없으면 새로 만든다. 목록에 없는 배너는 지운다. */
export class ControllerHomeDefaultBannerDto {
  @IsInt({
    propertyName: '배너 번호',
    description: '고칠 배너의 id. 새 배너는 비운다',
    optional: true,
    nullable: true,
    min: 1,
  })
  id?: number | null;

  @IsBoolean({
    propertyName: '보이기',
    description: '끄면 기간 안이어도 안 나온다',
  })
  visible!: boolean;

  @IsString({
    propertyName: '배너 그림',
    description: '미디어 파일 id(directus_files)',
    optional: true,
    nullable: true,
    pattern: UUID_RE,
    patternMessage: '배너 그림을 다시 골라 주세요.',
  })
  image?: string | null;

  @IsString({
    propertyName: '링크',
    description: '첫째 버튼이 가는 곳. 비우면 메인 화면 글의 첫째 버튼',
    example: '/page/support/notice',
    optional: true,
    nullable: true,
    max: 500,
    pattern: HOME_HREF_RE,
    patternMessage: HREF_MESSAGE,
  })
  link_href?: string | null;

  @IsDateTimeString({
    propertyName: '시작',
    description: '이때부터 나온다. 비우면 바로',
    optional: true,
    nullable: true,
  })
  starts_at?: string | null;

  @IsDateTimeString({
    propertyName: '끝',
    description: '이때부터 안 나온다. 비우면 계속',
    optional: true,
    nullable: true,
  })
  ends_at?: string | null;

  @IsArray({
    propertyName: '언어별 글',
    description: 'ko-KR · en-US',
    itemType: ControllerHomeDefaultBannerTextDto,
    maxSize: 2,
  })
  translations!: ControllerHomeDefaultBannerTextDto[];
}

/** 배너 전체(순서 = 배열 순서). */
export class ControllerHomeDefaultBannerSaveDto {
  @IsArray({
    propertyName: '배너 목록',
    description: '위에서부터의 차례. 살아 있는 것 중 첫째가 머리 그림에 나온다',
    itemType: ControllerHomeDefaultBannerDto,
    maxSize: 20,
  })
  items!: ControllerHomeDefaultBannerDto[];
}

/** 팝업의 언어별 글자. */
export class ControllerHomeDefaultPopupTextDto {
  @IsIn({ propertyName: '언어', description: '언어 코드', values: LANGUAGES })
  languages_code!: string;

  @IsString({
    propertyName: '팝업 제목',
    description: '창 머리. 화면 읽기 프로그램이 창 이름으로 읽는다',
    optional: true,
    nullable: true,
    max: 120,
  })
  title?: string | null;

  @IsString({
    propertyName: '팝업 내용',
    description:
      '편집기 HTML. 저장할 때 허용 태그만 남기고, 남긴 뒤 2000자까지',
    optional: true,
    nullable: true,
    max: 20000,
  })
  body?: string | null;

  @IsString({
    propertyName: '대체 글',
    description: '그림을 못 보는 사람에게 읽어 주는 글',
    optional: true,
    nullable: true,
    max: 200,
  })
  alt?: string | null;

  @IsString({
    propertyName: '버튼 글자',
    description: '링크가 있으면 창 아래 버튼 글자. 비우면 「자세히 보기」',
    optional: true,
    nullable: true,
    max: 40,
  })
  link_label?: string | null;
}

/** 팝업 한 줄. id 가 있으면 고치고(「보지 않기」 기록이 이 id 에 걸려 있다), 없으면 새로 만든다. */
export class ControllerHomeDefaultPopupDto {
  @IsInt({
    propertyName: '팝업 번호',
    description: '고칠 팝업의 id. 새 팝업은 비운다',
    optional: true,
    nullable: true,
    min: 1,
  })
  id?: number | null;

  @IsBoolean({
    propertyName: '보이기',
    description: '끄면 기간 안이어도 안 뜬다',
  })
  visible!: boolean;

  @IsString({
    propertyName: '팝업 그림',
    description: '미디어 파일 id(directus_files)',
    optional: true,
    nullable: true,
    pattern: UUID_RE,
    patternMessage: '팝업 그림을 다시 골라 주세요.',
  })
  image?: string | null;

  @IsString({
    propertyName: '링크',
    description: '창 아래 버튼·그림이 가는 곳',
    optional: true,
    nullable: true,
    max: 500,
    pattern: HOME_HREF_RE,
    patternMessage: HREF_MESSAGE,
  })
  link_href?: string | null;

  @IsDateTimeString({
    propertyName: '시작',
    description: '이때부터 뜬다. 비우면 바로',
    optional: true,
    nullable: true,
  })
  starts_at?: string | null;

  @IsDateTimeString({
    propertyName: '끝',
    description: '이때부터 안 뜬다. 비우면 계속',
    optional: true,
    nullable: true,
  })
  ends_at?: string | null;

  @IsInt({
    propertyName: '창 폭',
    description: '픽셀. 좁은 화면에서는 화면 폭에 맞춘다',
    example: 480,
    min: 280,
    max: 720,
  })
  width!: number;

  @IsInt({
    propertyName: '보지 않기 날수',
    description: '「N일 동안 보지 않기」의 N. 0 이면 닫기만',
    example: 1,
    min: 0,
    max: 30,
  })
  dismiss_days!: number;

  @IsArray({
    propertyName: '언어별 글',
    description: 'ko-KR · en-US',
    itemType: ControllerHomeDefaultPopupTextDto,
    maxSize: 2,
  })
  translations!: ControllerHomeDefaultPopupTextDto[];
}

/** 팝업 전체(순서 = 배열 순서 = 뜨는 차례). */
export class ControllerHomeDefaultPopupSaveDto {
  @IsArray({
    propertyName: '팝업 목록',
    description: '위에서부터 뜨는 차례. 한 번에 하나씩 뜬다',
    itemType: ControllerHomeDefaultPopupDto,
    maxSize: 10,
  })
  items!: ControllerHomeDefaultPopupDto[];
}
