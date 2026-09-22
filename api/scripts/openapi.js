#!/usr/bin/env node
/**
 * web 이 형을 만들 재료 두 벌을 파일로 뽑는다. 서버를 띄우지 않고, DB 에도 붙지 않는다.
 *
 *   npm run build && node scripts/openapi.js         # → api/openapi.json · api/page-schemas.json
 *   node scripts/openapi.js <출력 폴더>
 *
 * - openapi.json      API 문서(OpenAPI). Nest 의 preview 모드는 모듈 그래프만 만들고 공급자
 *                     (저장소·서비스·TypeORM 연결)를 만들지 않는다 — 문서에 필요한 것은 컨트롤러·DTO
 *                     의 메타데이터뿐이다. 띄운 서버의 /api/docs-json 과 같은 문서다.
 * - page-schemas.json 페이지 글 엔진의 칸 구조(PAGE_SCHEMAS). 페이지마다 저장되는 JSON 의 모양이다.
 *
 * web 은 이 두 파일에서 형을 만든다(web/scripts/gen-types.mjs). 손으로 옮겨 적지 않는다.
 */
const { writeFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { NestFactory } = require('@nestjs/core');
const { SwaggerModule } = require('@nestjs/swagger');
const { AppModule } = require('../dist/app/app.module');
const {
  buildSwaggerConfig,
} = require('../dist/common/swagger/swagger-config');
const { PAGE_SCHEMAS } = require('../dist/core/page/schema');

async function main() {
  const dir = resolve(process.argv[2] ?? resolve(__dirname, '..'));
  const app = await NestFactory.create(AppModule, {
    preview: true,
    logger: false,
  });
  app.setGlobalPrefix('api');
  const doc = SwaggerModule.createDocument(app, buildSwaggerConfig());
  await app.close();
  // 키 순서를 고정한다 — 다시 뽑아도 같은 파일이어야 낡았는지 비교할 수 있다.
  writeFileSync(
    resolve(dir, 'openapi.json'),
    JSON.stringify(sortKeys(doc), null, 2) + '\n',
  );
  // 칸 차례는 폼의 차례라 그대로 둔다(키만 정렬하면 순서가 사라진다).
  writeFileSync(
    resolve(dir, 'page-schemas.json'),
    JSON.stringify(PAGE_SCHEMAS, null, 2) + '\n',
  );
  const paths = Object.keys(doc.paths).length;
  const schemas = Object.keys(doc.components?.schemas ?? {}).length;
  console.log(
    `openapi: 경로 ${paths} · 스키마 ${schemas} · 페이지 ${PAGE_SCHEMAS.length} → ${dir}`,
  );
}

function sortKeys(v) {
  if (Array.isArray(v)) return v.map(sortKeys);
  if (v && typeof v === 'object')
    return Object.fromEntries(
      Object.keys(v)
        .sort()
        .map((k) => [k, sortKeys(v[k])]),
    );
  return v;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
