import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import {
  createTransactionContext,
  type ITransactionContext,
} from './transaction-context';

/**
 * 요청 밖(cron 등)에서 DB 문맥을 만든다. 요청 안에서는 `@TransactionContext()` 가 준다.
 * 서비스가 DataSource 를 직접 들지 않게 하려고 둔다 — 질의는 저장소에만 있다.
 */
@Injectable()
export class TransactionContextFactory {
  constructor(private readonly dataSource: DataSource) {}

  create(): ITransactionContext {
    return createTransactionContext(this.dataSource);
  }
}
