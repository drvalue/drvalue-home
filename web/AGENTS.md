# web — 공개 화면

## 이 덩어리가 맡는 것

사람이 보는 화면 전부. 주소 체계(옛 `.php` 주소를 308 로 받는 것 포함),
상단 메뉴, 검사 스크립트.

## 맡지 않는 것

- **데이터베이스를 직접 부르지 않는다.** `/api` 만 부른다. 관리 화면(`/admin`)도 `/api/admin/*` 만 부른다.
- 메일 발송·세션·속도 제한은 `api` 것이다.
- 게시판 글의 저장 규칙(검증·순서·파일)은 `api` 것이다. `/admin` 은 폼을 그리고 `/api/admin` 을 부를 뿐이다.
- 저장소 루트의 PHP 파일을 고치지 않는다.

## 늘 지켜야 하는 것

- **메뉴는 `getMenu()`(`lib/menu-cms.ts`) 하나에서 온다.** 관리 화면 「사이트 › 메뉴」 값이고
  (`/api/content/menu`), api 가 안 닿거나 비었으면 `lib/menu.ts` 예비다. 상단 탭 막대 · 현재 위치 줄 ·
  왼쪽 차례표 · 바닥글 링크 줄이 전부 이것을 읽는다. 다른 데 목록을 적으면 한쪽만 고쳐져 어긋난다.
  - 메뉴는 60초 캐시한다(태그 `menu`) — 머리글이 모든 장에 있어서 no-store 면 모든 장이 요청마다 그려진다.
    관리 화면이 저장하면 `app/api/admin/menu/refresh/route.ts` 가 태그를 비워 다음 요청부터 보인다
    (누가 비워도 되는지는 같은 쿠키로 api 의 관리 메뉴를 불러 본다 — 규칙은 api 에만).
  - `lib/menu.ts` 는 이제 **예비이자 씨앗**이다(migrations/0006 이 이 파일을 그대로 옮겼다). 메뉴를
    바꾸는 곳은 관리 화면이다. `app/sitemap.ts` 는 아직 `lib/menu.ts` 를 읽는다 — `getMenu()` 로 바꿀 자리.
  - M.AX · AI솔루션 소개 장은 구역 차례·링크를 `lib/menu.ts` 에서 정하고, 탭 글자만 관리 화면 이름을
    주소로 찾아 쓴다(`menuLabelOf`). 관리 화면에서 순서를 바꾸거나 숨겨도 장의 구역이 엇갈리지 않게.
  - `hidden`(관리 화면 「드롭다운에서는 숨기기」)은 「드롭다운에 안 띄우되 이름은 아는」 항목이다.
    현재 위치 줄이 그 이름을 써야 해서 지우지 않는다. 「사이트에 보이기」를 끄면 이름까지 빠진다.
  - `match`(관리 화면 「켜지는 주소」)가 배열인 이유는 M.AX 와 AI솔루션이 둘 다 `/page/business/`
    밑을 쓰기 때문이다.
  - `check-header.py` 는 관리 화면 메뉴를 기준으로 본다(못 읽으면 `lib/menu.ts`). 탭 이름을 바꿔도
    「이 장에서 켜질 탭」은 씨앗 이름 → 탭 주소로 찾아 비교한다.
- **페이지 전용 CSS 는 템플릿 문자열이다. 안에 역따옴표를 넣지 않는다.**
  하나만 들어가도 문자열이 끊겨 그 화면이 통째로 문법 오류가 되고, 모든
  화면이 500 이 된다.
- **가로 스크롤이 없어야 한다** — 390 · 768 · 1024 · 1280 · 1440.
  표·도식·코드 블록만 예외이고 자기 컨테이너 안에서만 민다.
