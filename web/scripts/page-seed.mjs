#!/usr/bin/env node
/**
 * 페이지 글의 씨앗 SQL 을 만든다 — 지금 화면에 있는 글(TS)을 page_contents 표에 처음 넣는다.
 *
 *   node web/scripts/page-seed.mjs            # SQL 을 찍는다 → 마이그레이션 파일에 붙인다
 *
 * 새 장을 편집하게 만들 때(E7·E8): 그 장의 content.ts 에 기본 글(스키마 모양)을 만들고 아래 PAGES 에
 * 한 줄 더한 뒤 돌린다. ON CONFLICT DO NOTHING 이라 이미 고친 글을 덮지 않는다.
 *
 * TS 를 node 로 바로 읽는다(형 지우기). 확장자 없는 상대 import(`../companyContent`)는 .ts 를 붙여 찾는다.
 * 그래서 content.ts 쪽은 `@/` 별칭을 쓰지 않는다.
 */
import { registerHooks } from 'node:module'

registerHooks({
  resolve(spec, ctx, next) {
    try {
      return next(spec, ctx)
    } catch (e) {
      if ((spec.startsWith('./') || spec.startsWith('../')) && !/\.[a-z]+$/i.test(spec)) return next(spec + '.ts', ctx)
      throw e
    }
  },
})

/** 편집할 수 있는 장. key 는 api 의 core/page/schema 와 같아야 한다. */
const PAGES = [
  { key: 'home', module: '../app/home/content.ts', name: 'HOME_DEFAULT' },
  { key: 'company-location', module: '../app/page/company/location/content.ts', name: 'LOCATION_DEFAULT' },
]

const lines = []
for (const p of PAGES) {
  const mod = await import(new URL(p.module, import.meta.url).href)
  const json = JSON.stringify(mod[p.name])
  if (json.includes('$seed$')) throw new Error(`${p.key}: 글에 $seed$ 가 있다 — 따옴표 구분자를 바꿔라`)
  lines.push(
    `INSERT INTO page_contents (key, languages_code, content, updated_on, updated_by)\n` +
      `VALUES ('${p.key}', 'ko-KR', $seed$${json}$seed$::jsonb, now(), 'seed')\n` +
      `ON CONFLICT (key, languages_code) DO NOTHING;`,
  )
}
console.log(lines.join('\n\n'))
