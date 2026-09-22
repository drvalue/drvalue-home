// node --test src/core/admin-auth/service/authorize.test.mjs  (빌드 뒤 dist 를 읽는다)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const {
  authorize,
} = require('../../../../dist/core/admin-auth/service/authorize.js');

const G = '81bf109a-60fd-4a72-a27b-87e355ac52e3';
const rule = { group: G, roles: ['OWNER', 'ADMIN'] };

test('PLATFORM_ADMIN 은 그룹과 무관하게 통과', () => {
  assert.equal(authorize({ role: 'PLATFORM_ADMIN', groups: [] }, rule), true);
});
test('그룹 OWNER 통과', () => {
  assert.equal(
    authorize(
      { role: 'USER', groups: [{ id: G, name: 'Default', role: 'OWNER' }] },
      rule,
    ),
    true,
  );
});
test('그룹 MEMBER 거부', () => {
  assert.equal(
    authorize({ role: 'USER', groups: [{ id: G, role: 'MEMBER' }] }, rule),
    false,
  );
});
test('그룹 없음 거부', () => {
  assert.equal(authorize({ role: 'USER', groups: [] }, rule), false);
});
test('이름만 같고 id 가 다르면 거부', () => {
  assert.equal(
    authorize(
      {
        role: 'USER',
        groups: [{ id: 'other', name: 'Default', role: 'OWNER' }],
      },
      rule,
    ),
    false,
  );
});
test('rule.group 이 비면 PLATFORM_ADMIN 만', () => {
  assert.equal(
    authorize(
      { role: 'USER', groups: [{ id: G, role: 'OWNER' }] },
      { group: '', roles: ['OWNER'] },
    ),
    false,
  );
});
