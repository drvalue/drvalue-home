import { Injectable, OnModuleInit } from '@nestjs/common';
import type { RevisionEntity } from '../../../common/entity/revision.entity';
import {
  RevisionHandler,
  RevisionRestoreRegistry,
  RevisionRestoreResult,
  RevisionSnapshot,
} from '../../../common/revision/revision-restore.registry';
import type { SessionPayload } from '../../../common/session/session-token';
import type { ITransactionContext } from '../../../common/typeorm/transaction-context';
import { SearchSettingsDefaultService } from '../service/search-settings-default.service';

/** 검색엔진 설정(site_search_settings)의 변경 이력 — 설정 전체가 한 항목(item `site`)이다. */
@Injectable()
export class SearchSettingsRevisionHandler
  implements RevisionHandler, OnModuleInit
{
  readonly collection = 'site_search_settings';
  readonly restorable = true;

  constructor(
    private readonly registry: RevisionRestoreRegistry,
    private readonly searchSettingsDefaultService: SearchSettingsDefaultService,
  ) {}

  onModuleInit(): void {
    this.registry.register(this);
  }

  label(): string {
    return '검색엔진 설정';
  }

  /** 검색엔진 설정 API 와 같다 — 전체 권한·마케팅. */
  canSee(_rev: RevisionEntity, who: SessionPayload): boolean {
    return who.role === 'admin' || who.role === 'marketing';
  }

  restore(
    ctx: ITransactionContext,
    before: RevisionSnapshot,
    _rev: RevisionEntity,
    who: SessionPayload,
  ): Promise<RevisionRestoreResult> {
    return this.searchSettingsDefaultService.restoreSnapshot(ctx, before, who);
  }
}
