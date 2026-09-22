# 고객센터 공지사항/보도자료 게시판 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 고객센터에 공지사항·보도자료 게시판(목록+검색+기간검색+상세보기)을 퍼블리싱하고 실제 API에 연동한다.

**Architecture:** 브라우저(jQuery ajax) → PHP 프록시(`notice_api.php`, 루트 로그인/토큰 캐시/화이트리스트 3액션) → growchat API. 공통 게시판 파셜(`_board.php`)을 `notice.php`(NOTICE)·`press.php`(NEWSROOM)가 include. 상세는 같은 파일 `?id=` 분기.

**Tech Stack:** PHP 8.x, jQuery 3.6, AOS, Pretendard. cURL(php). 자동 테스트 프레임워크 없음 → 검증은 cURL 프로브 + 로컬 PHP 서버 브라우저 확인.

## Global Constraints

- 디자인 결: 히어로 배너 + `breadcrumb.php` + 섹션, Pretendard, 포인트색 `#d00000`/`#f26f21`/`#191f28`, AOS.
- 모든 페이지는 `header.php`/`footer.php`를 `$_SERVER['DOCUMENT_ROOT']` 기준 include (기존 패턴).
- API 베이스: `https://api.growchat.co.kr/api/serv/`. 루트 로그인 `auth/v1/login/root/basic` (test/test1234). 조회 `baseinfo/v1/default-notify/{many,search,one/{id}}`.
- 응답 봉투: `{ data, status, resultCode, message, ... }`. 목록 payload `{ data:[], total, take, skip }`. 상세 payload = 엔티티.
- **보안 불변식**: 토큰·자격증명은 서버에만. 프록시는 `list/search/detail` 3액션만, `board=notice|press`만, `type`/`showYn` 서버 강제. 자격증명/토큰캐시는 git 제외.
- 페이지 크기 `PAGE_SIZE = 10`.
- 검증용 로컬 서버: 저장소 루트에서 `php -S localhost:8000`.

---

### Task 1: 자격증명 설정 + .gitignore

**Files:**

- Create: `page/support/notice_config.php`
- Create: `.gitignore`

**Interfaces:**

- Produces: `require`하면 배열 반환 — `['api_base','root_id','root_pw','page_size']`. `notice_api.php`가 소비.

- [ ] **Step 1: `.gitignore` 생성**

```gitignore
# API 자격증명 (커밋 금지)
page/support/notice_config.php

# 프록시 토큰 캐시
*.notify_token_cache
notify_token_cache*

# OS
.DS_Store
```

- [ ] **Step 2: `notice_config.php` 생성**

```php
<?php
// 외부 API 자격증명. .gitignore 처리됨 — 커밋 금지.
return [
    'api_base'  => 'https://api.growchat.co.kr/api/serv/',
    'root_id'   => 'test',
    'root_pw'   => 'test1234',
    'page_size' => 10,
];
```

- [ ] **Step 3: git 제외 확인**

Run: `git status --porcelain | grep notice_config.php || echo "IGNORED-OK"`
Expected: `IGNORED-OK` (config가 추적 대상에 없음)

- [ ] **Step 4: 커밋 (`.gitignore`만)**

```bash
git add .gitignore
git commit -m "chore: add .gitignore for notice api credentials"
```

---

### Task 2: PHP 프록시 `notice_api.php`

**Files:**

- Create: `page/support/notice_api.php`

**Interfaces:**

- Consumes: `notice_config.php` 배열.
- Produces: HTTP GET 엔드포인트.

  - `?board=notice|press&action=list&page=N&q=&startDate=&endDate=`
  - `?board=notice|press&action=search&page=N&q=&startDate=&endDate=`
  - `?board=notice|press&action=detail&id=<id>`
  - 응답: 성공 시 `Content-Type: application/json` 으로 외부 API의 `data`(목록 payload 또는 엔티티) 그대로. 오류 시 `{ "error": "<msg>" }` + 적절한 status.

- [ ] **Step 1: 프록시 전체 작성**

