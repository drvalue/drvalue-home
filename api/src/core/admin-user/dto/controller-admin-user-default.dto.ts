import { IsIn } from '../../../common/dto/validator-with-swagger.decorator';
import { ADMIN_ROLES } from '../../../common/entity/admin-user.entity';

/** 고칠 수 있는 범위만. 사람 추가·삭제·사용 여부는 IAM 로그인 동기화가 한다. */
export class ControllerAdminUserDefaultUpdateDto {
  @IsIn({
    propertyName: '권한 범위',
    description: 'admin(전체 권한) · marketing(채용 빼고) · hr(채용만)',
    values: ADMIN_ROLES,
    message: '권한 범위는 전체 권한·마케팅·인사 중에서 골라 주세요.',
  })
  role!: string;
}
