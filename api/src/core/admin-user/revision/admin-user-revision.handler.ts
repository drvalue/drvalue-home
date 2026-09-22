import { Injectable, OnModuleInit } from '@nestjs/common';
import type { RevisionEntity } from '../../../common/entity/revision.entity';
import {
  RevisionHandler,
  RevisionRestoreRegistry,
} from '../../../common/revision/revision-restore.registry';
import type { SessionPayload } from '../../../common/session/session-token';
import { AdminUserError } from '../error/admin-user.error';

/** 권한(admin_users)의 변경 이력 — 전체 권한만 본다. 범위는 권한 화면에서만 바꾼다(마지막 전체 권한 규칙). */
@Injectable()
export class AdminUserRevisionHandler implements RevisionHandler, OnModuleInit {
  readonly collection = 'admin_users';
  readonly restorable = false;
  readonly notRestorable = AdminUserError.NOT_RESTORABLE;

  constructor(private readonly registry: RevisionRestoreRegistry) {}

  onModuleInit(): void {
    this.registry.register(this);
  }

  label(rev: RevisionEntity): string {
    const s = (rev.after ?? rev.before) as Record<string, unknown> | null;
    return String(s?.email ?? rev.itemId);
  }

  canSee(_rev: RevisionEntity, who: SessionPayload): boolean {
    return who.role === 'admin';
  }
}
