import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { HomePopupEntity } from './home-popup.entity';

/** 팝업의 언어별 글자. body 는 편집기 HTML — 저장할 때 허용 태그만 남긴다(page 의 richtext 와 같은 규칙). */
@Entity({ name: 'home_popup_translations' })
export class HomePopupTranslationEntity {
  @PrimaryColumn({ name: 'popup_id', type: 'int' })
  popupId: number;

  @PrimaryColumn({ name: 'languages_code', type: 'varchar', length: 255 })
  languagesCode: string;

  @ManyToOne(() => HomePopupEntity, (p) => p.translations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'popup_id' })
  popup: HomePopupEntity;

  @Column({ type: 'varchar', length: 120, nullable: true })
  title: string | null;

  @Column({ type: 'text', nullable: true })
  body: string | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  alt: string | null;

  @Column({ name: 'link_label', type: 'varchar', length: 40, nullable: true })
  linkLabel: string | null;
}
