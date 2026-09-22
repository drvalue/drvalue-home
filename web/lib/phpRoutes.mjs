/**
 * 옛 `.php` 주소 → 확장자 없는 새 주소.
 *
 * 화면은 새 주소가 서비스하고, 옛 주소는 308(영구)로 넘긴다. 검색에 쌓인
 * `.php` 주소를 버리지 않으면서 주소창에는 확장자가 안 남는다.
 *
 * `.mjs` 인 이유는 dvRoutes.mjs 와 같다 — next.config.mjs 가 직접 읽는다.
 * 대조 스크립트(scripts/compare-all.sh)도 이 목록을 읽는다. 목록이 두 군데
 * 있으면 한쪽만 고쳐 놓고 "왜 안 걸리지" 를 하게 된다.
 *
 * **여기 넣으면 안 되는 것**: `/page/support/notice_api.php` 와
 * `/page/support/notice_login_callback.php`. 둘은 화면이 아니라 Nest 로
 * 넘기는 주소이고, 콜백 주소는 사내 IAM 화이트리스트에 글자 그대로 올라가
 * 있다. 주소를 바꾸면 로그인이 죽는다.
 *
 * @type {string[]}  — `.php` 를 뺀 주소. 옛 주소는 여기에 `.php` 를 붙인 것.
 */
export const CLEAN_PATHS = [
  '/page/business/ai_sol',
  '/page/business/smart_fac',
  '/page/company/history',
  '/page/company/intro',
  '/page/company/location',
  '/page/company/vision',
  '/page/portfolio/portfolio',
  '/page/service/cuton',
  '/page/service/growtok',
  '/page/service/growxd',
  '/page/support/notice',
  '/page/support/notify_form',
  '/page/support/press',
  '/page/tech/copyright',
  '/page/tech/patent',
  '/page/tech/patent_old',
]

/** next.config.mjs 가 그대로 넘길 수 있는 모양. */
export const PHP_REDIRECTS = CLEAN_PATHS.map((to) => ({
  source: `${to}.php`,
  destination: to,
  permanent: true,
}))
