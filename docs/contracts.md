# 바깥이 부르는 약속

이 시스템이 밖에 내놓는 것은 **HTTP 하나**다. 공개 사이트가 부르는 `/api/content/*` ·
`/api/inquiry` 와, 관리 화면이 부르는 `/api/admin/*`.

## 공통

- 응답은 JSON 이다. 목록은 `{ data, total, pageSize, language }`,
  상세는 `{ data, language }` 모양이다.
- 언어는 `?lang=` 으로 고른다. 안 주면 서버 기본값이다. 응답의 `language`
  가 실제로 쓰인 언어다.
- 잘못된 입력은 `400`, 없는 것은 `404`, 한도 초과는 `429`. HTTP 상태는 실제 값이다.
- 오류 본문은 `{ data: null, status, resultCode, message, path, timestamp }` 다.
  - `resultCode` 는 `api/src/**/error/*.error.ts`(기능별)와 `api/src/common/error/common.error.ts`
    (`COMMON_*` — 없는 주소·검증·429·500)에 있다. 화면이 분기할 때는 이것을 본다.
  - `message` 는 **사용자에게 그대로 보여 줄 말**이다(합니다체, 마침표). 화면은 따로 문구를
    만들지 않고 이것을 띄운다. 개발자용 원인(`detail`)은 응답에 없다 — 5xx 는 api 로그에 남는다.
  - `path` 는 쿼리를 뺀 주소다.
- 공개 목록은 전부 익명으로 부른다. `/api/admin/*` 는 IAM 로그인이 만든 세션 쿠키
  (`dv_admin`) 만 받는다 — `Authorization` 헤더는 보지 않는다. 없으면 `401`,
  입장 권한이 없으면 `403 ADMIN_AUTH_NOT_ALLOWED`, 역할이 안 맞으면 `403 ADMIN_AUTH_FORBIDDEN`.

## `GET /api/content/menu`

사이트 메뉴(관리 화면 「사이트 › 메뉴」). 익명. 모든 장의 머리글·현재 위치 줄·옆 차례표·바닥글이 읽는다.

| 받는 것 | 뜻 |
|---|---|
| `lang` | `ko-KR` · `en-US`. 그 언어 이름이 없는 칸은 한국어 이름으로 나간다. 다른 값은 `400` |

돌려주는 것: `{ data: { top, footer }, language }`. **보이는 칸만** 나간다(끈 칸은 이름도 없다).
- `top[]`: `label` · `href` · `match`(이 주소 앞부분으로 시작하면 그 탭이 켜진다. 없으면 `[href]`) ·
  `children[]`(`label` · `href` · `description` · `hidden_in_dropdown` — 참이면 드롭다운에는 안 그리고
  현재 위치 줄에만 이름을 쓴다).
- `footer[]`: `label` · `href`. 비어 있으면 바닥글에 링크 줄이 없다.

관리 쪽은 `GET·PUT /api/admin/menu`(세션 · 전체 권한과 마케팅, 인사 `403`). PUT 은 메뉴 전체
(`{ top: [...], footer: [...] }`)를 한 번에 바꾼다 — 깊이 3 · 한국어 이름 없음 · 링크 모양(`/` 로 시작하되
`//` 아님, 또는 http(s))이 틀리면 `400`. 웹의 `POST /api/admin/menu/refresh` 는 Next 가 받아 메뉴 캐시를 비운다.

## `GET /api/content/posts`

게시판 목록.

| 받는 것 | 뜻 |
|---|---|
| `board` | 게시판 종류. `notice` · `press` · `case`(수행실적) · `patent` · `copyright` · `history`(연혁). 안 주면 전부 |
| `page` | 1부터. 한 쪽 크기는 응답의 `pageSize` |
| `limit` | 한 쪽 크기. 기본 10, 최대 100. 연혁·증서처럼 한 장에 다 보이는 목록이 쓴다 |
| `q` | 제목·요약·본문 부분 일치. 200자에서 자른다 |
| `startDate` · `endDate` | `YYYY-MM-DD`. **표시 날짜** 기준이다 |
| `lang` | 언어 |

