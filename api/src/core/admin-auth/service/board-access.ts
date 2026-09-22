/**
 * 역할별로 만질 수 있는 게시판. 순수 함수 — 테스트가 붙어 있다.
 *
 *   admin      전부
 *   marketing  채용(recruit) 빼고 전부
 *   hr         채용(recruit)만
 */
export function canEditBoard(role: string | undefined, board: string): boolean {
  if (role === 'admin') return true;
  if (role === 'hr') return board === 'recruit';
  if (role === 'marketing') return board !== 'recruit';
  // 역할 없음(옛 세션)은 거부 — 조용히 admin 으로 올리지 않는다.
  return false;
}

/** 목록 화면이 보여 줄 게시판만. */
export function visibleBoards(
  role: string | undefined,
  all: readonly string[],
): string[] {
  return all.filter((b) => canEditBoard(role, b));
}
