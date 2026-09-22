import {
  IsInt,
  IsString,
} from '../../../common/dto/validator-with-swagger.decorator';

/** 전체 변경 이력 쿼리(전체 권한만). */
export class ControllerAdminRevisionDefaultListQueryDto {
  @IsString({
    propertyName: '종류',
    description:
      'posts · inquiries · files · admin_users · pages · menu · page_meta · home_banners · home_popups',
    example: 'posts',
    optional: true,
    max: 40,
  })
  collection?: string;

  @IsString({
    propertyName: '바꾼 사람',
    description: '바꾼 사람 이메일(그대로 같은 것만)',
    optional: true,
    max: 255,
  })
  actor?: string;

  @IsInt({
    propertyName: '쪽',
    description: '1 부터',
    optional: true,
    min: 1,
    query: true,
  })
  page?: number;
}
