import { Column, Entity, PrimaryColumn } from 'typeorm';

export const ADMIN_ROLES = ['admin', 'marketing', 'hr'] as const;
export type AdminRole = (typeof ADMIN_ROLES)[number];

/**
 * IAM 관리자 판정의 거울(db/migrations/0001 · 0002). 입장은 IAM(PLATFORM_ADMIN)이 정하고,
 * 여기의 role 은 CMS 안에서 고칠 수 있는 범위다 — admin 전부 · marketing 채용 빼고 · hr 채용만.
 */
@Entity({ name: 'admin_users' })
export class AdminUserEntity {
  @PrimaryColumn({ type: 'varchar', length: 255 })
  email: string;

  @Column({ type: 'varchar', length: 32, default: 'marketing' })
  role: AdminRole;

  @Column({ type: 'varchar', length: 100, nullable: true })
  name: string | null;

  @Column({ type: 'boolean', default: true })
  enabled: boolean;

  @Column({ name: 'iam_sub', type: 'varchar', length: 64, nullable: true })
  iamSub: string | null;

  @Column({ name: 'last_login_on', type: 'timestamptz', nullable: true })
  lastLoginOn: Date | null;

  @Column({ name: 'created_on', type: 'timestamptz', default: () => 'now()' })
  createdOn: Date;

  @Column({ name: 'updated_on', type: 'timestamptz', default: () => 'now()' })
  updatedOn: Date;
}
