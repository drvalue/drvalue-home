import { Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { DataSource } from 'typeorm';
import {
  createTransactionContext,
  TX_CONTEXT_KEY,
} from './transaction-context';

/** 모든 요청에 DB 문맥을 싣는다. 파라미터 데코레이터는 DI 를 못 받아서 여기서 넣어 둔다. */
@Injectable()
export class TransactionContextMiddleware implements NestMiddleware {
  constructor(private readonly dataSource: DataSource) {}

  use(req: Request, _res: Response, next: NextFunction): void {
    (req as unknown as Record<string, unknown>)[TX_CONTEXT_KEY] =
      createTransactionContext(this.dataSource);
    next();
  }
}
