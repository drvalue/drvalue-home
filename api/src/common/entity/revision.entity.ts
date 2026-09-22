import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

/** 누가 · 언제 · 어느 표의 어느 행을 · 이전 값 → 지금 값. db/migrations/0001. */
@Entity({ name: 'admin_revisions' })
export class RevisionEntity {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ type: 'varchar', length: 255 })
  actor: string;

  @Column({ type: 'varchar', length: 16 })
  action: string;

  @Column({ type: 'varchar', length: 64 })
  collection: string;

  @Column({ name: 'item_id', type: 'varchar', length: 64 })
  itemId: string;

  @Column({ type: 'jsonb', nullable: true })
  before: unknown;

  @Column({ type: 'jsonb', nullable: true })
  after: unknown;

  @Column({ name: 'created_on', type: 'timestamptz', default: () => 'now()' })
  createdOn: Date;
}
