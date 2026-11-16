import { Column, Entity, PrimaryColumn } from 'typeorm';

export type AutopostRunStatus =
  'running' | 'published' | 'drafted' | 'skipped' | 'error';

/**
 * 제조 AI 주간 글의 주 단위 기록(migrations/0023). 한 주에 한 행 — 기본 키가 주 키라 같은 주를 두 번 잡지 못한다.
 * 검사에 떨어진 글은 posts 가 아니라 여기 `article` 에만 남는다.
 */
@Entity({ name: 'autopost_runs' })
export class AutopostRunEntity {
  @PrimaryColumn({ name: 'week_key', type: 'varchar', length: 8 })
  weekKey: string;

  @Column({ type: 'varchar', length: 12 })
  status: AutopostRunStatus;

  @Column({ type: 'smallint', default: 1 })
  attempts: number;

  @Column({ type: 'text', nullable: true })
  reason: string | null;

  @Column({ name: 'post_id', type: 'integer', nullable: true })
  postId: number | null;

  @Column({ type: 'jsonb', nullable: true })
  article: object | null;

  @Column({ name: 'input_tokens', type: 'integer', nullable: true })
  inputTokens: number | null;

  @Column({ name: 'output_tokens', type: 'integer', nullable: true })
  outputTokens: number | null;

  @Column({ name: 'started_on', type: 'timestamptz', default: () => 'now()' })
  startedOn: Date;

  @Column({ name: 'finished_on', type: 'timestamptz', nullable: true })
  finishedOn: Date | null;
}