```php
<?php
// 고객센터 게시판 프록시 — 루트 로그인/토큰 캐시 후 조회 API 3종만 중계.
// 보안: 토큰·자격증명 미노출, board 화이트리스트, type/showYn 서버 강제.
header('Content-Type: application/json; charset=utf-8');

$cfg = require __DIR__ . '/notice_config.php';

// --- 입력 검증 ---
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'method not allowed']);
    exit;
}

$BOARD_TYPE = ['notice' => 'NOTICE', 'press' => 'NEWSROOM'];
$board  = $_GET['board']  ?? '';
$action = $_GET['action'] ?? '';

if (!isset($BOARD_TYPE[$board])) {
    http_response_code(400);
    echo json_encode(['error' => 'invalid board']);
    exit;
}
if (!in_array($action, ['list', 'search', 'detail'], true)) {
    http_response_code(400);
    echo json_encode(['error' => 'invalid action']);
    exit;
}
$type = $BOARD_TYPE[$board];

// --- 토큰 캐시 경로 (board 무관, 공용) ---
function notify_token_path() {
    return sys_get_temp_dir() . '/drvalue_notify_token_cache.json';
}

// --- 외부 API 호출 헬퍼 ---
function notify_curl($url, $method = 'GET', $body = null, $token = null) {
    $ch = curl_init($url);
    $headers = ['Accept: application/json'];
    if ($token) $headers[] = 'Authorization: Bearer ' . $token;
    if ($body !== null) {
        $headers[] = 'Content-Type: application/json';
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body));
    }
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CUSTOMREQUEST  => $method,
        CURLOPT_HTTPHEADER     => $headers,
        CURLOPT_TIMEOUT        => 15,
    ]);
    $res  = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    return [$code, $res ? json_decode($res, true) : null];
}

// --- 루트 로그인 → 토큰 ---
function notify_login($cfg) {
    [$code, $json] = notify_curl(
        rtrim($cfg['api_base'], '/') . '/auth/v1/login/root/basic',
        'POST',
        ['userId' => $cfg['root_id'], 'password' => $cfg['root_pw']]
    );
    $token = $json['data']['accessToken'] ?? null;
    if ($code === 200 && $token) {
        @file_put_contents(notify_token_path(), json_encode(['token' => $token]));
        return $token;
    }
    return null;
}

function notify_cached_token() {
    $p = notify_token_path();
    if (!is_file($p)) return null;
    $j = json_decode(@file_get_contents($p), true);
    return $j['token'] ?? null;
}

// --- 조회 URL 빌더 ---
function notify_build_url($cfg, $action, $type) {
    $base = rtrim($cfg['api_base'], '/') . '/baseinfo/v1/default-notify';
    if ($action === 'detail') {
        $id = $_GET['id'] ?? '';
        if (!preg_match('/^[A-Za-z0-9_-]+$/', $id)) return null; // id 형식 강제
        return $base . '/one/' . rawurlencode($id);
    }
    $page = max(1, (int)($_GET['page'] ?? 1));
    $take = (int)$cfg['page_size'];
    $skip = ($page - 1) * $take;
    $params = [
        'take'    => $take,
        'skip'    => $skip,
        'type'    => $type,   // 서버 강제
        'showYn'  => 'Y',     // 공개분만 (서버 강제)
    ];
    foreach (['q', 'startDate', 'endDate'] as $k) {
        if (!empty($_GET[$k])) $params[$k] = $_GET[$k];
    }
    $path = $action === 'search' ? '/search' : '/many';
    return $base . $path . '?' . http_build_query($params);
}

// --- 메인: 토큰으로 호출, 401이면 1회 재로그인 ---
$url = notify_build_url($cfg, $action, $type);
if ($url === null) {
    http_response_code(400);
    echo json_encode(['error' => 'invalid id']);
    exit;
}

$token = notify_cached_token() ?: notify_login($cfg);
if (!$token) {
    http_response_code(502);
    echo json_encode(['error' => 'auth failed']);
    exit;
}

[$code, $json] = notify_curl($url, 'GET', null, $token);
if ($code === 401) { // 만료 → 재로그인 후 재시도
    $token = notify_login($cfg);
    if ($token) [$code, $json] = notify_curl($url, 'GET', null, $token);
}

if ($code === 200 && isset($json['data'])) {
    echo json_encode($json['data']); // data 만 노출 (토큰/봉투 메타 제거)
    exit;
}
if ($code === 404) {
    http_response_code(404);
    echo json_encode(['error' => 'not found']);
    exit;
}
http_response_code(502);
echo json_encode(['error' => 'upstream error', 'status' => $code]);
```

- [ ] **Step 2: 로컬 서버 기동**

