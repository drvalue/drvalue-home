// node --test src/core/page/service/page-content.test.mjs  (빌드 뒤 dist 를 읽는다)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const {
  checkContent,
  emptyContent,
  PageContentError,
  withImageSizes,
} = require('../../../../dist/core/page/service/page-content.js');
const {
  HOME_SCHEMA,
} = require('../../../../dist/core/page/schema/home.schema.js');
const {
  COMPANY_LOCATION_SCHEMA,
} = require('../../../../dist/core/page/schema/company-location.schema.js');

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
  fails(
    { ...ok, items: [{ t: '' }] },
    /「항목」 1번째 항목의 「이름」 칸을 입력해 주세요/,
  );
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
  checkContent(fields, {
    ...ok,
    cta: { label: '메일', href: 'mailto:a@b.co' },
  });
  fails(
    { ...ok, cta: { label: 'x', href: 'javascript:alert(1)' } },
    /링크 주소/,
  );
  fails({ ...ok, cta: { label: 'x', href: '//evil.com' } }, /링크 주소/);
  fails({ ...ok, cta: { label: 'x', href: 'http://plain.com' } }, /링크 주소/);
});

test('그림은 uuid 만 받고 fileIds 로 모은다', () => {
  const id = 'AAAAAAAA-2222-3333-4444-555555555555';
  const r = checkContent(fields, { ...ok, photo: { id, alt: '건물' } });
  assert.deepEqual(r.content.photo, { id: id.toLowerCase(), alt: '건물' });
  assert.deepEqual(r.fileIds, [id.toLowerCase()]);
  fails({ ...ok, photo: { id: '../etc/passwd', alt: '' } }, /그림 값/);
  assert.equal(
    checkContent(fields, { ...ok, photo: { id: null, alt: '' } }).content.photo,
    null,
  );
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

test('사이트에 있는 그림(src) — 기본 글이 옛 화면 그림을 그대로 가리킨다', () => {
  const site = { id: null, alt: 'a', src: '/screens/pcb-dash.jpg', width: 1600, height: 1000 };
  const { content, fileIds } = checkContent(fields, { ...ok, photo: site });
  assert.deepEqual(content.photo, site);
  assert.deepEqual(fileIds, []);
  // 폴더 밖 · 위로 가기 · 바깥 주소는 거부
  fails({ ...ok, photo: { ...site, src: '/etc/passwd.png' } }, /그림 주소가 올바르지 않습니다/);
  fails({ ...ok, photo: { ...site, src: '/screens/../x.png' } }, /그림 주소가 올바르지 않습니다/);
  fails({ ...ok, photo: { ...site, src: 'https://evil.example/a.png' } }, /그림 주소가 올바르지 않습니다/);
  // 개인정보가 찍힌 증서 원본은 가리키지 못한다
  fails({ ...ok, photo: { ...site, src: '/img/patent2.png' } }, /그림 주소가 올바르지 않습니다/);
  fails({ ...ok, photo: { ...site, src: '/img/patent3.png' } }, /그림 주소가 올바르지 않습니다/);
  // 치수가 없으면 거부 — 공개 화면의 <img> 에 width·height 가 있어야 한다
  fails({ ...ok, photo: { id: null, alt: 'a', src: '/screens/pcb-dash.jpg' } }, /크기 값이 올바르지 않습니다/);
  // 미디어로 바꾸면 src 는 버린다
  const id = '11111111-2222-3333-4444-555555555555';
  const up = checkContent(fields, { ...ok, photo: { ...site, id } });
  assert.deepEqual(up.content.photo, { id, alt: 'a' });
});

test('소개 장 15장 스키마 — 칸 이름이 겹치지 않고, 키가 하나씩', () => {
  const { PAGE_SCHEMAS } = require('../../../../dist/core/page/schema/index.js');
  const keys = PAGE_SCHEMAS.map((s) => s.key);
  assert.equal(new Set(keys).size, keys.length);
  assert.equal(keys.length, 17); // 메인 1 + 소개 장 16(오시는 길 포함)
  const dup = (fs) => {
    const ks = fs.map((f) => f.key);
    assert.equal(new Set(ks).size, ks.length, ks.join(','));
    for (const f of fs) {
      if (f.type === 'group') dup(f.fields);
      if (f.type === 'list') dup(f.item);
    }
  };
  for (const s of PAGE_SCHEMAS) dup(s.fields);
});

// ── boolean · select · uniqueBy (메인 구역 차례)
const order = [
  {
    type: 'list',
    key: 'sections',
    label: '구역 차례',
    min: 2,
    max: 2,
    uniqueBy: 'section',
    item: [
      {
        type: 'select',
        key: 'section',
        label: '구역',
        required: true,
        options: [
          { value: 'a', label: '가' },
          { value: 'b', label: '나' },
        ],
      },
      { type: 'boolean', key: 'visible', label: '보이기' },
    ],
  },
];
const orderFails = (value, re) =>
  assert.throws(
    () => checkContent(order, value),
    (e) => e instanceof PageContentError && re.test(e.message),
  );

test('boolean 은 참·거짓만, 빠지면 false', () => {
  const { content } = checkContent(order, {
    sections: [{ section: 'a' }, { section: 'b', visible: true }],
  });
  assert.deepEqual(content.sections, [
    { section: 'a', visible: false },
    { section: 'b', visible: true },
  ]);
  orderFails(
    { sections: [{ section: 'a', visible: 'yes' }, { section: 'b' }] },
    /값이 올바르지/,
  );
});

test('select 는 목록에 있는 값만, 필수면 비울 수 없다', () => {
  orderFails(
    { sections: [{ section: 'z' }, { section: 'b' }] },
    /목록에 있는 값만/,
  );
  orderFails({ sections: [{ section: '' }, { section: 'b' }] }, /골라 주세요/);
});

test('uniqueBy — 같은 구역이 두 번 오면 거부한다', () => {
  orderFails(
    { sections: [{ section: 'a' }, { section: 'a' }] },
    /2번째 항목이 앞의 항목과 겹칩니다/,
  );
});

test('메인 스키마의 빈 글은 필수 칸에 걸린다', () => {
  const empty = emptyContent(HOME_SCHEMA.fields);
  assert.deepEqual(empty.sections, []);
  assert.throws(
    () => checkContent(HOME_SCHEMA.fields, empty),
    (e) => e instanceof PageContentError && /입력해 주세요/.test(e.message),
  );
});
