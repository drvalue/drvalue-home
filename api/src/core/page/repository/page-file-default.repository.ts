import { Injectable } from '@nestjs/common';
import { In, Repository } from 'typeorm';
import { FileEntity } from '../../../common/entity/file.entity';
import { BaseRepository } from '../../../common/typeorm/base.repository';
import type { ITransactionContext } from '../../../common/typeorm/transaction-context';

/** 페이지 글이 가리키는 그림 파일(directus_files)을 확인한다. */
@Injectable()
export class PageFileDefaultRepository extends BaseRepository<FileEntity> {
  override repository(ctx: ITransactionContext): Repository<FileEntity> {
    return super.repository(ctx, FileEntity);
  }

  /** ids 중 실제로 있는 파일과 그 치수. 없는 파일은 결과에 없다. */
  async findSizes(
    ctx: ITransactionContext,
    ids: string[],
  ): Promise<Map<string, { width: number | null; height: number | null }>> {
    const out = new Map<
      string,
      { width: number | null; height: number | null }
    >();
    if (ids.length === 0) return out;
    const rows = await this.repository(ctx).find({
      where: { id: In(ids) },
      select: { id: true, width: true, height: true },
    });
    for (const r of rows)
      out.set(r.id, { width: r.width ?? null, height: r.height ?? null });
    return out;
  }
}
