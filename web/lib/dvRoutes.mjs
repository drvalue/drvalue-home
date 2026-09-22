/**
 * 옛 주소 → 지금 실제로 있는 페이지.
 *
 * 한동안 새 디자인(별도 IA)을 얹는 방향으로 갔다가 접었다. 그때 만든 화면과
 * 안내 페이지는 지웠지만, 그 주소로 들어온 링크가 남아 있을 수 있어
 * 대응되는 실제 페이지로 넘긴다. 대응이 없던 것(역량·FAQ·자료실 등)은
 * 애초에 화면이 없었으므로 여기 없다 — 404 가 정확하다.
 *
 * 확장자가 `.mjs` 인 것은 `next.config.mjs` 가 이 파일을 직접 import 하기
 * 때문이다. Node 22 이하는 타입이 붙은 파일을 그냥 못 읽어서, `.ts` 로 두면
 * `next build` 가 시작도 못 하고 죽는다. 타입 없는 배열 하나뿐이라 잃는 게 없다.
 *
 * `permanent` 를 안 적으면 임시(307)다.
 *
 * @type {Array<{ from: string, to: string, permanent?: boolean }>}
 */
export const DV_ROUTE_MAP = [
  { from: '/company/introduction', to: '/page/company/intro' },
  { from: '/company/location', to: '/page/company/location' },
  { from: '/company/ip', to: '/page/tech/patent' },
  { from: '/platform/cuton', to: '/page/service/cuton' },
  { from: '/customer/notice', to: '/page/support/notice' },
  { from: '/customer/press', to: '/page/support/press' },
  { from: '/cases', to: '/page/portfolio/portfolio' },
  // 접은 방향에서 만들었던 M.AX 소개 화면. 지금은 비즈니스 메뉴 아래의
  // 페이지가 그 자리다. 확정이므로 영구(308)로 넘긴다.
  { from: '/max', to: '/page/business/max', permanent: true },
  // 홈은 뿌리(`/`)가 서비스한다. 옛 주소는 검색에 쌓여 있으므로 버리지 않고
  // 넘긴다. 영구(308)다 — 되돌릴 계획이 없고, 임시(307)로 두면 검색엔진이
  // /index.php 를 계속 색인한다.
  { from: '/index.php', to: '/', permanent: true },
]
