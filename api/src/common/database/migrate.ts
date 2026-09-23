/**
 * DB 스키마 적용기. api 컨테이너가 뜰 때 서버보다 먼저 돈다(Dockerfile CMD).
 *
 *   빈 DB  → db/schema.sql(표 여섯) → db/migrations/*.sql 차례로
 *   있는 DB → schema_migrations 에 없는 마이그레이션만
 *
 * 마이그레이션은 전부 두 번 돌려도 같게 쓰였다(IF NOT EXISTS · ON CONFLICT). 그래서 이 표가 없던
 * 옛 DB(손으로 적용한 곳)에서 처음 돌면 전부 다시 돌고 적어 둔다 — 결과는 같다.
 * 파일 하나는 한 트랜잭션이다. 하나가 실패하면 그 뒤는 안 돌고 api 도 안 뜬다(닫히는 쪽).
 *
 * 로컬에서 직접:  node --env-file=../.env dist/common/database/migrate.js
 */
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { Client } from 'pg';
import { AppConfig } from '../config/app-config';

/** 이미지에서는 /app/db, 저장소에서는 루트의 db/ (dist/common/database 에서 네 칸 위). */
function dbDir(): string {
  const candidates = [
    resolve(__dirname, '../../../db'),
    resolve(__dirname, '../../../../db'),
  ];
  const found = candidates.find((d) => existsSync(join(d, 'schema.sql')));
  if (!found)
    throw new Error(`db/schema.sql 을 찾지 못했다: ${candidates.join(' · ')}`);
  return found;
}

function client(database: string): Client {
  return new Client({
    host: AppConfig.db.host,
    port: AppConfig.db.port,
    database,
    user: AppConfig.db.user,
    password: AppConfig.db.password,
    ssl: AppConfig.db.ssl,
  });
}

/**
 * DB 이름은 우리가 정한다. 관리형 DB 에 그 이름이 아직 없으면(3D000) 관리용 DB 로 붙어 한 번 만든다 —
 * 새 서버에서 `docker compose up` 한 번으로 끝나게. 만들 권한이 없으면 그대로 실패한다(닫히는 쪽).
 */
async function connect(): Promise<Client> {
  const c = client(AppConfig.db.name);
  try {
    await c.connect();
    return c;
  } catch (e) {
    if ((e as { code?: string }).code !== '3D000') throw e;
    await c.end().catch(() => undefined);
    const admin = client('postgres');
    await admin.connect();
    try {
      // 이름은 식별자라 바인딩할 수 없다 — 따옴표를 막고 큰따옴표로 감싼다.
      const name = AppConfig.db.name;
      if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name))
        throw new Error(`DB_NAME 에 쓸 수 없는 글자가 있다: ${name}`);
      await admin.query(`CREATE DATABASE "${name}"`);
      console.log(`migrate: 데이터베이스 ${name} 를 만들었다`);
    } finally {
      await admin.end().catch(() => undefined);
    }
    const again = client(AppConfig.db.name);
    await again.connect();
    return again;
  }
}

async function hasTable(c: Client, name: string): Promise<boolean> {
  const { rows } = await c.query<{ ok: boolean }>(
    `SELECT to_regclass($1) IS NOT NULL AS ok`,
    [`public.${name}`],
  );
  return rows[0]?.ok === true;
}

async function main(): Promise<void> {
  const dir = dbDir();
  const c = await connect();
  try {
    if (!(await hasTable(c, 'posts'))) {
      // schema.sql 은 pg_dump 라 세션 search_path 를 비운다 — 따로 연결해 돌린다.
      const s = await connect();
      try {
        await s.query(readFileSync(join(dir, 'schema.sql'), 'utf8'));
      } finally {
        await s.end();
      }
      console.log('migrate: schema.sql 적용(빈 DB)');
    }
    await c.query(
      `CREATE TABLE IF NOT EXISTS public.schema_migrations (
         name varchar(200) PRIMARY KEY,
         applied_on timestamptz NOT NULL DEFAULT now()
       )`,
    );
    const done = new Set(
      (
        await c.query<{ name: string }>(
          'SELECT name FROM public.schema_migrations',
        )
      ).rows.map((r) => r.name),
    );
    const files = readdirSync(join(dir, 'migrations'))
      .filter((f) => /^\d{4}-.*\.sql$/.test(f))
      .sort();
    let applied = 0;
    for (const f of files) {
      if (done.has(f)) continue;
      const sql = readFileSync(join(dir, 'migrations', f), 'utf8');
      await c.query('BEGIN');
      try {
        await c.query(sql);
        await c.query(
          'INSERT INTO public.schema_migrations(name) VALUES ($1)',
          [f],
        );
        await c.query('COMMIT');
      } catch (e) {
        await c.query('ROLLBACK');
        throw new Error(`migrate: ${f} 실패 — ${(e as Error).message}`);
      }
      applied++;
      console.log(`migrate: ${f}`);
    }
    console.log(`migrate: 끝 (새로 ${applied} · 전체 ${files.length})`);
  } finally {
    await c.end();
  }
}

main().catch((e: unknown) => {
  // 비밀번호·주소는 찍지 않는다 — 메시지만.
  console.error((e as Error).message);
  process.exit(1);
});
