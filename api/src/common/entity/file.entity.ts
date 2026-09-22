import { Column, Entity, PrimaryColumn } from 'typeorm';

/**
 * 업로드 파일. 테이블은 Directus 가 만든 directus_files 를 그대로 쓴다(이름 바꾸는
 * 것은 별도 마이그레이션). 실제 파일은 UPLOADS_DIR/<filename_disk>.
 */
@Entity({ name: 'directus_files' })
export class FileEntity {
  @PrimaryColumn({ type: 'uuid' })
  id: string;

  @Column({ type: 'varchar', length: 255, default: 'local' })
  storage: string;

  /** 디스크 이름 `<uuid>.<ext>` */
  @Column({
    name: 'filename_disk',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  filenameDisk: string | null;

  /** 내려받을 때 이름 (원본 이름) */
  @Column({ name: 'filename_download', type: 'varchar', length: 255 })
  filenameDownload: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  title: string | null;

  /** MIME */
  @Column({ type: 'varchar', length: 255, nullable: true })
  type: string | null;

  @Column({ type: 'bigint', nullable: true })
  filesize: string | null;

  @Column({ type: 'integer', nullable: true })
  width: number | null;

  @Column({ type: 'integer', nullable: true })
  height: number | null;

  @Column({ name: 'created_on', type: 'timestamptz', default: () => 'now()' })
  createdOn: Date;

  @Column({ name: 'modified_on', type: 'timestamptz', default: () => 'now()' })
  modifiedOn: Date;
}
