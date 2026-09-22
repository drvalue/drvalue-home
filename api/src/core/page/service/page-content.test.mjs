// node --test src/core/page/service/page-content.test.mjs  (빌드 뒤 dist 를 읽는다)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { checkContent, emptyContent, PageContentError, withImageSizes } = require(
  '../../../../dist/core/page/service/page-content.js',
);
const { COMPANY_LOCATION_SCHEMA } = require(
  '../../../../dist/core/page/schema/company-location.schema.js',
);

const fields = [
  { type: 'text', key: 'title', label: '제목', max: 10, required: true },
  { type: 'richtext', key: 'body', label: '본문', max: 200 },
  { type: 'image', key: 'photo', label: '사진' },
  { type: 'link', key: 'cta', label: '버튼' },
  {
    type: 'list',
    key: 'items',
    label: '항목',
    min: 1,
    max: 2,
    item: [{ type: 'text', key: 't', label: '이름', max: 5, required: true }],
  },
];
const ok = { title: '가', items: [{ t: '나' }] };
const fails = (value, re) =>
  assert.throws(
    () => checkContent(fields, value),
    (e) => e instanceof PageContentError && re.test(e.message),
  );

test('빈 글은 스키마 모양 그대로', () => {
  assert.deepEqual(emptyContent(fields), {
    title: '',
    body: '',
    photo: null,
    cta: { label: '', href: '' },
    items: [],
  });
});

test('빠진 칸은 빈 값으로 채운다', () => {
  const { content } = checkContent(fields, ok);
  assert.equal(content.body, '');
  assert.equal(content.photo, null);
  assert.deepEqual(content.cta, { label: '', href: '' });
});

test('모르는 칸은 거부', () => {
  fails({ ...ok, extra: 1 }, /알 수 없는 칸/);
  fails({ ...ok, items: [{ t: '나', x: 1 }] }, /알 수 없는 칸/);
});

test('필수·길이·목록 개수', () => {
  fails({ ...ok, title: '' }, /「제목」 칸을 입력해 주세요/);
  fails({ ...ok, title: '가'.repeat(11) }, /10자까지/);
  fails({ ...ok, items: [] }, /1개 이상/);
  fails({ ...ok, items: [{ t: 'a' }, { t: 'b' }, { t: 'c' }] }, /2개까지/);
  fails({ ...ok, items: [{ t: '' }] }, /「항목」 1번째 항목의 「이름」 칸을 입력해 주세요/);
});

test('richtext 는 스크립트·이벤트 속성을 버린다', () => {
  const { content } = checkContent(fields, {
    ...ok,
    body: '<p onclick="x()">안녕<script>alert(1)</script></p><img src="javascript:alert(1)"><a href="javascript:x">링크</a>',
  });
  assert.equal(/script|onclick|javascript/i.test(content.body), false);
  assert.match(content.body, /<p>안녕<\/p>/);
});

test('richtext 의 그림은 우리 파일·https 만', () => {
  const id = '11111111-2222-3333-4444-555555555555';
  const { content } = checkContent(fields, {
    ...ok,
    body: `<p><img src="/api/content/assets/${id}"><img src="http://evil/x.png"></p>`,
  });
  assert.match(content.body, new RegExp(`/api/content/assets/${id}`));
  assert.equal(content.body.includes('evil'), false);
});

test('링크 주소는 / · https · mailto · tel 만', () => {
  checkContent(fields, { ...ok, cta: { label: '보기', href: '/page/x' } });
  checkContent(fields, { ...ok, cta: { label: '메일', href: 'mailto:a@b.co' } });
  fails({ ...ok, cta: { label: 'x', href: 'javascript:alert(1)' } }, /링크 주소/);
  fails({ ...ok, cta: { label: 'x', href: '//evil.com' } }, /링크 주소/);
  fails({ ...ok, cta: { label: 'x', href: 'http://plain.com' } }, /링크 주소/);
});

test('그림은 uuid 만 받고 fileIds 로 모은다', () => {
  const id = 'AAAAAAAA-2222-3333-4444-555555555555';
  const r = checkContent(fields, { ...ok, photo: { id, alt: '건물' } });
  assert.deepEqual(r.content.photo, { id: id.toLowerCase(), alt: '건물' });
  assert.deepEqual(r.fileIds, [id.toLowerCase()]);
  fails({ ...ok, photo: { id: '../etc/passwd', alt: '' } }, /그림 값/);
  assert.equal(checkContent(fields, { ...ok, photo: { id: null, alt: '' } }).content.photo, null);
});

test('오시는 길 스키마: 전화·이메일 형식', () => {
  const s = COMPANY_LOCATION_SCHEMA.fields;
  const base = {
    shell: { kicker: '찾아오시는 길', headLead: '안내' },
    place: {
      company: '디알밸류',
      address: [{ line: '경기도' }],
      tel: '031-400-3880',
      email: 'hi@drvalue.co.kr',
      mapQuery: '한양대',
    },
    guide: { title: '방문 안내' },
  };
  checkContent(s, base);
  assert.throws(
    () => checkContent(s, { ...base, place: { ...base.place, tel: '전화' } }),
    /숫자와 하이픈/,
  );
  assert.throws(
    () => checkContent(s, { ...base, place: { ...base.place, email: 'nope' } }),
    /이메일 주소 형식/,
  );
});

test('그림 칸에 미디어 치수를 적는다(보낸 치수는 검사에서 버린다)', () => {
  const id = '11111111-2222-3333-4444-555555555555';
  const { content } = checkContent(fields, {
    ...ok,
    photo: { id, alt: 'a', width: 9999, height: 1 },
  });
  assert.deepEqual(content.photo, { id, alt: 'a' });
  const sized = withImageSizes(
    content,
    new Map([[id, { width: 640, height: 480 }]]),
  );
  assert.deepEqual(sized.photo, { id, alt: 'a', width: 640, height: 480 });
  assert.equal(sized.title, '가');
});
