// node --test src/core/autopost/service/autopost-render.test.mjs  (빌드 뒤 dist 를 읽는다. DB 없이)
// 자동 글의 HTML. 모델은 구조만 내고 HTML 은 코드가 만든다 — 만든 것이 본문 소독을 그대로 지나가야 한다.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { good as sample } from './autopost-fixture.mjs';

const require = createRequire(import.meta.url);
const {
  sanitizeBody,
} = require('../../../../dist/common/html/sanitize-body.js');
const {
  renderArticle,
  bodyText,
  CTA_HTML,
} = require('../../../../dist/core/autopost/service/autopost-render.js');

test('만든 HTML 은 소독의 고정점', () => {
  const h = renderArticle(sample);
  assert.equal(sanitizeBody(h), h);
});

test('모양', () => {
  const h = renderArticle(sample);
  assert.match(h, /^<p>/);
  assert.equal((h.match(/<h2>/g) || []).length, sample.sections.length + 1); // + 출처
  assert.ok(h.includes('<h2>1. ' + sample.sections[0].heading + '</h2>'));
  assert.ok(h.includes('target="_blank" rel="noopener noreferrer"'));
  assert.ok(h.endsWith(CTA_HTML));
});

test('모델이 쓴 꺾쇠·따옴표는 글자로 나간다', () => {
  const h = renderArticle({
    ...sample,
    hook: ['<script>alert(1)</script> & "x"'],
  });
  assert.ok(!h.includes('<script>'));
  assert.equal(sanitizeBody(h), h);
});

test('bodyText 에 출처 제목·CTA 가 없다', () => {
  const t = bodyText({
    ...sample,
    sources: [{ ...sample.sources[0], title: 'M.AX 뉴스' }],
  });
  assert.ok(!t.includes('M.AX 뉴스'));
  assert.ok(!t.includes('문의'));
});
