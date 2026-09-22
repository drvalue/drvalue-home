import { Injectable } from '@nestjs/common';
import { Brackets, Repository, SelectQueryBuilder } from 'typeorm';
import { FileEntity } from '../../../common/entity/file.entity';
import { PostEntity } from '../../../common/entity/post.entity';
import { BaseRepository } from '../../../common/typeorm/base.repository';
import type { ITransactionContext } from '../../../common/typeorm/transaction-context';

/**
 * 지금 공개된 글. 상태만 보지 않는다 — 예약 공개(publish_at) 전과 자동 내림
 * (unpublish_at) 뒤는 status 가 아직 published 여도 안 나간다. admin-schedule 이
 * 1분마다 상태를 맞추지만, 그 1분 사이에도 새지 않게 여기서 시각을 직접 본다.
 */
const LIVE =
  "p.status = 'published' AND (p.publish_at IS NULL OR p.publish_at <= now()) AND (p.unpublish_at IS NULL OR p.unpublish_at > now())";

/** 공개 목록의 글 한 줄. `thumb` 는 대표 그림 파일(치수를 싣는다). */
export type PublicPostRow = PostEntity & { thumb?: FileEntity | null };

export interface PublicPostQuery {
  /** 요청 언어 + 기본 언어. 둘 다 싣는다 — 번역이 없는 글이 제목 없이 나가지 않게. */
  languages: string[];
  board?: string;
  keyword?: string;
  startDate?: string;
  endDate?: string;
  skip: number;
  take: number;
}

/** 공개 사이트가 읽는 posts. 게시판 목록·글 하나·공개 파일 관문의 글 쪽 판정. */
@Injectable()
export class ContentPostDefaultRepository extends BaseRepository<PostEntity> {
  override repository(ctx: ITransactionContext): Repository<PostEntity> {
    return super.repository(ctx, PostEntity);
  }

  /** 공개 목록 한 쪽과 전체 수. 순서는 게시판마다 다르다(`applyOrder`). */
  async findLivePage(
    ctx: ITransactionContext,
    q: PublicPostQuery,
  ): Promise<[PublicPostRow[], number]> {
    const qb = this.live(ctx, q.languages);
    if (q.board) qb.andWhere('p.board = :board', { board: q.board });
    if (q.keyword) {
      // 검색은 언어를 가리지 않는다 — 영어 번역이 걸려 같은 글이 나오는 것은 맞는 결과다.
      qb.andWhere(
        'p.id IN (SELECT posts FROM posts_translations WHERE title ILIKE :kw OR summary ILIKE :kw OR body ILIKE :kw)',
        { kw: `%${q.keyword}%` },
      );
    }
    // 기간 검색은 화면에 보이는 날짜(published_date) 기준. publish_at 은 예약 장치다.
    if (q.startDate) qb.andWhere('p.publishedDate >= :s', { s: q.startDate });
    if (q.endDate) qb.andWhere('p.publishedDate <= :e', { e: q.endDate });
    this.applyOrder(qb, q.board);
    return (await qb.skip(q.skip).take(q.take).getManyAndCount()) as [
      PublicPostRow[],
      number,
    ];
  }

  /** 공개 글 하나(첨부 파일까지). 없거나 공개 전·내린 뒤면 null. */
  async findLiveBySlug(
    ctx: ITransactionContext,
    slug: string,
    languages: string[],
  ): Promise<PublicPostRow | null> {
    return (await this.live(ctx, languages)
      .leftJoinAndSelect('p.files', 'pf')
      .leftJoinAndSelect('pf.file', 'ff')
      .andWhere('p.slug = :slug', { slug })
      .getOne()) as PublicPostRow | null;
  }

  /**
   * 공개된 글이 이 파일을 가리키나 — 대표 그림 · 공유 그림 · 첨부 · 본문 HTML 안의 그림.
   * 목록과 같은 공개 조건이다(예약 전·내린 뒤의 첨부가 파일 주소로 새지 않게).
   * id 는 서비스가 uuid 모양으로 걸렀지만 문자열은 바인딩으로만 넣는다.
   */
  async isReferencedByLivePost(
    ctx: ITransactionContext,
    fileId: string,
  ): Promise<boolean> {
    const n = await this.repository(ctx)
      .createQueryBuilder('p')
      .leftJoin('p.files', 'pf')
      .where(LIVE)
      .andWhere(
        new Brackets((w) => {
          w.where('p.thumbnail = :id', { id: fileId })
            .orWhere('p.og_image = :id', { id: fileId })
            .orWhere('pf.directus_files_id = :id', { id: fileId })
            .orWhere(
              'p.id IN (SELECT tb.posts FROM posts_translations tb WHERE tb.body LIKE :inBody)',
              { inBody: `%/api/content/assets/${fileId}%` },
            );
        }),
      )
      .getCount();
    return n > 0;
  }

  private live(
    ctx: ITransactionContext,
    languages: string[],
  ): SelectQueryBuilder<PostEntity> {
    return this.repository(ctx)
      .createQueryBuilder('p')
      .leftJoinAndSelect(
        'p.translations',
        't',
        't.languages_code IN (:...langs)',
        { langs: languages },
      )
      .leftJoinAndMapOne('p.thumb', FileEntity, 'f', 'f.id = p.thumbnail')
      .where(LIVE);
  }

  /**
   * 게시판(공지·보도·뉴스)은 날짜순. 증서·수행실적·FAQ 는 관리 화면에서 끈 순서(sort),
   * 연혁은 연도 내림차순 안에서 sort, 채용은 마감 임박 순 — 목록 장은 「최신 글」이 아니다.
   */
  private applyOrder(qb: SelectQueryBuilder<PostEntity>, board?: string): void {
    if (board === 'history') {
      qb.orderBy('p.historyYear', 'DESC')
        .addOrderBy('p.sort', 'ASC', 'NULLS LAST')
        .addOrderBy('p.id', 'ASC');
    } else if (
      board === 'patent' ||
      board === 'copyright' ||
      board === 'case' ||
      board === 'faq'
    ) {
      qb.orderBy('p.sort', 'ASC', 'NULLS LAST')
        .addOrderBy('p.publishedDate', 'DESC')
        .addOrderBy('p.id', 'ASC');
    } else if (board === 'recruit') {
      // 채용은 마감 임박 순. 상시 채용·마감일 없는 것은 뒤로.
      qb.orderBy('p.isOpenEnded', 'ASC')
        .addOrderBy('p.deadline', 'ASC', 'NULLS LAST')
        .addOrderBy('p.publishedDate', 'DESC')
        .addOrderBy('p.id', 'DESC');
    } else {
      qb.orderBy('p.isPinned', 'DESC')
        .addOrderBy('p.publishedDate', 'DESC')
        .addOrderBy('p.id', 'DESC');
    }
  }
}
