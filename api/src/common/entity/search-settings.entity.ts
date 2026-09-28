import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

/**
 * 검색엔진 설정(migrations/0021). 사이트에 하나뿐이라 한 행(id 1)이다 — 마이그레이션이 기본 행을 넣는다.
 * 소유 확인 코드는 비면 null(web 이 실행 환경값을 예비로 쓴다).
 */
@Entity({ name: 'site_search_settings' })
export class SearchSettingsEntity {
  @PrimaryColumn({ type: 'smallint' })
  id: number;

  @Column({
    name: 'naver_site_verification',
    type: 'varchar',
    length: 120,
    nullable: true,
  })
  naverSiteVerification: string | null;

  @Column({
    name: 'google_site_verification',
    type: 'varchar',
    length: 120,
    nullable: true,
  })
  googleSiteVerification: string | null;

  @Column({
    name: 'bing_site_verification',
    type: 'varchar',
    length: 120,
    nullable: true,
  })
  bingSiteVerification: string | null;

  @Column({ name: 'ai_search_allowed', type: 'boolean', default: true })
  aiSearchAllowed: boolean;

  @Column({ name: 'ai_training_allowed', type: 'boolean', default: true })
  aiTrainingAllowed: boolean;

  @UpdateDateColumn({ name: 'updated_on', type: 'timestamptz' })
  updatedOn: Date;

  @Column({ name: 'updated_by', type: 'varchar', length: 255, nullable: true })
  updatedBy: string | null;
}
