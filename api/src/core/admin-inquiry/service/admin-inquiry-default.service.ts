import { Injectable } from '@nestjs/common';
import { FindOptionsWhere, ILike, IsNull } from 'typeorm';
import { InquiryEntity } from '../../../common/entity/inquiry.entity';
import { CommonError } from '../../../common/error/common-error';
import { RevisionService } from '../../../common/revision/revision.service';
import type { SessionPayload } from '../../../common/session/session-token';
import { AdminUserService } from '../../admin-auth/service/admin-user.service';
import { ControllerAdminInquiryDefaultUpdateDto } from '../dto/controller-admin-inquiry-default.dto';
import { AdminInquiryError } from '../error/admin-inquiry.error';
import { InquiryDefaultRepository } from '../repository/inquiry-default.repository';

const PAGE = 30;

/** 관리 화면이 보는 문의 한 건. 칸 이름은 다른 관리 API 와 같이 snake_case. */
export interface AdminInquiryView {
  id: number;
  type: string;
  status: string;
  name: string;
  email: string | null;
  company: string | null;
  phone: string | null;
  message: string;
  consent: boolean;
  source_path: string | null;
  assignee_email: string | null;
  note: string | null;
  created_on: Date;
  updated_on: Date;
}

@Injectable()
export class AdminInquiryDefaultService {
  constructor(
    private readonly inquiryDefaultRepository: InquiryDefaultRepository,
    private readonly adminUserService: AdminUserService,
    private readonly revisionService: RevisionService,
  ) {}

  /**
   * 최신순. assignee: 'me'(나) · 'none'(미지정) · 이메일.
   * q 는 이름·회사·이메일·연락처·내용 어디에 걸려도 된다.
   */
  async list(
    options: { status?: string; q?: string; assignee?: string; page?: number },
    who: SessionPayload,
  ) {
    const page = Math.max(1, options.page ?? 1);
    const base: FindOptionsWhere<InquiryEntity> = {};
    if (options.status) base.status = options.status;
    if (options.assignee === 'none') base.assigneeEmail = IsNull();
    else if (options.assignee === 'me')
      base.assigneeEmail = who.email.toLowerCase();
    else if (options.assignee)
      base.assigneeEmail = options.assignee.toLowerCase();

    const q = (options.q ?? '').trim();
    const where: FindOptionsWhere<InquiryEntity>[] = q
      ? (['name', 'company', 'email', 'phone', 'message'] as const).map(
          (k) => ({
            ...base,
            [k]: ILike(`%${q}%`),
          }),
        )
      : [base];

    const [rows, total] =
      await this.inquiryDefaultRepository.repository.findAndCount({
        where,
        order: { createdOn: 'DESC', id: 'DESC' },
        skip: (page - 1) * PAGE,
        take: PAGE,
      });
    return {
      data: rows.map((r) => this.present(r)),
      total,
      page,
      pageSize: PAGE,
    };
  }

  /** 담당자로 고를 수 있는 사람 — admin_users 중 켜진 계정. */
  async assignees() {
    const users = await this.adminUserService.list();
    return users
      .filter((u) => u.enabled)
      .map((u) => ({ email: u.email, name: u.name, role: u.role }));
  }

  async update(
    id: number,
    dto: ControllerAdminInquiryDefaultUpdateDto,
    who: SessionPayload,
  ) {
    const row = await this.inquiryDefaultRepository.repository.findOne({
      where: { id },
    });
    if (!row) throw CommonError.createByErrorCode(AdminInquiryError.NOT_FOUND);
    const before = this.present(row);

    if (dto.status !== undefined) row.status = dto.status;
    if (dto.assignee_email !== undefined) {
      if (dto.assignee_email === null || dto.assignee_email === '') {
        row.assigneeEmail = null;
      } else {
        const email = dto.assignee_email.toLowerCase();
        const user = await this.adminUserService.find(email);
        if (!user || !user.enabled)
          throw CommonError.createByErrorCode(AdminInquiryError.BAD_ASSIGNEE);
        row.assigneeEmail = email;
      }
    }
    if (dto.note !== undefined) row.note = dto.note === '' ? null : dto.note;
    row.updatedOn = new Date();

    const saved = await this.inquiryDefaultRepository.repository.save(row);
    const after = this.present(saved);
    await this.revisionService.record({
      actor: who.email,
      action: 'update',
      collection: 'inquiries',
      itemId: id,
      before,
      after,
    });
    return after;
  }

  async remove(id: number, who: SessionPayload): Promise<void> {
    const row = await this.inquiryDefaultRepository.repository.findOne({
      where: { id },
    });
    if (!row) throw CommonError.createByErrorCode(AdminInquiryError.NOT_FOUND);
    const before = this.present(row);
    await this.inquiryDefaultRepository.repository.remove(row);
    await this.revisionService.record({
      actor: who.email,
      action: 'delete',
      collection: 'inquiries',
      itemId: id,
      before,
    });
  }

  private present(r: InquiryEntity): AdminInquiryView {
    return {
      id: r.id,
      type: r.type,
      status: r.status,
      name: r.name,
      email: r.email,
      company: r.company,
      phone: r.phone,
      message: r.message,
      consent: r.consent,
      source_path: r.sourcePath,
      assignee_email: r.assigneeEmail,
      note: r.note,
      created_on: r.createdOn,
      updated_on: r.updatedOn,
    };
  }
}
