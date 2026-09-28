/**
 * IndexNow 로 알릴 주소를 고른다. 순수 함수 — 서비스·테스트가 같이 쓴다.
 *
 * 주소의 정본은 web 이다. 여기 적은 것은 그 사본이라 web 에서 주소를 바꾸면 여기도 바꾼다.
 * - 글마다 주소가 있는 게시판: `web/app/(site)/page/support/board/boards.ts`(공지·보도·뉴스의 `path`,
 *   상세는 `${path}/${encodeURIComponent(slug)}`) · `web/app/(site)/page/support/recruit/page.tsx`(채용)
 * - 목록 장 하나에 다 보이는 게시판: `web/lib/menu.ts` 의 그 장 주소(`web/app/sitemap.ts` 의 POST_BOARDS 밖)
 * - 페이지 글: api `core/page/schema` 의 `path` · 검색 정보: `page_meta.path` 그대로
 */

/** 운영 주소(web `lib/seo.ts` 의 SITE_ORIGIN). 미리보기(NOINDEX=1)는 아예 안 보낸다(AppConfig). */
export const SITE_ORIGIN = 'https://drvalue.co.kr';

/** IndexNow 규약의 키 모양: 8~128자, 영문·숫자·-. web `lib/indexnow.ts` 와 같다. */
export function isIndexNowKey(v: string): boolean {
  return /^[A-Za-z0-9-]{8,128}$/.test(v);
}

/** 글 하나가 주소를 따로 갖는 게시판 → 목록 주소. 상세는 `<목록>/<slug>`. */
const DETAIL_BOARDS: Record<string, string> = {
  notice: '/page/support/notice',
  press: '/page/support/press',
  news: '/page/support/news',
  recruit: '/page/support/recruit',
};

/** 글이 목록 장 안에만 보이는 게시판 → 그 장 주소. */
const LIST_BOARDS: Record<string, string> = {
  patent: '/page/tech/patent',
  copyright: '/page/tech/copyright',
  case: '/page/portfolio/portfolio',
  history: '/page/company/history',
  faq: '/page/support/faq',
};

/** 글의 공개 주소(경로). 모르는 게시판·빈 slug 는 null. */
export function postPath(board: string, slug: string): string | null {
  if (Object.hasOwn(DETAIL_BOARDS, board))
    return slug ? `${DETAIL_BOARDS[board]}/${encodeURIComponent(slug)}` : null;
  return Object.hasOwn(LIST_BOARDS, board) ? LIST_BOARDS[board] : null;
}

/** 알림 판단에 쓰는 글의 칸. 칸 이름은 DB 이름(관리 화면 글 응답·변경 이력 스냅샷과 같다). */
export interface IndexNowPost {
  board?: unknown;
  slug?: unknown;
  status?: unknown;
  publish_at?: unknown;
  unpublish_at?: unknown;
  no_index?: unknown;
}

const time = (v: unknown): number | null => {
  if (v == null || v === '') return null;
  const t = v instanceof Date ? v.getTime() : Date.parse(String(v));
  return Number.isNaN(t) ? null : t;
};

/**
 * 지금 검색엔진이 봐야 하는 글인가. 공개 API 의 규칙(content 저장소의 PUBLISHED — 공개 상태 · 예약 공개
 * 시각이 지났고 · 자동 내림 시각 전)에 「검색에서 제외」가 아닌 것을 더한다.
 */
export function isIndexablePost(
  p: IndexNowPost | null | undefined,
  now = Date.now(),
): boolean {
  if (!p || p.status !== 'published' || p.no_index === true) return false;
  const from = time(p.publish_at);
  const until = time(p.unpublish_at);
  return (from === null || from <= now) && (until === null || until > now);
}

/**
 * 저장 전·후의 글로 알릴 경로를 고른다. 색인 대상인 쪽의 주소만 — 초안끼리의 저장은 알리지 않는다.
 * 전의 주소도 본다: 지우기·내리기·검색 제외·주소 바꾸기는 옛 주소가 404(또는 noindex)가 된 것을
 * 검색엔진이 봐야 한다.
 */
export function postChangePaths(
  before: IndexNowPost | null | undefined,
  after: IndexNowPost | null | undefined,
  now = Date.now(),
): string[] {
  const out = new Set<string>();
  for (const p of [before, after]) {
    if (!p || !isIndexablePost(p, now)) continue;
    const path = postPath(String(p.board ?? ''), String(p.slug ?? ''));
    if (path) out.add(path);
  }
  return [...out];
}

/** 사이트 안 경로인가(`/` 로 시작 · `//` 아님 · 관리 화면·API 아님). 검색 정보의 path 는 사람이 적은 값이다. */
export function isSitePath(path: string): boolean {
  return (
    path.startsWith('/') &&
    !path.startsWith('//') &&
    !/^\/(admin|api)(\/|$)/.test(path)
  );
}

/** 경로 → 운영 주소(겹침 없이). 사이트 밖 경로는 버린다. */
export function toSiteUrls(paths: string[]): string[] {
  return [...new Set(paths.filter(isSitePath))].map(
    (p) => `${SITE_ORIGIN}${p}`,
  );
}
