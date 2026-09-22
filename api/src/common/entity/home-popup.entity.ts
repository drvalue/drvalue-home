import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { HomePopupTranslationEntity } from './home-popup-translation.entity';

/**
 * 메인에서만 뜨는 알림 창(db/migrations/0005). 살아 있는 것을 sort 차례로 하나씩 띄운다(겹쳐 띄우지 않는다).
 * 「N일 동안 보지 않기」는 브라우저(localStorage)에 id 로 적는다 — 그래서 저장해도 id 가 안 바뀐다.
 */
@Entity({ name: 'home_popups' })
export class HomePopupEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', default: 0 })
  sort: number;

  @Column({ type: 'boolean', default: true })
  visible: boolean;

  @Column({ type: 'uuid', nullable: true })
  image: string | null;

  @Column({ name: 'link_href', type: 'varchar', length: 500, nullable: true })
  linkHref: string | null;

  @Column({ name: 'starts_at', type: 'timestamptz', nullable: true })
  startsAt: Date | null;

  @Column({ name: 'ends_at', type: 'timestamptz', nullable: true })
  endsAt: Date | null;

  /** 창 폭(px). 좁은 화면에서는 화면 폭에 맞춘다. */
  @Column({ type: 'int', default: 480 })
  width: number;

  /** 「N일 동안 보지 않기」의 N. 0 이면 그 버튼이 없다(닫기만). */
  @Column({ name: 'dismiss_days', type: 'int', default: 1 })
  dismissDays: number;

  @Column({ name: 'created_on', type: 'timestamptz', default: () => 'now()' })
  createdOn: Date;

  @Column({ name: 'updated_on', type: 'timestamptz', default: () => 'now()' })
  updatedOn: Date;

  @Column({ name: 'updated_by', type: 'varchar', length: 255, nullable: true })
  updatedBy: string | null;

  @OneToMany(() => HomePopupTranslationEntity, (t) => t.popup)
  translations: HomePopupTranslationEntity[];
}
