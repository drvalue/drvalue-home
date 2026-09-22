import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { ITransactionContext, TX_CONTEXT_KEY } from './transaction-context';

/**
 * 컨트롤러가 서비스에 넘길 DB 문맥. bmes 의 `@TenantTransactionContext()` 자리.
 *
 *   list(@TransactionContext() ctx: ITransactionContext, …) { return this.service.list(ctx, …) }
 */
export const TransactionContext = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): ITransactionContext => {
    const req = ctx.switchToHttp().getRequest<Record<string, unknown>>();
    const found = req[TX_CONTEXT_KEY] as ITransactionContext | undefined;
    if (!found?.dataSource)
      throw new Error(
        'TransactionContextMiddleware 가 걸리지 않았다(DatabaseModule)',
      );
    return found;
  },
);
