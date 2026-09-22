import { Column, Entity, PrimaryColumn } from 'typeorm';

/**
 * 페이지 글(db/migrations/0004, 표 page_contents). 회사소개·오시는 길처럼 게시판이 아닌 장의 글을 칸 구조 그대로 담는다.
 * 칸 구조(스키마)는 api 의 core/page/schema 가 정하고, 저장할 때 그 스키마로 검사한다.
 * 한 장 · 한 언어가 한 행이다. 저장한 것이 곧 공개다(초안 없음).
 */
@Entity({ name: 'page_contents' })
export class PageEntity {
  @PrimaryColumn({ type: 'varchar', length: 64 })
  key: string;

  @PrimaryColumn({ name: 'languages_code', type: 'varchar', length: 255 })
  languagesCode: string;

  @Column({ type: 'jsonb' })
  content: Record<string, unknown>;

  @Column({ name: 'updated_on', type: 'timestamptz', default: () => 'now()' })
  updatedOn: Date;

  @Column({ name: 'updated_by', type: 'varchar', length: 255, nullable: true })
  updatedBy: string | null;
}
