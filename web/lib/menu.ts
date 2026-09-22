// header.php 의 $menu_items 를 옮긴 것에서 **대분류 둘을 제품 이름으로 바꾼 것**.
//
// 옛 이름은 「서비스」·「비즈니스」였다. 둘 다 회사가 자기를 부르는 말이라
// 방문자는 어느 쪽에 무엇이 있는지 열어 보기 전에는 몰랐다. 우리가 파는
// 것의 이름(MAX)과 하는 일의 이름(AI솔루션)으로 바꾼다.
//
// 주소는 하나도 안 바뀐다 — 글자와 묶음만 바뀐다. 그래서 검색에 쌓인 것을
// 잃지 않는다.
//
// 주소에서 `.php` 를 뺐다. 옛 주소는 lib/phpRoutes.mjs 의 목록대로 308(영구)
// 로 넘어간다. 링크를 옛 주소로 두면 사이트 안에서 움직일 때마다 한 번씩
// 더 튕긴다.
//
// 하위 항목의 "현재 위치" 판정은 **정확히 같은 주소**일 때만 참이다.
// PHP 는 strpos 로 봤는데, `.php` 가 붙어 있을 때는 그것이 곧 정확한 일치와
// 같았다. 확장자를 떼면 `/page/tech/patent` 가 `/page/tech/patent_old` 의
// 앞부분이 되어 버려서, 부분 일치로 두면 없던 표시가 생긴다.

/** `neu` 는 원본 PHP 에 없던 항목이라는 표시다. 헤더는 이제 통째로 떼고
 *  비교하므로(compare.py 의 REDESIGNED) 이 표시는 모바일 메뉴 쪽에서만
 *  쓰인다. 항목이 실제로 그려지나는 scripts/check-header.py 가 본다. */
/** `d` 는 큰 메뉴판에 제목 밑에 깔리는 한 줄이다. 지어낸 말이 아니라 그
 *  페이지의 검색용 설명문(pageMeta 의 description)을 줄인 것이다. */
/** `hidden` 은 **드롭다운에는 안 띄우되 이름은 아는** 항목이다.
 *
 *  메뉴에서 내린 네 장(스마트 팩토리 사업·AI 솔루션 개발·GrowTalk·GrowXD)이
 *  그것이다. 주소는 살아 있어 검색으로 들어오는 사람이 본다. 그런데 목록에서
 *  아예 빼 버리면 현재 위치 줄이 그 장의 이름을 몰라서 **첫 하위로 떨어진다** —
 *  GrowTalk 을 열었는데 「AI솔루션 › 오토폼」 이라고 적히는 것을 실제로 봤다.
 *  여기 이름을 남겨 두면 위치 줄은 맞게 찍고 드롭다운에는 안 나온다. */
export type SubMenu = { t: string; l: string; d: string; neu?: boolean; hidden?: boolean }

/** `match` 가 여럿인 이유: MAX 와 AI솔루션 이 둘 다 `/page/business/` 밑을
 *  쓴다. 옛 구조는 대분류 하나가 디렉터리 하나였어서 글자 하나로 충분했다. */
export type MenuItem = { title: string; link: string; match: string[]; sub?: SubMenu[] }

