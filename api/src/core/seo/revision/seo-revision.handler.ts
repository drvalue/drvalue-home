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
import { SeoDefaultService } from '../service/seo-default.service';

/** 정적 장 검색 정보(page_meta)의 변경 이력 — 장 주소 하나가 한 항목이다. */
@Injectable()
export class SeoRevisionHandler implements RevisionHandler, OnModuleInit {
  readonly collection = 'page_meta';
  readonly restorable = true;

  constructor(
    private readonly registry: RevisionRestoreRegistry,
    private readonly seoDefaultService: SeoDefaultService,
  ) {}

  onModuleInit(): void {
    this.registry.register(this);
  }

  label(rev: RevisionEntity): string {
    return `검색 정보 ${rev.itemId}`;
  }

  /** SEO API 와 같다 — 전체 권한·마케팅. */
  canSee(_rev: RevisionEntity, who: SessionPayload): boolean {
    return who.role === 'admin' || who.role === 'marketing';
  }

  restore(
    ctx: ITransactionContext,
    before: RevisionSnapshot,
    _rev: RevisionEntity,
    who: SessionPayload,
  ): Promise<RevisionRestoreResult> {
    return this.seoDefaultService.restoreSnapshot(ctx, before, who);
  }
}
