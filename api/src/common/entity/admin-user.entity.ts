import { Column, Entity, PrimaryColumn } from 'typeorm';

export const ADMIN_ROLES = ['admin', 'marketing', 'hr'] as const;
export type AdminRole = (typeof ADMIN_ROLES)[number];

/**
 * 관리 화면에 들어올 수 있는 사람. IAM 은 「누구냐」만 답한다 — 「홈페이지 관리자냐」는
 * 이 표가 답한다. 로그인은 IAM, 입장과 역할은 여기.
 *
 * 비어 있으면(첫 설치) 옛 규칙(PLATFORM_ADMIN · nxcms root · IAM 그룹)으로 들어온
 * 사람이 admin 으로 자동 등록된다. 한 명이라도 있으면 그 뒤로는 이 표만 본다.
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

  @Column({ name: 'created_on', type: 'timestamptz', default: () => 'now()' })
  createdOn: Date;

  @Column({ name: 'updated_on', type: 'timestamptz', default: () => 'now()' })
  updatedOn: Date;
}
