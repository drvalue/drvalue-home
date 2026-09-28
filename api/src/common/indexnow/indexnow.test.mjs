// node --test src/common/indexnow/indexnow.test.mjs  (빌드 뒤 dist 를 읽는다. 바깥으로 요청하지 않는다 — fetch 를 바꿔 낀다)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { Logger } = require('@nestjs/common');
const { IndexNowService } = require('../../../dist/common/indexnow/indexnow.service.js');
const { AppConfig } = require('../../../dist/common/config/app-config.js');
const {
  isIndexNowKey,
  isIndexablePost,
  postChangePaths,
  postPath,
  toSiteUrls,
} = require('../../../dist/common/indexnow/indexnow-urls.js');

const NOW = Date.parse('2026-09-28T00:00:00Z');
const pub = (over = {}) => ({
  board: 'notice',
  slug: 'open',
  status: 'published',
  publish_at: null,
  unpublish_at: null,
  no_index: false,
  ...over,
});

test('키 모양: 8~128자 영문·숫자·- 만', () => {
  assert.equal(isIndexNowKey('abcd1234'), true);
  assert.equal(isIndexNowKey('a-B-3'.padEnd(128, 'x')), true);
  assert.equal(isIndexNowKey('abc1234'), false); // 7자
  assert.equal(isIndexNowKey('x'.repeat(129)), false);
  assert.equal(isIndexNowKey(''), false);
  assert.equal(isIndexNowKey('abcd_1234'), false);
  assert.equal(isIndexNowKey('abcd1234.txt'), false);
  assert.equal(isIndexNowKey('../abcd1234'), false);
});

test('게시판 → 공개 주소: 글 주소가 있는 넷과 목록 장에 보이는 다섯', () => {
  assert.equal(postPath('notice', 'a'), '/page/support/notice/a');
  assert.equal(postPath('press', 'a'), '/page/support/press/a');
  assert.equal(postPath('news', 'a'), '/page/support/news/a');
  assert.equal(postPath('recruit', '채용 1'), '/page/support/recruit/%EC%B1%84%EC%9A%A9%201');
  assert.equal(postPath('patent', 'x'), '/page/tech/patent');
  assert.equal(postPath('copyright', 'x'), '/page/tech/copyright');
  assert.equal(postPath('case', 'x'), '/page/portfolio/portfolio');
  assert.equal(postPath('history', 'x'), '/page/company/history');
  assert.equal(postPath('faq', 'x'), '/page/support/faq');
  assert.equal(postPath('notice', ''), null);
  assert.equal(postPath('unknown', 'x'), null);
  assert.equal(postPath('toString', 'x'), null);
});

test('색인 대상: 공개 · 예약 공개 시각 지남 · 내림 시각 전 · 검색 제외 아님', () => {
  assert.equal(isIndexablePost(pub(), NOW), true);
  assert.equal(isIndexablePost(pub({ status: 'draft' }), NOW), false);
  assert.equal(isIndexablePost(pub({ no_index: true }), NOW), false);
  assert.equal(isIndexablePost(pub({ publish_at: '2026-09-29T00:00:00Z' }), NOW), false);
  assert.equal(isIndexablePost(pub({ publish_at: '2026-09-27T00:00:00Z' }), NOW), true);
  assert.equal(isIndexablePost(pub({ unpublish_at: '2026-09-27T00:00:00Z' }), NOW), false);
  assert.equal(isIndexablePost(null, NOW), false);
});

