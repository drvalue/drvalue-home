import type { DataSource, EntityManager } from 'typeorm';

/**
 * 서비스·저장소가 첫 인자로 받는 DB 문맥. bmes 의 ITenantTransactionContext 를 한 DB 로 줄인 것이다
 * (테넌트 코드가 없다). `manager` 는 `@Transactional()` 안에서만 있다 — 있으면 그 트랜잭션으로 읽고 쓴다.
 */
export interface ITransactionContext {
  dataSource: DataSource;
  manager?: EntityManager;
}

/** 미들웨어가 요청에 문맥을 싣는 자리. `@TransactionContext()` 가 여기서 꺼낸다. */
export const TX_CONTEXT_KEY = '__txContext';

/** 요청 밖(예약 게시 cron 등)에서 문맥을 만든다. */
export function createTransactionContext(
  dataSource: DataSource,
): ITransactionContext {
  return { dataSource };
}
