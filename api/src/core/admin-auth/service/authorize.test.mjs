// node --test src/core/admin-auth/service/authorize.test.mjs  (빌드 뒤 dist 를 읽는다)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const {
  authorize,
  decide,
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

test('decide: M.AX 가 root 라고 하면 그룹과 무관하게 통과', () => {
  assert.deepEqual(decide({ role: 'USER', groups: [] }, rule, true), {
    ok: true,
    by: 'max-root',
  });
});
test('decide: M.AX 가 root 아니라고 하면 그룹 OWNER 여도 거부', () => {
  assert.deepEqual(
    decide({ role: 'USER', groups: [{ id: G, role: 'OWNER' }] }, rule, false),
    { ok: false, by: 'max-root' },
  );
});
test('decide: M.AX 를 못 봤으면 그룹 판정', () => {
  assert.deepEqual(
    decide({ role: 'USER', groups: [{ id: G, role: 'OWNER' }] }, rule, null),
    { ok: true, by: 'iam-group' },
  );
});
test('decide: PLATFORM_ADMIN 은 M.AX 가 거부해도 통과', () => {
  assert.deepEqual(decide({ role: 'PLATFORM_ADMIN' }, rule, false), {
    ok: true,
    by: 'platform-admin',
  });
});
test('decide: M.AX 설정은 있는데 안 닿으면 거부 (열리지 않는다)', () => {
  assert.deepEqual(
    decide(
      { role: 'USER', groups: [{ id: G, role: 'OWNER' }] },
      rule,
      'unavailable',
    ),
    { ok: false, by: 'max-unavailable' },
  );
});

const {
  canEditBoard,
} = require('../../../../dist/core/admin-auth/service/board-access.js');
test('board: admin 은 전부', () => {
  assert.equal(canEditBoard('admin', 'recruit'), true);
  assert.equal(canEditBoard('admin', 'notice'), true);
});
test('board: hr 은 채용만', () => {
  assert.equal(canEditBoard('hr', 'recruit'), true);
  assert.equal(canEditBoard('hr', 'notice'), false);
});
test('board: marketing 은 채용 빼고', () => {
  assert.equal(canEditBoard('marketing', 'notice'), true);
  assert.equal(canEditBoard('marketing', 'recruit'), false);
});
test('board: 역할 없는 옛 세션은 admin 취급', () => {
  assert.equal(canEditBoard(undefined, 'recruit'), true);
});
