import { Injectable } from '@nestjs/common';
import { In, Repository } from 'typeorm';
import { FileEntity } from '../../../common/entity/file.entity';
import { BaseRepository } from '../../../common/typeorm/base.repository';
import type { ITransactionContext } from '../../../common/typeorm/transaction-context';

@Injectable()
export class FileDefaultRepository extends BaseRepository<FileEntity> {
  override repository(ctx: ITransactionContext): Repository<FileEntity> {
    return super.repository(ctx, FileEntity);
  }

  /** 이 id 들 가운데 지금 있는 파일(directus_files). 첨부·증서 그림을 걸기 전에 본다. */
  async findExistingIds(
    ctx: ITransactionContext,
    ids: readonly string[],
  ): Promise<Set<string>> {
    if (ids.length === 0) return new Set();
    const rows = await this.repository(ctx).find({
      where: { id: In([...ids]) },
      select: { id: true },
    });
    return new Set(rows.map((r) => r.id));
  }
}
