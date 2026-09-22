import { LANGUAGES } from '../../../common/entity/post-translation.entity';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsString,
} from '../../../common/dto/validator-with-swagger.decorator';

/** 장 주소. 쿼리·끝 슬래시 없이. 홈은 '/'. admin_revisions.item_id(64자)에 들어가야 한다. */
export const PAGE_PATH_RE = /^\/(?:[a-z0-9_-]+(?:\/[a-z0-9_-]+)*)?$/;

export class ControllerSeoDefaultPathQueryDto {
  @IsString({
    propertyName: '주소',
    description: '장 주소(쿼리 없이). 홈은 /',
    example: '/page/company/intro',
    max: 64,
    pattern: PAGE_PATH_RE,
    patternMessage: '장 주소 형식이 올바르지 않습니다.',
  })
  path!: string;
}

export class ControllerSeoPageTranslationDto {
  @IsIn({ propertyName: '언어', description: '언어 코드', values: LANGUAGES })
  languages_code!: string;

  @IsString({
    propertyName: '검색 제목',
    description: '비우면 코드의 제목. 뒤의 「| 디알밸류」는 화면이 붙인다',
    optional: true,
    nullable: true,
    max: 255,
  })
  title?: string | null;

  @IsString({
    propertyName: '검색 설명',
    description: '비우면 코드의 설명',
    optional: true,
    nullable: true,
    max: 1000,
  })
  description?: string | null;
}

/** 한 장의 덮어쓰기 전부. 보낸 값으로 통째로 바꾼다. */
export class ControllerSeoDefaultSaveDto {
  @IsString({
    propertyName: '주소',
    description: '장 주소(쿼리 없이). 홈은 /',
    example: '/page/company/intro',
    max: 64,
    pattern: PAGE_PATH_RE,
    patternMessage: '장 주소 형식이 올바르지 않습니다.',
  })
  path!: string;

  @IsBoolean({
    propertyName: '검색에서 제외',
    description: 'noindex. 사이트맵에서도 뺀다',
    optional: true,
  })
  no_index?: boolean;

  @IsString({
    propertyName: '공유 그림',
    description: '공유 카드(og:image) 파일 id. 비우면 사이트 기본 그림',
    optional: true,
    nullable: true,
    pattern: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    patternMessage: '공유 그림을 다시 골라 주세요.',
  })
  og_image?: string | null;

  @IsArray({
    propertyName: '언어별 제목·설명',
    description: '언어마다 한 줄',
    maxSize: 2,
    itemType: ControllerSeoPageTranslationDto,
  })
  translations!: ControllerSeoPageTranslationDto[];
}
