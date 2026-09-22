// node --test src/common/html/sanitize-body.test.mjs  (빌드 뒤 dist 를 읽는다)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { sanitizeBody, sanitizeRichHtml } = require('../../../dist/common/html/sanitize-body.js');

const ASSET = '/api/content/assets/11111111-2222-3333-4444-555555555555';

test('편집기(Quill) 글은 바이트 그대로 돌아온다', () => {
  const quill =
    '<p>안녕하세요.</p><p><br></p><ol><li data-list="bullet">첫째</li><li data-list="ordered">둘째</li></ol>' +
    '<p class="ql-align-center"><strong>굵게</strong>&nbsp;끝 &amp; &lt;tag&gt; "따옴표"</p>' +
    `<p><img src="${ASSET}"></p>` +
    '<p><a href="https://x.com/a?b=1&amp;c=2" rel="noopener noreferrer" target="_blank">링크</a></p>' +
    '<h2>제목</h2><h3>작은 제목</h3><blockquote>인용</blockquote><p><em>기울임</em><u>밑줄</u><s>취소</s></p>' +
    '<p class="ql-indent-1">들여쓰기</p>';
  assert.equal(sanitizeBody(quill), quill);
});

test('옛 글 모양(p·br·ul·li)은 그대로', () => {
  const legacy =
    '<p>안녕하세요.<br>디알밸류입니다.</p><p>안내드립니다.</p><ul><li>하나</li><li>둘</li></ul>';
  assert.equal(sanitizeBody(legacy), legacy);
});

test('태그 없는 맨 글자는 손대지 않는다(화면이 이스케이프한다)', () => {
  const plain = 'a < b & c\n두 번째 줄 <3';
  assert.equal(sanitizeBody(plain), plain);
  assert.equal(sanitizeBody(null), null);
  assert.equal(sanitizeBody(undefined), null);
});

test('스크립트 · style · iframe · 이벤트 속성은 사라진다', () => {
  const out = sanitizeBody(
    '<p onclick="x()">가</p><script>alert(1)</script><style>p{}</style>' +
      '<iframe src="https://evil"></iframe><svg onload=alert(1)></svg>' +
      '<p style="background:url(javascript:alert(1))">나</p>' +
      `<img src="${ASSET}" onerror="alert(1)">`,
  );
  assert.equal(out, `<p>가</p><p>나</p><img src="${ASSET}">`);
});

test('javascript: · data: 링크는 주소를 잃는다(엔티티로 숨겨도)', () => {
  for (const href of [
    'javascript:alert(1)',
    'jav&#x61;script:alert(1)',
    '&#106;avascript:alert(1)',
    'javascript&colon;alert(1)',
    ' javascript:alert(1)',
    'data:text/html,x',
    '//evil.example/x',
  ]) {
    assert.equal(sanitizeBody(`<a href="${href}">x</a>`), '<a>x</a>', href);
  }
});

test('새 창 링크는 opener 를 끊는다', () => {
  assert.equal(
    sanitizeBody('<a href="https://x.com" target="_blank">x</a>'),
    '<a href="https://x.com" target="_blank" rel="noopener noreferrer">x</a>',
  );
});

test('그림은 우리 파일과 사이트 그림만 — 바깥 주소 · 위로 가기 · 증서 원본은 빠진다', () => {
  const keep = [ASSET, '/screens/pcb-dash.jpg', '/img/patent1.png'];
  for (const src of keep)
    assert.equal(sanitizeRichHtml(`<img src="${src}">`), `<img src="${src}">`, src);
  const drop = [
    'https://evil.example/a.png',
    'http://x/a.png',
    'data:image/png;base64,AAAA',
    '/img/patent2.png',
    '/img/patent3.png',
    '/screens/../etc/passwd.png',
    '/etc/passwd.png',
    'x',
  ];
  for (const src of drop)
    assert.equal(sanitizeRichHtml(`<p><img src="${src}"></p>`), '<p></p>', src);
});
