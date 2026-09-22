# 바깥이 부르는 약속

이 시스템이 밖에 내놓는 것은 **HTTP 하나**다. 공개 사이트가 부르는 `/api/*`.

## 공통

- 응답은 JSON 이다. 목록은 `{ data, total, pageSize, language }`,
  상세는 `{ data, language }` 모양이다.
- 언어는 `?lang=` 으로 고른다. 안 주면 서버 기본값이다. 응답의 `language`
  가 실제로 쓰인 언어다.
- 잘못된 입력은 `400`, 없는 것은 `404`, 한도 초과는 `429`.
  오류 본문은 `{ statusCode, code, message }` 다. `code` 는
  `api/src/**/error/*.error.ts` 에 있다.
- 아래 목록은 전부 익명으로 부른다.

## `GET /api/content/posts`

게시판 목록.

| 받는 것 | 뜻 |
|---|---|
| `board` | 게시판 종류. 예: `notice`, `press`. 안 주면 전부 |
| `page` | 1부터. 한 쪽 크기는 응답의 `pageSize` |
| `q` | 제목·요약·본문 부분 일치. 200자에서 자른다 |
| `startDate` · `endDate` | `YYYY-MM-DD`. **표시 날짜** 기준이다 |
| `lang` | 언어 |

돌려주는 것: `data` 는 글 배열이다. 각 글은 `slug` · `title` · `summary` ·
`published_date` · `is_pinned` · `thumbnail`(주소 또는 `null`) 을 갖는다.
`total` 은 조건에 맞는 전체 건수다. **CMS 가 건수를 안 주면 `null` 이
나간다** — 그때 쪽수를 `total` 로 계산하는 화면은 1쪽으로 접힌다.

정렬은 **고정 글 먼저, 그다음 표시 날짜 내림차순**이다.
**공개 상태인 글만 나온다.**

검색은 언어를 가리지 않는다. 영어 번역이 걸려 같은 글이 나오는 것은
맞는 결과다.

## `GET /api/content/posts/:slug`

글 하나. 없으면 `404`.

`data` 는 목록의 항목에 `body` 와 `attachments` 를 더한 것이다.
`attachments` 의 각 항목은 `id` · `name` · `url` 을 갖는다. `name` 은 CMS 의
제목이고, 비어 있으면 파일 이름, 그것도 없으면 `첨부파일` 이다.
파일 자체는 아래 경로로 받는다.

## `GET /api/content/assets/:id`

첨부·그림 파일. 파일 내용을 그대로 돌려준다. 브라우저가 CMS 를 직접 부르지
않도록 이 경로가 대신 받아 준다.

`:id` 는 36자 UUID 다. 모양이 아니면 `400`. 없는 파일과 **공개가 아닌 파일은
둘 다 `404`** 다 — 어느 쪽인지 알려 주지 않는다. CMS 가 5xx 로 답하면 `502`
로 구분해서 내보낸다(그래야 "파일이 없다" 와 "CMS 가 죽었다" 가 안 섞인다).

## `POST /api/inquiry`

문의 접수. 본문은 JSON 이다.

| 칸 | 한도 | 필수 |
|---|---|---|
| `user_name` | 200자 | ○ |
| `user_tel` | 50자 | ○ |
| `user_type` | 목록 중 하나 | ○ |
| `user_msg` | 5000자 | ○ |

- 성공 `201`. 실패 `400`(칸이 비었거나 한도 초과), `429`(한도 초과).
- **한 IP 가 분당 5건 · 시간당 30건.** 넘으면 `429`.
- 정의 안 한 칸은 버려진다.

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
