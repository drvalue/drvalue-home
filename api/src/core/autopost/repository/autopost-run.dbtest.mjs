// DB 가 있어야 도는 검사(일반 테스트 줄에는 넣지 않는다).
//   DB_HOST=… DB_PORT=… DB_NAME=… DB_USER=… DB_PASSWORD=… node --test src/core/autopost/repository/autopost-run.dbtest.mjs
// 마이그레이션 0023 이 깔린 DB 에서 주 잡기·다시 잡기·닫기가 한 주를 한 번만 잡는지 본다.
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { DataSource } = require('typeorm');
const { AutopostRunEntity } = require('../../../../dist/common/entity/autopost-run.entity.js');
const { AutopostRunDefaultRepository } = require('../../../../dist/core/autopost/repository/autopost-run-default.repository.js');

const dataSource = await new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  database: process.env.DB_NAME,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  entities: [AutopostRunEntity],
}).initialize();
const ctx = { dataSource };
const repo = new AutopostRunDefaultRepository();
const WEEK = '1999-W01';
const clean = () => dataSource.query('DELETE FROM autopost_runs WHERE week_key = $1', [WEEK]);
await clean();
after(async () => {
  await clean();
  await dataSource.destroy();
});

test('한 주는 한 번만 잡힌다', async () => {
  const both = await Promise.all([repo.claim(ctx, WEEK), repo.claim(ctx, WEEK)]);
  assert.deepEqual(both.sort(), [false, true]);
  assert.equal((await repo.findByWeek(ctx, WEEK)).status, 'running');
});

test('진행 중인 주는 다시 잡히지 않는다', async () => assert.equal(await repo.claimRetry(ctx, WEEK), false));

test('오류로 닫으면 한 번 더 잡히고, 그 뒤로는 안 잡힌다', async () => {
  await repo.finish(ctx, WEEK, { status: 'error', reason: 'x' });
  assert.equal(await repo.claimRetry(ctx, WEEK), true);
  const row = await repo.findByWeek(ctx, WEEK);
  assert.equal(row.attempts, 2);
  assert.equal(row.finishedOn, null);
  await repo.finish(ctx, WEEK, { status: 'error', reason: 'y' });
  assert.equal(await repo.claimRetry(ctx, WEEK), false);
});

test('닫힌 주는 덮어쓰지 않는다 · 죽은 진행 중만 닫는다', async () => {
  await repo.finish(ctx, WEEK, { status: 'published', postId: 1 });
  assert.equal((await repo.findByWeek(ctx, WEEK)).status, 'error');
  assert.equal(await repo.reap(ctx, WEEK), false);
});

test('공개한 글의 구조를 최근 순으로 준다', async () => {
  await clean();
  await repo.claim(ctx, WEEK);
  await repo.finish(ctx, WEEK, { status: 'published', postId: 7, article: { title: 't', sources: [{ url: 'https://a.example/x' }] }, inputTokens: 10, outputTokens: 2 });
  const row = await repo.findByWeek(ctx, WEEK);
  assert.equal(row.postId, 7);
  assert.ok(row.finishedOn);
  const list = await repo.findPublishedArticles(ctx);
  assert.ok(list.some((a) => a.title === 't'));
});
