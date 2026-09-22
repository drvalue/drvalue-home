import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { FileEntity } from '../../../common/entity/file.entity';
import { BaseRepository } from '../../../common/typeorm/base.repository';
import type { ITransactionContext } from '../../../common/typeorm/transaction-context';

/**
 * 공개 파일 관문이 읽는 directus_files 와, 글 밖에서 파일을 공개로 만드는 자리들.
 * 새 자리(표)가 파일을 공개로 싣기 시작하면 `isReferencedOutsidePosts` 에 더한다.
 */
@Injectable()
export class ContentFileDefaultRepository extends BaseRepository<FileEntity> {
  override repository(ctx: ITransactionContext): Repository<FileEntity> {
    return super.repository(ctx, FileEntity);
  }

  findById(ctx: ITransactionContext, id: string): Promise<FileEntity | null> {
    return this.repository(ctx).findOne({ where: { id } });
  }

  /**
   * 글이 아닌 곳이 이 파일을 공개로 싣나.
   * - 정적 장의 공유 그림(page_meta, 관리 화면 「SEO」) — 장은 늘 공개라 조건이 없다.
   * - 페이지 글(page_contents)의 그림 — 저장한 것이 곧 공개다. 값은 {"id":"<uuid>"} 모양이라 따옴표째 찾는다.
   * - 메인 배너·팝업 — 살아 있는 동안(보이기 · 기간 안)만. 예약해 둔 배너 그림이 먼저 새지 않게.
   */
  async isReferencedOutsidePosts(
    ctx: ITransactionContext,
    fileId: string,
  ): Promise<boolean> {
    const rows: Array<{ n: string }> = await this.repository(ctx).query(
      `SELECT (SELECT count(*) FROM page_meta WHERE og_image = $1::uuid)
            + (SELECT count(*) FROM page_contents WHERE content::text LIKE '%"' || $1::text || '"%')
            + (SELECT count(*) FROM home_banners b
                WHERE b.image = $1::uuid AND b.visible
                  AND (b.starts_at IS NULL OR b.starts_at <= now())
                  AND (b.ends_at IS NULL OR b.ends_at > now()))
            + (SELECT count(*) FROM home_popups p
                WHERE p.image = $1::uuid AND p.visible
                  AND (p.starts_at IS NULL OR p.starts_at <= now())
                  AND (p.ends_at IS NULL OR p.ends_at > now())) AS n`,
      [fileId],
    );
    return Number(rows[0]?.n ?? 0) > 0;
  }
}
