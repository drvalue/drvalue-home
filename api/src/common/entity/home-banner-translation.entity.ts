import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { HomeBannerEntity } from './home-banner.entity';

/** 배너의 언어별 글자. 비운 칸은 머리 그림의 기본 글(메인 화면 글)이 나온다. */
@Entity({ name: 'home_banner_translations' })
export class HomeBannerTranslationEntity {
  @PrimaryColumn({ name: 'banner_id', type: 'int' })
  bannerId: number;

  @PrimaryColumn({ name: 'languages_code', type: 'varchar', length: 255 })
  languagesCode: string;

  @ManyToOne(() => HomeBannerEntity, (b) => b.translations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'banner_id' })
  banner: HomeBannerEntity;

  @Column({ type: 'varchar', length: 120, nullable: true })
  title: string | null;

  @Column({ type: 'varchar', length: 300, nullable: true })
  description: string | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  alt: string | null;

  @Column({ name: 'link_label', type: 'varchar', length: 40, nullable: true })
  linkLabel: string | null;
}
