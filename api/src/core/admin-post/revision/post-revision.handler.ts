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
import { canEditBoard } from '../../admin-auth/service/board-access';
import { AdminPostDefaultService } from '../service/admin-post-default.service';

type Snap = Record<string, unknown>;

/** 글(posts)의 변경 이력 — 이름은 한국어 제목, 범위는 게시판, 되돌리기는 글 서비스가 한다. */
@Injectable()
export class PostRevisionHandler implements RevisionHandler, OnModuleInit {
  readonly collection = 'posts';
  readonly restorable = true;

  constructor(
    private readonly registry: RevisionRestoreRegistry,
    private readonly adminPostDefaultService: AdminPostDefaultService,
  ) {}

  onModuleInit(): void {
    this.registry.register(this);
  }

  label(rev: RevisionEntity): string {
    const s = (rev.after ?? rev.before) as Snap | null;
    if (!s) return rev.itemId;
    const ts = (s.translations as Snap[] | undefined) ?? [];
    const ko = ts.find((t) => t.languages_code === 'ko-KR') ?? ts[0];
    return String(ko?.title || s.slug || rev.itemId);
  }

  board(rev: RevisionEntity): string | null {
    const s = (rev.after ?? rev.before) as Snap | null;
    return s && typeof s.board === 'string' ? s.board : null;
  }

  /** 전체 권한은 전부, 나머지는 만질 수 있는 게시판의 글만. */
  canSee(rev: RevisionEntity, who: SessionPayload): boolean {
    if (who.role === 'admin') return true;
    const board = this.board(rev);
    return !board || canEditBoard(who.role, board);
  }

  restore(
    ctx: ITransactionContext,
    before: RevisionSnapshot,
    _rev: RevisionEntity,
    who: SessionPayload,
  ): Promise<RevisionRestoreResult> {
    return this.adminPostDefaultService.restoreSnapshot(ctx, before, who);
  }
}
