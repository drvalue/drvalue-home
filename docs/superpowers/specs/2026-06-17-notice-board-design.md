# 고객센터 공지사항/보도자료 게시판 설계

작성일: 2026-06-17

## 1. 목표

고객센터 안에 **공지사항** 게시판 페이지를 만든다. 게시판 목록(검색 가능) + 글 상세보기를 퍼블리싱하고, 실제 API에 연동한다. **보도자료** 페이지도 동일 구조로 만들되 콘텐츠 타입만 다르게 한다(공지=NOTICE, 보도자료=NEWSROOM). 고객센터 메뉴에 **공지사항·보도자료 둘 다 노출**한다.

## 2. 범위

### 포함
- `header.php` 의 `고객센터` 메뉴 복원 — sub로 **공지사항 + 보도자료 둘 다 노출**(GNB·모바일·브레드크럼)
- PHP 프록시(`notice_api.php`): 루트 로그인 → 토큰 캐시 → 조회 API 중계. **list / search / detail 3개 액션만** 노출
- 공통 게시판 파셜(`_board.php`): 목록(검색 + 기간 검색 + 페이지 번호) / 상세 화면
- `notice.php` (board=notice, type=NOTICE), `press.php` (board=press, type=NEWSROOM)
- 엔티티 타입 정의(JSDoc typedef) — 이미지 스키마 기준
- 빈 상태 / 검색 무결과 / 잘못된 id(404) / API 오류 처리

### 비포함 (이번 작업 아님)
- 글 작성/수정/삭제(향후 — 이때 루트 로그인 본격 활용)
- 테넌트 코드(불필요)

## 3. 연동 대상 API

공통 베이스: `https://api.growchat.co.kr/api/serv/`

| 용도 | 메서드 | 경로 |
|------|--------|------|
| 루트 로그인 | POST | `auth/v1/login/root/basic` |
| 목록 조회 | GET | `baseinfo/v1/default-notify/many` |
| 통합 검색 | GET | `baseinfo/v1/default-notify/search` |
| 상세 조회 | GET | `baseinfo/v1/default-notify/one/{id}` |

### 인증 흐름
조회 API도 토큰 필요(`401 GLB_CORE_ACL_INVALID_TOKEN`). 루트 로그인으로 토큰 발급:

```
POST auth/v1/login/root/basic
{ "userId": "test", "password": "test1234" }
→ data.accessToken (JWT, tenantId: ROOT, exp ≈ 10시간)
```

이후 조회 호출에 `Authorization: Bearer <accessToken>`.

### 응답 봉투 (라이브 확인 완료)
```jsonc
// 공통 봉투
{ "data": <payload>, "status": 200, "resultCode": "OK_0000",
  "message": "...", "timestamp": "...", "path": "...", "requestUser": {...} }

// 목록/검색 payload
{ "data": [ <NotifyEntity>... ], "total": 0, "take": 10, "skip": 0 }

// 상세 payload
<NotifyEntity>  // data 가 곧 엔티티
```
→ `total` 존재 확인됨 → **페이지 번호 페이지네이션 가능**.
(작성 시점 DB 비어있어 total 0. 실 엔티티 샘플은 상세조회 이미지 스키마 기준.)

### 쿼리 파라미터 (many / search 공통)
`take`(number), `skip`(number), `q`(제목/내용 검색어), `startDate`(조회 시작일), `endDate`(조회 종료일), `showYn`(관리자 전용 표시 여부 필터), `type`(NOTICE | RESOURCE | NEWSROOM).

## 4. 보안 설계 (핵심)

루트 토큰은 **최고관리자(tenantId: ROOT)** 권한이므로, 공개 마케팅 서버에 자격증명이 상주하는 위험을 다음으로 가둔다. (사용자 승인 완료: 별도 읽기전용 계정 없음 → 루트 진행)

1. **프록시는 화이트리스트 전용** — 임의 경로/파라미터 전달 금지. 허용 액션은 `list / search / detail` 뿐.
2. **type 서버 강제** — 클라이언트는 `board=notice|press` 만 보냄. 프록시가 `notice→NOTICE`, `press→NEWSROOM` 으로 매핑. 그 외 값 거부. 클라가 type을 직접 못 정함.
3. **showYn 서버 강제** — 공개분만(`Y` 가정, 실데이터로 정확값 검증). 숨김/미공개 공지 노출 차단.
4. **토큰·자격증명 미노출** — 토큰은 서버 파일에 캐시(예: `sys_get_temp_dir()`), 브라우저로 절대 반환 안 함. 자격증명은 `notice_config.php`(git 제외)에 분리.
5. **토큰 만료/401 재시도** — 캐시 토큰으로 호출 후 401이면 1회 재로그인 후 재호출.
6. **`.gitignore` 신설** — `page/support/notice_config.php` 및 토큰 캐시 파일 제외.

## 5. 파일 구조

```
header.php                       # 고객센터 메뉴 복원(공지사항+보도자료 sub)
.gitignore                       # 신설 — config/토큰캐시 제외
page/support/
  notice_config.php              # (git 제외) API base, 루트 자격증명
  notice_api.php                 # PHP 프록시: 로그인/토큰캐시/3액션 중계
  _board.php                     # 공통 게시판 파셜(목록+상세 마크업/JS/CSS)
  notice.php                     # board=notice → _board.php include
  press.php                      # board=press  → _board.php include
```

### 컴포넌트 경계
- `notice_config.php`: 비밀값만. 다른 파일이 require.
- `notice_api.php`: 입력 = `action`,`board`,`page`,`q`,`startDate`,`endDate`,`id`. 출력 = JSON(`data`만). API/토큰 로직 캡슐화.
- `_board.php`: 입력 = `$board`,`$page_title`,`$hero_*`. 화면/JS만. 데이터는 ajax로 `notice_api.php` 호출.
- `notice.php` / `press.php`: 얇은 진입점. 변수 설정 후 `_board.php` include.

