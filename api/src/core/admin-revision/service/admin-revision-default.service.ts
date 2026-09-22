import { Injectable } from '@nestjs/common';
import type { RevisionEntity } from '../../../common/entity/revision.entity';
import { CommonError } from '../../../common/error/common-error';
import type { ICommonErrorCode } from '../../../common/error/common-error-code';
import { ServiceException } from '../../../common/error/service-exception.decorator';
import {
  RevisionHandler,
  RevisionRestoreRegistry,
  RevisionRestoreResult,
  RevisionSnapshot,
} from '../../../common/revision/revision-restore.registry';
import type { SessionPayload } from '../../../common/session/session-token';
import type { ITransactionContext } from '../../../common/typeorm/transaction-context';
import { Transactional } from '../../../common/typeorm/transactional.decorator';
import { AdminAuthError } from '../../admin-auth/error/admin-auth.error';
import {
  ControllerAdminRevisionDefaultDetailResponseDto,
  ControllerAdminRevisionDefaultRowResponseDto,
} from '../dto/controller-admin-revision-default-response.dto';
import { ControllerAdminRevisionDefaultListQueryDto } from '../dto/controller-admin-revision-default.dto';
import { AdminRevisionError } from '../error/admin-revision.error';
import { RevisionDefaultRepository } from '../repository/revision-default.repository';

/** 전체 이력 한 쪽의 줄 수. */
const PAGE_SIZE = 50;
/** 한 항목의 이력은 이만큼까지. */
const ITEM_LIMIT = 100;

/**
 * 변경 이력 조회와 되돌리기.
 *
 * 표(collection)마다 다른 것 — 목록에 보일 이름 · 게시판 · 누가 보나 · 되돌리기 — 은 그 기능이
 * `RevisionRestoreRegistry` 에 건 핸들러가 답한다. 여기는 표 이름으로 분기하지 않는다.
 * 핸들러가 없는 표는 항목 id 로 보이고, 되돌리기는 거부한다.
 */
@Injectable()
export class AdminRevisionDefaultService {
  constructor(
    private readonly revisionDefaultRepository: RevisionDefaultRepository,
    private readonly revisionRestoreRegistry: RevisionRestoreRegistry,
  ) {}