- **자바스크립트가 꺼져도 글이 다 보여야 한다.** 등장 효과는 스크립트가
  숨기고, 스크립트가 안 돌면 아무것도 안 숨는다. 장치는 `app/layout.tsx`
  에 한 번 걸려 있고 규칙은 `styles/motion.css` 다 — 어느 장이든 표시만
  단다: `data-rv`(구역·자식 차례) · `data-rv="shot"`(그림) · `data-count`
  (숫자). 공개 장은 전부 새 틀(SolutionShell + `data-rv`)이다. AOS(`data-aos`)는 숨김 장 patent_old 에만 남았고 `<noscript>` 가 켠다.
- **제품 화면은 기능마다 한 장만 보인다.** 여러 장이면 첫 장 + 「N장 크게
  보기」다. 격자로 깔면 사진이 글보다 커진다(사용자가 되돌렸다).
- **`public/screens/` 에 안 쓰는 화면을 두지 않는다.** `check-pages.py` 가
  0장을 요구한다. 설명 그림·시안·같은 장면의 중복은 넣지 않는다.
- **`prefers-reduced-motion` 을 켠 사람에게 움직임을 끈다.** 끄되 결과는
  같다 — 숫자는 최종값, 글은 보임.
- **`<img>` 에 `width`·`height` 를 적는다.** 안 적으면 그림이 늦게 올 때
  화면이 한 번 흔들린다.
- **화면에 적는 숫자는 자료에서 센다.** 손으로 적지 않는다.
- `public/css`·`public/img`·`public/icon` 은 **루트 원본과 별개인 복사본**
  이다(커밋 `6f505ba` 에서 심볼릭 링크를 풀었다). 루트 `css/` 만 고치면
  Next 화면은 안 바뀐다. `style.css`·`header.css` 는 이미 내용이 다르다 —
  PHP 화면도 같이 바뀌어야 하면 양쪽을 다 고친다.

## 관리 화면 `/admin`

- `app/admin/**` 와 `lib/admin.ts`(fetch 헬퍼. 401 이면 `/admin/login` 으로) 뿐이다.
  공개 화면 CSS 와 섞지 않는다 — `app/admin/admin.css` 하나, 전부 `.dva` 아래.
- 메뉴는 **되는 것만**. 게시판은 `/api/admin/auth/me` 의 `boards`(규칙은 api 에만)로 거른다:
  게시판 9(공지·뉴스·보도자료·채용·FAQ·특허·저작권·수행실적·연혁 — hr 은 채용만, marketing 은
  채용 빼고) + 운영(문의·미디어 — hr 에는 없다) + 사이트(메인 화면·페이지·메뉴 — hr 에는 없다) + 관리(변경 이력·권한 — 전체 권한만).
- 「메뉴」(`app/admin/menu`): 상단 탭·하위와 하단 링크를 한 화면에서 고치고 한 번에 저장한다. 순서는
  ↑↓ 버튼이나 Alt + 화살표. 저장 전에 한국어 이름·링크 모양을 먼저 짚고, 사이트 안 주소는 HEAD 로 열어
  보아 404 면 저장을 막는다. 저장 뒤 캐시 비우기(`/api/admin/menu/refresh`)를 부른다.
- 첫 장 `/admin` 은 홈(새 문의 수 · 내 담당 · 게시판별 초안 · 예약 게시 · 바로 쓰기 · 최근 변경).
  수는 홈 요약 API(`/api/admin/dashboard`) 한 번으로 받는다 — 범위가 못 보는 칸(인사의 문의,
  전체 권한이 아닌 사람의 최근 변경)은 api 가 null 로 비운다. 문의 메뉴의 「접수」 배지는 껍데기가 따로 센다.
- 글 목록: 상태 거름 한 칸에 공개·초안(`?status=`)과 예약·내림 예정(`?schedule=scheduled|unpublishing`)을
  같이 둔다. api 는 모르는 값에 400 이라 화면이 아는 값만 보낸다. 배지 「예약 9/30 10:00」 「내림 예정 10/1」.
- 문의 `?id=` 가 지금 쪽 목록에 없으면 `GET /api/admin/inquiries/:id` 로 하나만 받아 연다.
- 에러의 칸 짚기는 문구가 아니라 `AdminError.code`(api 의 `resultCode`)로 한다 — 예: 지워진 첨부로
  저장하면 409 `ADMIN_POST_FILE_GONE` → 첨부 칸을 짚고, 미리보기 주소가 404 인 첨부에 「지워진 파일」.
