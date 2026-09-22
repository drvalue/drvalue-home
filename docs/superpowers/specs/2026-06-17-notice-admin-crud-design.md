# 공지/보도자료 관리자 CRUD + 자료형 정합 설계

작성일: 2026-06-17 (게시판 조회 기능 후속 — [2026-06-17-notice-board-design.md](2026-06-17-notice-board-design.md) 확장)

## 1. 목표

기존 공지사항/보도자료 게시판에 **관리자 전용 글 생성·수정·삭제**를 붙인다. 공개 유저는 목록/상세까지만, 관리자는 로그인 후 작성/수정/삭제까지. 더불어 엔티티 스키마와 어긋난 **자료형(특히 `showYn` boolean)을 전수 교정**한다.

## 2. 범위

### 포함

- 관리자 인증: 루트 id/pw 로그인 모달 → API 검증 → PHP 세션 + CSRF 토큰
- 프록시(`notice_api.php`) 확장: `login` / `logout` / `session` / `create` / `update` / `delete`
- 공개 페이지(`_board.php`)에 관리 UI 내장: 글작성 버튼, 수정/삭제 버튼, 로그인/로그아웃 버튼, 삭제 확인 팝업
- 글작성/수정 폼 페이지(`notify_form.php`, 관리자 전용)
- 자료형 정합: `showYn`/`isPinned` boolean, `attachmentFiles` 배열(요청)/문자열(응답), dates ISO8601

### 비포함

- 썸네일/첨부파일 입력 (업로드 API 없음 → 제외. create body는 `attachmentFiles: []`, 썸네일 미전송)
- RESOURCE 타입 (NOTICE·NEWSROOM만)
- 관리자 계정 관리(루트 단일 계정)

## 3. 연동 대상 API (추가분)

베이스 `https://api.growchat.co.kr/api/serv/`, 루트 토큰(`Authorization: Bearer`) 필요. 업스트림은 항상 HTTP 200 + 본문 `status` 필드로 실제 상태 전달.

| 용도 | 메서드 | 경로                                     |
| ---- | ------ | ---------------------------------------- |
| 생성 | POST   | `baseinfo/v1/default-notify/create`      |
| 수정 | POST   | `baseinfo/v1/default-notify/update`      |
| 삭제 | DELETE | `baseinfo/v1/default-notify/delete/{id}` |

### 생성 Request body

```jsonc
{
  "type": "NOTICE", // NOTICE | NEWSROOM
  "title": "...",
  "content": "...",
  "thumbnailImage": "", // 미사용 (빈 문자열 또는 미전송)
  "attachmentFiles": [], // 미사용 (빈 배열)
  "showYn": true, // boolean (글작성 시에 공개 비공개 여부 선택 가능하도록)
  "isPinned": false, // boolean
  "startDate": "2026-06-17T00:00:00.000Z", // ISO8601
  "endDate": "2026-06-30T23:59:59.000Z"
}
```

응답: `data` = 생성된 엔티티(`data.id` 포함).

### 수정 Request body

생성 body + `"id": "<uuid>"`. 응답 `data: null`(성공).

### 삭제

경로 파라미터 `{id}`. 응답 봉투 status로 성공 판정.

## 4. 인증·보안 설계

1. **로그인(option 1)**: 관리자가 루트 id/pw를 로그인 모달에 입력 → 프록시 `action=login`(POST)이 API 루트 로그인으로 **검증** → 성공 시 `$_SESSION['notify_admin'] = true`, `$_SESSION['csrf']` 발급.
2. **쓰기 게이트**: `create`/`update`/`delete`/`logout` 은 `$_SESSION['notify_admin'] === true` 아니면 **401**. 세션 없으면 쓰기 불가(공개 프록시 악용 차단).
3. **CSRF**: 세션 생성 시 `csrf` 토큰 발급. 쓰기 요청은 헤더 `X-CSRF-Token`로 전달, 프록시가 `hash_equals`로 검증. 불일치 → 403.
4. **세션 상태 노출**: `action=session`(GET) → `{ "admin": bool, "csrf": "<token-or-empty>" }`. 비관리자에겐 csrf 빈값. 페이지는 이 값으로 관리 버튼 노출 + csrf 확보.
5. **메서드 강제**: 조회=GET, 쓰기·login·logout=POST, delete=프록시는 POST 받아 업스트림 DELETE 호출(브라우저 폼 단순화).
6. **type 화이트리스트**: create/update의 type은 `NOTICE|NEWSROOM`만 허용, 그 외 400.
7. **세션 쿠키**: `session_start()` 시 httponly. 자격증명·토큰은 서버에만(기존 불변식 유지).

## 5. 자료형 정합 (전수 점검)

| 필드                  | 올바른 타입                  | 조치                                                                                      |
| --------------------- | ---------------------------- | ----------------------------------------------------------------------------------------- |
| `showYn`              | boolean                      | 읽기 필터 `showYn=Y` → **`true`** 로 수정(빈결과 의심 1순위). 쓰기 body JSON `true/false` |
| `isPinned`            | boolean                      | 쓰기 body JSON bool. 폼 체크박스 → bool                                                   |
| `attachmentFiles`     | 요청=배열 / 응답=JSON 문자열 | 요청 `[]`, 응답은 기존 `JSON.parse` 유지                                                  |
| `type`                | enum 문자열                  | NOTICE/NEWSROOM 화이트리스트                                                              |
| `startDate`/`endDate` | ISO8601 문자열               | 폼 date(YYYY-MM-DD) → `T00:00:00.000Z`/`T23:59:59.000Z` 변환 후 전송                      |

