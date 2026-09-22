import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { FileEntity } from './file.entity';
import { PostEntity } from './post.entity';

/** 글의 첨부 (posts ↔ directus_files). */
@Entity({ name: 'posts_files' })
export class PostFileEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => PostEntity, (p) => p.files, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'posts_id' })
  post: PostEntity;

  @Column({ name: 'directus_files_id', type: 'uuid', nullable: true })
  fileId: string | null;

  @ManyToOne(() => FileEntity, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'directus_files_id' })
  file: FileEntity | null;
}
