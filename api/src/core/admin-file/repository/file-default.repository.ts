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
   * 파일마다 쓰이는 곳의 수 — 글의 대표 이미지(thumbnail) · 공유 이미지(og_image) ·
   * 첨부(posts_files). 본문 HTML 안에 박힌 그림은 세지 않는다(문자열 검색이라 비싸다).
   */
  async usage(ids: string[]): Promise<Map<string, number>> {
    const out = new Map<string, number>();
    if (ids.length === 0) return out;
    const rows: Array<{ id: string; used: string }> =
      await this.repository.query(
        `SELECT f.id,
              (SELECT count(*) FROM posts p WHERE p.thumbnail = f.id OR p.og_image = f.id)
            + (SELECT count(*) FROM posts_files pf WHERE pf.directus_files_id = f.id) AS used
         FROM directus_files f
        WHERE f.id = ANY($1::uuid[])`,
        [ids],
      );
    for (const r of rows) out.set(r.id, Number(r.used));
    return out;
  }

  /**
   * 글에서 이 파일을 뺀다. posts.thumbnail 은 FK 가 SET NULL 로 풀지만 og_image 와
   * posts_files 는 FK 가 없어(Directus 시절 표) 직접 푼다.
   */
  async detach(m: EntityManager, id: string): Promise<void> {
    await m.query('UPDATE posts SET thumbnail = NULL WHERE thumbnail = $1', [
      id,
    ]);
    await m.query('UPDATE posts SET og_image = NULL WHERE og_image = $1', [id]);
    await m.query('DELETE FROM posts_files WHERE directus_files_id = $1', [id]);
  }
}