Run (백그라운드): 저장소 루트에서 `php -S localhost:8000`

- [ ] **Step 3: 목록 액션 검증**

Run: `curl -s "http://localhost:8000/page/support/notice_api.php?board=notice&action=list&page=1" | head -c 400`
Expected: `{"data":[...],"total":...,"take":10,"skip":0}` 형태 JSON (토큰/봉투 메타 없음). 현재 DB 비어있으면 `{"data":[],"total":0,...}`.

- [ ] **Step 4: 보안 검증 — 잘못된 board/action 거부**

Run: `curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:8000/page/support/notice_api.php?board=hack&action=list"`
Expected: `400`

Run: `curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:8000/page/support/notice_api.php?board=notice&action=delete"`
Expected: `400`

- [ ] **Step 5: 응답에 토큰 미노출 확인**

Run: `curl -s "http://localhost:8000/page/support/notice_api.php?board=press&action=list" | grep -c -i "accessToken\|Bearer\|root" || echo "CLEAN"`
Expected: `CLEAN` (또는 `0`)

- [ ] **Step 6: 커밋**

```bash
git add page/support/notice_api.php
git commit -m "feat: add notice board api proxy with root auth and allowlist"
```

---

### Task 3: 고객센터 메뉴 복원 (`header.php`)

**Files:**

- Modify: `header.php:120-124` (주석처리된 support 메뉴 블록)

**Interfaces:**

- Produces: `$menu_items` 에 support 항목 추가 → GNB/모바일/`breadcrumb.php` 가 자동 반영.

- [ ] **Step 1: 주석처리된 support 메뉴를 활성 항목으로 교체**

`header.php` 의 아래 주석 블록을

```php
                    // 임시 숨김 (요청 시 복구)
                    // ['title' => '고객센터', 'link' => '/page/support/notice.php', 'match' => 'support', 'sub' => [
                    //     ['t' => '공지사항', 'l' => '/page/support/notice.php'],
                    //     ['t' => '보도자료', 'l' => '/page/support/press.php']
                    // ]]
```

다음으로 교체:

```php
                    ['title' => '고객센터', 'link' => '/page/support/notice.php', 'match' => 'support', 'sub' => [
                        ['t' => '공지사항', 'l' => '/page/support/notice.php'],
                        ['t' => '보도자료', 'l' => '/page/support/press.php']
                    ]]
```

(직전 `tech` 메뉴 항목 끝의 `],` 뒤에 위 항목이 오도록 콤마 유지 확인.)

- [ ] **Step 2: 문법 검증**

Run: `php -l header.php`
Expected: `No syntax errors detected in header.php`

- [ ] **Step 3: 브라우저 확인**

`http://localhost:8000/page/company/intro.php` 접속 → GNB에 `고객센터` 노출, 호버 시 `공지사항`/`보도자료` 서브 표시.

- [ ] **Step 4: 커밋**

```bash
git add header.php
git commit -m "feat: restore 고객센터 menu with 공지사항 and 보도자료"
```

---

### Task 4: 진입점 + 게시판 파셜 골격

**Files:**

- Create: `page/support/_board.php` (골격: 히어로/브레드크럼/섹션/타입정의, 빈 컨테이너)
- Modify: `page/support/notice.php` (전체 교체)
- Modify: `page/support/press.php` (전체 교체)

**Interfaces:**

- Consumes: 진입점이 `$board`(`'notice'|'press'`), `$page_title`, `$page_eyebrow`, `$hero_img`, `$hero_text` 설정 후 `_board.php` include.
- Produces: `_board.php` 가 `window.BOARD = { key: '<board>', apiBase: '/page/support/notice_api.php' }` 노출 → Task 5/6 JS가 소비. 컨테이너 `#dvBoardList`, `#dvBoardDetail`, 검색폼 `#dvSearchForm`.

- [ ] **Step 1: `notice.php` 전체 교체**

```php
<?php
$board       = 'notice';
$page_title  = '공지사항';
$page_eyebrow= 'NOTICE';
$hero_img    = '/img/main_bg_02.jpg';
$hero_text   = '디알밸류의 소식과 공지사항을 안내드립니다.';
include __DIR__ . '/_board.php';
```

- [ ] **Step 2: `press.php` 전체 교체**

