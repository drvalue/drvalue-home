import { Injectable } from '@nestjs/common';
import { CommonError } from '../../../common/error/common-error';
import { ServiceException } from '../../../common/error/service-exception.decorator';
import { RevisionService } from '../../../common/revision/revision.service';
import type { SessionPayload } from '../../../common/session/session-token';
import type { ITransactionContext } from '../../../common/typeorm/transaction-context';
import { Transactional } from '../../../common/typeorm/transactional.decorator';
import { AdminUserService } from '../../admin-auth/service/admin-user.service';
import {
  ControllerAdminInquiryAssigneeResponseDto,
  ControllerAdminInquiryDefaultResponseDto,
} from '../dto/controller-admin-inquiry-default-response.dto';
import {
  ControllerAdminInquiryDefaultListQueryDto,
  ControllerAdminInquiryDefaultUpdateDto,
} from '../dto/controller-admin-inquiry-default.dto';
import { AdminInquiryError } from '../error/admin-inquiry.error';
import { InquiryDefaultRepository } from '../repository/inquiry-default.repository';

const PAGE = 30;

/** 관리 화면의 문의. 담당자 · 메모 · 상태를 고치고, 고칠 때마다 변경 이력을 남긴다. */
@Injectable()
export class AdminInquiryDefaultService {
  constructor(
    private readonly inquiryDefaultRepository: InquiryDefaultRepository,
    private readonly adminUserService: AdminUserService,
    private readonly revisionService: RevisionService,
  ) {}

