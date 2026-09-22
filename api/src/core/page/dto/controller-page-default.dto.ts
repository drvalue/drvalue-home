import { LANGUAGES } from '../../../common/entity/post-translation.entity';
import {
  IsIn,
  IsObject,
} from '../../../common/dto/validator-with-swagger.decorator';

/** 한 언어의 페이지 글 저장. 안쪽 칸은 그 장의 스키마(core/page/schema)로 서비스가 검사한다. */
export class ControllerPageDefaultSaveDto {
  @IsIn({
    propertyName: '언어',
    description: '저장할 언어',
    values: LANGUAGES,
    example: 'ko-KR',
  })
  languages_code!: string;

  @IsObject({
    propertyName: '페이지 내용',
    description: '스키마 모양 그대로의 글(JSON)',
    example: { shell: { kicker: '찾아오시는 길' } },
  })
  content!: Record<string, unknown>;
}

/** 공개 읽기의 언어. 없으면 기본 언어. */
export class ControllerPageDefaultLangQueryDto {
  @IsIn({
    propertyName: '언어',
    description: '읽을 언어(없으면 ko-KR)',
    values: LANGUAGES,
    optional: true,
  })
  lang?: string;
}
