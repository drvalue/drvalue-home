// node --test src/core/autopost/service/autopost-plan.test.mjs  (빌드 뒤 dist 를 읽는다. DB 없이)
// 주 단위 기록 행을 보고 이번 틱에 할 일을 정한다. 한 주에 글은 한 편, 시도는 두 번까지.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const {
  planRun,
} = require('../../../../dist/core/autopost/service/autopost-plan.js');

const t0 = new Date('2026-11-10T00:00:00Z');
const h = (n) => new Date(t0.getTime() + n * 3600e3);
const row = (status, attempts = 1) => ({ status, attempts, startedOn: t0 });

test('기록이 없으면 시작', () => assert.equal(planRun(null, t0), 'start'));

test('진행 중은 2시간까지 기다리고 넘으면 닫는다', () => {
  assert.equal(planRun(row('running'), h(1.9)), 'none');
  assert.equal(planRun(row('running'), h(2.1)), 'reap');
});

test('오류로 끝난 주만, 두 번째 시도까지', () => {
  assert.equal(planRun(row('error', 1), h(1)), 'retry');
  assert.equal(planRun(row('error', 2), h(1)), 'none');
});

test('끝난 주는 다시 하지 않는다', () => {
  for (const s of ['published', 'drafted', 'skipped'])
    assert.equal(planRun(row(s), h(1)), 'none', s);
});

test('모르는 상태는 아무것도 안 한다', () =>
  assert.equal(planRun(row('weird'), h(5)), 'none'));
