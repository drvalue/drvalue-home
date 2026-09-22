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
import { HomeDefaultService } from '../service/home-default.service';

/** 메인 화면 API 와 같다 — 전체 권한·마케팅. */
const canEditHome = (who: SessionPayload): boolean =>
  who.role === 'admin' || who.role === 'marketing';

/** 메인 배너 목록(home_banners)의 변경 이력 — 목록 전체가 한 항목(item `list`)이다. */
@Injectable()
export class HomeBannerRevisionHandler
  implements RevisionHandler, OnModuleInit
{
  readonly collection = 'home_banners';
  readonly restorable = true;

  constructor(
    private readonly registry: RevisionRestoreRegistry,
    private readonly homeDefaultService: HomeDefaultService,
  ) {}

  onModuleInit(): void {
    this.registry.register(this);
  }

  label(): string {
    return '메인 배너';
  }

  canSee(_rev: RevisionEntity, who: SessionPayload): boolean {
    return canEditHome(who);
  }

  restore(
    ctx: ITransactionContext,
    before: RevisionSnapshot,
    _rev: RevisionEntity,
    who: SessionPayload,
  ): Promise<RevisionRestoreResult> {
    return this.homeDefaultService.restoreBanners(ctx, before, who);
  }
}

/** 메인 팝업 목록(home_popups)의 변경 이력 — 목록 전체가 한 항목(item `list`)이다. */
@Injectable()
export class HomePopupRevisionHandler implements RevisionHandler, OnModuleInit {
  readonly collection = 'home_popups';
  readonly restorable = true;

  constructor(
    private readonly registry: RevisionRestoreRegistry,
    private readonly homeDefaultService: HomeDefaultService,
  ) {}

  onModuleInit(): void {
    this.registry.register(this);
  }

  label(): string {
    return '메인 팝업';
  }

  canSee(_rev: RevisionEntity, who: SessionPayload): boolean {
    return canEditHome(who);
  }

  restore(
    ctx: ITransactionContext,
    before: RevisionSnapshot,
    _rev: RevisionEntity,
    who: SessionPayload,
  ): Promise<RevisionRestoreResult> {
    return this.homeDefaultService.restorePopups(ctx, before, who);
  }
}