```php
<?php
$board       = 'press';
$page_title  = '보도자료';
$page_eyebrow= 'NEWSROOM';
$hero_img    = '/img/main_bg_02.jpg';
$hero_text   = '디알밸류의 보도자료와 언론 보도를 확인하세요.';
include __DIR__ . '/_board.php';
```

- [ ] **Step 3: `_board.php` 골격 작성**

```php
<?php
// 공통 게시판 파셜. 진입점(notice.php/press.php)이 $board 등 설정 후 include.
if (!isset($board) || !in_array($board, ['notice', 'press'], true)) { http_response_code(400); exit('invalid board'); }
include_once($_SERVER['DOCUMENT_ROOT'] . '/header.php');
?>
<link rel="stylesheet" href="https://unpkg.com/aos@next/dist/aos.css" />
<style>
    #dv_board { margin-top: 80px; color: #191f28; font-family: 'Pretendard', sans-serif; overflow-x: hidden; }
    #dv_board .t_inner { max-width: 1140px; margin: 0 auto; padding: 0 20px; width: 100%; }
    #dv_board .section_padding { padding: 100px 0; background: #f4f6f8; min-height: 50vh; }
    .hero_sub_banner { position: relative; height: 320px; background: url('<?php echo htmlspecialchars($hero_img); ?>') no-repeat center center / cover; display: flex; align-items: center; background-color: #191f28; }
    .hero_sub_banner::before { content:''; position:absolute; inset:0; background: rgba(0,0,0,0.5); z-index:1; }
    .hero_sub_banner .hero_text { position: relative; z-index: 2; color: #fff; }
    .hero_sub_banner h2 { font-size: 42px; font-weight: 800; margin: 0; letter-spacing: -1.5px; }
    .hero_sub_banner p { margin-top: 14px; font-size: 18px; color: #e5e8eb; }

    /* 검색 */
    .dv_search { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; justify-content: center; margin-bottom: 36px; }
    .dv_search input { height: 46px; border: 1px solid #e5e8eb; border-radius: 12px; padding: 0 14px; font-size: 15px; background:#fff; font-family:'Pretendard'; }
    .dv_search input[name=q] { width: 280px; max-width: 60vw; }
    .dv_search .dv_btn { height: 46px; padding: 0 22px; border: none; border-radius: 12px; font-weight: 700; cursor: pointer; font-family:'Pretendard'; font-size:15px; }
    .dv_btn_search { background: #d00000; color: #fff; }
    .dv_btn_reset { background: #e5e8eb; color: #4e5968; }

    /* 목록 */
    .dv_tbl { width: 100%; border-collapse: collapse; background:#fff; border-radius:16px; overflow:hidden; box-shadow:0 6px 24px rgba(0,0,0,.05); }
    .dv_tbl th, .dv_tbl td { padding: 16px 18px; border-bottom: 1px solid #eef0f3; font-size: 15px; }
    .dv_tbl th { background:#f9fafb; color:#4e5968; font-weight:700; text-align:left; }
    .dv_tbl td.c, .dv_tbl th.c { text-align:center; white-space:nowrap; color:#8b95a1; }
    .dv_tbl tr.is-pinned td { background:#fff7f5; }
    .dv_pin { display:inline-block; background:#ffe7d9; color:#f26f21; font-size:12px; font-weight:700; padding:2px 8px; border-radius:6px; margin-right:8px; }
    .dv_tbl a.dv_title { color:#191f28; font-weight:600; text-decoration:none; }
    .dv_tbl a.dv_title:hover { color:#d00000; text-decoration:underline; }

    /* 상태 */
    .dv_empty { text-align:center; padding:80px 0; color:#8b95a1; font-size:16px; }

    /* 페이지네이션 */
    .dv_pager { display:flex; gap:6px; justify-content:center; margin-top:34px; }
    .dv_pager button { min-width:38px; height:38px; border:1px solid #e5e8eb; background:#fff; border-radius:10px; cursor:pointer; font-family:'Pretendard'; color:#4e5968; }
    .dv_pager button.on { background:#d00000; color:#fff; border-color:#d00000; font-weight:700; }
    .dv_pager button:disabled { opacity:.4; cursor:default; }

    /* 상세 */
    .dv_detail { background:#fff; border-radius:16px; box-shadow:0 6px 24px rgba(0,0,0,.05); padding:48px 44px; }
    .dv_detail h3 { font-size:28px; font-weight:800; margin:0 0 16px; }
    .dv_detail_meta { display:flex; gap:18px; color:#8b95a1; font-size:14px; border-bottom:1px solid #eef0f3; padding-bottom:20px; margin-bottom:28px; }
    .dv_detail_body { font-size:16px; line-height:1.8; color:#333d4b; word-break:keep-all; }
    .dv_detail_body img { max-width:100%; height:auto; }
    .dv_files { margin-top:28px; border-top:1px solid #eef0f3; padding-top:20px; }
    .dv_files a { display:inline-block; margin:4px 8px 4px 0; color:#d00000; }
    .dv_back { margin-top:34px; text-align:center; }
    .dv_back a { display:inline-block; padding:13px 30px; background:#191f28; color:#fff; border-radius:12px; text-decoration:none; font-weight:700; }

    @media (max-width:900px){
        .hero_sub_banner h2{font-size:26px;} .hero_sub_banner p{font-size:15px;}
        .dv_tbl .hide-m{display:none;} .dv_detail{padding:30px 22px;}
    }
</style>

<div id="dv_board">
    <section class="hero_sub_banner">
        <div class="t_inner">
            <div class="hero_text" data-aos="fade-up">
                <h2><?php echo htmlspecialchars($page_title); ?></h2>
                <p><?php echo htmlspecialchars($hero_text); ?></p>
            </div>
        </div>
    </section>

    <?php include_once($_SERVER['DOCUMENT_ROOT'] . '/breadcrumb.php'); ?>

    <section class="section_padding">
        <div class="t_inner">
            <div id="dvBoardList"></div>
            <div id="dvBoardDetail"></div>
        </div>
    </section>
</div>

<script src="https://unpkg.com/aos@next/dist/aos.js"></script>
<script>
window.BOARD = { key: '<?php echo $board; ?>', api: '/page/support/notice_api.php', pageSize: 10, title: <?php echo json_encode($page_title); ?> };
$(function(){ AOS.init({ duration: 800, once: true }); });
</script>

<?php include_once($_SERVER['DOCUMENT_ROOT'] . '/footer.php'); ?>
```

