import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { FileEntity } from '../../../common/entity/file.entity';

@Injectable()
export class FileDefaultRepository {
  constructor(
    @InjectRepository(FileEntity) readonly repository: Repository<FileEntity>,
  ) {}

  findById(id: string): Promise<FileEntity | null> {
    return this.repository.findOne({ where: { id } });
  }

  /**
   * 파일마다 쓰는 곳의 수(같은 글은 한 번) — 대표 이미지(thumbnail) · 공유 이미지(og_image) ·
   * 첨부(posts_files) · 편집기로 본문에 넣은 그림(`/api/content/assets/<id>`) · 정적 장의 공유 그림
   * (page_meta, 관리 화면 「SEO」). 본문은 문자열 검색이다. 글이 수천 건이 되면 여기가 먼저 느려진다.
   */
  async usage(ids: string[]): Promise<Map<string, number>> {
    const out = new Map<string, number>();
    if (ids.length === 0) return out;
    const rows: Array<{ id: string; used: string }> =
      await this.repository.query(
        `SELECT f.id,
                (SELECT count(*) FROM posts p
                  WHERE p.thumbnail = f.id OR p.og_image = f.id
                     OR EXISTS (SELECT 1 FROM posts_files pf
                                 WHERE pf.posts_id = p.id AND pf.directus_files_id = f.id)
                     OR EXISTS (SELECT 1 FROM posts_translations t
                                 WHERE t.posts = p.id
                                   AND t.body LIKE '%/api/content/assets/' || f.id::text || '%')
                )
              + (SELECT count(*) FROM page_meta pm WHERE pm.og_image = f.id) AS used
           FROM directus_files f
          WHERE f.id = ANY($1::uuid[])`,
        [ids],
      );
    for (const r of rows) out.set(r.id, Number(r.used));
    return out;
  }

  /**
   * 글에서 이 파일을 뺀다. thumbnail · og_image · page_meta.og_image 는 FK 가 SET NULL,
   * posts_files 는 CASCADE 로도 풀리지만(migrations/0003·0007) 순서를 믿지 않고 직접 푼다. 본문에 넣은 그림은 <img> 를
   * 걷어 낸다 — 남기면 글에 깨진 그림이 보인다. id 는 uuid 라 정규식 특수문자가 없다.
   */
  async detach(m: EntityManager, id: string): Promise<void> {
    await m.query('UPDATE posts SET thumbnail = NULL WHERE thumbnail = $1', [
      id,
    ]);
    await m.query('UPDATE posts SET og_image = NULL WHERE og_image = $1', [id]);
    await m.query('UPDATE page_meta SET og_image = NULL WHERE og_image = $1', [
      id,
    ]);
    await m.query('DELETE FROM posts_files WHERE directus_files_id = $1', [id]);
    await m.query(
      `UPDATE posts_translations
          SET body = regexp_replace(body, '<img[^>]*/api/content/assets/' || $1::text || '[^>]*>', '', 'g')
        WHERE body LIKE '%/api/content/assets/' || $1::text || '%'`,
      [id],
    );
  }
}