구현 중 create 1건을 실제 호출해 body/응답·`showYn` 필터값을 라이브 검증한다(이전 조회 board의 미검증 렌더·showYn 문제도 이때 함께 해소).

## 6. 파일 구조

```
page/support/
  notice_api.php     # (수정) session_start + login/logout/session/create/update/delete 추가, showYn 필터 boolean
  _board.php         # (수정) 관리 버튼·로그인 모달·삭제 확인·세션 토글
  notify_form.php    # (신규) 글작성/수정 폼 (관리자 전용)
  notice.php         # (변경 없음)
  press.php          # (변경 없음)
```

### 컴포넌트 경계

- `notice_api.php`: 인증 상태(세션)·CSRF·업스트림 호출 캡슐화. 입력 검증 일원화.
- `_board.php`: 공개 렌더 + 관리 UI 토글(세션 상태에 따른 버튼 노출). 데이터는 프록시 ajax.
- `notify_form.php`: 관리자 폼. 진입 시 세션 미인증이면 board로 리다이렉트(또는 로그인 유도). create/edit 공용.

## 7. 화면·플로우

### 로그인 진입점

- board 페이지 하단에 **버튼**(링크 아님): 비로그인 "관리자 로그인" → 모달. 로그인 시 "로그아웃" 버튼.
- 모달: id/pw 입력 → `action=login` ajax → 성공 시 페이지 새로고침(관리 UI 노출).

### 목록(관리자)

- 상단/하단에 **글작성 버튼** → `notify_form.php?board=<notice|press>`.

### 상세(관리자)

- **수정 버튼** → `notify_form.php?id=<id>`.
- **삭제 버튼** → "정말 삭제하시겠습니까?" 예/아니오 팝업 → 예 → `action=delete` → 성공 시 그 글 **type의 board 목록**으로 이동(NOTICE→notice.php, NEWSROOM→press.php).

### 글작성/수정 폼 (`notify_form.php`)

- 필드: type 드롭다운(공지사항 NOTICE/보도자료 NEWSROOM), 제목, 내용(textarea), 공개여부(showYn 체크), 상단고정(isPinned 체크), 시작일/종료일(date).
- **신규 기본 type**: `?board=notice`→공지사항, `?board=press`→보도자료.
- **수정**: `?id=` → `action=detail`로 기존값 로드해 폼 채움.
- **제출**:
  - 신규: `action=create` → 성공 시 **선택한 type의 board 목록**으로 이동(공지서 들어와 보도자료 선택 시 press.php).
  - 수정: `action=update` → 성공 시 **수정한 글의 상세 페이지**로 이동(선택 type 기준: NOTICE→notice.php?id=, NEWSROOM→press.php?id=).
- 미인증 접근 시 board로 리다이렉트.

## 8. 프록시 액션 계약 (`notice_api.php`)

| action             | 메서드 | 세션 | 입력                | 출력                 |
| ------------------ | ------ | ---- | ------------------- | -------------------- |
| list/search/detail | GET    | 불요 | (기존)              | (기존)               |
| session            | GET    | 불요 | -                   | `{admin, csrf}`      |
| login              | POST   | 불요 | `userId,password`   | `{ok:true}` 또는 401 |
| logout             | POST   | 필요 | CSRF                | `{ok:true}`          |
| create             | POST   | 필요 | CSRF + 글 필드      | `{id}` 또는 4xx      |
| update             | POST   | 필요 | CSRF + id + 글 필드 | `{ok:true}`          |
| delete             | POST   | 필요 | CSRF + id           | `{ok:true}`          |

- 쓰기 입력 검증: type ∈ {NOTICE,NEWSROOM}, title·content 비어있지 않음, showYn/isPinned bool 캐스팅, dates ISO 형식 통과분만.
- 업스트림 호출은 기존 토큰 헬퍼(config 루트 토큰, 401 시 재로그인) 사용. 봉투 status로 성공 판정.

## 9. 상태·에러 처리

| 상황              | 처리                          |
| ----------------- | ----------------------------- |
| 로그인 실패       | 모달에 "아이디/비밀번호 오류" |
| 세션 만료 후 쓰기 | 401 → "다시 로그인" 안내      |
| CSRF 불일치       | 403                           |
| 필수값 누락       | 폼 인라인 검증 + 프록시 400   |
| 삭제 확인 취소    | 아무 동작 없음                |
| 업스트림 오류     | "처리 실패" 안내              |

## 10. 미해결(구현 중 라이브 확정)

- 읽기 필터 `showYn` 정확값/방향: `true` 가정 → create 1건 후 실검증.
- create/update body에서 `thumbnailImage` 미전송 가능 여부(필수면 빈문자열 전송).
- update 성공 응답 형태(`data:null`) 시 성공 판정은 봉투 status로.
