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
import { AdminInquiryDefaultService } from '../service/admin-inquiry-default.service';

/** 문의(inquiries)의 변경 이력 — 이름은 문의한 분, 되돌리기는 상태·담당자·메모만. */
@Injectable()
export class InquiryRevisionHandler implements RevisionHandler, OnModuleInit {
  readonly collection = 'inquiries';
  readonly restorable = true;

  constructor(
    private readonly registry: RevisionRestoreRegistry,
    private readonly adminInquiryDefaultService: AdminInquiryDefaultService,
  ) {}

  onModuleInit(): void {
    this.registry.register(this);
  }

  label(rev: RevisionEntity): string {
    const s = (rev.after ?? rev.before) as Record<string, unknown> | null;
    return String(s?.name ?? `문의 ${rev.itemId}`);
  }

  /** 인사는 문의를 못 본다(문의 API 와 같다). */
  canSee(_rev: RevisionEntity, who: SessionPayload): boolean {
    return who.role === 'admin' || who.role === 'marketing';
  }

  restore(
    ctx: ITransactionContext,
    before: RevisionSnapshot,
    rev: RevisionEntity,
    who: SessionPayload,
  ): Promise<RevisionRestoreResult> {
    return this.adminInquiryDefaultService.restoreSnapshot(
      ctx,
      Number(rev.itemId),
      before,
      who,
    );
  }
}