- 껍데기(`AdminShell.tsx`)가 공용 장치를 한 번씩 건다(`app/admin/ui/`):
  - `toast` — 저장·삭제·되돌리기 뒤 알림. 화면을 옮겨도 남는다.
  - `leave` — 저장 안 한 입력 보호. 폼이 `setDirty` 로 알리면, 관리 화면 안 링크를 누를 때 화면 아래
    확인 막대가 뜨고 탭을 닫을 때만 브라우저 기본 경고(beforeunload)가 뜬다. 뒤로 가기는 못 막는다.
  - `query` — 목록의 검색어·거르기·쪽·고른 항목을 주소(`?q=&status=&page=&id=`)에 둔다.
    `useSearchParams` 를 쓰므로 껍데기가 화면을 `Suspense` 로 감싼다.
  - `SearchBox`(0.3초 쉬면 찾기) · `InlineConfirm`(열리면 「취소」에 포커스, Escape 로 취소) ·
    `FileDrop`(누르거나 끌어다 놓는 파일 칸).
  - 껍데기 밖 형제로 그려지는 겹 층(알림·확인 막대)은 `.dva_layer` 다 — 색 변수가 거기도 있어야 한다.
- 860px 이하는 위 막대 + 메뉴 버튼 서랍(포커스 가둠 · Escape · 화면 옮기면 닫힘). 640px 이하에서
  글 목록 표는 카드가 된다(`.dva_table.is-cards` · 칸마다 `data-label`). 누를 자리는 44px.
- 글 폼: 저장 막대가 위에 붙어 따라온다. 한국어 제목이 비면 보내기 전에 그 칸을 짚는다. 순서로
  세우는 게시판(증서·수행실적·FAQ·연혁)은 사이트에 안 보이는 칸(표시 날짜·예약·주소)을 「고급 설정」에
  접는다. 연혁 목록은 연도별로 묶고 연도를 넘는 화살표는 끈다(사이트가 연도로 먼저 세운다).
- 로그인은 버튼 하나 「사내 IAM 으로 로그인」. 자동 리다이렉트 없음 — 로그아웃 뒤
  즉시 재로그인되는 것을 막는다. 이미 로그인한 채로 `/admin/login` 에 오면 `/admin` 으로 보낸다
  (세션이 살아 있는지는 서버가 api `/me` 에 물어본다).
- 브라우저 다이얼로그(`confirm`·`alert`)를 쓰지 않는다. 삭제는 인라인 확인 버튼, 이름은 「삭제」.
- 본문은 Quill 편집기다(`app/admin/posts/[board]/HtmlEditor.tsx`). **그림은 본문 안에 넣는다** —
  그림 버튼 · 붙여넣기 · 끌어다 놓기 셋 다 파일을 올려 주소를 넣는다(base64 로 박지 않는다).
  저장되는 HTML 은 공개 주소(`/api/content/assets/<id>`), 편집기 안에서는 관리 미리보기
  (`/api/admin/files/<id>`)로 보여 준다 — 공개 주소는 게시된 글의 그림만 내 줘서 초안에서 깨진다.
- 글 폼의 오른쪽은 설정(상태·날짜·예약·고정·주소·게시판별 칸)만이다. 증서 그림·첨부·목록 썸네일
  미리 보기는 본문 쪽에 있다. 공지·보도·뉴스의 목록 썸네일은 본문 첫 그림이다(api 가 저장할 때 정한다).
- **`/api/admin/files`(목록·올리기)만 rewrite 가 아니라 `app/api/admin/files/route.ts` 가 넘긴다.**
  rewrite 는 본문을 메모리에 복사하며 10MB 에서 잘라 큰 파일 요청이 끝나지 않는다. 한도를 올리면
  익명 주소까지 같이 오르므로 이 주소만 버퍼 없이 흘려보낸다.
