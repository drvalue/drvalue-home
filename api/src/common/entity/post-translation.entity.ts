import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { PostEntity } from './post.entity';

export const LANGUAGES = ['ko-KR', 'en-US'] as const;

/** 글의 언어별 본문. 한 글에 언어 수만큼 행이 붙는다. */
@Entity({ name: 'posts_translations' })
export class PostTranslationEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => PostEntity, (p) => p.translations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'posts' })
  post: PostEntity;

  @Column({ name: 'languages_code', type: 'varchar', length: 255 })
  languagesCode: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  title: string | null;

  @Column({ type: 'text', nullable: true })
  summary: string | null;

  /** HTML */
  @Column({ type: 'text', nullable: true })
  body: string | null;

  /** 수행실적의 「구분」(원문 그대로) */
  @Column({
    name: 'case_category_label',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  caseCategoryLabel: string | null;

  @Column({ name: 'seo_title', type: 'varchar', length: 255, nullable: true })
  seoTitle: string | null;

  @Column({ name: 'seo_description', type: 'text', nullable: true })
  seoDescription: string | null;
}
