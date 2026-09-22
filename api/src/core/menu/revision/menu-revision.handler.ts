import { Injectable, OnModuleInit } from '@nestjs/common';
import {
  RevisionHandler,
  RevisionRestoreRegistry,
  RevisionRestoreResult,
  RevisionSnapshot,
} from '../../../common/revision/revision-restore.registry';
import type { RevisionEntity } from '../../../common/entity/revision.entity';
import type { SessionPayload } from '../../../common/session/session-token';
import type { ITransactionContext } from '../../../common/typeorm/transaction-context';
import { MenuDefaultService } from '../service/menu-default.service';

/** 사이트 메뉴(menu)의 변경 이력 — 메뉴 전체가 한 항목(item `site`)이다. */
@Injectable()
export class MenuRevisionHandler implements RevisionHandler, OnModuleInit {
  readonly collection = 'menu';
  readonly restorable = true;

  constructor(
    private readonly registry: RevisionRestoreRegistry,
    private readonly menuDefaultService: MenuDefaultService,
  ) {}

  onModuleInit(): void {
    this.registry.register(this);
  }

  label(): string {
    return '사이트 메뉴';
  }

  /** 메뉴 API 와 같다 — 전체 권한·마케팅. */
  canSee(_rev: RevisionEntity, who: SessionPayload): boolean {
    return who.role === 'admin' || who.role === 'marketing';
  }

  restore(
    ctx: ITransactionContext,
    before: RevisionSnapshot,
    _rev: RevisionEntity,
    who: SessionPayload,
  ): Promise<RevisionRestoreResult> {
    return this.menuDefaultService.restoreTree(ctx, before, who);
  }
}