- **화면 문구는 합니다체다.** 에러는 api 가 준 `message` 를 그대로 띄운다 — `adminFetch` 가
  그 말로 에러를 던지니 화면은 `e.message` 만 쓴다. 로그인 실패만 예외다: api 가
  `/admin/login?error=<코드>` 로 돌려보내고 `login/page.tsx` 의 `LOGIN_ERRORS` 가 코드로 문구를
  고른다. `scripts/check-copy.py` 가 반말을 잡는다.
- **페이지**(`/admin/pages`, 메뉴 묶음 「사이트」 — 전체 권한·마케팅): 게시판이 아닌 장의 글. 폼은 api 가 주는
  칸 구조로 그린다(`pages/[key]/Fields.tsx` — 칸 종류마다 부품 하나, 칸 이름을 화면에 적지 않는다).
  언어마다 따로 저장하고, 영어 글이 없으면 사이트 영어 화면에도 한국어 글이 나온다. 공개 장은
  `lib/cms.ts` 의 `cmsPageContent(key) ?? content.ts 기본 글` 로 그린다 — api 가 죽어도 장이 안 빈다.
- **메인 화면**(`/admin/home`, 「사이트」 묶음 — 전체 권한·마케팅): 탭 셋 — 「문구 · 구역 차례」(페이지 편집기
  `pages/PageEditorView.tsx` 를 key `home` 으로 끼운 것), 「배너」, 「팝업」. 탭마다 저장이 따로라 세 탭을 다 그려 두고
  안 보이는 탭은 숨긴다(`hidden`) — 탭을 옮겨도 쓰던 글이 안 사라진다. 저장 안 한 탭에 점이 붙고, 이탈 경고는
  `ui/leave.tsx` 의 `LeaveGroup`·`LeaveScope` 가 탭마다 모은다(한 탭이 「저장함」을 알려도 다른 탭의 입력이 지켜진다).
  배너·팝업 목록은 ↑↓ 로 차례를 바꾸고 한 번에 저장한다. 상태 배지(진행 중 · 예약 · 끝남 · 꺼짐)는 api 의 `state` 와
  같은 규칙으로 저장 전에도 그린다.
- 공개 화면 스크립트(GTM · 헤더 동작 · 등장 · growchat 위젯)는 `components/SiteScripts.tsx`
  가 싣고 `/admin` 아래에서는 아무것도 싣지 않는다. `robots.ts` 가 `/admin` 을 막는다.

## 이 덩어리의 방식

- 화면은 서버 컴포넌트가 기본이다. 브라우저에서만 되는 일(관찰·모달·
  스크롤)만 `'use client'` 로 뺀다.
- 제품 설명·화면 캡처 설명은 `app/page/business/max/maxContent.ts` 와
  `app/page/service/solutionContent.ts` 에서 온다. 화면 파일에 글을 적지
  않는다 — 자료를 고쳤을 때 화면이 옛말을 하게 된다.
- 특허·저작권·수행실적·연혁 4장과 홈 소식은 `lib/cms.ts`·`app/home/news.ts` 로
  요청마다 `/api/content/posts` 를 읽는다(`no-store`, `force-dynamic`). 관리 화면에서
  저장하면 다음 요청에 보인다. api 가 안 닿을 때만 코드의 예비 목록
  (`companyContent.ts` · `portfolio/list.ts` · 각 장의 배열)을 쓴다.
- **공지·보도·뉴스는 `app/page/support/board/` 한 틀이다.** 목록·검색(GET 폼)·쪽 넘김(링크)·글
  한 건을 서버가 그린다 — 예전 jQuery 목록은 스크립트가 꺼지면 비었다. 글 주소는
  `/page/support/<게시판>/<slug>`. 옛 상세 `목록?id=` 는 308(옛 PHP id 는 `legacy-` + 앞 8자로
  옮겼다), 다른 게시판 글 주소는 제 게시판으로 308, 없는 글은 404(`app/not-found.tsx`).
  검색 결과 쪽은 noindex, 2쪽부터는 그 쪽이 대표주소. `scripts/check-boards.py` 가 본다.
