// DB 가 있어야 도는 검사(일반 테스트 줄에는 넣지 않는다). 실제 서버(`node dist/main.js`)를 띄워 HTTP 로 본다.
//   DB_HOST=… DB_PORT=… DB_NAME=… DB_USER=… DB_PASSWORD=… ADMIN_SESSION_SECRET=… node --test src/core/autopost/controller/autopost-http.dbtest.mjs
// 묶음을 받는 입구: 토큰 없으면 401 · 서버에 토큰이 없으면 전부 401 · 익명의 큰 본문은 413 · 규칙 읽기 · 공개 · 같은 주 두 번째는 거절 · 속도 제한.
// 서버의 「이번 주」(실제 오늘)에 글을 공개한다 — 이번 주 기록이 이미 있는 DB 에서는 돌지 않는다(남의 기록을 건드리지 않는다).
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { good } from '../service/autopost-fixture.mjs';

const require = createRequire(import.meta.url);
const { Client } = require('pg');
const { AppConfig } = require('../../../../dist/common/config/app-config.js');
const {
  weekKey,
  kstDate,
} = require('../../../../dist/core/autopost/service/autopost-week.js');
const {
  submitBundle,
  fetchRules,
} = require('../../../../dist/core/autopost/client/autopost-submit.client.js');

const API_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '../../../..');
const TOKEN = 'dbtest-' + 'k'.repeat(40);
const uploads = mkdtempSync(join(tmpdir(), 'autopost-http-'));
const week = weekKey(new Date());
const slug = `mfg-ai-${week.toLowerCase()}`;

const db = new Client({
  host: AppConfig.db.host,
  port: AppConfig.db.port,
  database: AppConfig.db.name,
  user: AppConfig.db.user,
  password: AppConfig.db.password,
  ssl: AppConfig.db.ssl,
});
await db.connect();
const taken =
  (await db.query('SELECT 1 FROM autopost_runs WHERE week_key = $1', [week]))
    .rowCount > 0;

const servers = [];
/** 서버 하나를 띄우고 뜰 때까지 기다린다. 루트 `.env` 의 켜기 값·키는 빈 값으로 덮는다(cron 이 돌지 않게). */
async function serve(port, token) {
  const child = spawn(process.execPath, ['dist/main.js'], {
    cwd: API_DIR,
    env: {
      ...process.env,
      PORT: String(port),
      UPLOADS_DIR: uploads,
      AUTOPOST_ENABLED: '',
      ANTHROPIC_API_KEY: '',
      AUTOPOST_PROVIDER: '',
      INDEXNOW_KEY: '',
      AUTOPOST_SUBMIT_TOKEN: token,
    },
    stdio: 'ignore',
  });
  servers.push(child);
  const origin = `http://127.0.0.1:${port}`;
  for (let i = 0; i < 100; i++) {
    try {
      await fetch(`${origin}/api/content/menu`);
      return origin;
    } catch {
      await new Promise((r) => setTimeout(r, 200));
    }
  }
  throw new Error('서버가 뜨지 않았다');
}

/** 헤더만 맞는 JPEG(1600×900). `bytes` 로 크기를 키운다 — 전역 본문 한도(100KB)를 넘는 묶음을 만들려고. */
const jpeg = (salt, bytes = 64) => {
  const b = Buffer.alloc(bytes);
  b.writeUInt16BE(0xffd8, 0);
  b.writeUInt16BE(0xffc0, 2);
  b.writeUInt16BE(17, 4);
  b[6] = 8;
  b.writeUInt16BE(900, 7);
  b.writeUInt16BE(1600, 9);
  b[40] = salt;
  return b.toString('base64');
};
// 고정 자료의 출처 날짜를 오늘 기준 14일 안으로 옮긴다(서버는 실제 오늘로 검사한다).
const day = (back) => kstDate(new Date(Date.now() - back * 24 * 3600 * 1000));
const article = {
  ...good,
  sources: good.sources.map((s, i) => ({ ...s, published: day(1 + i * 2) })),
};
const bundle = {
  article,
  pictures: [
    { section: null, data: jpeg(0, 300 * 1024) },
    { section: 1, data: jpeg(1) },
  ],
};
const post = (origin, body, token) =>
  fetch(`${origin}/api/autopost/bundle`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify(body),
  });
const run = async () =>
  (await db.query('SELECT * FROM autopost_runs WHERE week_key = $1', [week]))
    .rows[0];