- [ ] **Step 4: 문법 검증**

Run: `php -l page/support/_board.php && php -l page/support/notice.php && php -l page/support/press.php`
Expected: 3개 모두 `No syntax errors detected`

- [ ] **Step 5: 브라우저 확인**

`http://localhost:8000/page/support/notice.php` → 히어로("공지사항")·브레드크럼·빈 섹션 렌더. 콘솔에 `window.BOARD` = `{key:'notice',...}`. `press.php` 는 "보도자료"/`key:'press'`.

- [ ] **Step 6: 커밋**

```bash
git add page/support/_board.php page/support/notice.php page/support/press.php
git commit -m "feat: scaffold notice/press board partial and entry points"
```

---

### Task 5: 목록 모드 (검색 + 기간 + 페이지네이션)

**Files:**

- Modify: `page/support/_board.php` (Step 3의 `<script>` 안에 목록 로직 추가)

**Interfaces:**

- Consumes: `window.BOARD`, `notice_api.php?action=list|search`.
- Produces: JS 함수 `loadList(page)`, `renderList(payload)`, `renderPager(total, page)`, `getQuery()`. `?id=` 없을 때 목록 렌더. Task 6 가 `?id=` 분기 추가.

- [ ] **Step 1: typedef + 목록 JS 추가**

`_board.php` 의 `window.BOARD = ...;` 줄 **아래**, `$(function(){ AOS... })` **위**에 삽입:

