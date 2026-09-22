import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

export const INQUIRY_STATUSES = [
  'new',
  'in_progress',
  'answered',
  'closed',
  'spam',
] as const;

/** 홈페이지 문의. 공개 API 가 넣고 관리 화면이 상태를 바꾼다. */
@Entity({ name: 'inquiries' })
export class InquiryEntity {
  @PrimaryGeneratedColumn()
  id: number;

  /** 문의 모달의 선택지 글자 그대로 */
  @Column({ type: 'varchar', length: 255, default: '기타' })
  type: string;

  @Column({ type: 'varchar', length: 255, default: 'new' })
  status: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  company: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  phone: string | null;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'boolean', default: false })
  consent: boolean;

  @Column({ name: 'source_path', type: 'varchar', length: 255, nullable: true })
  sourcePath: string | null;

  /** 담당자 (admin_users.email) — db/migrations/0001 */
  @Column({
    name: 'assignee_email',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  assigneeEmail: string | null;

  /** 내부 메모. 문의한 사람에게는 안 보인다. */
  @Column({ type: 'text', nullable: true })
  note: string | null;

  @Column({ name: 'created_on', type: 'timestamptz', default: () => 'now()' })
  createdOn: Date;

  @Column({ name: 'updated_on', type: 'timestamptz', default: () => 'now()' })
  updatedOn: Date;
}