- **메인(/)은 CMS 가 그린다**(관리 화면 「메인 화면」). 글·구역 차례·카드는 `cmsPageContent('home') ?? app/home/content.ts`,
  기간 배너·팝업은 `cmsHome()`(`/api/content/home`), 머리 그림의 숫자 셋은 `cmsBoardTotal`(특허·저작권·수행실적
  공개 글 수 — 손으로 적지 않는다). 기본 글은 2026-09-22 화면 그대로라 CMS 로 옮긴 뒤 메인 HTML 이 한 줄도 안 바뀌었다.
  - 배너가 있으면 머리 그림의 사진(인라인 `background-image`)과 제목·설명·첫째 버튼이 바뀐다. 슬라이드는 없다.
  - 팝업(`home/HomePopups.tsx`)은 서버가 아무것도 안 그린다 — 자바스크립트가 꺼지면 안 뜨고 글을 가리지 않는다.
    하나씩 띄우고(닫으면 다음), 포커스를 가두고, Escape·닫기로 닫고, 「N일 동안 보지 않기」는 `localStorage`
    (`dv_popup_until_<id>`, 못 쓰면 이번 방문만). 팝업 CSS(`HOME_POPUP_CSS`)는 팝업이 있을 때만 싣는다.
  - `check-home.py` 는 구역 차례·보이기·카드 수·머리 숫자의 기대값을 CMS(`/api/content/pages/home` ·
    게시판 글 수)에서 읽는다 — 편집자가 구역을 옮겨도 검사가 틀렸다고 하지 않고, 화면이 CMS 와 다르면 잡는다.
- **h1 은 장마다 하나, 장 제목이다.** SolutionShell 머리말이 h1(`heroTag`), 헤더 로고는 div
  (`#toss_logo` — 글자 크기·굵기는 h1 기본값 그대로 둬서 줄 높이가 안 바뀐다). 글 한 건 장(게시판 글·
  채용 글)은 글 제목이 h1 이고 머리말을 `heroTag="h2"` 로 내린다. 머리말 CSS 는 `:is(h1, h2)` 로 둘 다 본다.
- 원본과 일부러 다르게 만든 자리는 **등록하고, 대신 볼 검사를 같이 만든다.**
  등록만 하고 검사를 안 만들면 그건 검사를 끈 것이다.

## 무엇을 검사하나

고치기 전과 후에 돌린다. 숫자가 줄면 되돌린다.

```bash
python3 scripts/check-src.py      # 제일 먼저. CSS 문자열이 깨졌나
python3 scripts/check-home.py     # 23/23   (:3400 이 떠 있어야 한다 — 다른 포트는 NEXT_ORIGIN)
python3 scripts/check-header.py   # 107/107
python3 scripts/check-a11y.py     # 323/323
python3 scripts/check-assets.py   # 빠진 파일 0
NEXT_ORIGIN=http://localhost:3400 python3 scripts/check-pages.py    # 110/110
python3 scripts/check-copy.py     # 화면으로 가는 문구의 반말 0건 (서버 없이)
python3 scripts/check-boards.py   # 35/35 공지·보도·뉴스 서버 렌더 · 글 주소 · 옛 주소 308
npx tsc --noEmit && npx next build
```

`check-src.py` 를 먼저 돌리는 이유: CSS 문자열이 깨져 있으면 모든 화면이
500 이 되어 「전부 다름」으로 나오고 진짜 원인이 안 보인다.

**새로 채운 13장은 `check-pages.py` 가 본다** — 본문 글자·그림 수의 바닥, 등장
표시, 화면 파일 실재, 안 쓰는 화면 0장. 바닥은 채운 날의 실측이다. 낮추려면
왜 줄어도 되는지를 먼저 적는다.

브라우저로 볼 때는 다음 넷을 다 본다 — 보통 화면 / 자바스크립트 끈 화면 /
움직임 줄이기 켠 화면 / 390px.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
