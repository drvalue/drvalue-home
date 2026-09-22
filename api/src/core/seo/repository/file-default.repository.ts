import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { FileEntity } from '../../../common/entity/file.entity';
import { BaseRepository } from '../../../common/typeorm/base.repository';
import type { ITransactionContext } from '../../../common/typeorm/transaction-context';

/** 공유 그림이 실제 파일인지만 본다. 파일 관리는 admin-file 이 한다. */
@Injectable()
export class SeoFileDefaultRepository extends BaseRepository<FileEntity> {
  override repository(ctx: ITransactionContext): Repository<FileEntity> {
    return super.repository(ctx, FileEntity);
  }

  exists(ctx: ITransactionContext, id: string): Promise<boolean> {
    return this.repository(ctx).exists({ where: { id } });
  }
}
