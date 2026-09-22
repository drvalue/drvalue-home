import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { MenuItemTranslationEntity } from './menu-item-translation.entity';

export const MENU_LOCATIONS = ['top', 'footer'] as const;
export type MenuLocation = (typeof MENU_LOCATIONS)[number];

/**
 * 사이트 메뉴 한 칸(db/migrations/0006). 상단은 대분류(parent_id NULL) + 하위 한 단,
 * 하단(footer)은 한 줄 링크뿐이다. web/lib/menu.ts 가 같은 모양의 예비다.
 * 표 이름이 site_ 로 시작하는 이유는 마이그레이션 머리말 참고(옛 Directus 표와 겹친다).
 */
@Entity({ name: 'site_menu_items' })
export class MenuItemEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 16 })
  location: MenuLocation;

  @Column({ name: 'parent_id', type: 'int', nullable: true })
  parentId: number | null;

  @ManyToOne(() => MenuItemEntity, (m) => m.children, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'parent_id' })
  parent: MenuItemEntity | null;

  @OneToMany(() => MenuItemEntity, (m) => m.parent)
  children: MenuItemEntity[];

  @Column({ type: 'int', default: 0 })
  sort: number;

  /** 사이트 안 주소(`/page/...`) 또는 http(s) 바깥 주소. */
  @Column({ type: 'varchar', length: 500 })
  href: string;

  /** 끄면 공개 메뉴에서 통째로 빠진다(이름도 안 나간다). */
  @Column({ type: 'boolean', default: true })
  visible: boolean;

  /** 하위만: 드롭다운에는 안 띄우되 현재 위치 줄은 이 이름을 쓴다(menu.ts 의 hidden). */
  @Column({ name: 'hidden_in_dropdown', type: 'boolean', default: false })
  hiddenInDropdown: boolean;

  /** 대분류만: 이 주소 앞부분으로 시작하면 「지금 여기」다(menu.ts 의 match). 비면 href. */
  @Column({ type: 'jsonb', nullable: true })
  match: string[] | null;

  @OneToMany(() => MenuItemTranslationEntity, (t) => t.item, { cascade: true })
  translations: MenuItemTranslationEntity[];

  @Column({ name: 'created_on', type: 'timestamptz', default: () => 'now()' })
  createdOn: Date;

  @Column({ name: 'updated_on', type: 'timestamptz', default: () => 'now()' })
  updatedOn: Date;
}
