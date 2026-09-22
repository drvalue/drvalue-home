import { IsString } from '../../../common/dto/validator-with-swagger.decorator';

/**
 * 공개 게시판 목록의 쿼리. **일부러 느슨하다** — 틀린 값은 400 이 아니라 무시하거나 한도로 자른다
 * (`page=abc` → 1쪽, `limit=999` → 100, 날짜 모양이 아니면 조건에서 뺀다). 옛 게시판 JS·검색 폼이
 * 손으로 만든 주소를 보내 왔고, 공개 화면이 400 으로 비면 안 된다. 자르는 규칙은 서비스에 있다.
 */
export class ControllerContentDefaultPostsQueryDto {
  @IsString({
    propertyName: '게시판',
    description:
      '게시판 키(notice·press·news·recruit·faq·patent·copyright·case·history). 모르는 값이면 빈 목록',
    example: 'notice',
    optional: true,
    max: 40,
  })
  board?: string;

  @IsString({
    propertyName: '쪽',
    description: '1 부터. 숫자가 아니면 1',
    example: '1',
    optional: true,
    max: 10,
  })
  page?: string;

  @IsString({
    propertyName: '검색어',
    description: '제목·요약·본문(언어 무관). 200자에서 자른다',
    optional: true,
    max: 1000,
  })
  q?: string;

  @IsString({
    propertyName: '시작일',
    description: 'YYYY-MM-DD(표시 날짜 기준). 모양이 아니면 무시',
    example: '2026-01-01',
    optional: true,
    max: 20,
  })
  startDate?: string;

  @IsString({
    propertyName: '종료일',
    description: 'YYYY-MM-DD(표시 날짜 기준). 모양이 아니면 무시',
    example: '2026-12-31',
    optional: true,
    max: 20,
  })
  endDate?: string;

  @IsString({
    propertyName: '언어',
    description: 'ko-KR · en-US. 없거나 모르면 ko-KR',
    example: 'ko-KR',
    optional: true,
    max: 10,
  })
  lang?: string;

  @IsString({
    propertyName: '쪽 크기',
    description: '1..100. 없으면 10(게시판 쪽 번호가 이 값을 전제한다)',
    example: '10',
    optional: true,
    max: 10,
  })
  limit?: string;
}

export class ControllerContentDefaultPostQueryDto {
  @IsString({
    propertyName: '언어',
    description: 'ko-KR · en-US. 없거나 모르면 ko-KR',
    example: 'ko-KR',
    optional: true,
    max: 10,
  })
  lang?: string;
}
