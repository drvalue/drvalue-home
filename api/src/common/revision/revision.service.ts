import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RevisionEntity } from '../entity/revision.entity';

/**
 * 변경 이력. 관리 서비스가 저장·삭제할 때마다 한 줄 남긴다.
 * before/after 는 화면이 돌려주는 모양(full) 그대로 — 복구가 그걸 다시 PUT 한다.
 */
@Injectable()
export class RevisionService {
  constructor(
    @InjectRepository(RevisionEntity)
    private readonly revisions: Repository<RevisionEntity>,
  ) {}

  async record(input: {
    actor: string;
    action: 'create' | 'update' | 'delete' | 'restore';
    collection: string;
    itemId: string | number;
    before?: unknown;
    after?: unknown;
  }): Promise<void> {
    await this.revisions.save(
      this.revisions.create({
        actor: input.actor,
        action: input.action,
        collection: input.collection,
        itemId: String(input.itemId),
        before: input.before ?? null,
        after: input.after ?? null,
      }),
    );
  }

  async listFor(
    collection: string,
    itemId: string | number,
    limit = 50,
  ): Promise<RevisionEntity[]> {
    return this.revisions.find({
      where: { collection, itemId: String(itemId) },
      order: { id: 'DESC' },
      take: limit,
    });
  }

  async listRecent(options: {
    collection?: string;
    actor?: string;
    page?: number;
    pageSize?: number;
  }) {
    const page = Math.max(1, options.page ?? 1);
    const take = Math.min(100, options.pageSize ?? 50);
    const where: Record<string, string> = {};
    if (options.collection) where.collection = options.collection;
    if (options.actor) where.actor = options.actor;
    const [rows, total] = await this.revisions.findAndCount({
      where,
      order: { id: 'DESC' },
      skip: (page - 1) * take,
      take,
    });
    return { data: rows, total, page, pageSize: take };
  }

  async get(id: number): Promise<RevisionEntity | null> {
    return this.revisions.findOne({ where: { id } });
  }
}
