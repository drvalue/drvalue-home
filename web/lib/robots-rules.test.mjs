/**
 * robots.txt 의 묶음이 관리 화면 스위치를 따르는가. 서버 없이 — `.ts` 를 그대로 읽는다(node 22.6+ 형 지우기).
 *
 *   node --test lib/robots-rules.test.mjs
 *
 * 지키는 것: 검색엔진(네이버 Yeti · 빙 등)은 어떤 스위치로도 안 막힌다 · 막은 묶음에 allow 가 없다(구글은 같은 길이면
 * allow 를 택한다) · api 를 못 읽으면(null) 예전처럼 둘 다 연다.
 */
import assert from 'node:assert/strict'
import test from 'node:test'
import { AI_SEARCH, AI_TRAINING, SEARCH_ENGINES, robotsRules } from './robots-rules.ts'

const OPEN = { allow: ['/', '/api/content/assets/'], disallow: ['/api/', '/admin', '/page/support/notify_form'] }
const group = (rules, list) => rules.find((r) => Array.isArray(r.userAgent) && r.userAgent[0] === list[0])
const s = (search, training) => ({ ai_search_allowed: search, ai_training_allowed: training })

test('묶음 넷: 모두 · 검색엔진 · AI 검색 · AI 학습', () => {
  const r = robotsRules(s(true, true))
  assert.equal(r.length, 4)
  assert.deepEqual(r[0], { userAgent: '*', ...OPEN })
  assert.deepEqual(r[1].userAgent, SEARCH_ENGINES)
  assert.deepEqual(r[2].userAgent, AI_SEARCH)
  assert.deepEqual(r[3].userAgent, AI_TRAINING)
})

test('검색엔진(Yeti·Daumoa·Bingbot·Applebot)은 AI 묶음에 없다', () => {
  for (const bot of ['Yeti', 'Daumoa', 'Bingbot', 'Applebot']) {
    assert.ok(SEARCH_ENGINES.includes(bot), bot)
    assert.ok(!AI_SEARCH.includes(bot), bot)
    assert.ok(!AI_TRAINING.includes(bot), bot)
  }
})

test('둘 다 켬 · null(api 못 읽음): 전부 같은 열린 규칙', () => {
  for (const v of [s(true, true), null]) {
    for (const g of robotsRules(v)) assert.deepEqual({ allow: g.allow, disallow: g.disallow }, OPEN)
  }
})

test('AI 검색 끔: 그 묶음만 disallow / 이고 allow 가 없다 · 검색엔진은 열림', () => {
  const r = robotsRules(s(false, true))
  assert.deepEqual(group(r, AI_SEARCH), { userAgent: AI_SEARCH, disallow: '/' })
  assert.ok(!('allow' in group(r, AI_SEARCH)))
  assert.deepEqual(group(r, SEARCH_ENGINES).allow, OPEN.allow)
  assert.deepEqual(group(r, AI_TRAINING).allow, OPEN.allow)
})

test('AI 학습 끔: 그 묶음만 disallow / 이고 allow 가 없다', () => {
  const r = robotsRules(s(true, false))
  assert.deepEqual(group(r, AI_TRAINING), { userAgent: AI_TRAINING, disallow: '/' })
  assert.deepEqual(group(r, AI_SEARCH).allow, OPEN.allow)
})

test('둘 다 끔: AI 두 묶음만 닫히고 모두·검색엔진은 그대로', () => {
  const r = robotsRules(s(false, false))
  assert.deepEqual(r[0], { userAgent: '*', ...OPEN })
  assert.deepEqual(r[1], { userAgent: SEARCH_ENGINES, ...OPEN })
  assert.deepEqual(r[2], { userAgent: AI_SEARCH, disallow: '/' })
  assert.deepEqual(r[3], { userAgent: AI_TRAINING, disallow: '/' })
})
