// node --test src/core/admin-auth/service/authorize.test.mjs  (빌드 뒤 dist 를 읽는다)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const {
  isIamAdmin,
  scopeOf,
} = require('../../../../dist/core/admin-auth/service/authorize.js');
const {
  canEditBoard,
} = require('../../../../dist/core/admin-auth/service/board-access.js');

// ── 입장: IAM 이 관리자라고 한 사람만
test('IAM 최상위 role 이 admin · PLATFORM_ADMIN 이면 관리자', () => {
  assert.equal(isIamAdmin({ role: 'admin' }), true);
  assert.equal(isIamAdmin({ role: 'ADMIN' }), true);
  assert.equal(isIamAdmin({ role: 'PLATFORM_ADMIN' }), true);
  assert.equal(isIamAdmin({ role: 'platform_admin' }), true);
  assert.equal(isIamAdmin({ role: 'USER' }), false);
  assert.equal(isIamAdmin({}), false);
});
test('그룹 안에서 ADMIN·OWNER 여도 최상위 role 이 USER 면 관리자가 아니다', () => {
  assert.equal(
    isIamAdmin({
      role: 'USER',
      groups: [
        { id: 'g', name: 'Default', role: 'OWNER' },
        { id: 'h', name: 'Team', role: 'ADMIN' },
      ],
    }),
    false,
  );
});

// ── 범위: admin_users(IAM 판정의 거울)의 행
test('범위: 행 없음·꺼짐은 null (못 들어온다)', () => {
  assert.equal(scopeOf(null), null);
  assert.equal(scopeOf({ role: 'admin', enabled: false }), null);
});
test('범위: 켜진 행은 그 역할', () => {
  assert.equal(scopeOf({ role: 'marketing', enabled: true }), 'marketing');
  assert.equal(scopeOf({ role: 'hr', enabled: true }), 'hr');
  assert.equal(scopeOf({ role: 'admin', enabled: true }), 'admin');
});
test('범위: 모르는 역할은 null', () => {
  assert.equal(scopeOf({ role: 'owner', enabled: true }), null);
});

// ── 게시판: 범위별로 만질 수 있는 것
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
test('board: 역할 없는 옛 세션은 거부', () => {
  assert.equal(canEditBoard(undefined, 'notice'), false);
});
