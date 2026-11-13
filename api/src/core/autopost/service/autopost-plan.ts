/** 「진행 중」이 이만큼 넘게 남아 있으면 죽은 것으로 본다(컨테이너가 만드는 도중에 내려갔다). */
const STALE_MS = 2 * 3600 * 1000;
/** 한 주의 시도 한도. 돈이 드는 호출이라 무한히 되풀이하지 않는다. */
export const MAX_ATTEMPTS = 2;

export type AutopostPlan = 'start' | 'retry' | 'reap' | 'none';

/**
 * 이번 주 기록 행을 보고 할 일을 정한다.
 *
 *   행 없음                    → start (이번 주를 잡고 만든다)
 *   진행 중 · 2시간 넘음        → reap  (오류로 닫는다. 다음 틱이 retry 를 본다)
 *   오류 · 시도가 한도 아래     → retry
 *   그 밖(공개·건너뜀·초안 …)   → none  — 검사에 떨어진 주는 다시 하지 않는다
 */
export function planRun(
  row: { status: string; attempts: number; startedOn: Date } | null,
  now: Date,
): AutopostPlan {
  if (!row) return 'start';
  if (row.status === 'running')
    return now.getTime() - row.startedOn.getTime() > STALE_MS ? 'reap' : 'none';
  if (row.status === 'error' && row.attempts < MAX_ATTEMPTS) return 'retry';
  return 'none';
}
