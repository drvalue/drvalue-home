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
  paragraphs: judgedUnits(a).map((_, i) => ({ n: i + 1, supported: true })),
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
