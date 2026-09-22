import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { PostFileEntity } from './post-file.entity';
import { PostTranslationEntity } from './post-translation.entity';

/** 게시판 종류. 화면이 있는 것만 관리 메뉴에 둔다. */
export const BOARDS = [
  'notice',
  'press',
  'news',
  'recruit',
  'faq',
  'patent',
  'copyright',
  'case',
  'history',
] as const;
export type Board = (typeof BOARDS)[number];

/**
 * 게시판 글. 테이블은 Directus 가 만든 posts 를 그대로 쓴다 — 이관 없음.
 * 글로 된 값(제목·요약·본문)은 posts_translations 에 언어별로 있다.
 */
@Entity({ name: 'posts' })
export class PostEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  board: string;

  /** published | draft */
  @Column({ type: 'varchar', length: 255, default: 'draft' })
  status: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  slug: string;

  /** 사람이 보는 날짜. 목록 정렬 기준. */
  @Column({ name: 'published_date', type: 'date' })
  publishedDate: string;

  @Column({ name: 'publish_at', type: 'timestamptz', nullable: true })
  publishAt: Date | null;

  @Column({ name: 'unpublish_at', type: 'timestamptz', nullable: true })
  unpublishAt: Date | null;

  /** 대표 이미지·증서 그림 (directus_files.id) */
  @Column({ type: 'uuid', nullable: true })
  thumbnail: string | null;

  @Column({ name: 'is_pinned', type: 'boolean', default: false })
  isPinned: boolean;

  @Column({ name: 'is_featured', type: 'boolean', default: false })
  isFeatured: boolean;

  @Column({ type: 'integer', nullable: true })
  sort: number | null;

  @Column({ name: 'og_image', type: 'uuid', nullable: true })
  ogImage: string | null;

  @Column({ name: 'no_index', type: 'boolean', default: false })
  noIndex: boolean;

  @Column({ name: 'en_ready', type: 'boolean', default: false })
  enReady: boolean;

  // 보도자료
  @Column({ name: 'press_media', type: 'varchar', length: 255, nullable: true })
  pressMedia: string | null;

  // 수행실적
  @Column({ name: 'period_start', type: 'date', nullable: true })
  periodStart: string | null;

  @Column({ name: 'period_end', type: 'date', nullable: true })
  periodEnd: string | null;

  // 특허·저작권 — registered | applied
  @Column({ name: 'cert_state', type: 'varchar', length: 255, nullable: true })
  certState: string | null;

  @Column({ name: 'cert_no', type: 'varchar', length: 255, nullable: true })
  certNo: string | null;

  @Column({ name: 'cert_date', type: 'date', nullable: true })
  certDate: string | null;

  @Column({ name: 'cert_made_date', type: 'date', nullable: true })
  certMadeDate: string | null;

  @Column({ name: 'cert_kind', type: 'varchar', length: 255, nullable: true })
  certKind: string | null;

  // 연혁
  @Column({
    name: 'history_year',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  historyYear: string | null;

  // 채용 — db/migrations/0001
  @Column({
    name: 'employment_type',
    type: 'varchar',
    length: 32,
    nullable: true,
  })
  employmentType: string | null;

  @Column({ name: 'is_open_ended', type: 'boolean', default: false })
  isOpenEnded: boolean;

  /** 채용·지원사업 마감일 */
  @Column({ type: 'date', nullable: true })
  deadline: string | null;

  @OneToMany(() => PostTranslationEntity, (t) => t.post, { cascade: true })
  translations: PostTranslationEntity[];

  @OneToMany(() => PostFileEntity, (f) => f.post, { cascade: true })
  files: PostFileEntity[];
}
