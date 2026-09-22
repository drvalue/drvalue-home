import { Injectable } from '@nestjs/common';
import { In, Repository } from 'typeorm';
import { InquiryEntity } from '../../../common/entity/inquiry.entity';
import { BaseRepository } from '../../../common/typeorm/base.repository';
import type { ITransactionContext } from '../../../common/typeorm/transaction-context';

/** 답을 기다리는 문의 상태. 답변완료·종료·스팸은 끝난 것이다. */
const OPEN = ['new', 'in_progress'];

@Injectable()
export class InquiryDefaultRepository extends BaseRepository<InquiryEntity> {
  override repository(ctx: ITransactionContext): Repository<InquiryEntity> {
    return super.repository(ctx, InquiryEntity);
  }

  /** 「접수」 상태 그대로인 문의 수. */
  countNew(ctx: ITransactionContext): Promise<number> {
    return this.repository(ctx).count({ where: { status: 'new' } });
  }

  /** 이 사람이 맡아 아직 끝나지 않은 문의 수. 담당자 이메일은 소문자로 저장한다. */
  countOpenAssignedTo(
    ctx: ITransactionContext,
    email: string,
  ): Promise<number> {
    return this.repository(ctx).count({
      where: { assigneeEmail: email.toLowerCase(), status: In(OPEN) },
    });
  }
}
