#!/usr/bin/env node
/**
 * api 가 뽑은 두 파일에서 web 의 형을 만든다. web 은 api 의 모양을 손으로 옮겨 적지 않는다.
 *
 *   (cd ../api && npm run build && node scripts/openapi.js)   # api/openapi.json · api/page-schemas.json
 *   node scripts/gen-types.mjs                                # → lib/api-types.gen.ts · lib/page-types.gen.ts
 *   node scripts/gen-types.mjs <출력 폴더> [api 파일 폴더]      # 검사(check-types.py)가 임시 폴더로 부른다
 *
 * - api-types.gen.ts   OpenAPI 의 components.schemas 하나마다 interface 하나(이름 그대로).
 * - page-types.gen.ts  페이지 칸 구조의 형(api/src/core/page/schema/page-schema.ts 를 그대로 옮긴다)
 *                      + 페이지마다 저장되는 글의 형(PageContentMap).
 *
 * 외부 생성기(openapi-typescript 등)를 쓰지 않는 이유: 그 도구들은 TypeScript 5 의 컴파일러 API 로
 * 글을 찍는데 web 은 TypeScript 7 이다(peer 충돌). 이 문서가 쓰는 모양은 object·nullable·enum·
 * $ref·allOf·oneOf·additionalProperties·배열뿐이라 직접 찍는 편이 짧고, 버전에 안 묶인다.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const API = resolve(HERE, '../../api')
const OUT = resolve(process.argv[2] ?? resolve(HERE, '../lib'))
/** openapi.json · page-schemas.json 이 있는 폴더. 기본은 api/. */
const SRC = resolve(process.argv[3] ?? API)

const HEADER = (src) =>
  `// 자동 생성 — 손대지 않는다. 원본: ${src}\n` +
  `// 다시 만들기: (cd api && npm run build && node scripts/openapi.js) && (cd web && node scripts/gen-types.mjs)\n` +
  `// 낡았는지 검사: python3 web/scripts/check-types.py\n` +
  `/* eslint-disable */\n\n`

