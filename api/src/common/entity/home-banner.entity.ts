import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { HomeBannerTranslationEntity } from './home-banner-translation.entity';

/**
 * 메인 머리 그림의 기간 배너(db/migrations/0005). 슬라이드가 아니다 — 살아 있는 것 중 sort 가 앞선
 * 하나가 머리 그림 사진과(있으면) 제목·설명·첫째 버튼을 대신한다. 살아 있음 = visible 이고 기간 안.
 */
@Entity({ name: 'home_banners' })
export class HomeBannerEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', default: 0 })
  sort: number;

  @Column({ type: 'boolean', default: true })
  visible: boolean;

  /** directus_files.id. 배너는 그림이 있어야 한다(서비스가 막는다). 파일을 지우면 FK 가 비운다. */
  @Column({ type: 'uuid', nullable: true })
  image: string | null;

  @Column({ name: 'link_href', type: 'varchar', length: 500, nullable: true })
  linkHref: string | null;

  @Column({ name: 'starts_at', type: 'timestamptz', nullable: true })
  startsAt: Date | null;

  @Column({ name: 'ends_at', type: 'timestamptz', nullable: true })
  endsAt: Date | null;

  @Column({ name: 'created_on', type: 'timestamptz', default: () => 'now()' })
  createdOn: Date;

  @Column({ name: 'updated_on', type: 'timestamptz', default: () => 'now()' })
  updatedOn: Date;

  @Column({ name: 'updated_by', type: 'varchar', length: 255, nullable: true })
  updatedBy: string | null;

  @OneToMany(() => HomeBannerTranslationEntity, (t) => t.banner)
  translations: HomeBannerTranslationEntity[];
}
