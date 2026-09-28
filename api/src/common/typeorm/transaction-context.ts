import type { DataSource, EntityManager } from 'typeorm';

/**
 * 서비스·저장소가 첫 인자로 받는 DB 문맥. bmes 의 ITenantTransactionContext 를 한 DB 로 줄인 것이다
 * (테넌트 코드가 없다). `manager` 는 `@Transactional()` 안에서만 있다 — 있으면 그 트랜잭션으로 읽고 쓴다.
 */
export interface ITransactionContext {
  dataSource: DataSource;
  manager?: EntityManager;
  /** 바깥 트랜잭션이 커밋된 뒤 부를 일. `@Transactional()` 이 트랜잭션을 열 때만 만든다 — `onCommit` 으로 싣는다. */
  afterCommit?: Array<() => void>;
}

/**
 * 커밋이 끝난 뒤 한 번 부른다. 트랜잭션 안이면 가장 바깥 트랜잭션의 커밋 뒤로 미루고(롤백되면 안 부른다),
 * 밖이면 바로 부른다. 바깥 알림(IndexNow)처럼 저장을 기다리게 하거나 실패시키면 안 되는 일에 쓴다.
 */
export function onCommit(ctx: ITransactionContext, fn: () => void): void {
  if (ctx.afterCommit) ctx.afterCommit.push(fn);
  else fn();
}

/** 미들웨어가 요청에 문맥을 싣는 자리. `@TransactionContext()` 가 여기서 꺼낸다. */
export const TX_CONTEXT_KEY = '__txContext';

/** 요청 밖(예약 게시 cron 등)에서 문맥을 만든다. */
export function createTransactionContext(
  dataSource: DataSource,
): ITransactionContext {
  return { dataSource };
}