```javascript
/**
 * @typedef {Object} NotifyEntity
 * @property {string} id @property {('NOTICE'|'RESOURCE'|'NEWSROOM')} type
 * @property {string} title @property {string} content
 * @property {string} [thumbnailImage] @property {string} attachmentFiles  // JSON 문자열
 * @property {boolean} showYn @property {boolean} isPinned
 * @property {string} [startDate] @property {string} [endDate]
 * @property {{name?:string}} [writer] @property {string} createdAt
 */
/** @typedef {Object} NotifyListPayload @property {NotifyEntity[]} data @property {number} total */

function dvEsc(s) {
  return $("<div>")
    .text(s == null ? "" : String(s))
    .html();
}
function dvDate(s) {
  if (!s) return "-";
  return String(s).slice(0, 10);
}
function dvQS(params) {
  return Object.entries(params)
    .filter(([, v]) => v !== "" && v != null)
    .map(([k, v]) => k + "=" + encodeURIComponent(v))
    .join("&");
}

// URL 쿼리스트링 읽기 (검색 상태 유지)
function dvGetParams() {
  var p = new URLSearchParams(location.search);
  return {
    id: p.get("id") || "",
    q: p.get("q") || "",
    startDate: p.get("startDate") || "",
    endDate: p.get("endDate") || "",
    page: parseInt(p.get("page") || "1", 10),
  };
}

function dvLoadList() {
  var cur = dvGetParams();
  var hasSearch = cur.q || cur.startDate || cur.endDate;
  var action = hasSearch ? "search" : "list";
  var url =
    BOARD.api +
    "?" +
    dvQS({
      board: BOARD.key,
      action: action,
      page: cur.page,
      q: cur.q,
      startDate: cur.startDate,
      endDate: cur.endDate,
    });
  $("#dvBoardList").html('<div class="dv_empty">불러오는 중...</div>');
  $.getJSON(url)
    .done(function (payload) {
      dvRenderSearch(cur);
      dvRenderList(payload, cur, hasSearch);
    })
    .fail(function () {
      $("#dvBoardList").html(
        '<div class="dv_empty">일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.</div>'
      );
    });
}

function dvRenderSearch(cur) {
  var html =
    "" +
    '<form id="dvSearchForm" class="dv_search">' +
    '  <input type="text" name="q" placeholder="제목 / 내용 검색" value="' +
    dvEsc(cur.q) +
    '">' +
    '  <input type="date" name="startDate" value="' +
    dvEsc(cur.startDate) +
    '">' +
    '  <input type="date" name="endDate" value="' +
    dvEsc(cur.endDate) +
    '">' +
    '  <button type="submit" class="dv_btn dv_btn_search">검색</button>' +
    '  <button type="button" class="dv_btn dv_btn_reset" onclick="location.href=location.pathname">초기화</button>' +
    "</form>";
  // 검색폼은 목록 컨테이너 위에 한 번만
  if (!$("#dvSearchForm").length) {
    $("#dvBoardList").before(html);
  } else {
    $("#dvSearchForm input[name=q]").val(cur.q);
  }
}

function dvRenderList(payload, cur, hasSearch) {
  var items = (payload && payload.data) || [];
  var total = (payload && payload.total) || 0;
  if (!items.length) {
    var msg = hasSearch ? "검색 결과가 없습니다." : "등록된 게시글이 없습니다.";
    $("#dvBoardList").html('<div class="dv_empty">' + msg + "</div>");
    return;
  }
  var startNo = total - (cur.page - 1) * BOARD.pageSize;
  var rows = items
    .map(function (it, i) {
      var no = startNo - i;
      var titleLink = location.pathname + "?id=" + encodeURIComponent(it.id);
      var pin = it.isPinned ? '<span class="dv_pin">고정</span>' : "";
      return (
        '<tr class="' +
        (it.isPinned ? "is-pinned" : "") +
        '">' +
        '<td class="c">' +
        (it.isPinned ? "-" : no) +
        "</td>" +
        "<td>" +
        pin +
        '<a class="dv_title" href="' +
        titleLink +
        '">' +
        dvEsc(it.title) +
        "</a></td>" +
        '<td class="c hide-m">' +
        dvEsc((it.writer && it.writer.name) || "디알밸류") +
        "</td>" +
        '<td class="c">' +
        dvDate(it.startDate || it.createdAt) +
        "</td>" +
        "</tr>"
      );
    })
    .join("");
  $("#dvBoardList").html(
    '<table class="dv_tbl"><thead><tr>' +
      '<th class="c" style="width:70px">번호</th><th>제목</th>' +
      '<th class="c hide-m" style="width:120px">작성자</th><th class="c" style="width:120px">작성일</th>' +
      "</tr></thead><tbody>" +
      rows +
      "</tbody></table>" +
      dvRenderPager(total, cur.page)
  );
}

function dvRenderPager(total, page) {
  var totalPages = Math.max(1, Math.ceil(total / BOARD.pageSize));
  if (totalPages <= 1) return "";
  var block = 5,
    startP = Math.floor((page - 1) / block) * block + 1,
    endP = Math.min(startP + block - 1, totalPages);
  function btn(p, label, opt) {
    opt = opt || {};
    return (
      "<button " +
      (opt.disabled ? "disabled" : "") +
      ' class="' +
      (opt.on ? "on" : "") +
      '" onclick="dvGoPage(' +
      p +
      ')">' +
      (label || p) +
      "</button>"
    );
  }
  var h = '<div class="dv_pager">';
  h += btn(page - 1, "‹", { disabled: page <= 1 });
  for (var p = startP; p <= endP; p++) h += btn(p, p, { on: p === page });
  h += btn(page + 1, "›", { disabled: page >= totalPages });
  h += "</div>";
  return h;
}

function dvGoPage(p) {
  var cur = dvGetParams();
  location.href =
    location.pathname +
    "?" +
    dvQS({ q: cur.q, startDate: cur.startDate, endDate: cur.endDate, page: p });
}
```