after(async () => {
  for (const child of servers) child.kill();
  if (!taken) {
    await db.query('DELETE FROM autopost_runs WHERE week_key = $1', [week]);
    await db.query('DELETE FROM posts WHERE slug = $1', [slug]);
    await db.query(
      'DELETE FROM directus_files WHERE filename_download LIKE $1',
      [`${slug}-%`],
    );
  }
  await db.end();
  rmSync(uploads, { recursive: true, force: true });
});

const opts = {
  skip: taken && `이번 주(${week}) 기록이 이미 있는 DB 다 — 건드리지 않는다`,
};

test('서버에 토큰이 없으면 닫힌다 — 무엇을 보내도 401', opts, async () => {
  const origin = await serve(3597, '');
  for (const token of [undefined, TOKEN, 'null', '']) {
    const res = await fetch(`${origin}/api/autopost/rules`, {
      headers: token === undefined ? {} : { Authorization: `Bearer ${token}` },
    });
    assert.equal(res.status, 401, String(token));
  }
  const res = await post(origin, bundle, TOKEN);
  // 토큰이 안 맞으니 큰 한도로 읽지 않는다 — 300KB 묶음은 전역 한도에 걸린다.
  assert.equal(res.status, 413);
  assert.equal((await post(origin, { article }, TOKEN)).status, 401);
  assert.equal(await run(), undefined);
});

test(
  '토큰이 있어야 들어온다 · 공개 · 한 주에 한 편 · 속도 제한',
  opts,
  async () => {
    const origin = await serve(3598, TOKEN);

    // 토큰 없이·틀린 토큰으로
    const none = await fetch(`${origin}/api/autopost/rules`);
    assert.equal(none.status, 401);
    const body = await none.json();
    assert.equal(body.resultCode, 'AUTOPOST_UNAUTHORIZED');
    assert.ok(!JSON.stringify(body).includes(TOKEN));
    assert.equal(
      (
        await fetch(`${origin}/api/autopost/rules`, {
          headers: { Authorization: `Bearer ${TOKEN}x` },
        })
      ).status,
      401,
    );
    // 규칙 읽기(보내는 쪽 코드로)
    const rules = await fetchRules(origin, TOKEN);
    assert.ok(rules.includes('글의 구조(JSON Schema)'));
    assert.ok(rules.includes('이미 다룬 글의 제목'));

    // 묶음 — 익명의 큰 본문은 읽지 않는다(413), 작은 본문은 401
    assert.equal((await post(origin, bundle)).status, 413); // 본문 읽기에서 끊긴다 — 속도 제한에 안 센다
    assert.equal((await post(origin, { article })).status, 401); // 1
    assert.equal(await run(), undefined);
    // 글이 빠진 본문은 400
    assert.equal((await post(origin, { pictures: [] }, TOKEN)).status, 400); // 2
    // 형이 깨진 글은 거절(200) — 기록을 잡지 않는다
    const broken = await submitBundle(origin, TOKEN, { article: { title: 1 } }); // 3
    assert.equal(broken.outcome, 'refused');
    assert.equal(await run(), undefined);

    // 공개 — 300KB 그림이 든 묶음이 전역 한도를 넘어 들어온다
    const done = await submitBundle(origin, TOKEN, bundle); // 4
    assert.equal(done.outcome, 'published', done.reasons.join(' / '));
    assert.equal(done.pictures, 2);
    const saved = (
      await db.query('SELECT slug, status FROM posts WHERE id = $1', [
        done.post_id,
      ])
    ).rows[0];
    assert.deepEqual(saved, { slug, status: 'published' });
    assert.equal((await run()).status, 'published');
    // 공개 API 로 읽힌다
    const pub = await fetch(`${origin}/api/content/posts/${slug}`);
    assert.equal(pub.status, 200);

    // 같은 주에 한 번 더: 거절(200) — 한 주에 한 편
    const again = await submitBundle(origin, TOKEN, bundle); // 5
    assert.equal(again.outcome, 'refused');
    // 여섯 번째 요청은 속도 제한(분 5회) — 토큰이 맞아도
    const sixth = await post(origin, bundle, TOKEN);
    assert.equal(sixth.status, 429);
    assert.equal(
      (
        await db.query('SELECT count(*)::int AS n FROM posts WHERE slug = $1', [
          slug,
        ])
      ).rows[0].n,
      1,
    );
  },
);

test(
  '같은 주에 한 번 더 넣으면 거절한다(서버를 새로 띄워 속도 제한을 비운 뒤)',
  opts,
  async () => {
    const origin = await serve(3599, TOKEN);
    const again = await submitBundle(origin, TOKEN, bundle);
    assert.equal(again.outcome, 'refused');
    assert.ok(
      again.reasons.join(' ').includes('이미'),
      again.reasons.join(' / '),
    );
  },
);
