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
  judgedUnits,
  pruneSources,
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

test('짧은 구절 하나가 두 문단을 덮어도, 문단마다 판정을 받아야 한다', () => {
  // 주장 「30% 줄었습니다.」는 「멈춤 시간이 30% 줄었습니다.」에도 「불량률이 30% 줄었습니다.」에도 들어 있다.
  const a = {
    ...withHook(good, '불량률이 30% 줄었습니다.'),
    claims: [
      ...good.claims,
      { ...good.claims[0], sentence: '30% 줄었습니다.' },
    ],
  };
  assert.deepEqual(
    lintStructure(a, { today: '2026-11-12', usedSourceUrls: [] }),
    [],
  );
  const j = allTrue(a);
  j.units['불량률이 30% 줄었습니다.'] = false; // 판정이 이 문단은 출처에 없다고 했다
  assert.match(lintClaims(a, j).join(), /출처로 뒷받침되지 않는 문단/);
  delete j.units['불량률이 30% 줄었습니다.']; // 판정에 없는 문단도 같다
  assert.match(lintClaims(a, j).join(), /출처로 뒷받침되지 않는 문단/);
});

test('덩어리마다 판정을 요구한다 — 숫자가 없어도(인용·발표·계약)', () => {
  assert.equal(
    judgedUnits(good).length,
    new Set([
      good.title,
      good.summary,
      good.seo_description,
      ...good.hook,
      ...good.sections.flatMap((x) => [x.heading, ...x.paragraphs]),
    ]).size,
  );
  const a = withHook(
    good,
    '롤란트 부시 회장은 "한국 공장 열 곳에 먼저 깔겠다"고 말했습니다.',
  );
  const j = allTrue(a);
  assert.deepEqual(lintClaims(a, j), []);
  delete j.units[a.hook[2]];
  assert.match(lintClaims(a, j).join(), /출처로 뒷받침되지 않는 문단/);
});

test('한글로 푼 수량은 떨어진다', () => {
  for (const t of [
    '불량률을 절반으로 줄였습니다.',
    '생산성이 두 배로 늘었습니다.',
    '불량이 삼십 퍼센트 줄었습니다.',
    '수백억 원을 투자했습니다.',
    '수십 곳이 도입했습니다.',
    '세 배 빨라졌습니다.',
  ])
    assert.match(pass(withHook(good, t)).join(), /한글로 쓴 수량/, t);
  for (const t of [
    '두 회사가 손을 잡았습니다.',
    '두 배터리 업체가 조건을 맞췄습니다.',
    '조명 설비와 이 프로젝트를 봅니다.',
  ])
    assert.deepEqual(pass(withHook(good, t)), [], t);
  for (const t of ['삼천 명이 일합니다.', '백만 원을 아꼈습니다.'])
    assert.match(pass(withHook(good, t)).join(), /한글로 쓴 수량/, t);
});

test('「개월」「개국」은 개수 예외가 아니다', () => {
  for (const t of [
    '투자금을 3개월 만에 회수했습니다.',
    '8개국에 법인을 냈습니다.',
  ])
    assert.match(pass(withHook(good, t)).join(), /주장 목록에 없는 숫자/, t);
  assert.deepEqual(pass(withHook(good, '기능은 3개입니다.')), []);
});

test('금지 이름은 띄어쓰기·음차·전각·폭 없는 문자로 비켜 가지 못한다', () => {
  for (const t of [
    '디알 밸류',
    '디알벨류',
    'drvalue.co.kr',
    'DRVALUE',
    '그로우엑스디',
    'Grow XD',
    '코스모GMP',
    'M-AX',
    'M. AX',
    'MAX 플랫폼',
    'Ｍ.ＡＸ',
    'M.\u200bAX',
    '저희 회사 솔루션',
    '당사 제품',
  ])
    assert.match(
      pass(withHook(good, t + ' 이야기입니다.')).join(),
      /쓰면 안 되는/,
      t,
    );
});

