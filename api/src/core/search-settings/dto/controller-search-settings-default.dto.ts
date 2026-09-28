import {
  IsBoolean,
  IsString,
} from '../../../common/dto/validator-with-swagger.decorator';

/**
 * 소유 확인 코드 한 칸. 검색엔진이 주는 meta 태그의 content 값이다(영문·숫자와 _ - = : . 만, 120자까지).
 * 빈 글자도 받는다 — 비우면 web 이 실행 환경값을 쓴다. 따옴표·꺾쇠를 막아 머리 정보에 다른 것이 끼지 않게.
 */
export const VERIFICATION_CODE_RE = /^(?:[A-Za-z0-9_=:.-]{1,120})?$/;

export class ControllerSearchSettingsDefaultSaveDto {
  @IsString({
    propertyName: '네이버 확인 코드',
    description:
      '네이버 서치어드바이저 HTML 태그의 content 값. 비우면 실행 환경값',
    example: '0123456789abcdef0123456789abcdef01234567',
    optional: true,
    nullable: true,
    max: 120,
    pattern: VERIFICATION_CODE_RE,
    patternMessage:
      '네이버 확인 코드는 영문·숫자와 _ - = : . 만 쓸 수 있습니다. content 값만 붙여 넣어 주세요.',
  })
  naver_site_verification?: string | null;

  @IsString({
    propertyName: '구글 확인 코드',
    description: '구글 서치 콘솔 HTML 태그의 content 값. 비우면 실행 환경값',
    example: 'AbCdEf-0123456789_AbCdEf0123456789AbCdEf012',
    optional: true,
    nullable: true,
    max: 120,
    pattern: VERIFICATION_CODE_RE,
    patternMessage:
      '구글 확인 코드는 영문·숫자와 _ - = : . 만 쓸 수 있습니다. content 값만 붙여 넣어 주세요.',
  })
  google_site_verification?: string | null;

  @IsString({
    propertyName: '빙 확인 코드',
    description: '빙 웹마스터 HTML 태그(msvalidate.01)의 content 값. 비우면 실행 환경값',
    example: '0123456789ABCDEF0123456789ABCDEF',
    optional: true,
    nullable: true,
    max: 120,
    pattern: VERIFICATION_CODE_RE,
    patternMessage:
      '빙 확인 코드는 영문·숫자와 _ - = : . 만 쓸 수 있습니다. content 값만 붙여 넣어 주세요.',
  })
  bing_site_verification?: string | null;

  @IsBoolean({
    propertyName: 'AI 검색 답변 허용',
    description:
      'false 면 robots.txt 가 AI 답변 봇(ChatGPT·Claude·Perplexity 검색)을 막는다. 검색엔진(네이버·빙 등)은 그대로',
    example: true,
  })
  ai_search_allowed!: boolean;

  @IsBoolean({
    propertyName: 'AI 학습 수집 허용',
    description:
      'false 면 robots.txt 가 학습용 수집 봇(GPTBot·ClaudeBot·Google-Extended 등)을 막는다',
    example: true,
  })
  ai_training_allowed!: boolean;
}