test('저장 전·후: 초안끼리는 안 알리고, 내림·지우기·주소 바꾸기는 옛 주소를 알린다', () => {
  assert.deepEqual(postChangePaths(null, pub({ status: 'draft' }), NOW), []);
  assert.deepEqual(postChangePaths(null, pub(), NOW), ['/page/support/notice/open']);
  assert.deepEqual(postChangePaths(pub(), null, NOW), ['/page/support/notice/open']);
  assert.deepEqual(postChangePaths(pub(), pub({ status: 'draft' }), NOW), ['/page/support/notice/open']);
  assert.deepEqual(postChangePaths(pub(), pub({ no_index: true }), NOW), ['/page/support/notice/open']);
  assert.deepEqual(postChangePaths(pub(), pub({ slug: 'new' }), NOW), [
    '/page/support/notice/open',
    '/page/support/notice/new',
  ]);
  // 자동 내림(예약 게시): 지금 보면 전도 내림 시각이 지났다 — 내림 시각 직전으로 보면 옛 주소가 나온다.
  const cut = '2026-09-27T12:00:00Z';
  const down = [pub({ unpublish_at: cut }), pub({ status: 'draft', unpublish_at: null })];
  assert.deepEqual(postChangePaths(...down, NOW), []);
  assert.deepEqual(postChangePaths(...down, Date.parse(cut) - 1), ['/page/support/notice/open']);
  assert.deepEqual(postChangePaths(pub({ board: 'patent' }), pub({ board: 'patent', slug: 'b' }), NOW), [
    '/page/tech/patent',
  ]);
});

test('운영 주소로 바꾸고 사이트 밖·관리 화면·API 경로는 버린다', () => {
  assert.deepEqual(toSiteUrls(['/', '/page/company/intro', '/page/company/intro', '//evil.example', '/admin', '/api/x', 'x']), [
    'https://drvalue.co.kr/',
    'https://drvalue.co.kr/page/company/intro',
  ]);
});

/** env 와 fetch 를 잠시 바꿔 끼우고 되돌린다. 요청은 밖으로 안 나간다. */
async function withEnv(env, fetchImpl, fn) {
  const saved = { INDEXNOW_KEY: process.env.INDEXNOW_KEY, NOINDEX: process.env.NOINDEX };
  const savedFetch = globalThis.fetch;
  const apply = (vals) => {
    for (const [k, v] of Object.entries(vals)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  };
  apply(env);
  globalThis.fetch = fetchImpl;
  Logger.overrideLogger(false);
  try {
    await fn();
  } finally {
    apply(saved);
    globalThis.fetch = savedFetch;
    Logger.overrideLogger(['log', 'error', 'warn']);
  }
}

const KEY = 'testkey-0123456789';

test('키 설정: 없거나 모양이 틀리거나 미리보기(NOINDEX=1)면 꺼진다', async () => {
  const f = globalThis.fetch;
  await withEnv({ INDEXNOW_KEY: undefined, NOINDEX: undefined }, f, async () => {
    assert.equal(AppConfig.indexNowKey, null);
  });
  await withEnv({ INDEXNOW_KEY: 'short', NOINDEX: undefined }, f, async () => {
    assert.equal(AppConfig.indexNowKey, null);
  });
  await withEnv({ INDEXNOW_KEY: KEY, NOINDEX: '1' }, f, async () => {
    assert.equal(AppConfig.indexNowKey, null);
  });
  await withEnv({ INDEXNOW_KEY: ` ${KEY} `, NOINDEX: undefined }, f, async () => {
    assert.equal(AppConfig.indexNowKey, KEY);
  });
});

test('보내기: 규약 모양 한 번 · 겹친 주소는 하나 · 시간 제한', async () => {
  const calls = [];
  const ok = async (url, init) => {
    calls.push({ url, body: JSON.parse(init.body), signal: init.signal });
    return { ok: true, status: 200 };
  };
  await withEnv({ INDEXNOW_KEY: KEY, NOINDEX: undefined }, ok, async () => {
    const s = new IndexNowService();
    s.enqueue(['/page/support/notice/a', '/page/support/notice/a', '/admin']);
    await s.flush();
    s.onModuleDestroy();
  });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, 'https://api.indexnow.org/indexnow');
  assert.deepEqual(calls[0].body, {
    host: 'drvalue.co.kr',
    key: KEY,
    keyLocation: `https://drvalue.co.kr/${KEY}.txt`,
    urlList: ['https://drvalue.co.kr/page/support/notice/a'],
  });
  assert.ok(calls[0].signal instanceof AbortSignal);
});

