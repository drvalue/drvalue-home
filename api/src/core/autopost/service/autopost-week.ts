/**
 * 자동 글의 달력. 운영 컨테이너에는 TZ 가 없어(개발 compose 에만 있다) 한국 시간을 여기서 센다 —
 * 9시간을 더한 뒤 UTC 접근자만 쓴다. 로컬 시간대·Intl 에 기대지 않는다.
 */
const KST_OFFSET_MS = 9 * 3600 * 1000;
const DAY_MS = 24 * 3600 * 1000;
const PUBLISH_DAY = 2; // 화요일(월=1 … 일=7)
const PUBLISH_HOUR = 9;

function kst(now: Date): Date {
  return new Date(now.getTime() + KST_OFFSET_MS);
}

/** 월=1 … 일=7. */
function isoDay(d: Date): number {
  return d.getUTCDay() || 7;
}

/** 한국 날짜 `YYYY-MM-DD`. */
export function kstDate(now: Date): string {
  return kst(now).toISOString().slice(0, 10);
}

/** 한국 시간 기준 ISO 주 — `2026-W46`. 그 주의 목요일이 속한 해가 주의 해다. */
export function weekKey(now: Date): string {
  const d = kst(now);
  const thursday = new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) +
      (4 - isoDay(d)) * DAY_MS,
  );
  const year = thursday.getUTCFullYear();
  const week =
    Math.floor((thursday.getTime() - Date.UTC(year, 0, 1)) / (7 * DAY_MS)) + 1;
  return `${year}-W${String(week).padStart(2, '0')}`;
}

/** 그 주 화요일 09:00(KST) 이후인가. 월요일과 화요일 09:00 전에는 아직 아니다. */
export function isDue(now: Date): boolean {
  const d = kst(now);
  const day = isoDay(d);
  if (day !== PUBLISH_DAY) return day > PUBLISH_DAY;
  return d.getUTCHours() >= PUBLISH_HOUR;
}
