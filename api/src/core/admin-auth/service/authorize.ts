/**
 * 관리 화면 입장 판정. 순수 함수 — 테스트가 붙어 있다.
 *
 * 관리자는 사내 IAM 이 정한다. 토큰 **최상위** role 이 admin(또는 PLATFORM_ADMIN)인 사람만 들어온다.
 * 그룹 안의 role(OWNER·ADMIN)은 보지 않는다 — 누구나 자기 워크스페이스에서는 OWNER 다.
 * 그 밖의 IAM 계정은 우리 쪽 표에 무엇이 있든 못 들어온다.
 */
export interface IamClaims {
  sub?: string;
  email?: string;
  name?: string;
  role?: string;
  groups?: Array<{ id?: string; name?: string; role?: string }>;
}

export const IAM_ADMIN_ROLES = ['ADMIN', 'PLATFORM_ADMIN'];

export function isIamAdmin(claims: IamClaims): boolean {
  return IAM_ADMIN_ROLES.includes(String(claims.role ?? '').toUpperCase());
}

/** CMS 안에서 고칠 수 있는 범위. 행이 없거나 꺼졌으면 null(= 못 들어온다). */
export function scopeOf(
  row: { role: string; enabled: boolean } | null,
): 'admin' | 'marketing' | 'hr' | null {
  if (!row || !row.enabled) return null;
  return row.role === 'marketing' || row.role === 'hr' || row.role === 'admin'
    ? row.role
    : null;
}

/** 거부 로그용. 값이 아니라 모양만 — 그룹 id·역할은 식별자라 남겨도 된다. */
export function describeGroups(claims: IamClaims): string {
  return (claims.groups ?? [])
    .map(
      (g) =>
        `${g?.id ?? '?'}${g?.name ? '(' + g.name + ')' : ''}:${g?.role ?? '?'}`,
    )
    .join(' ');
}
