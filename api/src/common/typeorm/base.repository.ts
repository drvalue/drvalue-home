import type { EntityTarget, ObjectLiteral, Repository } from 'typeorm';
import type { ITransactionContext } from './transaction-context';

/**
 * 엔티티 하나의 저장소. bmes 의 `RnBaseTenantRepository` 자리.
 * 기능 저장소는 이것을 상속하고 `repository(ctx)` 를 엔티티로 좁힌다:
 *
 *   override repository(ctx: ITransactionContext): Repository<PostEntity> {
 *     return super.repository(ctx, PostEntity);
 *   }
 *
 * 트랜잭션 안이면(ctx.manager) 그 manager 로, 밖이면 기본 연결로 간다.
 * 이름 붙은 질의(findPage · findMaxSort …)는 저장소 메서드로 둔다 — 서비스는 질의를 조립하지 않는다.
 */
export class BaseRepository<T extends ObjectLiteral> {
  repository(ctx: ITransactionContext, entity: EntityTarget<T>): Repository<T> {
    return (ctx.manager ?? ctx.dataSource.manager).getRepository(entity);
  }
}
