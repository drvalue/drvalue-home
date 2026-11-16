// node --test src/core/autopost/service/autopost-submit.test.mjs  (빌드 뒤 dist 를 읽는다. DB·서버 없이)
// 묶음을 받는 입구의 문(토큰)과 보내는 쪽. 빠뜨리면 닫힌다 — 토큰이 없거나 모양이 틀리면 무엇을 보내도 못 들어온다.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { AppConfig } = require('../../../../dist/common/config/app-config.js');
const {
  bearerMatches,
} = require('../../../../dist/core/autopost/guard/autopost-token.guard.js');
const {
  submitOrigin,
  submitBundle,
  fetchRules,
} = require('../../../../dist/core/autopost/client/autopost-submit.client.js');

const TOKEN = 'a'.repeat(31) + 'Z';
const set = (name, value) => {
  if (value === undefined) delete process.env[name];
  else process.env[name] = value;
};

test('토큰 설정: 비었거나 짧거나 모양이 틀리면 없는 것이다', () => {
  for (const v of [
    undefined,
    '',
    '   ',
    'short',
    'a'.repeat(31),
    `${'a'.repeat(31)} b`,
    `${'a'.repeat(40)}!`,
    'a'.repeat(257),
  ]) {
    set('AUTOPOST_SUBMIT_TOKEN', v);
    assert.equal(AppConfig.autopost.submitToken, null, JSON.stringify(v));
  }
  set('AUTOPOST_SUBMIT_TOKEN', ` ${TOKEN}\n`);
  assert.equal(AppConfig.autopost.submitToken, TOKEN); // 앞뒤 공백은 뗀다
  set('AUTOPOST_SUBMIT_TOKEN', undefined);
});

test('묶음 공개 스위치: 켜기 값도 토큰도 없으면 닫힌다. 토큰만으로는 cron 이 켜지지 않는다', () => {
  set('AUTOPOST_ENABLED', undefined);
  set('ANTHROPIC_API_KEY', undefined);
  set('AUTOPOST_SUBMIT_TOKEN', undefined);
  assert.equal(AppConfig.autopost.canPublishGiven, false);
  set('AUTOPOST_SUBMIT_TOKEN', 'short');
  assert.equal(AppConfig.autopost.canPublishGiven, false);
  set('AUTOPOST_SUBMIT_TOKEN', TOKEN);
  assert.equal(AppConfig.autopost.canPublishGiven, true);
  assert.equal(AppConfig.autopost.ready, false);
  set('AUTOPOST_SUBMIT_TOKEN', undefined);
  set('AUTOPOST_ENABLED', '1');
  assert.equal(AppConfig.autopost.canPublishGiven, true);
  set('AUTOPOST_ENABLED', undefined);
});

test('헤더 검사: 설정이 없으면 무엇을 보내도 거짓', () => {
  for (const h of [undefined, '', 'Bearer ', `Bearer ${TOKEN}`, 'Bearer null'])
    assert.equal(bearerMatches(null, h), false, JSON.stringify(h));
});

test('헤더 검사: 정확히 Bearer <같은 토큰> 만 참', () => {
  assert.equal(bearerMatches(TOKEN, `Bearer ${TOKEN}`), true);
  for (const h of [
    undefined,
    '',
    TOKEN,
    `bearer ${TOKEN}`,
    `Bearer  ${TOKEN}`,
    `Bearer ${TOKEN} `,
    `Bearer ${TOKEN}x`,
    `Bearer ${TOKEN.slice(0, -1)}`,
    `Bearer ${TOKEN.toLowerCase()}`,
    `Basic ${TOKEN}`,
    [`Bearer ${TOKEN}`],
  ])
    assert.equal(bearerMatches(TOKEN, h), false, JSON.stringify(h));
});

test('보내는 주소: https 만. 이 기계 주소만 http. 로그인 정보가 든 주소는 거부', () => {
  assert.equal(
    submitOrigin('https://drvalue.co.kr/어디든'),
    'https://drvalue.co.kr',
  );
  assert.equal(submitOrigin('http://localhost:3500'), 'http://localhost:3500');
  assert.equal(submitOrigin('http://127.0.0.1:3500/'), 'http://127.0.0.1:3500');
  for (const u of [
    '',
    'drvalue.co.kr',
    'http://drvalue.co.kr',
    'http://localhost.example.com',
    'ftp://drvalue.co.kr',
    'https://user:pw@drvalue.co.kr',
  ])
    assert.equal(submitOrigin(u), null, u);
});

test('보내기: 토큰은 헤더에만, 넘겨 보내는 곳은 안 따라간다, 묶음의 다른 칸은 안 보낸다', async () => {
  let seen;
  const ok = async (url, init) => {
    seen = { url, init };
    return {
      ok: true,
      status: 200,
      json: async () => ({
        data: { outcome: 'published', reasons: [], post_id: 7, pictures: 1 },
      }),
    };
  };
  const done = await submitBundle(
    'https://drvalue.co.kr',
    TOKEN,
    {
      article: { title: 't' },
      pictures: [{ section: null, mime: 'image/jpeg', data: 'AAAA' }],
      madeOn: 'x',
    },
    ok,
  );
  assert.equal(done.post_id, 7);
  assert.equal(seen.url, 'https://drvalue.co.kr/api/autopost/bundle');
  assert.equal(seen.init.headers.Authorization, `Bearer ${TOKEN}`);
  assert.equal(seen.init.redirect, 'error');
  assert.ok(!seen.url.includes(TOKEN) && !seen.init.body.includes(TOKEN));
  assert.deepEqual(JSON.parse(seen.init.body), {
    article: { title: 't' },
    pictures: [{ section: null, data: 'AAAA' }],
  });
});

test('보내기: 한도(9MB)를 넘는 묶음은 서버를 부르지 않고 던진다', async () => {
  let called = 0;
  const never = async () => {
    called++;
    throw new Error('부르면 안 된다');
  };
  const big = {
    article: {},
    pictures: [{ section: null, data: 'A'.repeat(9 * 1024 * 1024) }],
  };
  await assert.rejects(
    () => submitBundle('https://drvalue.co.kr', TOKEN, big, never),
    /너무 큽니다/,
  );
  assert.equal(called, 0);
});

test('보내기: 서버가 거절하면 던진다 — 문장에 토큰이 없다', async () => {
  const denied = async () => ({
    ok: false,
    status: 401,
    json: async () => ({
      data: null,
      resultCode: 'AUTOPOST_UNAUTHORIZED',
      message: '인증이 필요합니다.',
    }),
  });
  await assert.rejects(
    () => fetchRules('https://drvalue.co.kr', TOKEN, denied),
    (e) =>
      e.message.includes('401') &&
      e.message.includes('AUTOPOST_UNAUTHORIZED') &&
      !e.message.includes(TOKEN),
  );
  // JSON 이 아닌 답(앞단의 오류 장)도 던진다
  const html = async () => ({
    ok: true,
    status: 200,
    json: async () => {
      throw new Error('not json');
    },
  });
  await assert.rejects(() => fetchRules('https://drvalue.co.kr', TOKEN, html));
});
