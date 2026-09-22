import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray as IsArrayValidator,
  IsOptional,
} from 'class-validator';
import { LANGUAGES } from '../../../common/entity/post-translation.entity';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsString,
} from '../../../common/dto/validator-with-swagger.decorator';

/**
 * 링크 주소. 사이트 안 주소(`/`로 시작, `//` 은 아님 — 브라우저가 바깥 주소로 읽는다) 또는
 * http(s) 바깥 주소. `javascript:` 같은 것은 여기서 막힌다.
 * 사이트 안 주소가 실제로 있는 장인지는 관리 화면이 저장 전에 그 주소를 불러 보고 확인한다 —
 * 어떤 장이 있는지는 web 만 안다.
 */
export const MENU_HREF_RE = /^(\/(?!\/)[^\s<>"']*|https?:\/\/[^\s<>"']+)$/;
const MATCH_RE = /^\/[^\s<>"']*$/;

/** 공개 메뉴 읽기. */
export class ControllerMenuDefaultQueryDto {
  @IsIn({
    propertyName: '언어',
    description:
      '없으면 ko-KR. 그 언어 이름이 없는 칸은 한국어 이름으로 나간다',
    values: LANGUAGES,
    optional: true,
  })
  lang?: string;
}

/** 메뉴 칸의 언어별 이름. */
export class ControllerMenuDefaultLabelDto {
  @IsIn({ propertyName: '언어', description: '언어 코드', values: LANGUAGES })
  languages_code!: string;

  @IsString({
    propertyName: '메뉴 이름',
    description: '탭·하위 항목에 보이는 글자',
    example: '공지사항',
    min: 1,
    max: 40,
  })
  label!: string;

  @IsString({
    propertyName: '한 줄 설명',
    description: '큰 메뉴판·옆 차례표에서 이름 밑에 깔리는 한 줄(하위만 쓴다)',
    example: '서비스 오픈과 점검 안내',
    optional: true,
    nullable: true,
    max: 80,
  })
  description?: string | null;
}

/** 하위 메뉴 한 칸, 또는 하단 링크 한 줄. 이 아래에는 더 못 넣는다(깊이 2). */
export class ControllerMenuDefaultChildDto {
  @IsString({
    propertyName: '링크',
    description: '사이트 안 주소(/page/...) 또는 http(s) 주소',
    example: '/page/support/notice',
    min: 1,
    max: 500,
    pattern: MENU_HREF_RE,
    patternMessage:
      '링크는 /로 시작하는 사이트 안 주소나 http(s):// 로 시작하는 주소로 적어 주세요.',
  })
  href!: string;

  @IsBoolean({
    propertyName: '보이기',
    description: '끄면 공개 메뉴에서 빠진다',
  })
  visible!: boolean;

  @IsBoolean({
    propertyName: '드롭다운에서 숨김',
    description: '하위만: 드롭다운에는 안 띄우고 현재 위치 줄에만 이름을 쓴다',
    optional: true,
  })
  hidden_in_dropdown?: boolean;

  @IsArray({
    propertyName: '이름',
    description: '언어별 이름(한국어는 꼭)',
    itemType: ControllerMenuDefaultLabelDto,
    maxSize: LANGUAGES.length,
  })
  translations!: ControllerMenuDefaultLabelDto[];

  /** 받기만 하고 비어 있어야 한다 — 비어 있지 않으면 400(깊이 3 을 조용히 버리지 않는다). */
  @IsOptional()
  @IsArrayValidator({ message: '하위 메뉴 형식이 올바르지 않습니다.' })
  @ArrayMaxSize(0, {
    message: '하위 메뉴 아래에는 메뉴를 더 넣을 수 없습니다.',
  })
  @ApiProperty({
    required: false,
    maxItems: 0,
    description: '비워 둔다(깊이 2까지)',
  })
  children?: unknown[];
}

/** 상단 대분류 한 칸. 하위를 한 단 가진다. */
export class ControllerMenuDefaultNodeDto {
  @IsString({
    propertyName: '링크',
    description: '탭을 누르면 가는 주소',
    example: '/page/support/notice',
    min: 1,
    max: 500,
    pattern: MENU_HREF_RE,
    patternMessage:
      '링크는 /로 시작하는 사이트 안 주소나 http(s):// 로 시작하는 주소로 적어 주세요.',
  })
  href!: string;

  @IsBoolean({
    propertyName: '보이기',
    description: '끄면 공개 메뉴에서 빠진다',
  })
  visible!: boolean;

  @IsArray({
    propertyName: '켜지는 주소',
    description:
      '이 주소 앞부분으로 시작하는 장에서 이 탭이 「지금 여기」로 켜진다. 비우면 링크 주소',
    example: ['/page/support/'],
    each: 'string',
    maxSize: 5,
    optional: true,
    nullable: true,
  })
  match?: string[] | null;

  @IsArray({
    propertyName: '이름',
    description: '언어별 이름(한국어는 꼭)',
    itemType: ControllerMenuDefaultLabelDto,
    maxSize: LANGUAGES.length,
  })
  translations!: ControllerMenuDefaultLabelDto[];

  @IsArray({
    propertyName: '하위 메뉴',
    description: '드롭다운에 뜨는 항목(12개까지)',
    itemType: ControllerMenuDefaultChildDto,
    maxSize: 12,
    optional: true,
  })
  children?: ControllerMenuDefaultChildDto[];
}

/** 메뉴 전체를 한 번에 저장한다(부분 저장 없음 — 순서가 전체에서 정해진다). */
export class ControllerMenuDefaultSaveDto {
  @IsArray({
    propertyName: '상단 메뉴',
    description: '탭 막대(8개까지)',
    itemType: ControllerMenuDefaultNodeDto,
    maxSize: 8,
  })
  top!: ControllerMenuDefaultNodeDto[];

  @IsArray({
    propertyName: '하단 링크',
    description: '바닥글의 링크 줄(12개까지). 비우면 바닥글에 링크 줄이 없다',
    itemType: ControllerMenuDefaultChildDto,
    maxSize: 12,
  })
  footer!: ControllerMenuDefaultChildDto[];
}

/** match 항목 형식. DTO 의 each: 'string' 은 모양만 본다 — 앞이 / 인지는 서비스가 본다. */
export const isMatchPath = (s: string) => MATCH_RE.test(s) && s.length <= 200;
