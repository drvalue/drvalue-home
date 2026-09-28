import { Injectable } from '@nestjs/common';
import { ServiceException } from '../../../common/error/service-exception.decorator';
import { IndexNowService } from '../../../common/indexnow/indexnow.service';
import { RevisionService } from '../../../common/revision/revision.service';
import { snapshotToDto } from '../../../common/revision/snapshot-dto';
import type { SessionPayload } from '../../../common/session/session-token';
import type { ITransactionContext } from '../../../common/typeorm/transaction-context';
import { Transactional } from '../../../common/typeorm/transactional.decorator';
import {
  ControllerSearchSettingsDefaultResponseDto,
  ControllerSearchSettingsDefaultRowResponseDto,
  ControllerSearchSettingsPublicResponseDto,
} from '../dto/controller-search-settings-default-response.dto';
import { ControllerSearchSettingsDefaultSaveDto } from '../dto/controller-search-settings-default.dto';
import { SearchSettingsError } from '../error/search-settings.error';
import {
  SEARCH_SETTINGS_ID,
  SearchSettingsDefaultRepository,
} from '../repository/search-settings-default.repository';

type Row = ControllerSearchSettingsDefaultRowResponseDto;
type Admin = ControllerSearchSettingsDefaultResponseDto;

/** 행이 없을 때(누가 지웠다) 내는 값 — 마이그레이션의 기본 행과 같다. 다음 저장이 행을 다시 만든다. */
const DEFAULT_ROW: Row = {
  naver_site_verification: null,
  google_site_verification: null,
  bing_site_verification: null,
  ai_search_allowed: true,
  ai_training_allowed: true,
  updated_on: null,
  updated_by: null,
};

/** 앞뒤 공백을 걷고 빈 글자는 null — 비운 칸은 web 이 실행 환경값을 쓴다. */
const code = (v: string | null | undefined): string | null =>
  v?.trim() || null;

/**
 * 검색엔진 설정(한 행). 소유 확인 코드 셋과 robots.txt 의 AI 스위치 둘.
 * 저장은 IndexNow 로 알리지 않는다 — 장의 내용이 바뀐 것이 아니다.
 */
@Injectable()
export class SearchSettingsDefaultService {
  constructor(
    private readonly searchSettingsDefaultRepository: SearchSettingsDefaultRepository,
    private readonly revisionService: RevisionService,
    private readonly indexNowService: IndexNowService,
  ) {}

  /** 관리 화면용 — 설정 행 + IndexNow 켜짐·최근 보내기. */
  @ServiceException({ errorCode: SearchSettingsError.GET_UNKNOWN })
  async get(ctx: ITransactionContext): Promise<Admin> {
    return this.withIndexNow(await this.row(ctx));
  }

  /** 공개 사이트용 — 확인 코드 · 두 스위치 · IndexNow 켜짐만. */
  @ServiceException({ errorCode: SearchSettingsError.GET_UNKNOWN })
  async publicGet(
    ctx: ITransactionContext,
  ): Promise<ControllerSearchSettingsPublicResponseDto> {
    return ControllerSearchSettingsPublicResponseDto.from(
      await this.row(ctx),
      this.indexNowService.enabled,
    );
  }

  /** 설정을 통째로 바꾼다(행이 없으면 만든다). */
  @ServiceException({ errorCode: SearchSettingsError.SAVE_UNKNOWN })
  @Transactional()
  async save(
    ctx: ITransactionContext,
    dto: ControllerSearchSettingsDefaultSaveDto,
    who: SessionPayload,
  ): Promise<Admin> {
    return this.withIndexNow(await this.write(ctx, dto, who));
  }

  /** 변경 이력의 설정(행 모양)으로 되돌린다. 저장 DTO 로 바꿔 같은 규칙으로 검사한다. */
  @ServiceException({ errorCode: SearchSettingsError.RESTORE_UNKNOWN })
  @Transactional()
  async restoreSnapshot(
    ctx: ITransactionContext,
    snapshot: Record<string, unknown>,
    who: SessionPayload,
  ): Promise<{ data: Admin; warnings: string[] }> {
    const dto = await snapshotToDto(ControllerSearchSettingsDefaultSaveDto, {
      naver_site_verification: snapshot.naver_site_verification ?? null,
      google_site_verification: snapshot.google_site_verification ?? null,
      bing_site_verification: snapshot.bing_site_verification ?? null,
      ai_search_allowed: snapshot.ai_search_allowed ?? true,
      ai_training_allowed: snapshot.ai_training_allowed ?? true,
    });
    const data = this.withIndexNow(await this.write(ctx, dto, who, 'restore'));
    return { data, warnings: [] };
  }

  private async row(ctx: ITransactionContext): Promise<Row> {
    const r = await this.searchSettingsDefaultRepository.findSite(ctx);
    return r
      ? ControllerSearchSettingsDefaultRowResponseDto.from(r)
      : DEFAULT_ROW;
  }

  private withIndexNow(row: Row): Admin {
    return ControllerSearchSettingsDefaultResponseDto.withIndexNow(
      row,
      this.indexNowService.enabled,
      this.indexNowService.recent(),
    );
  }

  /** 행 저장 · 변경 이력. 저장과 되돌리기가 같이 쓴다. */
  private async write(
    ctx: ITransactionContext,
    dto: ControllerSearchSettingsDefaultSaveDto,
    who: SessionPayload,
    action?: 'restore',
  ): Promise<Row> {
    const existing = await this.searchSettingsDefaultRepository.findSite(ctx);
    const before = existing
      ? ControllerSearchSettingsDefaultRowResponseDto.from(existing)
      : undefined;
    const repo = this.searchSettingsDefaultRepository.repository(ctx);
    await repo.save(
      repo.create({
        id: SEARCH_SETTINGS_ID,
        naverSiteVerification: code(dto.naver_site_verification),
        googleSiteVerification: code(dto.google_site_verification),
        bingSiteVerification: code(dto.bing_site_verification),
        aiSearchAllowed: dto.ai_search_allowed,
        aiTrainingAllowed: dto.ai_training_allowed,
        updatedBy: who.email,
      }),
    );
    const saved = await this.searchSettingsDefaultRepository.findSite(ctx);
    const after = ControllerSearchSettingsDefaultRowResponseDto.from(saved!);
    await this.revisionService.record(
      {
        actor: who.email,
        action: action ?? (existing ? 'update' : 'create'),
        collection: 'site_search_settings',
        itemId: 'site',
        before,
        after,
      },
      ctx,
    );
    return after;
  }
}
