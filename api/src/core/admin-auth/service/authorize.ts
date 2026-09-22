/**
 * IAM 토큰의 claim 으로 관리 화면 입장을 판정한다. 순수 함수 — 테스트가 붙어 있다.
 *
 * 통과: role 이 PLATFORM_ADMIN 이거나, groups 에 `group`(uuid) 이 있고 그 역할이
 * `roles` 안에 있다. 그룹은 uuid 로만 맞춘다 — 이름("Default")은 어디에나 있다.
 * `group` 이 비어 있으면 PLATFORM_ADMIN 만 통과한다.
 */
export interface IamClaims {
  email?: string;
  role?: string;
  groups?: Array<{ id?: string; name?: string; role?: string }>;
}

export interface AuthorizeRule {
  group: string;
  roles: string[];
}

export function authorize(claims: IamClaims, rule: AuthorizeRule): boolean {
  if (String(claims.role ?? '').toUpperCase() === 'PLATFORM_ADMIN') return true;
  const group = rule.group.trim().toLowerCase();
  if (!group) return false;
  const roles = rule.roles.map((r) => r.trim().toUpperCase()).filter(Boolean);
  const hit = (claims.groups ?? []).find(
    (g) => String(g?.id ?? '').toLowerCase() === group,
  );
  return Boolean(hit) && roles.includes(String(hit?.role ?? '').toUpperCase());
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
