import { Injectable } from '@nestjs/common';
import type { RevisionEntity } from '../entity/revision.entity';
import type { ICommonErrorCode } from '../error/common-error-code';
import type { SessionPayload } from '../session/session-token';
import type { ITransactionContext } from '../typeorm/transaction-context';

export type RevisionSnapshot = Record<string, unknown>;

export interface RevisionRestoreResult {
  /** 되돌린 뒤의 모양(그 기능의 관리 화면 응답 모양). */
  data: unknown;
  /** 되돌리며 뺀 것(지워진 파일 등). 화면이 저장 알림 옆에 보여 준다. */
  warnings: string[];
}

/**
 * 변경 이력의 한 종류(collection)를 아는 기능이 등록한다. 변경 이력 모듈은 표마다 분기하지 않고
 * 여기서 이름·범위·되돌리기를 묻는다 — 새 표를 이력에 남기기 시작하면 그 기능이 핸들러를 하나 더 건다.
 */
export interface RevisionHandler {
  /** admin_revisions.collection */
  readonly collection: string;
  /** 목록 한 줄에 보일 이름. */
  label(rev: RevisionEntity): string;
  /** 게시판 글이면 게시판 키. 아니면 null. */
  board?(rev: RevisionEntity): string | null;
  /** 이 사람이 이 이력을 볼 수 있나(관리 이력 API 의 역할 제한 안에서 더 좁힌다). 없으면 볼 수 있다. */
  canSee?(rev: RevisionEntity, who: SessionPayload): boolean;
  /** false 면 되돌리기를 받지 않는다 — `notRestorable` 코드로 거부. */
  readonly restorable: boolean;
  readonly notRestorable?: ICommonErrorCode;
  /**
   * `before` 스냅샷으로 되돌린다. 호출자가 연 트랜잭션(ctx.manager) 안에서 불린다.
   * 그 기능의 저장 규칙(검사)을 그대로 거치고, 되돌림 자체를 변경 이력(action restore)으로 남긴다.
   */
  restore?(
    ctx: ITransactionContext,
    before: RevisionSnapshot,
    rev: RevisionEntity,
    who: SessionPayload,
  ): Promise<RevisionRestoreResult>;
}

/** 변경 이력 핸들러 모음. RevisionModule 에 하나 — 기능 모듈이 onModuleInit 에서 등록한다. */
@Injectable()
export class RevisionRestoreRegistry {
  private readonly handlers = new Map<string, RevisionHandler>();

  register(handler: RevisionHandler): void {
    this.handlers.set(handler.collection, handler);
  }

  get(collection: string): RevisionHandler | undefined {
    return this.handlers.get(collection);
  }
}
