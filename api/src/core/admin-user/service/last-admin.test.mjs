// node --test src/core/admin-user/service/last-admin.test.mjs  (빌드 뒤 dist 를 읽는다)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const {
  wouldLockOut,
} = require('../../../../dist/core/admin-user/service/last-admin.js');

test('마지막 켜진 admin 을 marketing 으로 → 막는다', () => {
  assert.equal(
    wouldLockOut({ enabled: true, role: 'admin' }, 'marketing', 1),
    true,
  );
});
test('admin 이 둘이면 하나는 내릴 수 있다', () => {
  assert.equal(wouldLockOut({ enabled: true, role: 'admin' }, 'hr', 2), false);
});
test('꺼진 admin 은 세지 않는다 — 내려도 잠기지 않는다', () => {
  assert.equal(wouldLockOut({ enabled: false, role: 'admin' }, 'hr', 1), false);
});
test('admin → admin 은 그대로', () => {
  assert.equal(
    wouldLockOut({ enabled: true, role: 'admin' }, 'admin', 1),
    false,
  );
});
test('marketing 을 hr 로 → 관계없다', () => {
  assert.equal(
    wouldLockOut({ enabled: true, role: 'marketing' }, 'hr', 1),
    false,
  );
});