- [ ] **Step 2: 검색 제출 + 초기 진입 바인딩 추가**

같은 `<script>` 의 `$(function(){ AOS.init(...) });` 를 다음으로 교체:

```javascript
$(function () {
  AOS.init({ duration: 800, once: true });
  $(document).on("submit", "#dvSearchForm", function (e) {
    e.preventDefault();
    var q = $(this).find("[name=q]").val().trim();
    var sd = $(this).find("[name=startDate]").val();
    var ed = $(this).find("[name=endDate]").val();
    location.href =
      location.pathname +
      "?" +
      dvQS({ q: q, startDate: sd, endDate: ed, page: 1 });
  });
  var p = dvGetParams();
  if (p.id) {
    /* Task 6: dvLoadDetail(p.id) */
  } else {
    dvLoadList();
  }
});
```

- [ ] **Step 3: 문법 검증**

Run: `php -l page/support/_board.php`
Expected: `No syntax errors detected`

- [ ] **Step 4: 브라우저 확인 — 목록/빈상태**

`http://localhost:8000/page/support/notice.php` → 검색폼 + 게시판 테이블(또는 DB 비었으면 "등록된 게시글이 없습니다"). 네트워크 탭에서 `notice_api.php?board=notice&action=list&page=1` 200.

- [ ] **Step 5: 브라우저 확인 — 검색**

검색창에 임의어 입력 후 검색 → URL에 `?q=...&page=1`, 호출이 `action=search` 로 바뀜. 결과 없으면 "검색 결과가 없습니다." 표시.

- [ ] **Step 6: 커밋**

```bash
git add page/support/_board.php
git commit -m "feat: notice board list with search, date filter, pagination"
```

---

### Task 6: 상세 모드 (`?id=`)

**Files:**

- Modify: `page/support/_board.php` (상세 JS 추가 + Task 5 Step 2의 분기 활성화)

**Interfaces:**

- Consumes: `window.BOARD`, `notice_api.php?action=detail&id=<id>`. 응답 = `NotifyEntity`.
- Produces: JS 함수 `dvLoadDetail(id)`, `dvRenderDetail(entity)`.

- [ ] **Step 1: 상세 JS 추가**

`_board.php` `<script>` 안 `dvGoPage` 함수 아래에 삽입:

