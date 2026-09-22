import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  AdminRole,
  AdminUserEntity,
} from '../../../common/entity/admin-user.entity';

/**
 * admin_users 표. 로그인 판정과 세션 재검(60초)이 같이 쓴다.
 *
 * 판정 규칙 — 표에 한 명이라도 있으면:
 *   등록 + enabled → 그 역할로 입장. 아니면 거부. IAM 그룹·nxcms 는 안 본다.
 * 표가 비어 있으면(첫 설치):
 *   호출자가 옛 규칙(PLATFORM_ADMIN · nxcms root · IAM 그룹)으로 통과한 사람을
 *   admin 으로 넣는다 — 그 다음부터는 표가 원본이다.
 */
@Injectable()
export class AdminUserService {
  private readonly log = new Logger(AdminUserService.name);

  constructor(
    @InjectRepository(AdminUserEntity)
    private readonly users: Repository<AdminUserEntity>,
  ) {}

  async count(): Promise<number> {
    return this.users.count();
  }

  async find(email: string): Promise<AdminUserEntity | null> {
    return this.users.findOne({ where: { email: email.toLowerCase() } });
  }

  /** 첫 관리자. 표가 비어 있을 때만 넣는다 — 경쟁하면 두 번째는 그냥 있는 행을 돌려준다. */
  async bootstrap(email: string, name?: string): Promise<AdminUserEntity> {
    const have = await this.find(email);
    if (have) return have;
    if ((await this.count()) > 0) {
      // 그 사이 누가 등록됐다. 첫 관리자가 아니므로 옛 규칙 통과로는 못 들어온다.
      throw new Error('admin_users is no longer empty');
    }
    const row = this.users.create({
      email: email.toLowerCase(),
      role: 'admin',
      name: name ?? null,
      enabled: true,
    });
    await this.users.save(row);
    this.log.warn(`첫 관리자 등록: ${email} (admin_users 가 비어 있었다)`);
    return row;
  }

  async list(): Promise<AdminUserEntity[]> {
    return this.users.find({ order: { createdOn: 'ASC' } });
  }

  async upsert(
    email: string,
    patch: { role?: AdminRole; name?: string | null; enabled?: boolean },
  ): Promise<AdminUserEntity> {
    const e = email.toLowerCase();
    const row =
      (await this.find(e)) ??
      this.users.create({
        email: e,
        role: 'marketing',
        enabled: true,
        name: null,
      });
    Object.assign(row, patch, { updatedOn: new Date() });
    return this.users.save(row);
  }

  async remove(email: string): Promise<void> {
    await this.users.delete({ email: email.toLowerCase() });
  }
}
