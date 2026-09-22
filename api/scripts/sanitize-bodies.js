#!/usr/bin/env node
/**
 * 게시판 본문(posts_translations.body)을 저장 규칙(common/html/sanitize-body)으로 다시 다듬는다.
 *
 *   node scripts/sanitize-bodies.js            # 바뀔 행 수와 차이 표본만 본다(쓰지 않는다)
 *   node scripts/sanitize-bodies.js --apply    # 바뀌는 행만 고친다. 두 번째 실행은 0 행이어야 한다
 *
 * 규칙을 넓히거나 좁힌 뒤, 옛 글을 들여온 뒤에 돌린다. 공개 API 는 내보낼 때도 같은 규칙을 쓰므로
 * 이 스크립트를 안 돌려도 화면은 안전하다 — 저장된 값을 규칙과 맞춰 두는 일이다.
 * 빌드한 뒤 돌린다(dist 를 읽는다). DB 접속은 루트 .env 의 DB_* 를 쓴다.
 */
const { resolve } = require('node:path');
const fs = require('node:fs');
const { Client } = require('pg');
const { sanitizeBody } = require('../dist/common/html/sanitize-body.js');

const envFile = resolve(__dirname, '../../.env');
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, 'utf8').split('\n')) {
    const m = /^([A-Z_][A-Z0-9_]*)=(.*)$/.exec(line);
    if (m && process.env[m[1]] === undefined)
      process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
  }
}

const apply = process.argv.includes('--apply');

function firstDiff(a, b) {
  let i = 0;
  while (i < a.length && a[i] === b[i]) i++;
  return {
    at: i,
    before: a.slice(Math.max(0, i - 30), i + 60),
    after: b.slice(Math.max(0, i - 30), i + 60),
  };
}

async function main() {
  const c = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3330),
    database: process.env.DB_NAME || 'drvalue_cms',
    user: process.env.DB_USER || 'drvalue',
    password: process.env.DB_PASSWORD,
    ssl: process.env.DB_SSL === 'require' ? { rejectUnauthorized: false } : false,
  });
  await c.connect();
  try {
    const { rows } = await c.query(
      'SELECT id, posts, languages_code, body FROM posts_translations WHERE body IS NOT NULL ORDER BY id',
    );
    const changed = [];
    for (const r of rows) {
      const clean = sanitizeBody(r.body);
      if (clean !== r.body) changed.push({ ...r, clean });
    }
    const html = rows.filter((r) => /<[a-z!/?]/i.test(r.body)).length;
    console.log(
      `본문 ${rows.length}행 (태그 섞인 것 ${html}) · 규칙과 다른 것 ${changed.length}`,
    );
    for (const r of changed.slice(0, 5)) {
      const d = firstDiff(r.body, r.clean);
      console.log(
        `  #${r.id} (글 ${r.posts}, ${r.languages_code}) ${r.body.length}자 → ${r.clean.length}자, 처음 다른 곳 ${d.at}`,
      );
      console.log(`    전: ${JSON.stringify(d.before)}`);
      console.log(`    후: ${JSON.stringify(d.after)}`);
    }
    if (apply && changed.length) {
      await c.query('BEGIN');
      for (const r of changed)
        await c.query('UPDATE posts_translations SET body = $1 WHERE id = $2', [
          r.clean,
          r.id,
        ]);
      await c.query('COMMIT');
      console.log(`고침 ${changed.length}행`);
    } else if (apply) {
      console.log('고침 0행');
    }
  } finally {
    await c.end();
  }
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
