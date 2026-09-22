import type { EntityManager } from 'typeorm';
import type { ITransactionContext } from './transaction-context';

/**
 * 메서드 하나를 트랜잭션으로 감싼다. bmes 의 `@TenantTransactional()` 자리.
 * 첫 인자가 `ITransactionContext` 여야 한다. 트랜잭션용 manager 를 실은 문맥으로 바꿔 넘기고,
 * 이미 트랜잭션 안이면(manager 가 있으면) 그대로 탄다 — 안쪽 호출이 따로 커밋하지 않는다.
 * 저장소는 `repository(ctx)` 가 manager 를 보므로 같은 트랜잭션으로 읽고 쓴다.
 *
 * `@ServiceException()` 을 위에, 이것을 아래에 붙인다. 안에서 던지면 롤백되고, 그 뒤에 에러 코드로 바뀐다.
 */
export function Transactional(): MethodDecorator {
  return (_target, _key, descriptor: PropertyDescriptor) => {
    const original = descriptor.value as (
      ctx: ITransactionContext,
      ...rest: unknown[]
    ) => Promise<unknown>;
    descriptor.value = async function (
      this: unknown,
      ctx: ITransactionContext,
      ...rest: unknown[]
    ) {
      if (!ctx?.dataSource)
        throw new Error(
          '@Transactional: 첫 인자가 ITransactionContext 여야 한다',
        );
      if (ctx.manager) return original.apply(this, [ctx, ...rest]);
      return ctx.dataSource.transaction((manager: EntityManager) =>
        original.apply(this, [{ ...ctx, manager }, ...rest]),
      );
    };
    return descriptor;
  };
}