돌려주는 것: `data` 는 글 배열이다. 각 글은 `slug` · `title` · `summary` ·
`published_date` · `is_pinned` · `sort` · `thumbnail`(주소 또는 `null`) ·
`thumbnail_size`(`{w, h}` 또는 `null`) 을 갖는다. 게시판에 따라 더 온다 —
특허·저작권: `cert_state`(`registered`|`applied`) · `cert_no` · `cert_date` ·
`cert_made_date` · `cert_kind`. 연혁: `history_year`. 수행실적:
`period_start` · `period_end` · `case_category_label`. 없는 칸은 `null`.
`total` 은 조건에 맞는 전체 건수다.

정렬은 게시판이 정한다. 공지·보도자료는 **고정 글 먼저, 표시 날짜 내림차순**.
특허·저작권·수행실적은 관리 화면의 순서(`sort`). 연혁은 연도 내림차순 안에서 `sort`.
**공개 상태인 글만 나온다.**

검색은 언어를 가리지 않는다. 영어 번역이 걸려 같은 글이 나오는 것은
맞는 결과다.

## `GET /api/content/posts/:slug`

글 하나. 없으면 `404`.

`data` 는 목록의 항목에 `body` 와 `attachments` 를 더한 것이다.
`attachments` 의 각 항목은 `id` · `name` · `url` 을 갖는다. `name` 은 파일의
제목이고, 비어 있으면 파일 이름, 그것도 없으면 `첨부파일` 이다.
파일 자체는 아래 경로로 받는다.

## `GET /api/content/assets/:id`

첨부·그림 파일. 파일 내용을 그대로 돌려준다. 업로드 폴더를 브라우저에 직접
열지 않고 이 경로가 대신 낸다.

`:id` 는 36자 UUID 다. 모양이 아니면 `400`. 없는 파일과 **공개가 아닌 파일은
둘 다 `404`** 다 — 어느 쪽인지 알려 주지 않는다. 공개 = 게시된 글의 대표
이미지·공유 이미지·첨부가 가리키는 파일.

## `POST /api/inquiry`

문의 접수. 본문은 JSON 이다.

| 칸 | 한도 | 필수 |
|---|---|---|
| `user_name` | 200자 | ○ |
| `user_tel` | 50자 | ○ |
| `user_email` | 이메일 형식, 255자 | ○ |
| `user_type` | 목록 중 하나 | ○ |
| `user_msg` | 5000자 | ○ |

- 성공 `201`. 실패 `400`(칸이 비었거나 한도 초과), `429`(한도 초과), `502`
  (`INQUIRY_SUBMIT_FAILED` — 메일과 DB 저장이 둘 다 실패).
- `400` 의 `message` 는 틀린 칸을 말한다(「이메일 주소를 확인해 주세요.」). 공개 문의 폼은
  이 말을 그대로 띄운다.
- **한 IP 가 분당 5건 · 시간당 30건.** 넘으면 `429`.
- 정의 안 한 칸은 버려진다.

## 관리 API `/api/admin/*`

관리 화면(`/admin`)만 부른다. 오류 본문은 공개 API 와 같다. DTO 검증 실패도
`400 COMMON_INVALID_INPUT` 한 건이고, `message` 는 DTO 에 적은 한국어 문구(없으면
「입력한 내용을 다시 확인해 주세요.」)다.

### 로그인

| 경로 | 뜻 |
|---|---|
| `GET /api/admin/auth/login` | 사내 IAM 으로 보낸다(302). state 쿠키를 심는다. 설정이 비었으면 `/admin/login?error=ADMIN_AUTH_NOT_CONFIGURED` |
| `GET /api/admin/auth/callback?code=&state=` | IAM 에서 돌아오는 자리. 통과하면 `dv_admin` 쿠키를 심고 `/admin` 으로 302. 실패는 JSON 이 아니라 `/admin/login?error=<resultCode>` 로 302 (`ADMIN_AUTH_NOT_ALLOWED` · `BAD_STATE` · `EXCHANGE_FAILED` · `NO_EMAIL` · `NOT_CONFIGURED`). 로그인 화면이 코드로 문구를 고른다 |
| `GET /api/admin/auth/me` | `{ data: { email, name, role } }`. 세션 없으면 `401` |
| `POST /api/admin/auth/logout` | 쿠키를 지운다. `{ ok: true }` |

