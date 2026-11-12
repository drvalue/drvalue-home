// node --test src/core/autopost/service/autopost-lint.test.mjs  (빌드 뒤 dist 를 읽는다. DB 없이)
// 자동 글의 코드 검사. 사람이 검수하지 않으므로 여기서 떨어지면 그 주는 글이 없다 — 애매하면 떨어지는 쪽이다.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import {
  good,
  allTrue,
  withHook,
  withSourceDate,
  withSourceTitle,
  withSourceUrl,
  withClaim,
} from './autopost-fixture.mjs';

const require = createRequire(import.meta.url);
const {
  lintStructure,
  lintClaims,
  numbersIn,
} = require('../../../../dist/core/autopost/service/autopost-lint.js');

const pass = (a, c = {}) => [
  ...lintStructure(a, { today: '2026-11-12', usedSourceUrls: [], ...c }),
  ...lintClaims(a, allTrue(a)),
];

test('통과', () => assert.deepEqual(pass(good), []));

test('주장에 없는 숫자', () =>
  assert.match(
    pass(withHook(good, '불량률이 47% 줄었습니다.')).join(),
    /주장 목록에 없는 숫자: 47/,
  ));

test('표기 차이는 같은 값', () => {
  assert.deepEqual(
    pass(withClaim(good, '감소 폭은 ３０ ％입니다.', '30%')),
    [],
  );
  assert.deepEqual(
    pass(withClaim(good, '투자 규모는 １，２００억 원입니다.', '1200억 원')),
    [],
  );
  assert.deepEqual(numbersIn('1,200억 원과 ３０％, 0.76'), [
    '1200',
    '30',
    '0.76',
  ]);
});

test('확인 안 된 주장', () => {
  const j = allTrue(good);
  j.claims[good.claims[0].sentence] = false;
  assert.match(lintClaims(good, j).join(), /확인되지 않은 주장/);
});

test('판정에 없는 주장·출처는 확인 안 된 것', () => {
  assert.ok(
    lintClaims(good, { claims: {}, sources: {}, datesOk: true }).length,
  );
  assert.match(
    lintClaims(good, { ...allTrue(good), sources: {} }).join(),
    /발행일/,
  );
});

test('본문의 날짜가 출처와 안 맞으면 떨어진다', () =>
  assert.match(
    lintClaims(good, { ...allTrue(good), datesOk: false }).join(),
    /날짜/,
  ));

test('주장 문장이 본문에 없으면 떨어진다', () => {
  // 본문은 「불량률 30%」라고 쓰고 주장은 「멈춤 시간 30%」— 같은 숫자지만 다른 말이다.
  const a = {
    ...withHook(good, '불량률이 30% 줄었습니다.'),
    claims: good.claims,
  };
  assert.match(pass(a).join(), /주장 목록에 없는 숫자: 30/);
  const b = {
    ...good,
    claims: [
      ...good.claims,
      { ...good.claims[0], sentence: '본문에 없는 문장 30%' },
    ],
  };
  assert.match(pass(b).join(), /본문에 없는 주장/);
});

test('같은 숫자라도 그 문단의 주장이 있어야 한다', () =>
  assert.deepEqual(
    pass(withClaim(good, '불량률이 30% 줄었습니다.', '30%')),
    [],
  ));

test('주장의 값은 그 문장 안에 있어야 한다', () => {
  const a = {
    ...good,
    claims: [{ ...good.claims[0], value: '45%' }, ...good.claims.slice(1)],
  };
  assert.ok(pass(a).length);
});

test('같은 문장의 주장이 둘이면 값이 달라야 한다', () => {
  assert.ok(pass({ ...good, claims: [...good.claims, good.claims[0]] }).length);
});

test('기간으로 쓴 「일」은 숫자 검사를 받는다', () => {
  assert.match(
    pass(withHook(good, '납기가 90일에서 30일로 줄었습니다.')).join(),
    /주장 목록에 없는 숫자: 90/,
  );
  assert.deepEqual(
    pass(withHook(good, '2026년 11월 10일에 발표했습니다.')),
    [],
  );
});

test('오래된 출처', () =>
  assert.ok(pass(withSourceDate(good, '2026-10-28')).length)); // 15일 전

test('14일 전은 통과', () =>
  assert.deepEqual(pass(withSourceDate(good, '2026-10-29')), []));

test('읽을 수 없는 날짜', () => {
  for (const d of [
    '',
    '2026.11.10',
    'November 10, 2026',
    '2026-13-40',
    '2026-02-30',
    '2026-11-13',
  ])
    assert.ok(pass(withSourceDate(good, d)).length, d);
});

test('겹치는 출처', () =>
  assert.ok(
    pass(good, { usedSourceUrls: [good.sources[0].url + '/?utm_source=x#top'] })
      .length,
  ));

test('금지 문자열', () => {
  for (const s of ['디알밸류', 'GrowXD', 'CosmoGMP', 'M.AX 플랫폼'])
    assert.ok(pass(withHook(good, s + ' 이야기입니다.')).length, s);
});

test('M.AX 얼라이언스는 통과', () =>
  assert.deepEqual(
    pass(withHook(good, '산업부가 M.AX 얼라이언스를 출범했습니다.')),
    [],
  ));

test('출처 제목의 M.AX 는 안 본다', () =>
  assert.deepEqual(pass(withSourceTitle(good, 'M.AX 관련 발표')), []));

test('http 가 아닌 주소', () => {
  for (const u of [
    'javascript:alert(1)',
    'ftp://example.org/a',
    'not a url',
    '',
  ])
    assert.ok(pass(withSourceUrl(good, u)).length, u);
});

test('이모지', () => assert.ok(pass(withHook(good, '🚨 속보입니다.')).length));

test('연도·날짜·한 자리 개수는 숫자 검사 예외', () =>
  assert.deepEqual(
    pass(withHook(good, '2026년 11월 10일, 세 회사가 3가지 기능을 냈습니다.')),
    [],
  ));

test('구조: 단락 수·제목 길이·주장 없음', () => {
  assert.ok(pass({ ...good, sections: good.sections.slice(0, 3) }).length);
  assert.ok(pass({ ...good, title: '짧다' }).length);
  assert.ok(pass({ ...good, claims: [] }).length);
  assert.ok(pass({ ...good, sources: [] }).length);
});

test('주장의 출처가 출처 목록에 없다', () =>
  assert.ok(
    pass({
      ...good,
      claims: [
        { ...good.claims[0], source_url: 'https://other.example/x' },
        good.claims[1],
      ],
    }).length,
  ));

test('형이 깨진 글은 던지지 않고 떨어진다', () => {
  assert.ok(
    lintStructure({}, { today: '2026-11-12', usedSourceUrls: [] }).length,
  );
  assert.ok(
    lintStructure(
      { ...good, hook: 'x', sections: null },
      { today: '2026-11-12', usedSourceUrls: [] },
    ).length,
  );
});