  /** 최신순 한 쪽(30). 담당자 'me' 는 지금 사람의 이메일로 바꿔 찾는다. */
  @ServiceException({ errorCode: AdminInquiryError.LIST_UNKNOWN })
  async list(
    ctx: ITransactionContext,
    query: ControllerAdminInquiryDefaultListQueryDto,
    who: SessionPayload,
  ): Promise<{
    data: ControllerAdminInquiryDefaultResponseDto[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const page = query.page ?? 1;
    const assignee =
      query.assignee === 'me'
        ? who.email.toLowerCase()
        : query.assignee?.toLowerCase();
    const [rows, total] = await this.inquiryDefaultRepository.findPage(ctx, {
      status: query.status,
      assignee: assignee || undefined,
      q: (query.q ?? '').trim() || undefined,
      skip: (page - 1) * PAGE,
      take: PAGE,
    });
    return {
      data: rows.map((r) => ControllerAdminInquiryDefaultResponseDto.from(r)),
      total,
      page,
      pageSize: PAGE,
    };
  }

  /** 문의 하나. 목록의 지금 쪽에 없는 문의를 `?id=` 로 열 때 쓴다. 없으면 404. */
  @ServiceException({ errorCode: AdminInquiryError.GET_UNKNOWN })
  async get(
    ctx: ITransactionContext,
    id: number,
  ): Promise<ControllerAdminInquiryDefaultResponseDto> {
    return ControllerAdminInquiryDefaultResponseDto.from(
      await this.findOrThrow(ctx, id),
    );
  }

  /** 담당자로 고를 수 있는 사람 — admin_users 중 켜진 계정. */
  @ServiceException({ errorCode: AdminInquiryError.ASSIGNEES_UNKNOWN })
  async assignees(
    ctx: ITransactionContext,
  ): Promise<ControllerAdminInquiryAssigneeResponseDto[]> {
    const users = await this.adminUserService.listEnabled(ctx);
    return users.map((u) => ControllerAdminInquiryAssigneeResponseDto.from(u));
  }

  /**
   * 보낸 칸만 고친다. 담당자는 권한 목록의 켜진 계정만(아니면 400), null·빈 값이면 비운다.
   * 저장과 변경 이력은 한 트랜잭션이다.
   */
  @ServiceException({ errorCode: AdminInquiryError.UPDATE_UNKNOWN })
  @Transactional()
  async update(
    ctx: ITransactionContext,
    id: number,
    dto: ControllerAdminInquiryDefaultUpdateDto,
    who: SessionPayload,
  ): Promise<ControllerAdminInquiryDefaultResponseDto> {
    const row = await this.findOrThrow(ctx, id);
    const before = ControllerAdminInquiryDefaultResponseDto.from(row);

    if (dto.status !== undefined) row.status = dto.status;
    if (dto.assignee_email !== undefined) {
      if (!dto.assignee_email) {
        row.assigneeEmail = null;
      } else {
        const email = dto.assignee_email.toLowerCase();
        const user = await this.adminUserService.find(ctx, email);
        if (!user || !user.enabled)
          throw CommonError.createByErrorCode(AdminInquiryError.BAD_ASSIGNEE);
        row.assigneeEmail = email;
      }
    }
    if (dto.note !== undefined) row.note = dto.note === '' ? null : dto.note;
    row.updatedOn = new Date();

    const after = ControllerAdminInquiryDefaultResponseDto.from(
      await this.inquiryDefaultRepository.save(ctx, row),
    );
    await this.revisionService.record(
      {
        actor: who.email,
        action: 'update',
        collection: 'inquiries',
        itemId: id,
        before,
        after,
      },
      ctx,
    );
    return after;
  }

  /** 문의를 지운다. 지우기 전 모양을 변경 이력에 남긴다(되돌릴 수 있게). */
  @ServiceException({ errorCode: AdminInquiryError.DELETE_UNKNOWN })
  @Transactional()
  async remove(
    ctx: ITransactionContext,
    id: number,
    who: SessionPayload,
  ): Promise<void> {
    const row = await this.findOrThrow(ctx, id);
    const before = ControllerAdminInquiryDefaultResponseDto.from(row);
    await this.inquiryDefaultRepository.remove(ctx, row);
    await this.revisionService.record(
      {
        actor: who.email,
        action: 'delete',
        collection: 'inquiries',
        itemId: id,
        before,
      },
      ctx,
    );
  }

  /**
   * 변경 이력의 스냅샷으로 상태·담당자·메모를 되돌린다(문의 내용은 손대지 않는다). 지운 문의는 404.
   * 담당자가 지금은 권한 목록에 없으면(꺼졌거나 빠졌으면) 비워 두고 경고를 돌려준다.
   */
  @ServiceException({ errorCode: AdminInquiryError.RESTORE_UNKNOWN })
  @Transactional()
  async restoreSnapshot(
    ctx: ITransactionContext,
    id: number,
    snap: Record<string, unknown>,
    who: SessionPayload,
  ): Promise<{
    data: ControllerAdminInquiryDefaultResponseDto;
    warnings: string[];
  }> {
    const row = await this.inquiryDefaultRepository.findById(ctx, id);
    if (!row)
      throw CommonError.createByErrorCode(
        AdminInquiryError.RESTORE_TARGET_GONE,
      );
    const warnings: string[] = [];
    const before = ControllerAdminInquiryDefaultResponseDto.from(row);
    if (typeof snap.status === 'string') row.status = snap.status;
    if ('assignee_email' in snap) {
      const email =
        typeof snap.assignee_email === 'string'
          ? snap.assignee_email.toLowerCase()
          : null;
      const user = email ? await this.adminUserService.find(ctx, email) : null;
      if (email && (!user || !user.enabled))
        warnings.push(
          '담당자 계정이 지금은 권한 목록에 없어 담당자를 비워 두었습니다.',
        );
      row.assigneeEmail = user?.enabled ? email : null;
    }
    if ('note' in snap)
      row.note = typeof snap.note === 'string' ? snap.note : null;
    row.updatedOn = new Date();
    const after = ControllerAdminInquiryDefaultResponseDto.from(
      await this.inquiryDefaultRepository.save(ctx, row),
    );
    await this.revisionService.record(
      {
        actor: who.email,
        action: 'restore',
        collection: 'inquiries',
        itemId: id,
        before,
        after,
      },
      ctx,
    );
    return { data: after, warnings };
  }

  private async findOrThrow(ctx: ITransactionContext, id: number) {
    const row = await this.inquiryDefaultRepository.findById(ctx, id);
    if (!row) throw CommonError.createByErrorCode(AdminInquiryError.NOT_FOUND);
    return row;
  }
}