test('보내기: 꺼져 있으면 커밋 뒤 할 일도 안 싣고 요청도 없다', async () => {
  let called = 0;
  await withEnv({ INDEXNOW_KEY: undefined, NOINDEX: undefined }, async () => (called += 1), async () => {
    const s = new IndexNowService();
    const afterCommit = [];
    s.submitAfterCommit({ afterCommit }, ['/']);
    assert.equal(afterCommit.length, 0);
    s.enqueue(['/']);
    await s.flush();
    s.onModuleDestroy();
  });
  assert.equal(called, 0);
});

test('보내기: 네트워크가 죽어도 · 4xx 여도 던지지 않는다', async () => {
  for (const f of [
    async () => {
      throw new Error('network down');
    },
    async () => ({ ok: false, status: 403 }),
  ]) {
    await withEnv({ INDEXNOW_KEY: KEY, NOINDEX: undefined }, f, async () => {
      const s = new IndexNowService();
      s.enqueue(['/']);
      await s.flush(); // 던지면 여기서 실패한다
      s.onModuleDestroy();
    });
  }
});

test('최근 기록: 성공·실패·응답 없음을 새것부터 남기고, 키·주소는 안 싣는다', async () => {
  const seq = [
    async () => ({ ok: true, status: 200 }),
    async () => ({ ok: false, status: 403 }),
    async () => {
      throw new Error('network down');
    },
  ];
  let i = 0;
  await withEnv({ INDEXNOW_KEY: KEY, NOINDEX: undefined }, (...a) => seq[i++](...a), async () => {
    const s = new IndexNowService();
    assert.equal(s.enabled, true);
    assert.deepEqual(s.recent(), []);
    s.enqueue(['/', '/page/company/intro']);
    await s.flush();
    s.enqueue(['/']);
    await s.flush();
    s.enqueue(['/']);
    await s.flush();
    s.onModuleDestroy();
    const r = s.recent();
    assert.deepEqual(
      r.map((e) => [e.status, e.http_status, e.url_count]),
      [
        ['fail', null, 1],
        ['fail', 403, 1],
        ['ok', 200, 2],
      ],
    );
    for (const e of r) {
      assert.deepEqual(Object.keys(e).sort(), ['at', 'http_status', 'status', 'url_count']);
      assert.ok(!Number.isNaN(Date.parse(e.at)));
    }
    assert.ok(!JSON.stringify(r).includes(KEY));
    assert.ok(!JSON.stringify(r).includes('drvalue.co.kr'));
    // 복사본이다 — 받은 쪽이 고쳐도 기록은 그대로다.
    r[0].status = 'ok';
    assert.equal(s.recent()[0].status, 'fail');
  });
});

test('최근 기록: 20개까지만 둔다 · 꺼져 있으면 enabled 가 false', async () => {
  await withEnv({ INDEXNOW_KEY: KEY, NOINDEX: undefined }, async () => ({ ok: true, status: 202 }), async () => {
    const s = new IndexNowService();
    for (let n = 1; n <= 25; n++) {
      s.enqueue(Array.from({ length: n }, (_, k) => `/page/support/notice/n${k}`));
      await s.flush();
    }
    s.onModuleDestroy();
    const r = s.recent();
    assert.equal(r.length, 20);
    assert.equal(r[0].url_count, 25);
    assert.equal(r[19].url_count, 6);
  });
  await withEnv({ INDEXNOW_KEY: KEY, NOINDEX: '1' }, globalThis.fetch, async () => {
    assert.equal(new IndexNowService().enabled, false);
  });
  await withEnv({ INDEXNOW_KEY: undefined, NOINDEX: undefined }, globalThis.fetch, async () => {
    assert.equal(new IndexNowService().enabled, false);
  });
});
