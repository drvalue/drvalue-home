import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InquiryEntity } from '../../../common/entity/inquiry.entity';
import { BaseRepository } from '../../../common/typeorm/base.repository';
import type { ITransactionContext } from '../../../common/typeorm/transaction-context';

/** 공개 문의 접수가 쓰는 inquiries. 읽기·고치기는 admin-inquiry 가 한다. */
@Injectable()
export class InquiryDefaultRepository extends BaseRepository<InquiryEntity> {
  override repository(ctx: ITransactionContext): Repository<InquiryEntity> {
    return super.repository(ctx, InquiryEntity);
  }

  /** 새 문의 한 건. 상태는 접수(new). */
  insertNew(
    ctx: ITransactionContext,
    row: Pick<InquiryEntity, 'name' | 'phone' | 'email' | 'type' | 'message'>,
  ): Promise<InquiryEntity> {
    const repo = this.repository(ctx);
    return repo.save(repo.create({ ...row, status: 'new' }));
  }
}
