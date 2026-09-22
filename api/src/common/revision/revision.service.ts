import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { ITransactionContext } from '../typeorm/transaction-context';
import { RevisionEntity } from '../entity/revision.entity';

/**
 * 변경 이력 기록기. 관리 서비스가 저장·삭제·되돌릴 때마다 한 줄 남긴다.
 * before/after 는 그 기능의 관리 화면 응답 모양 그대로 — 되돌리기가 그걸 다시 저장한다.
 * 읽기(목록·한 건)는 admin-revision 모듈의 저장소가 한다.
 */
@Injectable()
export class RevisionService {
  constructor(
    @InjectRepository(RevisionEntity)
    private readonly revisions: Repository<RevisionEntity>,
  ) {}

  /**
   * 한 줄 남긴다. `ctx` 를 주면 그 트랜잭션 안에서 쓴다 — 저장이 롤백되면 이력도 같이 사라진다.
   */
  async record(
    input: {
      actor: string;
      action: 'create' | 'update' | 'delete' | 'restore';
      collection: string;
      itemId: string | number;
      before?: unknown;
      after?: unknown;
    },
    ctx?: ITransactionContext,
  ): Promise<void> {
    const repo = ctx?.manager
      ? ctx.manager.getRepository(RevisionEntity)
      : this.revisions;
    await repo.save(
      repo.create({
        actor: input.actor,
        action: input.action,
        collection: input.collection,
        itemId: String(input.itemId),
        before: input.before ?? null,
        after: input.after ?? null,
      }),
    );
  }
}
