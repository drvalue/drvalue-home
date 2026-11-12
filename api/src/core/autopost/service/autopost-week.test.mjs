// node --test src/core/autopost/service/autopost-week.test.mjs  (빌드 뒤 dist 를 읽는다. DB 없이)
// 자동 글의 주 키와 「때가 됐나」. 운영 컨테이너에 TZ 가 없어 KST 를 코드에서 센다.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const {
  weekKey,
  isDue,
  kstDate,
} = require('../../../../dist/core/autopost/service/autopost-week.js');

test('주 키는 KST 로 센다', () => {
  assert.equal(weekKey(new Date('2026-11-09T14:59:00Z')), '2026-W46'); // KST 월 23:59
  assert.equal(weekKey(new Date('2026-11-08T15:00:00Z')), '2026-W46'); // KST 월 00:00
  assert.equal(weekKey(new Date('2026-11-08T14:59:00Z')), '2026-W45'); // KST 일 23:59
});

test('해 넘김 주', () => {
  assert.equal(weekKey(new Date('2026-12-31T03:00:00Z')), '2026-W53');
  assert.equal(weekKey(new Date('2027-01-03T03:00:00Z')), '2026-W53');
  assert.equal(weekKey(new Date('2027-01-04T03:00:00Z')), '2027-W01');
});

test('화요일 09:00 KST 부터', () => {
  assert.equal(isDue(new Date('2026-11-09T23:59:00Z')), false); // 화 08:59
  assert.equal(isDue(new Date('2026-11-10T00:00:00Z')), true); // 화 09:00
  assert.equal(isDue(new Date('2026-11-15T14:00:00Z')), true); // 일 23:00
  assert.equal(isDue(new Date('2026-11-09T03:00:00Z')), false); // 월 12:00
});

test('kstDate', () =>
  assert.equal(kstDate(new Date('2026-11-11T15:30:00Z')), '2026-11-12'));