test('출처 칸: 발행처도 검사하고, 주장 없는 출처·겹친 주소·계정 든 주소·긴 제목은 떨어진다', () => {
  const src = (patch) => ({
    ...good,
    sources: [{ ...good.sources[0], ...patch }, good.sources[1]],
  });
  assert.ok(pass(src({ publisher: '디알밸류 GrowXD 고객사' })).length);
  assert.ok(pass(src({ publisher: 'Siemens 🚀' })).length);
  assert.ok(pass(src({ title: 'x'.repeat(201) })).length);
  assert.ok(pass(src({ publisher: 'x'.repeat(81) })).length);
  assert.match(
    pass(withSourceUrl(good, 'https://evil.example/login')).join(),
    /주장이 없는 출처/,
  );
  assert.match(
    pass({ ...good, sources: [...good.sources, good.sources[0]] }).join(),
    /같은 출처/,
  );
  const u = 'https://drvalue.co.kr@evil.example/x';
  assert.ok(
    pass({
      ...good,
      sources: [{ ...good.sources[0], url: u }, good.sources[1]],
      claims: good.claims.map((c) =>
        c.source_url === good.sources[0].url ? { ...c, source_url: u } : c,
      ),
    }).length,
  );
});

test('출처 주소는 조사가 찾은 주소 안에 있어야 한다', () => {
  assert.match(
    pass(good, { researchUrls: [good.sources[0].url] }).join(),
    /조사에 없는 출처/,
  );
  assert.deepEqual(
    pass(good, { researchUrls: good.sources.map((x) => x.url + '/') }),
    [],
  );
});

test('멀쩡한 문장을 떨어뜨리지 않는다 (규칙의 경계)', () => {
  for (const t of [
    '투자사와 담당사가 함께 발표했습니다.', // 「자사」「당사」가 낱말 안에 들어 있다
    '지멘스는 자사 공장에 먼저 적용했습니다.', // 기사 주체의 「자사」
    '불량 개수만 세던 방식에서 벗어났습니다.', // 「수만」
    '검사 횟수조차 줄였습니다.', // 「수조」
    '냉각 수조의 온도를 읽습니다.',
    '기존 구조 대비 부품이 줄었습니다.', // 「구조 대」
    '구조 원리와 구조 건전성을 함께 봅니다.',
    'Boeing MAX 생산 라인에도 쓰입니다.', // 앞이 영문인 MAX 는 다른 말이다
    '출력은 최대(max) 값으로 맞춥니다.',
    'Xcelerator™ 와 Teamcenter® 를 묶었습니다.',
  ])
    assert.deepEqual(pass(withHook(good, t)), [], t);
  assert.deepEqual(
    pass(withSourceTitle(good, 'Siemens Xcelerator™ update 🚀')),
    [],
  ); // 출처 제목은 바깥 글 그대로
});

test('열지 못한 출처는 발행일 미확인과 다른 사유로 나온다', () => {
  const j = allTrue(good);
  j.sources[good.sources[1].url] = false;
  j.unopened = [good.sources[1].url];
  const r = lintClaims(good, j).join();
  assert.match(r, /출처를 열지 못했습니다/);
  assert.doesNotMatch(r, /발행일이 원문에서 확인되지/);
});

test('이름에 든 숫자: 정해 둔 이름만 숫자 검사에서 빠진다', () => {
  for (const t of [
    '뉴스1에 따르면 산업부가 발표했습니다.',
    '3D 검사와 5G 망, 4차 산업혁명 이야기입니다.',
  ])
    assert.deepEqual(pass(withHook(good, t)), [], t);
  // 발행처는 모델이 쓰는 칸이다 — 거기 적은 숫자가 본문 숫자를 덮으면 안 된다.
  const a = {
    ...withHook(good, '불량률이 47% 줄었습니다.'),
    sources: [{ ...good.sources[0], publisher: '불량률 47%' }, good.sources[1]],
  };
  assert.match(pass(a).join(), /주장 목록에 없는 숫자: 47/);
  assert.match(
    pass(withHook(good, '뉴스2에 따르면 30곳이 도입했습니다.')).join(),
    /주장 목록에 없는 숫자/,
  );
});

test('숫자 사유는 어느 문단인지 같이 알려 준다', () =>
  assert.match(
    pass(withHook(good, '불량률이 47% 줄었습니다.')).join('|'),
    /주장 목록에 없는 숫자: 47 — 「불량률이 47% 줄었습니다/,
  ));

test('주장이 걸리지 않은 출처는 떼어 낸다', () => {
  const extra = withSourceUrl(good, 'https://evil.example/login');
  assert.equal(extra.sources.length, 3);
  const pruned = pruneSources(extra);
  assert.deepEqual(pruned.sources, good.sources);
  assert.deepEqual(pass(pruned), []);
  assert.equal(pruneSources(good), good); // 뗄 것이 없으면 그대로
  assert.deepEqual(pruneSources({}), {}); // 형이 깨진 글은 건드리지 않는다
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
