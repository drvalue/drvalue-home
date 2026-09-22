import { Injectable } from '@nestjs/common';
import { FindOptionsWhere, ILike, IsNull, Repository } from 'typeorm';
import { InquiryEntity } from '../../../common/entity/inquiry.entity';
import { BaseRepository } from '../../../common/typeorm/base.repository';
import type { ITransactionContext } from '../../../common/typeorm/transaction-context';

export interface AdminInquiryFilter {
  status?: string;
  /** 'none'(미지정) 이거나 담당자 이메일(소문자). 'me' 는 서비스가 이메일로 바꿔 넘긴다. */
  assignee?: string;
  /** 이름·회사·이메일·연락처·내용 어디에 걸려도 된다. */
  q?: string;
  skip: number;
  take: number;
}

/** 관리 화면이 읽고 고치는 inquiries. 접수(insert)는 공개 inquiry 모듈이 한다. */
@Injectable()
export class InquiryDefaultRepository extends BaseRepository<InquiryEntity> {
  override repository(ctx: ITransactionContext): Repository<InquiryEntity> {
    return super.repository(ctx, InquiryEntity);
  }

  /** 최신순 한 쪽과 전체 수. */
  findPage(
    ctx: ITransactionContext,
    f: AdminInquiryFilter,
  ): Promise<[InquiryEntity[], number]> {
    const base: FindOptionsWhere<InquiryEntity> = {};
    if (f.status) base.status = f.status;
    if (f.assignee === 'none') base.assigneeEmail = IsNull();
    else if (f.assignee) base.assigneeEmail = f.assignee;
    const where: FindOptionsWhere<InquiryEntity>[] = f.q
      ? (['name', 'company', 'email', 'phone', 'message'] as const).map(
          (k) => ({
            ...base,
            [k]: ILike(`%${f.q}%`),
          }),
        )
      : [base];
    return this.repository(ctx).findAndCount({
      where,
      order: { createdOn: 'DESC', id: 'DESC' },
      skip: f.skip,
      take: f.take,
    });
  }

  findById(
    ctx: ITransactionContext,
    id: number,
  ): Promise<InquiryEntity | null> {
    return this.repository(ctx).findOne({ where: { id } });
  }

  save(ctx: ITransactionContext, row: InquiryEntity): Promise<InquiryEntity> {
    return this.repository(ctx).save(row);
  }

  async remove(ctx: ITransactionContext, row: InquiryEntity): Promise<void> {
    await this.repository(ctx).remove(row);
  }
}