## 6. PHP 프록시 — `notice_api.php`

요청 → 응답 흐름:
```
브라우저 ajax
  GET /page/support/notice_api.php?board=notice&action=list&page=1&q=&startDate=&endDate=
  GET ...?board=notice&action=search&page=1&q=검색어&...
  GET ...?board=notice&action=detail&id=<id>

프록시:
  1. board 검증 → type 매핑 (notice→NOTICE, press→NEWSROOM), 아니면 400
  2. action 검증 (list|search|detail), 아니면 400
  3. 토큰 확보: 캐시 읽기 → 없거나 만료면 루트 로그인 → 캐시 저장
  4. 실 API 호출 (type, showYn 서버 강제 / take=PAGE_SIZE, skip=(page-1)*PAGE_SIZE)
     - list   → .../many
     - search → .../search
     - detail → .../one/{id}
  5. 401 이면 재로그인 1회 후 재호출
  6. 응답의 data 만 추출해 JSON 반환 (+ 적절한 HTTP status)
```

- 메서드 GET만 허용. `id`는 형식 검증(영숫자 등) 후 경로 인코딩.
- 페이지 크기 `PAGE_SIZE`(예: 10) 서버 상수.

## 7. 화면 설계 — `_board.php`

기존 사이트 디자인 결 따름: 히어로 배너 + 브레드크럼(`breadcrumb.php`) + 섹션, Pretendard, 포인트색 `#d00000`/`#f26f21`/`#191f28`, AOS 애니메이션, jQuery ajax.

### 목록 모드 (`?id=` 없음)
- **검색 영역**: 제목/내용 검색어 입력(q) + 기간(startDate~endDate, date input) + 검색 버튼 + 초기화.
- **게시판**: 행별 번호 / 제목(고정글 isPinned는 상단·배지) / 작성자(writer.name) / 날짜(createdAt or startDate). 제목 클릭 → `?id=` 이동.
- **페이지네이션**: `total`,`PAGE_SIZE`로 `‹ 1 2 3 ... ›` 계산. 검색 상태는 쿼리스트링 유지.
- 데이터: q/기간 비어있으면 `action=list`, 검색 조건 있으면 `action=search`.

### 상세 모드 (`?id=xxx`)
- `action=detail` 호출 → 제목 / 작성자 / 날짜 / 본문 / 첨부 / 목록버튼.
- `content`: 관리자 작성 신뢰 소스 → HTML 렌더. (평문이면 줄바꿈 보존)
- `attachmentFiles`: **JSON 문자열** → `JSON.parse` 후 다운로드 링크 목록. 빈 `[]`면 영역 숨김.
- `thumbnailImage`: 있으면 상단/본문에 표시.
- 잘못된 id → 404 안내 + 목록 링크.

### URL 분기
같은 `notice.php`(또는 `press.php`)에서 `?id=` 유무로 목록/상세 전환. 뒤로가기/URL 공유 자연 동작.

## 8. 타입 정의 (이미지 스키마 기준, JSDoc)

`_board.php` 의 JS 상단에 typedef로 정의(런타임 영향 없음, 참조/문서화용).

```js
/**
 * @typedef {Object} NotifyWriter
 * @property {string} id
 * @property {string} name
 * @property {string} userId
 * @property {('ACTIVE'|'INACTIVE'|'SUSPENDED'|'DELETED')} status
 * @property {boolean} isAdmin
 * @property {string} [email]
 * @property {string} [phone]
 * @property {string} createdAt
 */

/**
 * @typedef {Object} NotifyEntity
 * @property {string} id
 * @property {('NOTICE'|'RESOURCE'|'NEWSROOM')} type
 * @property {string} title
 * @property {string} content
 * @property {string} [thumbnailImage]
 * @property {string} attachmentFiles   // JSON 문자열 → 파싱 필요
 * @property {boolean} showYn
 * @property {boolean} isPinned
 * @property {string} [startDate]
 * @property {string} [endDate]
 * @property {NotifyWriter} [writer]
 * @property {string} createdAt
 * @property {string} updatedAt
 * @property {?string} deletedAt
 */

/**
 * @typedef {Object} NotifyListPayload
 * @property {NotifyEntity[]} data
 * @property {number} total
 * @property {number} take
 * @property {number} skip
 */
```

## 9. 상태/에러 처리

| 상황 | 처리 |
|------|------|
| 목록 0건 | "등록된 게시글이 없습니다" 빈 상태 |
| 검색 무결과 | "검색 결과가 없습니다" + 검색어 표시 |
| 잘못된 id | 404 안내 + 목록으로 |
| API 오류/네트워크 | "일시적 오류" 안내 + 재시도 |
| 토큰 만료 | 프록시가 재로그인(사용자 비노출) |

## 10. 미해결/검증 항목 (구현 중 라이브로 확정)

- `showYn` 공개분 정확값(`Y`/`true`/`"Y"`) — 실 데이터/스웨거로 확인.
- `content` HTML vs 평문 — 실 데이터로 확인(현재 DB 비어있음). 기본 HTML 렌더 가정.
- 날짜 표시 기준 필드(createdAt vs startDate) — 게시판 관례상 createdAt 우선.
- `many` vs `search` 차이 — 목록=many, 검색조건 있으면 search 사용(둘 다 q 받음).

## 11. 자격증명 (git 제외)

`page/support/notice_config.php` (예시, 실제 값은 커밋 안 함):
```php
<?php
return [
  'api_base'  => 'https://api.growchat.co.kr/api/serv/',
  'root_id'   => 'test',
  'root_pw'   => 'test1234',
  'page_size' => 10,
];
```
