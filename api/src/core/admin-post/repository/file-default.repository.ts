import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { FileEntity } from '../../../common/entity/file.entity';
import { BaseRepository } from '../../../common/typeorm/base.repository';
import type { ITransactionContext } from '../../../common/typeorm/transaction-context';

/** 글이 가리키는 파일(공유 그림)이 있는지만 본다. 파일 관리는 admin-file 이 한다. */
@Injectable()
export class FileDefaultRepository extends BaseRepository<FileEntity> {
  override repository(ctx: ITransactionContext): Repository<FileEntity> {
    return super.repository(ctx, FileEntity);
  }

  exists(ctx: ITransactionContext, id: string): Promise<boolean> {
    return this.repository(ctx).exists({ where: { id } });
  }
}
