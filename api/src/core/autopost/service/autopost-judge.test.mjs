// node --test src/core/autopost/service/autopost-judge.test.mjs  (빌드 뒤 dist 를 읽는다. DB·네트워크 없이)
// 판정 호출의 답을 판정 결과로 묶는다. 답에 없는 것, 실제로 열리지 않은 출처에 기댄 것은 전부 확인 안 된 것이다.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { good } from './autopost-fixture.mjs';

const require = createRequire(import.meta.url);
const {
  judgementFrom,
} = require('../../../../dist/core/autopost/service/autopost-judge.js');
const {
  judgedUnits,
} = require('../../../../dist/core/autopost/service/autopost-lint.js');

const all = (a) => ({
  claims: a.claims.map((_, i) => ({ n: i + 1, found: true })),
  sources: a.sources.map((_, i) => ({ n: i + 1, date_confirmed: true })),
  paragraphs: judgedUnits(a).map((_, i) => ({
    n: i + 1,
    supported: true,
    sources: [1],
  })),
  dates_ok: true,
});
const urls = good.sources.map((s) => s.url);
const allOk = (j) =>
  Object.values(j.claims).every(Boolean) &&
  Object.values(j.sources).every(Boolean) &&
  Object.values(j.units).every(Boolean) &&
  j.datesOk;

test('전부 확인', () =>
  assert.equal(allOk(judgementFrom(good, all(good), urls)), true));

test('답에 없는 번호는 확인 안 된 것', () => {
  const r = all(good);
  r.claims.pop();
  r.paragraphs.shift();
  const j = judgementFrom(good, r, urls);
  assert.equal(j.claims[good.claims.at(-1).sentence], false);
  assert.equal(j.units[judgedUnits(good)[0]], false);
});

test('같은 번호가 두 번 나오면 하나라도 아니면 아니다', () => {
  const r = all(good);
  r.claims.push({ n: 1, found: false });
  assert.equal(
    judgementFrom(good, r, urls).claims[good.claims[0].sentence],
    false,
  );
});

test('실제로 열리지 않은 출처는 미확인이고, 거기 기댄 주장도 없음이다', () => {
  const j = judgementFrom(good, all(good), [urls[0] + '/']); // 둘째 출처는 안 열렸다. 끝 빗금 차이는 같은 주소
  assert.equal(j.sources[urls[0]], true);
  assert.equal(j.sources[urls[1]], false);
  for (const c of good.claims)
    assert.equal(j.claims[c.sentence], c.source_url === urls[0]);
});

test('답의 형이 깨져도 던지지 않고 전부 미확인', () => {
  for (const r of [
    {},
    null,
    { claims: 'x', sources: [], paragraphs: null, dates_ok: 'yes' },
  ])
    assert.equal(allOk(judgementFrom(good, r, urls)), false);
});

test('열린 주소는 scheme·www·쿼리가 달라도 같은 글로 본다 (리다이렉트)', () => {
  const j = judgementFrom(good, all(good), [
    urls[0].replace('https://', 'http://www.') + '?ref=rss',
    urls[1] + '/',
  ]);
  assert.equal(allOk(j), true);
  assert.deepEqual(j.unopened, []);
});

test('열지 못한 출처 목록을 준다', () => {
  assert.deepEqual(judgementFrom(good, all(good), [urls[0]]).unopened, [
    urls[1],
  ]);
});

test('문단의 근거로 쓴 출처를 모은다 — 열린 것만, 「예」인 문단 것만', () => {
  const r = all(good);
  r.paragraphs[0] = { n: 1, supported: false, sources: [2] }; // 아니오인 문단의 근거는 안 센다
  r.paragraphs[1] = { n: 2, supported: true, sources: [2, 99, 'x'] }; // 없는 번호·깨진 값은 버린다
  assert.deepEqual(
    judgementFrom(good, r, urls).usedSources.sort(),
    [...urls].sort(),
  );
  assert.deepEqual(judgementFrom(good, r, [urls[0]]).usedSources, [urls[0]]); // 안 열린 출처는 근거가 못 된다
});

test('답에 없는 문단을 따로 알려 준다', () => {
  const r = all(good);
  r.paragraphs.shift();
  assert.deepEqual(judgementFrom(good, r, urls).unanswered, [
    judgedUnits(good)[0],
  ]);
});
