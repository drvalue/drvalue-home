// node --test src/core/autopost/service/autopost-flow.test.mjs  (빌드 뒤 dist 를 읽는다. DB·네트워크 없이)
// 글 한 편의 순서: 조사 → 집필 → 구조 검사 → 판정 → 주장 검사. 떨어지면 한 번만 다시 쓴다.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { good, allTrue, withHook } from './autopost-fixture.mjs';

const require = createRequire(import.meta.url);
const {
  produce,
} = require('../../../../dist/core/autopost/service/autopost-produce.js');

const input = { today: '2026-11-12', avoidTitles: [], avoidUrls: [] };
const bad = withHook(good, '불량률이 47% 줄었습니다.'); // 주장에 없는 숫자 — 구조 검사에서 떨어진다
const research = {
  topic: 't',
  notes: 'n',
  sourceUrls: good.sources.map((s) => s.url),
};

/** 호출 횟수를 세는 가짜. articles 는 write 가 차례로 내는 글. */
function fake({ articles, verified = () => true }) {
  const calls = { research: 0, write: 0, verify: 0 };
  const client = {
    calls,
    lastWrite: null,
    async research() {
      calls.research++;
      return { research, usage: { input: 10, output: 1 } };
    },
    async write(w) {
      client.lastWrite = w;
      return {
        article: articles[calls.write++],
        usage: { input: 20, output: 2 },
      };
    },
    async verify(a) {
      calls.verify++;
      const judged = allTrue(a);
      for (const c of a.claims) judged.claims[c.sentence] = verified(c);
      return { judged, usage: { input: 30, output: 3 } };
    },
  };
  return client;
}

test('한 번에 통과', async () => {
  const c = fake({ articles: [good] });
  const r = await produce(c, input);
  assert.equal(r.ok, true);
  assert.deepEqual(r.reasons, []);
  assert.deepEqual(c.calls, { research: 1, write: 1, verify: 1 });
});

test('떨어지면 한 번만 다시 쓴다', async () => {
  const c = fake({ articles: [bad, good] });
  const r = await produce(c, input);
  assert.equal(r.ok, true);
  assert.equal(c.calls.write, 2);
  assert.ok(c.lastWrite.errors.length);
  assert.equal(c.lastWrite.previous, bad);
  assert.equal(r.article, good);
});

test('두 번 떨어지면 탈락', async () => {
  const c = fake({ articles: [bad, bad] });
  const r = await produce(c, input);
  assert.equal(r.ok, false);
  assert.equal(c.calls.write, 2);
  assert.ok(r.reasons.length);
});

test('구조 검사에 떨어지면 판정 호출을 안 한다', async () => {
  const c = fake({ articles: [bad, bad] });
  await produce(c, input);
  assert.equal(c.calls.verify, 0);
});

test('판정이 없다고 한 주장이 있으면 다시 쓰고, 또 없으면 탈락', async () => {
  const c = fake({ articles: [good, good], verified: () => false });
  const r = await produce(c, input);
  assert.equal(r.ok, false);
  assert.deepEqual(c.calls, { research: 1, write: 2, verify: 2 });
  assert.match(r.reasons.join(), /확인되지 않은 주장/);
});

test('토큰 수를 전부 더한다', async () => {
  const r = await produce(fake({ articles: [good] }), input);
  assert.deepEqual(r.usage, { input: 60, output: 6 });
});

test('이미 낸 출처는 조사에 넘기고 검사에도 쓴다', async () => {
  const c = fake({ articles: [good, good] });
  const r = await produce(c, { ...input, avoidUrls: [good.sources[0].url] });
  assert.equal(r.ok, false);
  assert.match(r.reasons.join(), /이미 낸 글의 출처/);
});

test('형이 깨진 글은 던지지 않고 탈락', async () => {
  const r = await produce(fake({ articles: [{}, { title: 1 }] }), input);
  assert.equal(r.ok, false);
});
