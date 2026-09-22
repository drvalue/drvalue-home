import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * 코드로 쓴 정적 장의 검색 정보 덮어쓰기(migrations/0007). 행이 없으면 코드의 값이 그대로 나간다.
 * 주소는 쿼리 없는 경로 하나 — '/' 가 홈.
 */
@Entity({ name: 'page_meta' })
export class PageMetaEntity {
  @PrimaryColumn({ type: 'varchar', length: 64 })
  path: string;

  @Column({ name: 'og_image', type: 'uuid', nullable: true })
  ogImage: string | null;

  @Column({ name: 'no_index', type: 'boolean', default: false })
  noIndex: boolean;

  @UpdateDateColumn({ name: 'updated_on', type: 'timestamptz' })
  updatedOn: Date;

  @Column({ name: 'updated_by', type: 'varchar', length: 255, nullable: true })
  updatedBy: string | null;

  @OneToMany(() => PageMetaTranslationEntity, (t) => t.page, { cascade: true })
  translations: PageMetaTranslationEntity[];
}

/** 언어별 검색 제목·설명. 비운 칸은 코드의 값. */
@Entity({ name: 'page_meta_translations' })
export class PageMetaTranslationEntity {
  @PrimaryColumn({ type: 'varchar', length: 64 })
  path: string;

  @PrimaryColumn({ name: 'languages_code', type: 'varchar', length: 255 })
  languagesCode: string;

  @ManyToOne(() => PageMetaEntity, (p) => p.translations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'path' })
  page: PageMetaEntity;

  @Column({ type: 'varchar', length: 255, nullable: true })
  title: string | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;
}