export const MENU_ITEMS: MenuItem[] = [
  {
    title: '회사소개', link: '/page/company/intro', match: ['/page/company/'],
    sub: [
      { t: '안내', l: '/page/company/intro', d: '제조 현장의 언어를 데이터로 통일' },
      { t: '비전', l: '/page/company/vision', d: '지능형 제조가 가는 방향과 전략' },
      { t: '연혁', l: '/page/company/history', d: '2024년 설립부터 인증·선정 기록' },
      { t: '찾아오시는 길', l: '/page/company/location', d: '한양대 ERICA 창업보육센터' },
    ],
  },
  {
    // 제조 AI 계열. 소개 한 장과 업종 둘, 그 위에서 도는 AI 하나.
    //
    // 업종 둘과 MES AI 는 **M.AX 페이지 한 장 안의 탭**이었다. 탭은 주소가
    // 없어서 메뉴에서 눌러 그 내용으로 보낼 수가 없었고, 검색에도 한 장으로
    // 합쳐져 잡혔다. 각자 주소를 가진 장으로 뗐다.
    title: 'M.AX', link: '/page/business/max',
    match: ['/page/business/max', '/page/business/smart_fac'],
    sub: [
      { t: 'M.AX 소개', l: '/page/business/max', d: '견적부터 출고까지 한 흐름으로', neu: true },
      { t: 'PCB MES', l: '/page/business/max/pcb-mes', d: '소량 다품종 샘플 PCB 전 공정', neu: true },
      { t: '화장품 MES', l: '/page/business/max/cosmetics-mes', d: '배합과 LOT 이력 통합 관리', neu: true },
      { t: 'MES AI', l: '/page/business/max/mes-ai', d: 'OCR 자동 입고 · 규제 자동검증', neu: true },
      { t: '스마트 팩토리 사업', l: '/page/business/smart_fac', d: '설비·공정을 잇는 실시간 최적화', hidden: true },
    ],
  },
  {
    // 만들어 주는 것 하나(AI 솔루션 개발)와 이미 만들어 둔 제품들.
    // 탭을 누르면 첫 항목인 「AI 솔루션 개발」로 간다 — 그 장이 묶음의 첫 장이고
    // 나머지 제품으로 가는 카드를 들고 있다(사용자 결정으로 되살렸다).
    title: 'AI솔루션', link: '/page/business/ai_sol',
    match: ['/page/business/ai_sol', '/page/service/'],
    sub: [
      { t: 'AI 솔루션 개발', l: '/page/business/ai_sol', d: '사내 데이터로 답하는 RAG 구축' },
      { t: '오토폼', l: '/page/service/autoform', d: '쓰던 한글 양식 그대로 채운다', neu: true },
      { t: '컷온', l: '/page/service/cuton', d: '도면을 올리면 견적이 초 단위로' },
      { t: 'CADON', l: '/page/service/cadon', d: 'AutoCAD 안에서 판금 전개', neu: true },
      { t: '채팅', l: '/page/service/chat', d: '고객과 상담원을 곧바로 잇는다', neu: true },
      { t: '한건', l: '/page/service/hangeon', d: 'LLM·RAG 기반 건설 AI Chat', neu: true },
      { t: 'GrowTalk', l: '/page/service/growtok', d: '현장 상황을 나누는 협업 플랫폼', hidden: true },
      { t: 'GrowXD', l: '/page/service/growxd', d: 'AI 분석·예측을 더한 차세대 MES', hidden: true },
    ],
  },
  {
    // 하위가 하나뿐이지만 둔다. 이것만 없으면 다른 메뉴는 호버할 때 판이
    // 내려오는데 여기만 아무것도 안 떠서 막대가 고장 난 것처럼 보인다.
    title: '수행실적', link: '/page/portfolio/portfolio', match: ['/page/portfolio/'],
    sub: [{ t: '주요 수행실적', l: '/page/portfolio/portfolio', d: '9건의 과제와 기간·발주 유형', neu: true }],
  },
  {
    title: '기술력', link: '/page/tech/patent', match: ['/page/tech/'],
    sub: [
      { t: '특허', l: '/page/tech/patent', d: '등록 1건 · 출원 5건' },
      { t: '저작권', l: '/page/tech/copyright', d: '프로그램 저작권 5건' },
    ],
  },
  {
    title: '고객센터', link: '/page/support/notice', match: ['/page/support/'],
    sub: [
      { t: '공지사항', l: '/page/support/notice', d: '서비스 오픈과 점검 안내' },
      { t: '보도자료', l: '/page/support/press', d: '언론에 소개된 소식' },
      { t: '뉴스', l: '/page/support/news', d: '디알밸류 소식' },
      { t: '채용', l: '/page/support/recruit', d: '함께 일할 사람' },
      { t: 'FAQ', l: '/page/support/faq', d: '자주 묻는 질문' },
    ],
  },
]

/** 대분류 판정. 하나라도 걸리면 그 탭이 현재 위치다. */
export function isActive(currentPath: string, match: string[]): boolean {
  return match.some((m) => currentPath.includes(m))
}

/** 하위 항목 판정. 위 머리말대로 부분 일치가 아니라 정확한 일치다. */
export function isSubActive(currentPath: string, link: string): boolean {
  return currentPath.split('?')[0] === link
}
