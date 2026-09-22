import { SetMetadata } from '@nestjs/common';
import type { AdminRole } from '../../../common/entity/admin-user.entity';

export const ADMIN_ROLES_KEY = 'admin:roles';

/**
 * 이 핸들러(또는 컨트롤러)를 쓸 수 있는 역할. admin 은 항상 통과한다.
 * 없으면 세션만 있으면 된다(전 역할). AdminSessionGuard 가 읽는다.
 */
export const AdminRoles = (...roles: AdminRole[]) =>
  SetMetadata(ADMIN_ROLES_KEY, roles);
