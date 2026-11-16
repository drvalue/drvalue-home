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

const two = (a) => ({
  ...a,
  sections: [
    {
      heading: '무엇이 나왔나',
      paragraphs: ['결론 한 문장입니다.', '받치는 문단입니다.'],
    },
    ...a.sections.slice(1),
  ],
});
const figures = [
  { value: '30%', label: '멈춤 시간 감소' },
  { value: '1,200억 원', label: '투자 규모' },
];

test('만든 HTML 은 소독의 고정점 — 숫자 줄·그림·꾸밈 표시가 다 들어가도', () => {
  const h = renderArticle(sample);
  assert.equal(sanitizeBody(h), h);
  const id = '0f8fad5b-d9cb-469f-a165-70867728950e';
  const id2 = '1f8fad5b-d9cb-469f-a165-70867728950e';
  const full = renderArticle(
    { ...two(sample), figures, title: '따옴표 "가" 든 <제목> & 기호' },
    [
      { id, width: 1600, height: 900, section: null },
      { id: id2, width: 1600, height: 900, section: 1 },
    ],
  );
  assert.equal(sanitizeBody(full), full);
  // 표지는 맨 위(대표 이미지가 된다), 단락 그림은 그 단락 제목 아래
  assert.ok(
    full.startsWith(
      '<p class="dv_ap_cover"><img src="/api/content/assets/' + id + '" alt="',
    ),
  );
  assert.ok(
    full.includes(
      '<span class="dv_ap_no">02</span> ' +
        sample.sections[1].heading +
        '</h2><p class="dv_ap_pic"><img src="/api/content/assets/' +
        id2,
    ),
  );
  assert.equal((full.match(/<img /g) || []).length, 2);
  assert.ok(!renderArticle(sample).includes('<img'));
});

test('모양: 숫자 줄 → 3줄 요약 → 훅 → 단락 → 출처 → 문의 띠', () => {
  const h = renderArticle({ ...two(sample), figures });
  assert.ok(
    h.startsWith(
      '<ul class="dv_ap_figs"><li><strong>30%</strong> <span>멈춤 시간 감소</span></li>',
    ),
  );
  assert.ok(
    h.includes(
      '</ul><blockquote class="dv_ap_sum"><p><strong>3줄 요약</strong></p><ul><li>',
    ),
  );
  assert.equal((h.match(/<h2 class="dv_ap_h">/g) || []).length, 4);
  // 굵은 결론은 단락의 첫 문단 하나. 문단이 하나뿐인 단락은 통째로 결론으로 만들지 않는다
  assert.ok(
    h.includes(
      '<h2 class="dv_ap_h"><span class="dv_ap_no">01</span> 무엇이 나왔나</h2><p class="dv_ap_lead">결론 한 문장입니다.</p><p>받치는 문단입니다.</p>',
    ),
  );
  assert.equal((h.match(/dv_ap_lead/g) || []).length, 1);
  assert.ok(
    h.includes('<h2 class="dv_ap_src_h">출처</h2><ul class="dv_ap_src">'),
  );
  assert.ok(h.includes('target="_blank" rel="noopener noreferrer"'));
  assert.ok(h.endsWith(CTA_HTML));
  assert.ok(CTA_HTML.includes('href="/page/support/notify_form"'));
  // 숫자 줄이 없는 글, 요약·숫자 칸이 아예 없는 옛 글도 그려진다
  assert.ok(!renderArticle(sample).includes('dv_ap_figs'));
  assert.ok(
    !renderArticle({
      ...sample,
      key_points: undefined,
      figures: undefined,
    }).includes('dv_ap_sum'),
  );
});

test('꾸밈 표시는 dv_ap_ 로 시작하는 것만 소독을 지난다', () => {
  assert.equal(
    sanitizeBody('<p class="dv_ap_lead evil dv_art">x</p>'),
    '<p class="dv_ap_lead">x</p>',
  );
  assert.equal(sanitizeBody('<p class="dv_ap_X1">x</p>'), '<p>x</p>');
});

test('모델이 쓴 꺾쇠·따옴표는 글자로 나간다', () => {
  const h = renderArticle({
    ...sample,
    hook: ['<script>alert(1)</script> & "x" 줄바꿈\u00a0없는 공백'],
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