```javascript
function dvLoadDetail(id) {
  $("#dvBoardList").hide();
  $("#dvBoardDetail").show().html('<div class="dv_empty">불러오는 중...</div>');
  $.getJSON(
    BOARD.api + "?" + dvQS({ board: BOARD.key, action: "detail", id: id })
  )
    .done(function (entity) {
      dvRenderDetail(entity);
    })
    .fail(function (xhr) {
      var msg =
        xhr.status === 404
          ? "존재하지 않는 게시글입니다."
          : "게시글을 불러오지 못했습니다.";
      $("#dvBoardDetail").html(
        '<div class="dv_empty">' + msg + "</div>" + dvBackBtn()
      );
    });
}

function dvBackBtn() {
  return (
    '<div class="dv_back"><a href="' +
    location.pathname +
    '">목록으로</a></div>'
  );
}

// content 가 HTML 태그를 포함하면 그대로, 평문이면 줄바꿈 보존
function dvRenderContent(content) {
  var s = content || "";
  if (/<[a-z][\s\S]*>/i.test(s)) return s; // HTML (관리자 작성 신뢰 소스)
  return "<p>" + dvEsc(s).replace(/\n/g, "<br>") + "</p>";
}

function dvRenderFiles(attachmentFiles) {
  var arr = [];
  try {
    arr = JSON.parse(attachmentFiles || "[]");
  } catch (e) {
    arr = [];
  }
  if (!Array.isArray(arr) || !arr.length) return "";
  var links = arr
    .map(function (f) {
      var url = typeof f === "string" ? f : f.url || f.path || "";
      var name =
        typeof f === "string"
          ? f.split("/").pop()
          : f.name || url.split("/").pop() || "첨부파일";
      if (!url) return "";
      return (
        '<a href="' +
        dvEsc(url) +
        '" target="_blank" rel="noopener">📎 ' +
        dvEsc(name) +
        "</a>"
      );
    })
    .join("");
  return links
    ? '<div class="dv_files"><strong>첨부파일</strong><br>' + links + "</div>"
    : "";
}

function dvRenderDetail(it) {
  if (!it || !it.id) {
    $("#dvBoardDetail").html(
      '<div class="dv_empty">존재하지 않는 게시글입니다.</div>' + dvBackBtn()
    );
    return;
  }
  var thumb = it.thumbnailImage
    ? '<img src="' +
      dvEsc(it.thumbnailImage) +
      '" alt="" style="max-width:100%;border-radius:12px;margin-bottom:24px;">'
    : "";
  var html =
    '<article class="dv_detail" data-aos="fade-up">' +
    "<h3>" +
    dvEsc(it.title) +
    "</h3>" +
    '<div class="dv_detail_meta">' +
    "<span>작성자 " +
    dvEsc((it.writer && it.writer.name) || "디알밸류") +
    "</span>" +
    "<span>" +
    dvDate(it.startDate || it.createdAt) +
    "</span>" +
    "</div>" +
    thumb +
    '<div class="dv_detail_body">' +
    dvRenderContent(it.content) +
    "</div>" +
    dvRenderFiles(it.attachmentFiles) +
    "</article>" +
    dvBackBtn();
  document.title = (it.title || BOARD.title) + " | 디알밸류";
  $("#dvBoardDetail").html(html);
}
```

- [ ] **Step 2: 초기 분기 활성화**

Task 5 Step 2 의 `if(p.id){ /* Task 6: dvLoadDetail(p.id) */ }` 를 다음으로 교체:

```javascript
if (p.id) {
  $("#dvBoardList").hide();
  dvLoadDetail(p.id);
}
```

- [ ] **Step 3: 문법 검증**

Run: `php -l page/support/_board.php`
Expected: `No syntax errors detected`

- [ ] **Step 4: 브라우저 확인 — 잘못된 id (404)**

`http://localhost:8000/page/support/notice.php?id=nonexistent999` → "존재하지 않는 게시글입니다." + 목록으로 버튼. 네트워크 `action=detail` 호출 404.

- [ ] **Step 5: 브라우저 확인 — 정상 상세 (데이터 있을 때)**

목록에 글이 있으면 제목 클릭 → `?id=` 상세 화면(제목/작성자/날짜/본문/첨부). 뒤로가기/목록으로 동작. (작성 시점 DB 비어있으면 이 단계는 데이터 입력 후 재확인.)

- [ ] **커밋은 금지: 사용자가 검토 후 직접 커밋**

---

## Self-Review (작성자 점검 완료)

**스펙 커버리지:**

- 메뉴 복원(공지+보도) → Task 3 ✅
- 프록시(3액션/화이트리스트/type·showYn강제/토큰비노출) → Task 2 ✅
- 목록+검색+기간+페이지번호 → Task 5 ✅
- 상세(?id=, content HTML, attachmentFiles JSON파싱, thumbnail, 404) → Task 6 ✅
- 타입정의(JSDoc) → Task 5 Step 1 ✅
- 자격증명 git 제외 → Task 1 ✅
- 공통 파셜 + 두 진입점(NOTICE/NEWSROOM) → Task 4 ✅
- 빈상태/무결과/오류 → Task 5·6 ✅

**미해결(구현 중 라이브 확정):** `showYn` 공개값(`Y` 가정), `content` HTML여부, 날짜 필드(startDate→createdAt fallback) — 모두 코드에 방어적 처리 + DB 데이터 생기면 재확인.

**타입 일관성:** `window.BOARD`(key/api/pageSize/title), `dvGetParams`, `dvLoadList`/`dvLoadDetail`/`dvRenderList`/`dvRenderDetail` 함수명 태스크 간 일치 확인.
