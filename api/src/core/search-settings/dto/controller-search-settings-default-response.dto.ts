import { ApiProperty } from '@nestjs/swagger';
import type { SearchSettingsEntity } from '../../../common/entity/search-settings.entity';
import type { IndexNowSubmission } from '../../../common/indexnow/indexnow.service';

/** 설정 행 그대로. 관리 화면과 변경 이력(before/after)이 이 모양을 쓴다. */
export class ControllerSearchSettingsDefaultRowResponseDto {
  @ApiProperty({ nullable: true, type: String })
  naver_site_verification!: string | null;
  @ApiProperty({ nullable: true, type: String })
  google_site_verification!: string | null;
  @ApiProperty({ nullable: true, type: String })
  bing_site_verification!: string | null;
  @ApiProperty() ai_search_allowed!: boolean;
  @ApiProperty() ai_training_allowed!: boolean;
  @ApiProperty({ nullable: true, type: String, format: 'date-time' })
  updated_on!: string | null;
  @ApiProperty({ nullable: true, type: String }) updated_by!: string | null;

  static from(
    r: SearchSettingsEntity,
  ): ControllerSearchSettingsDefaultRowResponseDto {
    return {
      naver_site_verification: r.naverSiteVerification,
      google_site_verification: r.googleSiteVerification,
      bing_site_verification: r.bingSiteVerification,
      ai_search_allowed: r.aiSearchAllowed,
      ai_training_allowed: r.aiTrainingAllowed,
      updated_on: r.updatedOn ? new Date(r.updatedOn).toISOString() : null,
      updated_by: r.updatedBy,
    };
  }
}

/** IndexNow 보내기 한 번. 주소·키는 싣지 않는다. */
export class ControllerSearchSettingsIndexNowEntryResponseDto {
  @ApiProperty({ type: String, format: 'date-time' }) at!: string;
  @ApiProperty() url_count!: number;
  @ApiProperty({ enum: ['ok', 'fail'] }) status!: 'ok' | 'fail';
  @ApiProperty({
    nullable: true,
    type: Number,
    description: '받은 HTTP 상태. 응답이 없었으면(네트워크·시간 초과) null',
  })
  http_status!: number | null;
}

/** IndexNow 상태. 키 값은 절대 싣지 않는다 — 켜졌는지만. */
export class ControllerSearchSettingsIndexNowResponseDto {
  @ApiProperty({
    description: '키가 설정돼 있고 미리보기(NOINDEX)가 아니면 true',
  })
  enabled!: boolean;
  @ApiProperty({
    type: [ControllerSearchSettingsIndexNowEntryResponseDto],
    description: '최근 보내기(새것이 앞, 최대 20). api 를 다시 띄우면 빈다',
  })
  recent!: ControllerSearchSettingsIndexNowEntryResponseDto[];
}

/** 관리 화면 「검색엔진 설정」 — 설정 행 + IndexNow 상태. */
export class ControllerSearchSettingsDefaultResponseDto extends ControllerSearchSettingsDefaultRowResponseDto {
  @ApiProperty({ type: ControllerSearchSettingsIndexNowResponseDto })
  index_now!: ControllerSearchSettingsIndexNowResponseDto;

  static withIndexNow(
    row: ControllerSearchSettingsDefaultRowResponseDto,
    enabled: boolean,
    recent: IndexNowSubmission[],
  ): ControllerSearchSettingsDefaultResponseDto {
    return { ...row, index_now: { enabled, recent } };
  }
}

/**
 * 공개 사이트(web)가 읽는 것 — robots.txt 의 두 스위치와 머리 정보의 확인 코드, IndexNow 가 켜졌는지.
 * 고친 사람·시각과 IndexNow 키·기록은 싣지 않는다.
 */
export class ControllerSearchSettingsPublicResponseDto {
  @ApiProperty({ nullable: true, type: String, description: '비었으면 null' })
  naver_site_verification!: string | null;
  @ApiProperty({ nullable: true, type: String, description: '비었으면 null' })
  google_site_verification!: string | null;
  @ApiProperty({ nullable: true, type: String, description: '비었으면 null' })
  bing_site_verification!: string | null;
  @ApiProperty() ai_search_allowed!: boolean;
  @ApiProperty() ai_training_allowed!: boolean;
  @ApiProperty() index_now_enabled!: boolean;

  static from(
    row: ControllerSearchSettingsDefaultRowResponseDto,
    indexNowEnabled: boolean,
  ): ControllerSearchSettingsPublicResponseDto {
    return {
      naver_site_verification: row.naver_site_verification,
      google_site_verification: row.google_site_verification,
      bing_site_verification: row.bing_site_verification,
      ai_search_allowed: row.ai_search_allowed,
      ai_training_allowed: row.ai_training_allowed,
      index_now_enabled: indexNowEnabled,
    };
  }
}