  /** 전체 변경 이력 한 쪽(50줄, 최신순). 종류·바꾼 사람으로 거른다. */
  @ServiceException({ errorCode: AdminRevisionError.LIST_UNKNOWN })
  async list(
    ctx: ITransactionContext,
    query: ControllerAdminRevisionDefaultListQueryDto,
  ): Promise<{
    data: ControllerAdminRevisionDefaultRowResponseDto[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const page = query.page ?? 1;
    const [rows, total] = await this.revisionDefaultRepository.findPage(ctx, {
      collection: query.collection || undefined,
      actor: query.actor || undefined,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    });
    return {
      data: rows.map((r) => this.row(r)),
      total,
      page,
      pageSize: PAGE_SIZE,
    };
  }

  /** 가장 최근 변경 몇 줄. 홈(대시보드)이 쓴다 — 목록과 같은 모양. */
  @ServiceException({ errorCode: AdminRevisionError.LIST_UNKNOWN })
  async recent(
    ctx: ITransactionContext,
    limit: number,
  ): Promise<ControllerAdminRevisionDefaultRowResponseDto[]> {
    const [rows] = await this.revisionDefaultRepository.findPage(ctx, {
      skip: 0,
      take: limit,
    });
    return rows.map((r) => this.row(r));
  }

  /** 한 항목(글 하나·장 하나…)의 이력, 최신순. 볼 수 없는 항목이면 403. */
  @ServiceException({ errorCode: AdminRevisionError.LIST_UNKNOWN })
  async item(
    ctx: ITransactionContext,
    collection: string,
    itemId: string,
    who: SessionPayload,
  ): Promise<ControllerAdminRevisionDefaultRowResponseDto[]> {
    const rows = await this.revisionDefaultRepository.findFor(
      ctx,
      collection,
      itemId,
      ITEM_LIMIT,
    );
    // 이력이 아직 없는 항목도 같은 규칙으로 본다(권한 이력은 전체 권한만 — 빈 목록이라도).
    this.assertCanSee(
      rows[0] ??
        ({ collection, itemId, before: null, after: null } as RevisionEntity),
      who,
    );
    return rows.map((r) => this.row(r));
  }

  /** 이력 한 건 — 바꾸기 전·뒤와 되돌릴 수 있는지(없으면 그 까닭). */
  @ServiceException({ errorCode: AdminRevisionError.GET_UNKNOWN })
  async get(
    ctx: ITransactionContext,
    id: number,
    who: SessionPayload,
  ): Promise<ControllerAdminRevisionDefaultDetailResponseDto> {
    const rev = await this.find(ctx, id);
    this.assertCanSee(rev, who);
    const refusal = this.refusal(
      rev,
      this.revisionRestoreRegistry.get(rev.collection),
    );
    return {
      ...this.row(rev),
      before: rev.before ?? null,
      after: rev.after ?? null,
      restorable: !refusal,
      restore_note: refusal?.message ?? null,
    };
  }

  /**
   * 이 이력의 「바꾸기 전」으로 되돌린다. 그 기능의 핸들러가 저장 규칙을 거쳐 쓰고,
   * 되돌림 자체도 이력 한 줄(action restore)로 남긴다. 한 트랜잭션이다.
   */
  @ServiceException({ errorCode: AdminRevisionError.RESTORE_UNKNOWN })
  @Transactional()
  async restore(
    ctx: ITransactionContext,
    id: number,
    who: SessionPayload,
  ): Promise<RevisionRestoreResult> {
    const rev = await this.find(ctx, id);
    this.assertCanSee(rev, who);
    const handler = this.revisionRestoreRegistry.get(rev.collection);
    const refusal = this.refusal(rev, handler);
    if (refusal || !handler?.restore)
      throw CommonError.createByErrorCode(
        refusal ?? AdminRevisionError.NOT_RESTORABLE,
      );
    return handler.restore(ctx, rev.before as RevisionSnapshot, rev, who);
  }

  /**
   * 되돌릴 수 없으면 그 까닭. 한 건 조회의 restorable 과 되돌리기가 이 한 규칙을 본다 —
   * 핸들러가 없거나 거절하는 표면 그 표의 코드, 만들기 이력(전이 없다)이면 NO_BEFORE.
   */
  private refusal(
    rev: RevisionEntity,
    handler: RevisionHandler | undefined,
  ): ICommonErrorCode | null {
    if (!handler?.restorable || !handler.restore)
      return handler?.notRestorable ?? AdminRevisionError.NOT_RESTORABLE;
    if (rev.before == null) return AdminRevisionError.NO_BEFORE;
    return null;
  }

  private async find(
    ctx: ITransactionContext,
    id: number,
  ): Promise<RevisionEntity> {
    const rev = await this.revisionDefaultRepository.findById(ctx, id);
    if (!rev) throw CommonError.createByErrorCode(AdminRevisionError.NOT_FOUND);
    return rev;
  }

  /** 전체 권한은 전부. 나머지는 그 표의 핸들러가 정한다(핸들러가 없으면 컨트롤러의 역할 제한까지). */
  private assertCanSee(rev: RevisionEntity, who: SessionPayload): void {
    if (who.role === 'admin') return;
    const handler = this.revisionRestoreRegistry.get(rev.collection);
    if (handler?.canSee && !handler.canSee(rev, who))
      throw CommonError.createByErrorCode(AdminAuthError.FORBIDDEN);
  }

  private row(
    rev: RevisionEntity,
  ): ControllerAdminRevisionDefaultRowResponseDto {
    const handler = this.revisionRestoreRegistry.get(rev.collection);
    return ControllerAdminRevisionDefaultRowResponseDto.from(
      rev,
      handler?.label(rev) ?? rev.itemId,
      handler?.board?.(rev) ?? null,
    );
  }
}
