// DB 가 있어야 도는 검사(일반 테스트 줄에는 넣지 않는다). Claude 는 부르지 않는다 — 가짜를 끼운다.
//   DB_HOST=… DB_PORT=… DB_NAME=… DB_USER=… DB_PASSWORD=… ADMIN_SESSION_SECRET=… node --test src/core/autopost/service/autopost-flow.dbtest.mjs
// 앱을 HTTP 없이 띄워 한 주의 흐름을 본다: 꺼짐 · 때가 아님 · 공개 · 같은 주 두 번 · 탈락 · 오류 뒤 한 번 더 · 초안 · 표지 그림.
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { existsSync, mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { good, allTrue, withHook } from './autopost-fixture.mjs';

const require = createRequire(import.meta.url);
const { NestFactory } = require('@nestjs/core');
const { DataSource } = require('typeorm');
const { SchedulerRegistry } = require('@nestjs/schedule');
const { AppModule } = require('../../../../dist/app/app.module.js');
const {
  AutopostDefaultService,
} = require('../../../../dist/core/autopost/service/autopost-default.service.js');
const {
  AdminPostDefaultService,
} = require('../../../../dist/core/admin-post/service/admin-post-default.service.js');

delete process.env.AUTOPOST_ENABLED;
delete process.env.ANTHROPIC_API_KEY;
const app = await NestFactory.createApplicationContext(AppModule, {
  logger: false,
});
for (const job of app.get(SchedulerRegistry).getCronJobs().values()) job.stop(); // 테스트 동안 cron 을 돌리지 않는다
const service = app.get(AutopostDefaultService);
const posts = app.get(AdminPostDefaultService);
const dataSource = app.get(DataSource);
const ctx = { dataSource };

const calls = { research: 0, write: 0, verify: 0 };
let next = { article: good, fail: false };
service.client = {
  async research() {
    calls.research++;
    if (next.fail) throw new Error('가짜 API 실패');
    return {
      research: {
        topic: 't',
        notes: 'n',
        sourceUrls: good.sources.map((x) => x.url),
      },
      usage: { input: 1, output: 1 },
    };
  },
  async write() {
    calls.write++;
    return { article: next.article, usage: { input: 1, output: 1 } };
  },
  async verify(a) {
    calls.verify++;
    return { judged: allTrue(a), usage: { input: 1, output: 1 } };
  },
  // 그림 판정(다른 모델). 기본은 「뺄 것 없음」 — 그림 테스트가 illustrate 만 갈아 끼운다.
  inspect: async () => ({ marked: [], pairs: [] }),
};

// 고정 자료의 출처 날짜(2026-11-10·11-05)가 14일 안에 들게 2026-11-12 주변의 시각만 쓴다.
const TUE = new Date('2026-11-10T03:00:00Z'); // KST 화 12:00, 2026-W46
const MON = new Date('2026-11-09T03:00:00Z'); // KST 월 12:00, 2026-W46
const NEXT = new Date('2026-11-17T03:00:00Z'); // 2026-W47
const uploads = mkdtempSync(join(tmpdir(), 'autopost-uploads-'));
process.env.UPLOADS_DIR = uploads; // 실제 업로드 폴더에 쓰지 않는다
const coverRows = () =>
  dataSource.query(
    `SELECT id, filename_disk, type, width, height FROM directus_files WHERE filename_download LIKE 'mfg-ai-2026-w4%'`,
  );
/** 헤더만 있는 JPEG — 치수 읽기가 1600×900 으로 읽는다. */
const jpeg = (width = 1600, height = 900, salt = 0) => {
  const b = Buffer.alloc(64);
  b.writeUInt16BE(0xffd8, 0);
  b.writeUInt16BE(0xffc0, 2);
  b.writeUInt16BE(17, 4);
  b[6] = 8;
  b.writeUInt16BE(height, 7);
  b.writeUInt16BE(width, 9);
  b[40] = salt; // 같은 바이트의 그림은 겹친 것으로 빠진다 — 자리마다 다르게
  return b;
};
const row = async (week) =>
  (
    await dataSource.query('SELECT * FROM autopost_runs WHERE week_key = $1', [
      week,
    ])
  )[0];
const clean = async () => {
  await dataSource.query(
    `DELETE FROM autopost_runs WHERE week_key IN ('2026-W46','2026-W47')`,
  );
  await dataSource.query(`DELETE FROM posts WHERE slug LIKE 'mfg-ai-2026-w4%'`);
  // 표지 그림: 행과 디스크 파일을 같이 지운다(올린 이름이 글 주소로 시작한다).
  for (const f of await coverRows())
    rmSync(join(uploads, f.filename_disk), { force: true });
  await dataSource.query(
    `DELETE FROM directus_files WHERE filename_download LIKE 'mfg-ai-2026-w4%'`,
  );
};
await clean();
after(async () => {
  await clean();
  rmSync(uploads, { recursive: true, force: true });
  await app.close();
});

test('꺼져 있으면 Claude 를 부르지 않고 기록도 없다', async () => {
  assert.equal(await service.run(ctx, 'auto', TUE), null);
  process.env.ANTHROPIC_API_KEY = 'fake';
  assert.equal(await service.run(ctx, 'auto', TUE), null); // 키만 있고 켜기 값이 없다
  assert.equal(calls.research, 0);
  assert.equal(await row('2026-W46'), undefined);
});

test('켜져 있어도 화요일 09:00 전에는 안 돈다', async () => {
  process.env.AUTOPOST_ENABLED = '1';
  assert.equal(await service.run(ctx, 'auto', MON), null);
  assert.equal(calls.research, 0);
});

test('통과하면 뉴스 게시판에 공개로 저장한다', async () => {
  const r = await service.run(ctx, 'auto', TUE);
  assert.equal(r.outcome, 'published');
  const post = await posts.get(ctx, r.postId);
  assert.equal(post.board, 'news');
  assert.equal(post.status, 'published');
  assert.equal(post.slug, 'mfg-ai-2026-w46');
  assert.equal(post.published_date, '2026-11-10');
  const ko = post.translations.find((t) => t.languages_code === 'ko-KR');
  assert.equal(ko.title, good.title);
  assert.equal(ko.body, r.html);
  assert.equal(ko.seo_description, good.seo_description);
  const run = await row('2026-W46');
  assert.equal(run.status, 'published');
  assert.equal(run.post_id, r.postId);
  assert.equal(run.input_tokens, 3);
  const rev = await dataSource.query(
    `SELECT * FROM admin_revisions WHERE collection = 'posts' ORDER BY id DESC LIMIT 1`,
  );
  assert.equal(JSON.stringify(rev[0]).includes('autopost@system'), true);
});

test('같은 주에 다시 불러도 글은 한 편', async () => {
  const before = calls.research;
  assert.equal(
    await service.run(ctx, 'auto', new Date(TUE.getTime() + 3600e3)),
    null,
  );
  assert.equal(calls.research, before);
  const n = await dataSource.query(
    `SELECT count(*)::int AS n FROM posts WHERE slug LIKE 'mfg-ai-2026-w4%'`,
  );
  assert.equal(n[0].n, 1);
});

test('검사에 떨어지면 글을 만들지 않고 기록만 남기며, 그 주는 다시 하지 않는다', async () => {
  // 지난주 글의 출처와 겹쳐서 떨어진다(이미 낸 출처) — 다시 써도 같다.
  const r = await service.run(ctx, 'auto', NEXT);
  assert.equal(r.outcome, 'skipped');
  assert.match(r.reasons.join(), /이미 낸 글의 출처|오래됐습니다/);
  const run = await row('2026-W47');
  assert.equal(run.status, 'skipped');
  assert.equal(run.post_id, null);
  assert.ok(run.article);
  assert.ok(run.reason);
  const n = await dataSource.query(
    `SELECT count(*)::int AS n FROM posts WHERE slug LIKE 'mfg-ai-2026-w4%'`,
  );
  assert.equal(n[0].n, 1);
  const before = calls.research;
  assert.equal(
    await service.run(ctx, 'auto', new Date(NEXT.getTime() + 3600e3)),
    null,
  );
  assert.equal(calls.research, before);
});

test('호출이 실패하면 오류로 닫고 한 번만 더 한다', async () => {
  await clean();
  next = { article: good, fail: true };
  assert.equal(await service.run(ctx, 'auto', TUE), null);
  assert.equal((await row('2026-W46')).status, 'error');
  assert.equal(await service.run(ctx, 'auto', TUE), null);
  const run = await row('2026-W46');
  assert.equal(run.status, 'error');
  assert.equal(run.attempts, 2);
  const before = calls.research;
  assert.equal(await service.run(ctx, 'auto', TUE), null);
  assert.equal(calls.research, before); // 세 번째는 없다
  assert.equal(JSON.stringify(run).includes('fake'), false); // 키가 기록에 없다
});

test('초안으로: 공개하지 않고 기록 표도 건드리지 않는다', async () => {
  await clean();
  next = { article: good, fail: false };
  const r = await service.run(ctx, 'draft', TUE);
  assert.equal(r.outcome, 'drafted');
  const post = await posts.get(ctx, r.postId);
  assert.equal(post.status, 'draft');
  assert.match(post.slug, /^mfg-ai-2026-w46-draft-/);
  assert.equal(await row('2026-W46'), undefined);
});

test('보기만: 저장이 없다 · 떨어진 글도 사유와 함께 보여 준다', async () => {
  next = { article: withHook(good, '불량률이 47% 줄었습니다.'), fail: false };
  const before = await dataSource.query(`SELECT count(*)::int AS n FROM posts`);
  const r = await service.run(ctx, 'preview', TUE);
  assert.equal(r.outcome, 'preview');
  assert.ok(r.reasons.length);
  assert.ok(r.html.includes('47%'));
  const afterN = await dataSource.query(`SELECT count(*)::int AS n FROM posts`);
  assert.equal(afterN[0].n, before[0].n);
});

test('초안으로: 검사에 떨어진 글은 저장하지 않는다', async () => {
  const before = await dataSource.query(`SELECT count(*)::int AS n FROM posts`);
  const r = await service.run(ctx, 'draft', TUE); // next 는 위에서 떨어지는 글이다
  assert.equal(r.outcome, 'preview');
  assert.ok(r.reasons.length);
  const afterN = await dataSource.query(`SELECT count(*)::int AS n FROM posts`);
  assert.equal(afterN[0].n, before[0].n);
});

test('기록을 못 닫으면 글 저장도 되돌린다', async () => {
  await clean();
  process.env.AUTOPOST_ENABLED = '1';
  next = { article: good, fail: false };
  const verify = service.client.verify;
  // 만드는 도중에 그 주의 행이 사라졌다(멈춘 실행으로 닫히고 다른 실행이 잡은 것과 같은 결과 — 닫을 행이 없다).
  service.client.verify = async (a) => {
    await dataSource.query(
      `DELETE FROM autopost_runs WHERE week_key = '2026-W46'`,
    );
    return verify(a);
  };
  assert.equal(await service.run(ctx, 'auto', TUE), null);
  service.client.verify = verify;
  const n = await dataSource.query(
    `SELECT count(*)::int AS n FROM posts WHERE slug LIKE 'mfg-ai-2026-w4%'`,
  );
  assert.equal(n[0].n, 0);
  delete process.env.AUTOPOST_ENABLED;
});

test('표지 그림: 파일로 저장하고 본문 맨 위에 넣는다 — 대표 이미지가 된다', async () => {
  await clean();
  next = { article: good, fail: false };
  service.client.illustrate = async () => [
    { bytes: jpeg(), mime: 'image/jpeg', section: null },
    { bytes: jpeg(1600, 900, 1), mime: 'image/jpeg', section: 1 },
    { bytes: jpeg(320, 180), mime: 'image/jpeg', section: 3 }, // 작은 그림은 빠진다
    { bytes: jpeg(), mime: 'image/jpeg', section: 9 }, // 없는 단락도 빠진다
  ];
  const r = await service.run(ctx, 'draft', TUE);
  delete service.client.illustrate;
  assert.equal(r.outcome, 'drafted');
  assert.equal(r.pictures.length, 2);
  assert.equal((r.html.match(/<img /g) || []).length, 2);
  const files = (await coverRows()).filter((f) =>
    r.html.startsWith(
      `<p class="dv_ap_cover"><img src="/api/content/assets/${f.id}" `,
    ),
  );
  assert.equal((await coverRows()).length, 2);
  assert.equal(files.length, 1); // 맨 위가 표지다
  assert.deepEqual(
    [files[0].type, files[0].width, files[0].height],
    ['image/jpeg', 1600, 900],
  );
  assert.ok(existsSync(join(uploads, files[0].filename_disk)));
  assert.ok(
    r.html.startsWith(
      `<p class="dv_ap_cover"><img src="/api/content/assets/${files[0].id}" `,
    ),
  );
  const saved = await dataSource.query(
    `SELECT p.thumbnail, t.body FROM posts p JOIN posts_translations t ON t.posts = p.id WHERE p.id = $1`,
    [r.postId],
  );
  assert.equal(saved[0].thumbnail, files[0].id);
  assert.equal(saved[0].body, r.html); // 소독을 지나도 그대로 저장된다
});

test('그림: 공개된 글의 그림은 공개 관문을 지난다(초안의 그림은 못 지난다)', async () => {
  const {
    ContentPostDefaultRepository,
  } = require('../../../../dist/core/content/repository/post-default.repository.js');
  const gate = app.get(ContentPostDefaultRepository, { strict: false });
  const two = async () => [
    { bytes: jpeg(), mime: 'image/jpeg', section: null },
    { bytes: jpeg(1600, 900, 1), mime: 'image/jpeg', section: 1 },
  ];
  await clean();
  next = { article: good, fail: false };
  service.client.illustrate = two;
  await service.run(ctx, 'draft', TUE);
  for (const f of await coverRows())
    assert.equal(await gate.isReferencedByLivePost(ctx, f.id), false);
  await clean();
  process.env.AUTOPOST_ENABLED = '1';
  const r = await service.run(ctx, 'auto', TUE);
  delete service.client.illustrate;
  delete process.env.AUTOPOST_ENABLED;
  assert.equal(r.outcome, 'published');
  const files = await coverRows();
  assert.equal(files.length, 2);
  for (const f of files)
    assert.equal(await gate.isReferencedByLivePost(ctx, f.id), true);
});

test('표지 그림: 못 만들거나 그림답지 않으면 글은 그림 없이 나간다', async () => {
  for (const illustrate of [
    async () => {
      throw new Error('가짜 실패');
    },
    async () => [{ bytes: jpeg(320, 180), mime: 'image/jpeg', section: null }],
    // 표지 없이 단락 그림만 오면 쓰지 않는다
    async () => [{ bytes: jpeg(1600, 900, 1), mime: 'image/jpeg', section: 1 }],
    async () => [
      {
        bytes: Buffer.from('그림이 아니다'.repeat(8)),
        mime: 'image/jpeg',
        section: null,
      },
    ],
  ]) {
    await clean();
    next = { article: good, fail: false };
    service.client.illustrate = illustrate;
    const r = await service.run(ctx, 'draft', TUE);
    delete service.client.illustrate;
    assert.equal(r.outcome, 'drafted');
    assert.deepEqual(r.pictures, []);
    assert.ok(!r.html.includes('<img'));
    assert.equal((await coverRows()).length, 0);
  }
});

test('그림 판정: 글자·로고가 든 그림과 겹친 장면의 뒤 그림을 뺀다 · 판정하지 못하면 그림 없이 간다', async () => {
  const three = async () => [
    { bytes: jpeg(), mime: 'image/jpeg', section: null },
    { bytes: jpeg(1600, 900, 1), mime: 'image/jpeg', section: 1 },
    { bytes: jpeg(1600, 900, 2), mime: 'image/jpeg', section: 3 },
  ];
  const inspect = service.client.inspect;
  const run = async (verdict) => {
    await clean();
    next = { article: good, fail: false };
    service.client.illustrate = three;
    service.client.inspect = verdict;
    const r = await service.run(ctx, 'preview', TUE);
    delete service.client.illustrate;
    service.client.inspect = inspect;
    return r.pictures.map((p) => p.section);
  };
  assert.deepEqual(await run(async () => ({ marked: [], pairs: [] })), [
    null,
    1,
    3,
  ]);
  // 2번 그림에 글자가 있다 → 그 그림만 뺀다
  assert.deepEqual(await run(async () => ({ marked: [1], pairs: [] })), [
    null,
    3,
  ]);
  // 2번·3번이 같은 장면 → 뒤의 것을 뺀다
  assert.deepEqual(await run(async () => ({ marked: [], pairs: [[1, 2]] })), [
    null,
    1,
  ]);
  // 표지에 글자가 있다 → 표지가 빠지면 그림 전부 없이 간다
  assert.deepEqual(await run(async () => ({ marked: [0], pairs: [] })), []);
  // 판정이 실패했다 · 판정 길이 없다 → 통과가 아니라 그림 없음
  assert.deepEqual(
    await run(async () => {
      throw new Error('가짜 판정 실패');
    }),
    [],
  );
  assert.deepEqual(await run(undefined), []);
});

test('표지 그림: 떨어진 글에는 만들지 않는다', async () => {
  let asked = 0;
  next = { article: withHook(good, '불량률이 47% 줄었습니다.'), fail: false };
  service.client.illustrate = async () => {
    asked++;
    return [{ bytes: jpeg(), mime: 'image/jpeg', section: null }];
  };
  const r = await service.run(ctx, 'preview', TUE);
  delete service.client.illustrate;
  assert.ok(r.reasons.length);
  assert.equal(asked, 0);
});

test('표지 그림: 글 저장이 되돌려지면 파일 행도 디스크 파일도 남지 않는다', async () => {
  await clean();
  process.env.AUTOPOST_ENABLED = '1';
  next = { article: good, fail: false };
  service.client.illustrate = async () => {
    // 그림을 만드는 사이에 그 주의 행이 사라졌다 — 닫을 행이 없어 저장이 되돌려진다.
    await dataSource.query(
      `DELETE FROM autopost_runs WHERE week_key = '2026-W46'`,
    );
    return [
      { bytes: jpeg(), mime: 'image/jpeg', section: null },
      { bytes: jpeg(1600, 900, 1), mime: 'image/jpeg', section: 1 },
    ];
  };
  assert.equal(await service.run(ctx, 'auto', TUE), null);
  delete service.client.illustrate;
  delete process.env.AUTOPOST_ENABLED;
  assert.equal((await coverRows()).length, 0);
  assert.deepEqual(readdirSync(uploads), []);
});

test('받은 글: 조사·집필을 건너뛰고 판정은 한 번, 떨어져도 다시 쓰지 않는다', async () => {
  await clean();
  const before = { ...calls };
  const r = await service.run(ctx, 'preview', TUE, good);
  assert.equal(r.outcome, 'preview');
  assert.deepEqual(r.reasons, []);
  assert.equal(calls.research, before.research);
  assert.equal(calls.write, before.write);
  assert.equal(calls.verify, before.verify + 1);
  // 구조에서 떨어지는 글: 판정도 부르지 않고 한 번에 끝난다
  const bad = await service.run(
    ctx,
    'draft',
    TUE,
    withHook(good, '불량률이 47% 줄었습니다.'),
  );
  assert.equal(bad.outcome, 'preview');
  assert.equal(bad.attempts.length, 1);
  assert.equal(calls.verify, before.verify + 1);
  // 형이 깨진 글은 던지지 않고 떨어진다
  const broken = await service.run(ctx, 'preview', TUE, { title: 1 });
  assert.ok(broken.reasons.length);
});

test('묶음 공개: 주간 기록을 잡고 닫는다 — 한 주에 한 편, 이미 낸 출처는 다시 못 쓴다', async () => {
  await clean();
  const pics = [
    { bytes: jpeg(), mime: 'image/jpeg', section: null },
    { bytes: jpeg(1600, 900, 1), mime: 'image/jpeg', section: 1 },
    {
      bytes: Buffer.from('그림이 아니다'.repeat(8)),
      mime: 'image/jpeg',
      section: 3,
    },
  ];
  // 꺼져 있으면 막힌다
  await assert.rejects(() => service.publishGiven(ctx, good, pics, TUE));
  assert.equal(await row('2026-W46'), undefined);
  process.env.AUTOPOST_ENABLED = '1';
  // 구조 검사에 떨어지는 글은 기록을 잡지 않는다(고쳐서 다시 넣을 수 있게)
  const bad = await service.publishGiven(
    ctx,
    withHook(good, '불량률이 47% 줄었습니다.'),
    pics,
    TUE,
  );
  assert.equal(bad.outcome, 'refused');
  assert.equal(await row('2026-W46'), undefined);
  // 화요일 09:00 전이어도 공개한다(사람이 돌리는 명령)
  const EARLY = new Date('2026-11-09T22:00:00Z'); // KST 화 07:00
  const r = await service.publishGiven(ctx, good, pics, EARLY);
  assert.equal(r.outcome, 'published');
  assert.equal(r.pictures, 2);
  const post = await posts.get(ctx, r.postId);
  assert.equal(post.status, 'published');
  assert.equal(post.slug, 'mfg-ai-2026-w46');
  assert.equal((await row('2026-W46')).status, 'published');
  assert.equal((await coverRows()).length, 2);
  // 같은 주에 다른 글(출처가 다르다)을 한 번 더: 한 주에 한 편이라 거절
  const other = JSON.parse(
    JSON.stringify(good)
      .replaceAll('press.siemens.com', 'press.siemens.org')
      .replaceAll('example.org', 'example.net'),
  );
  const again = await service.publishGiven(ctx, other, pics, TUE);
  assert.equal(again.outcome, 'refused');
  assert.ok(again.reasons[0].includes('한 주에 한 편'));
  // 다음 주에 같은 출처로: 이미 낸 글의 출처라 거절, 기록도 안 잡는다
  const next2 = await service.publishGiven(ctx, good, pics, NEXT);
  assert.equal(next2.outcome, 'refused');
  assert.ok(next2.reasons.some((x) => x.includes('이미 낸 글의 출처')));
  assert.equal(await row('2026-W47'), undefined);
  // 쓰는 쪽이 읽는 「이미 다룬 글」에 이제 나온다
  const past = await service.avoid(ctx, '');
  assert.ok(past.avoidTitles.includes(good.title));
  delete process.env.AUTOPOST_ENABLED;
});

test('키가 없으면 손으로 돌리는 것도 막힌다', async () => {
  delete process.env.ANTHROPIC_API_KEY;
  await assert.rejects(service.run(ctx, 'preview', TUE));
});
