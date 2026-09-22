import { Injectable } from '@nestjs/common';
import { In, Repository } from 'typeorm';
import { FileEntity } from '../../../common/entity/file.entity';
import { BaseRepository } from '../../../common/typeorm/base.repository';
import type { ITransactionContext } from '../../../common/typeorm/transaction-context';

/** 글이 가리키는 파일(첨부·증서 그림·공유 그림)이 있는지만 본다. 파일 관리는 admin-file 이 한다. */
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

  /** 이 파일이 있나. 공유 그림(og_image)을 걸기 전에 본다. */
  exists(ctx: ITransactionContext, id: string): Promise<boolean> {
    return this.repository(ctx).exists({ where: { id } });
  }
}
