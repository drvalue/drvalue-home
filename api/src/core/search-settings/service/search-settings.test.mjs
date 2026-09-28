// node --test src/core/search-settings/service/search-settings.test.mjs  (빌드 뒤 dist 를 읽는다. DB 없이)
// 검색엔진 설정 저장 DTO 의 검사 — 확인 코드는 비우거나(빈 글자·null) 1~120자의 영문·숫자·_ - = : . 만.
// 되돌리기(snapshotToDto)와 요청(ValidationPipe)이 같은 규칙을 쓴다.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { snapshotToDto } = require('../../../../dist/common/revision/snapshot-dto.js');
const {
  ControllerSearchSettingsDefaultSaveDto: Save,
  VERIFICATION_CODE_RE,
} = require('../../../../dist/core/search-settings/dto/controller-search-settings-default.dto.js');

const base = { ai_search_allowed: true, ai_training_allowed: true };
const ok = (body) => snapshotToDto(Save, { ...base, ...body });
async function rejects(body) {
  try {
    await ok(body);
  } catch (e) {
    return e;
  }
  assert.fail(`통과하면 안 된다: ${JSON.stringify(body)}`);
}

test('확인 코드 모양: 실제 코드들 · 빈 글자는 통과', () => {
  for (const v of [
    '',
    'a',
    '0123456789abcdef0123456789abcdef01234567', // 네이버(40자 hex)
    'AbCdEf-0123456789_AbCdEf0123456789AbCdEf012', // 구글(43자 base64url)
    '0123456789ABCDEF0123456789ABCDEF', // 빙(32자 hex)
    'x=y:z.w',
    'a'.repeat(120),
  ])
    assert.equal(VERIFICATION_CODE_RE.test(v), true, v);
});

test('확인 코드 모양: 태그째 붙여 넣기 · 따옴표 · 공백 · 121자 · 한글은 거부', () => {
  for (const v of [
    '<meta name="naver-site-verification" content="abc" />',
    'abc"def',
    "abc'def",
    'abc def',
    'abc<def',
    'a'.repeat(121),
    '한글',
  ])
    assert.equal(VERIFICATION_CODE_RE.test(v), false, v);
});

test('저장 DTO: 코드 셋 비움(null·빈 글자·빠짐) + 스위치 둘은 통과', async () => {
  await ok({});
  await ok({ naver_site_verification: null, google_site_verification: '', bing_site_verification: undefined });
  const d = await ok({ naver_site_verification: 'abc123', ai_search_allowed: false, ai_training_allowed: false });
  assert.equal(d.naver_site_verification, 'abc123');
  assert.equal(d.ai_search_allowed, false);
  assert.equal(d.ai_training_allowed, false);
});

test('저장 DTO: 틀린 코드는 400 과 칸 이름이 든 한국어 문구', async () => {
  const e = await rejects({ google_site_verification: '<meta content="x">' });
  assert.equal(e.getStatus(), 400);
  assert.match(e._message, /구글 확인 코드는 영문·숫자와/);
  const long = await rejects({ bing_site_verification: 'a'.repeat(121) });
  assert.equal(long.getStatus(), 400);
  assert.match(long._message, /빙 확인 코드/);
});

test('저장 DTO: 스위치가 빠지거나 불리언이 아니면 거부(조용히 켜지 않는다)', async () => {
  for (const body of [{ ai_search_allowed: undefined }, { ai_training_allowed: 'false' }, { ai_search_allowed: 0 }]) {
    const e = await rejects(body);
    assert.equal(e.getStatus(), 400);
  }
});
