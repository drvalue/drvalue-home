import {
  IsIn,
  IsInt,
  IsString,
} from '../../../common/dto/validator-with-swagger.decorator';

/** 미디어 목록 쿼리. 화면(미디어 탭)이 아는 값만 보낸다. */
export class ControllerAdminFileDefaultListQueryDto {
  @IsString({
    propertyName: '검색어',
    description: '이름 · 원본 파일 이름',
    optional: true,
    max: 200,
  })
  q?: string;

  @IsIn({
    propertyName: '형식',
    description: '그림 · PDF · 영상',
    values: ['image', 'pdf', 'video'],
    optional: true,
  })
  type?: string;

  @IsInt({
    propertyName: '쪽',
    description: '1 부터',
    optional: true,
    min: 1,
    query: true,
  })
  page?: number;
}

/** 올리기(multipart). 파일 칸 이름은 `file`. */
export class ControllerAdminFileDefaultUploadDto {
  @IsString({
    propertyName: '이름',
    description: '보이는 이름. 없으면 원본 파일 이름(확장자 뺀 것)',
    optional: true,
    max: 255,
  })
  title?: string;
}

/** 파일 이름 고치기. 디스크 이름(uuid)은 그대로 — 이미 박힌 주소가 안 깨진다. */
export class ControllerAdminFileDefaultUpdateDto {
  @IsString({
    propertyName: '이름',
    description: '보이는 이름',
    example: '공장 전경',
    max: 255,
  })
  title!: string;
}

/** 지우기. `force=1` 이면 쓰는 곳에서 빼고 지운다(아니면 쓰는 중일 때 409). */
export class ControllerAdminFileDefaultRemoveQueryDto {
  @IsIn({
    propertyName: '강제',
    description:
      "'1'·'true' 면 쓰는 곳(그림 칸·첨부·본문 그림)에서 빼고 지운다",
    values: ['1', 'true', '0', 'false'],
    optional: true,
  })
  force?: string;
}
