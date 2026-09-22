import { Injectable } from '@nestjs/common';
import { Brackets, Repository } from 'typeorm';
import { PostEntity } from '../../../common/entity/post.entity';
import { BaseRepository } from '../../../common/typeorm/base.repository';
import type { ITransactionContext } from '../../../common/typeorm/transaction-context';

/** 관리 목록의 거름 조건. `boards` 는 이 범위로 볼 수 있는 게시판 전부(게시판을 안 골랐을 때). */
export interface AdminPostPageFilter {
  boards: readonly string[];
  board?: string;
  status?: string;
  q?: string;
  /** scheduled = 예약 공개 대기 · unpublishing = 자동 내림 대기 */
  schedule?: 'scheduled' | 'unpublishing';
  page: number;
  pageSize: number;
}

/** 글 게시판은 날짜가 먼저다. 증서·수행실적·FAQ 는 관리 화면에서 끈 순서(sort)가 먼저. */
const DATE_FIRST = ['notice', 'press', 'news'];

@Injectable()
export class PostDefaultRepository extends BaseRepository<PostEntity> {
  override repository(ctx: ITransactionContext): Repository<PostEntity> {
    return super.repository(ctx, PostEntity);
  }

  /** 번역·첨부(파일 이름 포함)까지. 첨부는 넣은 순서대로. */
  findOneFull(
    ctx: ITransactionContext,
    id: number,
  ): Promise<PostEntity | null> {
    return this.repository(ctx).findOne({
      where: { id },
      relations: { translations: true, files: { file: true } },
      order: { files: { id: 'ASC' } },
    });
  }

  findBySlug(
    ctx: ITransactionContext,
    slug: string,
  ): Promise<PostEntity | null> {
    return this.repository(ctx).findOne({ where: { slug } });
  }

  /** 게시판 안의 가장 큰 sort. 새 글은 그다음 번호로 맨 뒤에 붙는다. */
  async findMaxSort(ctx: ITransactionContext, board: string): Promise<number> {
    const row = await this.repository(ctx)
      .createQueryBuilder('p')
      .select('MAX(p.sort)', 'max')
      .where('p.board = :board', { board })
      .getRawOne<{ max: number | null }>();
    return row?.max ?? 0;
  }

  /** 글 id 들이 속한 게시판(겹치지 않게). */
  async findBoardsOf(
    ctx: ITransactionContext,
    ids: number[],
  ): Promise<string[]> {
    if (ids.length === 0) return [];
    const rows = await this.repository(ctx)
      .createQueryBuilder('p')
      .select('DISTINCT p.board', 'board')
      .where('p.id IN (:...ids)', { ids })
      .getRawMany<{ board: string }>();
    return rows.map((r) => r.board);
  }

  async updateSort(
    ctx: ITransactionContext,
    id: number,
    sort: number,
  ): Promise<void> {
    await this.repository(ctx).update({ id }, { sort });
  }

  /** 관리 목록 한 쪽. 순서는 게시판마다 다르다 — 사이트 목록과 같은 순서로 보여 준다. */
  findAdminPage(
    ctx: ITransactionContext,
    f: AdminPostPageFilter,
  ): Promise<[PostEntity[], number]> {
    const qb = this.repository(ctx)
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.translations', 't');

    if (f.board) qb.andWhere('p.board = :board', { board: f.board });
    else qb.andWhere('p.board IN (:...boards)', { boards: f.boards });
    if (f.status) qb.andWhere('p.status = :status', { status: f.status });
    if (f.schedule === 'scheduled') qb.andWhere('p.publishAt > now()');
    if (f.schedule === 'unpublishing')
      qb.andWhere('p.unpublishAt IS NOT NULL AND p.unpublishAt > now()');
    if (f.q)
      qb.andWhere(
        new Brackets((w) => {
          w.where('t.title ILIKE :q', { q: `%${f.q}%` }).orWhere(
            'p.slug ILIKE :q',
            { q: `%${f.q}%` },
          );
        }),
      );

    if (f.board && DATE_FIRST.includes(f.board)) {
      qb.orderBy('p.isPinned', 'DESC')
        .addOrderBy('p.publishedDate', 'DESC')
        .addOrderBy('p.id', 'DESC');
    } else if (f.board === 'history') {
      qb.orderBy('p.historyYear', 'DESC')
        .addOrderBy('p.sort', 'ASC', 'NULLS LAST')
        .addOrderBy('p.id', 'ASC');
    } else if (f.board === 'recruit') {
      // 마감 임박 순. 상시 채용과 마감일 없는 글은 뒤로.
      qb.orderBy('p.isOpenEnded', 'ASC')
        .addOrderBy('p.deadline', 'ASC', 'NULLS LAST')
        .addOrderBy('p.publishedDate', 'DESC')
        .addOrderBy('p.id', 'DESC');
    } else {
      qb.orderBy('p.sort', 'ASC', 'NULLS LAST')
        .addOrderBy('p.publishedDate', 'DESC')
        .addOrderBy('p.id', 'DESC');
    }

    return qb
      .skip((f.page - 1) * f.pageSize)
      .take(f.pageSize)
      .getManyAndCount();
  }
}
