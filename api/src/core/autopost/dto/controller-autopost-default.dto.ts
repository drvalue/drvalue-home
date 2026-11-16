import {
  IsArray,
  IsInt,
  IsObject,
  IsString,
} from '../../../common/dto/validator-with-swagger.decorator';

/** 묶음의 그림 한 장. JPEG 만 받는다 — 서명·치수·크기는 서비스가 다시 본다. */
export class ControllerAutopostDefaultPictureDto {
  @IsInt({
    propertyName: '그림 자리',
    description: '단락 번호(0 부터). 표지는 null',
    example: 0,
    optional: true,
    nullable: true,
    min: 0,
    max: 9,
  })
  section?: number | null;

  @IsString({
    propertyName: '그림',
    description: 'JPEG 바이트(base64). 원본 2MB 까지',
    example: '/9j/4AAQSkZJRg==',
    // 2MB 를 base64 로 적으면 2,796,204자다. 넘는 그림은 서비스가 어차피 뺀다 — 여기서 먼저 막는다.
    max: 2_800_000,
    pattern: /^[A-Za-z0-9+/]+={0,2}$/,
  })
  data!: string;
}

/** 다른 기계에서 검사·판정·그림까지 끝낸 글 묶음(`--bundle` 이 만든 파일의 글과 그림). */
export class ControllerAutopostDefaultBundleDto {
  @IsObject({
    propertyName: '글',
    description:
      '글(구조는 GET /api/autopost/rules 끝의 JSON Schema). 안쪽은 구조 검사가 본다 — 형이 틀리면 거절 사유로 돌아간다',
    example: { title: '…' },
  })
  article!: Record<string, unknown>;

  @IsArray({
    propertyName: '그림',
    description: '표지 한 장과 단락 그림. 없어도 된다(글만 나간다)',
    optional: true,
    maxSize: 5,
    itemType: ControllerAutopostDefaultPictureDto,
  })
  pictures?: ControllerAutopostDefaultPictureDto[];
}
