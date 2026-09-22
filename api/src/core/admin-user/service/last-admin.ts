/**
 * 켜져 있는 마지막 「전부(admin)」를 내리면 아무도 범위를 못 고친다 — 그 한 번을 막는다.
 * 순수 함수. 테스트: last-admin.test.mjs
 */
export function wouldLockOut(
  row: { enabled: boolean; role: string },
  next: string,
  enabledAdmins: number,
): boolean {
  return (
    row.enabled &&
    row.role === 'admin' &&
    next !== 'admin' &&
    enabledAdmins <= 1
  );
}
