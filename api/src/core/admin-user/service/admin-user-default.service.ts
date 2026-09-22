import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  AdminRole,
  AdminUserEntity,
} from '../../../common/entity/admin-user.entity';
import { CommonError } from '../../../common/error/common-error';
import { RevisionService } from '../../../common/revision/revision.service';
import type { SessionPayload } from '../../../common/session/session-token';
import { AdminUserError } from '../error/admin-user.error';
import { wouldLockOut } from './last-admin';

export interface AdminUserView {
  email: string;
  name: string | null;
  role: string;
  enabled: boolean;
  last_login_on: Date | null;
}

/**
 * 권한 화면의 뒤. 사람은 IAM 이 정한다 — IAM 관리자(PLATFORM_ADMIN)가 로그인하면 행이
 * 생기거나 다시 켜지고, 관리자에서 빠지면 다음 로그인·재검에서 꺼진다. 여기서는 각자의
 * 「고칠 수 있는 범위」(role)만 바꾼다. 추가·삭제·사용 여부는 API 에 없다.
 * 모든 변경은 admin_revisions(collection admin_users)에 남는다.
 */
@Injectable()
export class AdminUserDefaultService {
  constructor(
    @InjectRepository(AdminUserEntity)
    private readonly users: Repository<AdminUserEntity>,
    private readonly revisionService: RevisionService,
  ) {}

  async list(): Promise<AdminUserView[]> {
    const rows = await this.users.find({
      order: { enabled: 'DESC', email: 'ASC' },
    });
    return rows.map((u) => this.view(u));
  }

  async setRole(
    email: string,
    role: string,
    who: SessionPayload,
  ): Promise<AdminUserView> {
    const key = email.trim().toLowerCase();
    const row = await this.users.findOne({ where: { email: key } });
    if (!row) throw new CommonError(AdminUserError.NOT_FOUND);
    const next = role as AdminRole;
    const before = this.view(row);
    // 켜져 있는 마지막 「전부」를 내리면 아무도 범위를 못 고친다.
    if (row.enabled && row.role === 'admin' && next !== 'admin') {
      const admins = await this.users.count({
        where: { enabled: true, role: 'admin' },
      });
      if (wouldLockOut(row, next, admins))
        throw new CommonError(AdminUserError.LAST_ADMIN);
    }
    if (row.role === next) return before;
    row.role = next;
    row.updatedOn = new Date();
    const after = this.view(await this.users.save(row));
    await this.revisionService.record({
      actor: who.email,
      action: 'update',
      collection: 'admin_users',
      itemId: key,
      before,
      after,
    });
    return after;
  }

  private view(u: AdminUserEntity): AdminUserView {
    return {
      email: u.email,
      name: u.name,
      role: u.role,
      enabled: u.enabled,
      last_login_on: u.lastLoginOn ?? null,
    };
  }
}
