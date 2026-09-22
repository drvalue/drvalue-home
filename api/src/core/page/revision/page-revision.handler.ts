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
import { pageSchemaOf } from '../schema';
import { PageDefaultService } from '../service/page-default.service';

/** item_id `<장 key>/<언어>` 를 나눈다. */
function splitItem(itemId: string): [key: string, lang: string] {
  const i = itemId.lastIndexOf('/');
  return i < 0 ? [itemId, 'ko-KR'] : [itemId.slice(0, i), itemId.slice(i + 1)];
}

/** 페이지 글(pages)의 변경 이력 — 한 장 · 한 언어가 한 항목이다. before 는 그때의 글 JSON. */
@Injectable()
export class PageRevisionHandler implements RevisionHandler, OnModuleInit {
  readonly collection = 'pages';
  readonly restorable = true;

  constructor(
    private readonly registry: RevisionRestoreRegistry,
    private readonly pageDefaultService: PageDefaultService,
  ) {}

  onModuleInit(): void {
    this.registry.register(this);
  }

  label(rev: RevisionEntity): string {
    const [key, lang] = splitItem(rev.itemId);
    const name = pageSchemaOf(key)?.label ?? key;
    return lang === 'ko-KR' ? name : `${name} (${lang})`;
  }

  /** 페이지 API 와 같다 — 전체 권한·마케팅. */
  canSee(_rev: RevisionEntity, who: SessionPayload): boolean {
    return who.role === 'admin' || who.role === 'marketing';
  }

  restore(
    ctx: ITransactionContext,
    before: RevisionSnapshot,
    rev: RevisionEntity,
    who: SessionPayload,
  ): Promise<RevisionRestoreResult> {
    const [key, lang] = splitItem(rev.itemId);
    return this.pageDefaultService.restoreContent(ctx, key, lang, before, who);
  }
}
