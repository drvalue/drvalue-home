import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { MenuItemEntity } from './menu-item.entity';

/** 메뉴 칸의 언어별 이름과 한 줄 설명(큰 메뉴판·옆 차례표의 부연). posts_translations 와 같은 모양. */
@Entity({ name: 'site_menu_item_translations' })
export class MenuItemTranslationEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => MenuItemEntity, (m) => m.translations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'menu_item_id' })
  item: MenuItemEntity;

  @Column({ name: 'languages_code', type: 'varchar', length: 255 })
  languagesCode: string;

  @Column({ type: 'varchar', length: 40 })
  label: string;

  @Column({ type: 'varchar', length: 80, nullable: true })
  description: string | null;
}
