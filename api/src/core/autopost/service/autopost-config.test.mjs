// node --test src/core/autopost/service/autopost-config.test.mjs  (빌드 뒤 dist 를 읽는다. DB 없이)
// 자동 글은 빠뜨리면 꺼진다 — 켜기 값(정확히 '1')과 API 키가 둘 다 있어야 돈다.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { AppConfig } = require('../../../../dist/common/config/app-config.js');

function ready(enabled, key) {
  for (const [name, value] of [
    ['AUTOPOST_ENABLED', enabled],
    ['ANTHROPIC_API_KEY', key],
  ]) {
    if (value === undefined) delete process.env[name];
    else process.env[name] = value;
  }
  return AppConfig.autopost.ready;
}

test('둘 다 없으면 꺼짐', () =>
  assert.equal(ready(undefined, undefined), false));
test('키만 있으면 꺼짐', () => assert.equal(ready(undefined, 'k'), false));
test('켜기 값이 1 이 아니면 꺼짐', () => {
  for (const v of ['true', 'on', 'yes', '0', '', ' 1'])
    assert.equal(ready(v, 'k'), false, JSON.stringify(v));
});
test('켰는데 키가 비면 꺼짐', () => {
  assert.equal(ready('1', ''), false);
  assert.equal(ready('1', '   '), false);
  assert.equal(ready('1', undefined), false);
});
test('둘 다 있으면 켜짐', () => assert.equal(ready('1', 'k'), true));
test('보기만·초안으로는 키만 본다', () => {
  ready(undefined, 'k');
  assert.equal(AppConfig.autopost.hasKey, true);
  ready('1', '');
  assert.equal(AppConfig.autopost.hasKey, false);
});
