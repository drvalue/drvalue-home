import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  AdminRole,
  AdminUserEntity,
} from '../../../common/entity/admin-user.entity';

/**
 * admin_users — IAM 관리자 판정의 거울. 로그인 때마다 IAM 이 준 판정을 받아 적는다.
 *
 *   IAM 관리자(PLATFORM_ADMIN) 로그인 → 행을 만들거나 갱신(enabled=true, 이름, IAM id, 시각).
 *                                         처음이면 범위 role='admin'. 이미 있으면 범위는 그대로.
 *   IAM 관리자가 아닌 로그인           → 행이 있으면 enabled=false. 입장은 거부(호출자가).
 *
 * 입장은 IAM 이 정하고, 여기의 role 은 CMS 안에서 고칠 수 있는 범위만 정한다.
 * 가드는 60초마다 이 행을 다시 본다 — 범위를 바꾸면 곧 따라오고, 꺼진 행은 막힌다.
 */
@Injectable()
export class AdminUserService {
  private readonly log = new Logger(AdminUserService.name);

  constructor(
    @InjectRepository(AdminUserEntity)
    private readonly users: Repository<AdminUserEntity>,
  ) {}

  async find(email: string): Promise<AdminUserEntity | null> {
    return this.users.findOne({ where: { email: email.toLowerCase() } });
  }

  /** IAM 관리자로 들어왔다. 행을 만들거나 갱신한다. 범위(role)는 처음에만 admin. */
  async syncAdmin(
    email: string,
    name: string | undefined,
    sub: string,
  ): Promise<AdminUserEntity> {
    const e = email.toLowerCase();
    const row =
      (await this.find(e)) ??
      this.users.create({ email: e, role: 'admin', enabled: true, name: null });
    row.enabled = true;
    if (name) row.name = name;
    row.iamSub = sub || row.iamSub || null;
    row.lastLoginOn = new Date();
    row.updatedOn = new Date();
    return this.users.save(row);
  }

  /** IAM 이 관리자가 아니라고 했다. 행이 있으면 끈다(다음 가드 재검에서 세션도 막힌다). */
  async markNotAdmin(email: string): Promise<void> {
    const row = await this.find(email);
    if (!row || !row.enabled) return;
    row.enabled = false;
    row.updatedOn = new Date();
    await this.users.save(row);
    this.log.warn(`IAM 관리자 해제 반영: ${email}`);
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
