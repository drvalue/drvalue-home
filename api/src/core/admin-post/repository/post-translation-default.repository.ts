import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { PostTranslationEntity } from '../../../common/entity/post-translation.entity';
import type { PostEntity } from '../../../common/entity/post.entity';
import type { ColumnMetadata } from 'typeorm/metadata/ColumnMetadata';
import { BaseRepository } from '../../../common/typeorm/base.repository';
import type { ITransactionContext } from '../../../common/typeorm/transaction-context';

@Injectable()
export class PostTranslationDefaultRepository extends BaseRepository<PostTranslationEntity> {
  override repository(
    ctx: ITransactionContext,
  ): Repository<PostTranslationEntity> {
    return super.repository(ctx, PostTranslationEntity);
  }

  /** posts_translations 의 칸 메타데이터 — 변경 이력 스냅샷을 칸 이름으로 맞출 때 쓴다. */
  columns(ctx: ITransactionContext): ColumnMetadata[] {
    return this.repository(ctx).metadata.columns;
  }

  /** 글의 번역을 이 목록으로 갈아 끼운다. */
  async replaceForPost(
    ctx: ITransactionContext,
    postId: number,
    rows: Partial<PostTranslationEntity>[],
  ): Promise<void> {
    await this.repository(ctx).delete({ post: { id: postId } });
    for (const row of rows)
      await this.repository(ctx).insert({
        ...row,
        post: { id: postId } as PostEntity,
      });
  }

  /** 수행실적 「구분」에 지금까지 쓴 값(가나다순, 빈 값 제외). */
  findCaseCategoryLabels(ctx: ITransactionContext): Promise<string[]> {
    return this.distinct(ctx, 'case', 't.caseCategoryLabel');
  }

  /** FAQ 「분류」에 지금까지 쓴 값(가나다순, 빈 값 제외). */
  findFaqCategories(ctx: ITransactionContext): Promise<string[]> {
    return this.distinct(ctx, 'faq', 't.faqCategory');
  }

  private async distinct(
    ctx: ITransactionContext,
    board: string,
    column: 't.caseCategoryLabel' | 't.faqCategory',
  ): Promise<string[]> {
    const rows = await this.repository(ctx)
      .createQueryBuilder('t')
      .innerJoin('t.post', 'p')
      .select(`DISTINCT ${column}`, 'label')
      .where('p.board = :board', { board })
      .andWhere(`${column} IS NOT NULL AND ${column} <> ''`)
      .orderBy('label', 'ASC')
      .getRawMany<{ label: string }>();
    return rows.map((r) => r.label);
  }
}