입장은 IAM 이 정한다(결정 0015). 토큰 최상위 `role` 이 `ADMIN`·`PLATFORM_ADMIN` 인 사람만
들어오고, 로그인 때마다 `admin_users` 에 받아 적는다(없으면 범위 `admin` 으로 만든다).
관리자가 아니면 그 행을 끄고 `ADMIN_AUTH_NOT_ALLOWED`. 세션은 30분. 60초마다 `admin_users`
를 다시 본다 — 그 사이에 꺼진 사람은 다음 요청부터 `403 ADMIN_AUTH_NOT_ALLOWED`.

역할: `admin` 전부 · `marketing` 채용 빼고 · `hr` 채용만. 게시판이 역할과 안 맞으면
목록·낱개·저장·삭제 모두 `403 ADMIN_AUTH_FORBIDDEN`.

### 글 `/api/admin/posts`

| 경로 | 뜻 |
|---|---|
| `GET ?board=&q=&status=&page=` | 목록 `{ data, total, page, pageSize }`. 초안 포함. 한 쪽 30 |
| `GET /category-labels` | 수행실적 「구분」에 지금까지 쓴 값 `{ data: string[] }` — 폼의 datalist |
| `GET /:id` | 낱개. `translations`(언어별) · `files` 포함 |
| `POST` | 만들기. 본문은 아래 |
| `PUT /:id` | 고치기. 같은 본문. 보내지 않은 언어의 번역은 그대로 둔다. `file_ids` 를 보내면 첨부를 그 목록으로 바꾼다 |
| `DELETE /:id` | 지우기. 번역·첨부 연결이 같이 간다 |
| `POST /reorder` `{ ids: [...] }` | 그 순서대로 `sort` 를 1부터 매긴다 |

본문: `board`(필수, `notice` · `press` · `patent` · `copyright` · `case` · `history`) ·
`slug`(선택, 소문자·숫자·하이픈. 비우면 자동) · `status`(`published` · `draft`) ·
`published_date`(필수 `YYYY-MM-DD`) · `is_pinned` · `thumbnail`(파일 uuid) ·
`press_media` · `period_start` · `period_end` · `cert_state`(`registered` · `applied`) ·
`cert_no` · `cert_date` · `cert_made_date` · `cert_kind` · `history_year` ·
`translations: [{ languages_code, title, summary, body(HTML), case_category_label,
seo_title, seo_description }]`(`ko-KR` 의 `title` 필수) · `file_ids: [uuid]`.
같은 `slug` 가 있으면 `409`. 만들기·고치기·지우기는 `admin_revisions` 에 before/after 를 남긴다.

### 파일 `/api/admin/files`

| 경로 | 뜻 |
|---|---|
| `POST` multipart `file`(+`title`) | 올리기. png · jpg · webp · gif · pdf · txt, 20MB. `{ data: { id, url, filename_download, title, type, width, height } }` |
| `GET /:id` | 관리자 미리보기(초안 첨부도 보인다) |
| `DELETE /:id` | 행과 디스크 파일을 지운다. 글의 연결은 풀린다 |

### 문의 `/api/admin/inquiries`

| 경로 | 뜻 |
|---|---|
| `GET ?status=&q=&page=` | 목록. `q` 는 이름 부분 일치. 행에 `email` 이 있다 — 관리 화면이 mailto 로 답장한다 |
| `PATCH /:id` `{ status }` | `new` · `in_progress` · `answered` · `closed` · `spam` |
| `DELETE /:id` | 지우기 |

## 옛 주소

`.php` 가 붙은 옛 화면 주소는 전부 **`308`**(영구) 로 새 주소에 넘어간다.
검색에 쌓인 것을 잃지 않기 위해서다.

`.php` 가 아닌 옛 주소도 일곱 있고, 이쪽은 **`307`**(임시) 다:

| 옛 주소 | 가는 곳 |
|---|---|
| `/company/introduction` | `/page/company/intro` |
| `/company/location` | `/page/company/location` |
| `/company/ip` | `/page/tech/patent` |
| `/platform/cuton` | `/page/service/cuton` |
| `/customer/notice` | `/page/support/notice` |
| `/customer/press` | `/page/support/press` |
| `/cases` | `/page/portfolio/portfolio` |

**307 인 이유**: 화면 구조가 아직 확정이 아니다. 308 을 주면 검색엔진이
그 대응을 굳혀 버려서 나중에 바꿀 때 되돌릴 수 없다. 확정된 둘만 308 이다
— `/max` → `/page/business/max`, `/index.php` → `/`.