const ID_RE = /^[A-Za-z_$][A-Za-z0-9_$]*$/
const key = (k) => (ID_RE.test(k) ? k : JSON.stringify(k))
const lit = (v) => JSON.stringify(v)
const doc = (text, pad) => (text ? `${pad}/** ${String(text).replace(/\*\//g, '*\\/').replace(/\n+/g, ' ')} */\n` : '')
const paren = (t) => (/[|&]/.test(t) && !/^\{/.test(t) ? `(${t})` : t)

// ── OpenAPI → TS ─────────────────────────────────────────────────────────
function refName(ref) {
  return ref.split('/').pop()
}

function tsOf(s, pad) {
  if (!s || typeof s !== 'object') return 'unknown'
  let t
  if (s.$ref) t = refName(s.$ref)
  else if (s.allOf) t = s.allOf.map((x) => paren(tsOf(x, pad))).join(' & ')
  else if (s.oneOf || s.anyOf) t = (s.oneOf ?? s.anyOf).map((x) => paren(tsOf(x, pad))).join(' | ')
  else if (s.enum) t = s.enum.map(lit).join(' | ')
  else if (s.type === 'array') t = `${paren(tsOf(s.items, pad))}[]`
  else if (s.type === 'string') t = 'string'
  else if (s.type === 'integer' || s.type === 'number') t = 'number'
  else if (s.type === 'boolean') t = 'boolean'
  else if (s.type === 'object' || s.properties || s.additionalProperties) t = objectOf(s, pad)
  else t = 'unknown'
  return s.nullable ? `${paren(t)} | null` : t
}

function objectOf(s, pad) {
  const props = s.properties ?? {}
  const names = Object.keys(props)
  if (names.length === 0) {
    if (s.additionalProperties && typeof s.additionalProperties === 'object')
      return `Record<string, ${tsOf(s.additionalProperties, pad)}>`
    return 'Record<string, unknown>'
  }
  const req = new Set(s.required ?? [])
  const inner = pad + '  '
  const lines = names.map((n) => doc(props[n].description, inner) + `${inner}${key(n)}${req.has(n) ? '' : '?'}: ${tsOf(props[n], inner)}`)
  return `{\n${lines.join('\n')}\n${pad}}`
}

function apiTypes() {
  const spec = JSON.parse(readFileSync(resolve(SRC, 'openapi.json'), 'utf8'))
  const schemas = spec.components?.schemas ?? {}
  let out = HEADER('api/openapi.json (Nest 의 DTO · @ApiProperty)')
  for (const name of Object.keys(schemas).sort()) {
    const s = schemas[name]
    out += doc(s.description, '')
    out += s.type === 'object' || s.properties ? `export interface ${name} ${objectOf(s, '')}\n\n` : `export type ${name} = ${tsOf(s, '')}\n\n`
  }
  // 주소 하나마다 응답·본문의 형. 목록 봉투({ data, total, page, pageSize })처럼 이름 없이 적힌 모양도 여기서 잡힌다.
  let ops = 0
  out += '/** 「METHOD /api/…」 → 성공 응답(response)과 요청 본문(body). 본문이 없으면 never. */\n'
  out += 'export interface ApiOperations {\n'
  for (const path of Object.keys(spec.paths).sort()) {
    for (const method of Object.keys(spec.paths[path]).sort()) {
      const op = spec.paths[path][method]
      const ok = Object.keys(op.responses ?? {}).find((c) => c.startsWith('2'))
      const res = ok ? op.responses[ok].content?.['application/json']?.schema : undefined
      const reqContent = op.requestBody?.content ?? {}
      const req = reqContent['application/json']?.schema ?? reqContent['multipart/form-data']?.schema
      out += doc(op.summary, '  ')
      out += `  ${lit(`${method.toUpperCase()} ${path}`)}: {\n`
      out += `    response: ${res ? tsOf(res, '    ') : 'unknown'}\n`
      out += `    body: ${req ? tsOf(req, '    ') : 'never'}\n`
      out += '  }\n'
      ops++
    }
  }
  out += '}\n\n'
  out += 'export type ApiOperation = keyof ApiOperations\n'
  out += "export type ApiResponse<K extends ApiOperation> = ApiOperations[K]['response']\n"
  out += "export type ApiBody<K extends ApiOperation> = ApiOperations[K]['body']\n"
  return { text: out, count: `${Object.keys(schemas).length} · 주소 ${ops}` }
}

// ── 페이지 칸 구조 → 저장되는 글의 형 ──────────────────────────────────────
function fieldType(f, pad) {
  switch (f.type) {
    case 'text':
    case 'textarea':
    case 'richtext':
      return 'string'
    case 'image':
      return f.required ? 'ImageValue' : 'ImageValue | null'
    case 'link':
      return 'LinkValue'
    case 'boolean':
      return 'boolean'
    case 'select': {
      const vals = f.options.map((o) => lit(o.value))
      if (!f.required) vals.push("''")
      return vals.join(' | ')
    }
    case 'list':
      return `${fieldsType(f.item, pad)}[]`
    case 'group':
      return fieldsType(f.fields, pad)
    default:
      throw new Error(`모르는 칸 종류: ${f.type}`)
  }
}

function fieldsType(fields, pad) {
  const inner = pad + '  '
  const lines = fields.map((f) => doc(f.label, inner) + `${inner}${key(f.key)}: ${fieldType(f, inner)}`)
  return `{\n${lines.join('\n')}\n${pad}}`
}

function pageTypes() {
  const schemas = JSON.parse(readFileSync(resolve(SRC, 'page-schemas.json'), 'utf8'))
  // 칸 구조의 형은 api 의 정의 파일을 그대로 옮긴다(관리 화면의 폼이 이 모양을 받는다).
  const defs = readFileSync(resolve(API, 'src/core/page/schema/page-schema.ts'), 'utf8')
    .replace(/^interface Base/m, 'export interface PageFieldBase')
    .replace(/extends Base\b/g, 'extends PageFieldBase')
  let out = HEADER('api/src/core/page/schema/page-schema.ts · api/page-schemas.json')
  out += defs.trim() + '\n\n'
  out += '/** 페이지마다 저장되는 글(GET /api/content/pages/:key 의 data, 관리 화면이 저장하는 content). */\n'
  out += 'export interface PageContentMap {\n'
  for (const s of schemas) {
    out += doc(`${s.label} — ${s.path}`, '  ')
    out += `  ${key(s.key)}: ${fieldsType(s.fields, '  ')}\n`
  }
  out += '}\n\nexport type PageKey = keyof PageContentMap\n'
  out += 'export type PageContentOf<K extends PageKey> = PageContentMap[K]\n'
  return { text: out, count: schemas.length }
}

mkdirSync(OUT, { recursive: true })
const a = apiTypes()
const p = pageTypes()
writeFileSync(resolve(OUT, 'api-types.gen.ts'), a.text)
writeFileSync(resolve(OUT, 'page-types.gen.ts'), p.text)
console.log(`gen-types: api 형 ${a.count} · 페이지 ${p.count} → ${OUT}`)
