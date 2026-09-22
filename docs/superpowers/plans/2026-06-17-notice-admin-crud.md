# 공지/보도자료 관리자 CRUD 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
> **커밋 금지:** 사용자가 검토 후 직접 커밋. 각 태스크는 파일 작성 + 검증까지만. git add/commit 실행하지 말 것.

**Goal:** 기존 공지/보도자료 게시판에 관리자 전용 글 생성·수정·삭제와 자료형 정합(showYn boolean 등)을 추가한다.

**Architecture:** `notice_api.php` 프록시를 확장해 세션 기반 관리자 인증(루트 로그인 검증) + CSRF + create/update/delete 액션을 추가. 공개 `_board.php`에 세션 상태로 토글되는 관리 UI(로그인 모달, 글작성/수정/삭제 버튼, 삭제 확인) 내장. 글작성/수정은 공용 폼 `notify_form.php`.

**Tech Stack:** PHP 8.x(session, curl), jQuery 3.6, AOS, Pretendard. 자동 테스트 없음 → 검증은 curl(쿠키 jar로 세션 유지) + 로컬 PHP 서버 브라우저 확인.

## Global Constraints

- API 베이스 `https://api.growchat.co.kr/api/serv/`. 루트 로그인 `auth/v1/login/root/basic`(test/test1234, HTTP 201). 쓰기 `baseinfo/v1/default-notify/{create,update}`(POST), `delete/{id}`(DELETE).
- 업스트림은 항상 HTTP 200/201 + 본문 `status` 필드로 실제 상태 전달 → **봉투 status로 판정**.
- 보안 불변식: 토큰·자격증명 서버에만. 쓰기(create/update/delete/logout)는 **세션(`$_SESSION['notify_admin']`) + CSRF(`X-CSRF-Token`)** 없으면 거부. type은 `NOTICE|NEWSROOM`만.
- 자료형: `showYn`/`isPinned` = JSON boolean. 읽기 필터 `showYn`도 `true`. `attachmentFiles` 요청=빈배열 `[]`. dates = ISO8601(`YYYY-MM-DDT00:00:00.000Z` / 종료일 `T23:59:59.000Z`).
- 디자인 결: 포인트색 `#d00000`/`#f26f21`/`#191f28`, Pretendard, 기존 모달 스타일 재사용.
- 검증 로컬 서버: 저장소 루트 `php -S localhost:8000` (이미 실행 중일 수 있음).
- 페이지 크기 `PAGE_SIZE=10`.

---

### Task 1: 프록시 확장 — 세션 인증 + CRUD (`notice_api.php` 전체 교체)

**Files:**

- Modify(전체 교체): `page/support/notice_api.php`

**Interfaces:**

- Consumes: `notice_config.php` (`api_base,root_id,root_pw,page_size`).
- Produces 엔드포인트:

  - `GET ?board=&action=list|search|detail&...` (기존, showYn 필터 `true`)
  - `GET ?action=session` → `{admin:bool, csrf:string}`
  - `POST ?action=login` body `{userId,password}` → `{ok:true,csrf}` | 401
  - `POST ?action=logout` (세션+CSRF) → `{ok:true}`
  - `POST ?action=create` (세션+CSRF) body `{type,title,content,showYn,isPinned,startDate,endDate}` → `{ok:true,id}`
  - `POST ?action=update` (세션+CSRF) body 위 + `{id}` → `{ok:true,id}`
  - `POST ?action=delete` (세션+CSRF) body `{id}` → `{ok:true}`

- [ ] **Step 1: `notice_api.php` 전체를 아래로 교체**

```php
<?php
// 고객센터 게시판 프록시 — 조회(공개) + 관리자 CRUD(세션+CSRF 게이트).
// 보안: 토큰·자격증명 미노출, board/type 화이트리스트, 쓰기는 세션+CSRF 필수.
ini_set('display_errors', '0');
ini_set('log_errors', '1');
error_reporting(E_ALL);
session_start();
header('Content-Type: application/json; charset=utf-8');

$cfg = require __DIR__ . '/notice_config.php';

$action = $_GET['action'] ?? '';
$method = $_SERVER['REQUEST_METHOD'];
$TYPES  = ['NOTICE', 'NEWSROOM'];
$BOARD_TYPE = ['notice' => 'NOTICE', 'press' => 'NEWSROOM'];

// ---------- 공통 헬퍼 ----------
function notify_token_path() {
    return sys_get_temp_dir() . '/drvalue_notify_token_cache.json';
}
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
    return [$code, $res ? json_decode($res, true) : null];
}
// 업스트림은 항상 HTTP 200/201 + 본문 status 로 실제 결과 전달.
function notify_status($transport, $json) {
    return isset($json['status']) ? (int)$json['status'] : (int)$transport;
}
function notify_login($cfg) {
    [$code, $json] = notify_curl(
        rtrim($cfg['api_base'], '/') . '/auth/v1/login/root/basic',
        'POST', ['userId' => $cfg['root_id'], 'password' => $cfg['root_pw']]
    );
    $token = $json['data']['accessToken'] ?? null;
    if ($token && notify_status($code, $json) >= 200 && notify_status($code, $json) < 300) {
        $p = notify_token_path();
        @file_put_contents($p, json_encode(['token' => $token]));
        @chmod($p, 0600);
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
function notify_body() {
    $j = json_decode(file_get_contents('php://input'), true);
    return is_array($j) ? $j : [];
}
function notify_fail($status, $msg) {
    http_response_code($status);
    echo json_encode(['error' => $msg]);
    exit;
}
function notify_require_admin() {
    if (empty($_SESSION['notify_admin'])) notify_fail(401, 'unauthorized');
}
function notify_check_csrf() {
    $t = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
    if (empty($_SESSION['csrf']) || !hash_equals($_SESSION['csrf'], $t)) notify_fail(403, 'csrf');
}
// 날짜 정규화: 빈값→null, YYYY-MM-DD→ISO, 이미 ISO면 그대로.
function notify_iso($d, $isEnd) {
    $d = trim((string)$d);
    if ($d === '') return null;
    if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $d)) return $d . ($isEnd ? 'T23:59:59.000Z' : 'T00:00:00.000Z');
    if (preg_match('/^\d{4}-\d{2}-\d{2}T/', $d)) return $d;
    return null;
}
// 토큰 확보 후 호출, 401(봉투) 시 1회 재로그인.
function notify_call($cfg, $url, $method, $body) {
    $token = notify_cached_token() ?: notify_login($cfg);
    if (!$token) notify_fail(502, 'auth failed');
    [$code, $json] = notify_curl($url, $method, $body, $token);
    if (notify_status($code, $json) === 401) {
        $token = notify_login($cfg);
        if ($token) [$code, $json] = notify_curl($url, $method, $body, $token);
    }
    return [notify_status($code, $json), $json];
}

// ---------- 세션/인증 액션 ----------
if ($action === 'session') {
    $admin = !empty($_SESSION['notify_admin']);
    echo json_encode(['admin' => $admin, 'csrf' => $admin ? ($_SESSION['csrf'] ?? '') : '']);
    exit;
}
if ($action === 'login') {
    if ($method !== 'POST') notify_fail(405, 'method not allowed');
    $b = notify_body();
    [$code, $json] = notify_curl(
        rtrim($cfg['api_base'], '/') . '/auth/v1/login/root/basic',
        'POST', ['userId' => $b['userId'] ?? '', 'password' => $b['password'] ?? '']
    );
    $token = $json['data']['accessToken'] ?? null;
    $st = notify_status($code, $json);
    if ($token && $st >= 200 && $st < 300) {
        session_regenerate_id(true);
        $_SESSION['notify_admin'] = true;
        $_SESSION['csrf'] = bin2hex(random_bytes(32));
        $p = notify_token_path();
        @file_put_contents($p, json_encode(['token' => $token]));
        @chmod($p, 0600);
        echo json_encode(['ok' => true, 'csrf' => $_SESSION['csrf']]);
        exit;
    }
    notify_fail(401, 'login failed');
}
if ($action === 'logout') {
    if ($method !== 'POST') notify_fail(405, 'method not allowed');
    notify_require_admin();
    notify_check_csrf();
    $_SESSION = [];
    session_destroy();
    echo json_encode(['ok' => true]);
    exit;
}

// ---------- 조회(공개) ----------
if (in_array($action, ['list', 'search', 'detail'], true)) {
    if ($method !== 'GET') notify_fail(405, 'method not allowed');
    $board = $_GET['board'] ?? '';
    if (!isset($BOARD_TYPE[$board])) notify_fail(400, 'invalid board');
    $type = $BOARD_TYPE[$board];
    $base = rtrim($cfg['api_base'], '/') . '/baseinfo/v1/default-notify';

    if ($action === 'detail') {
        $id = $_GET['id'] ?? '';
        if (!preg_match('/^[A-Za-z0-9_-]+$/', $id)) notify_fail(400, 'invalid id');
        $url = $base . '/one/' . rawurlencode($id);
    } else {
        $page = max(1, (int)($_GET['page'] ?? 1));
        $take = (int)$cfg['page_size'];
        $params = [
            'take'   => $take,
            'skip'   => ($page - 1) * $take,
            'type'   => $type,    // 서버 강제
            'showYn' => 'true',   // 공개분만 (boolean true). 서버 강제
        ];
        if (!empty($_GET['q'])) $params['q'] = $_GET['q'];
        foreach (['startDate', 'endDate'] as $k) {
            if (!empty($_GET[$k]) && preg_match('/^\d{4}-\d{2}-\d{2}$/', $_GET[$k])) $params[$k] = $_GET[$k];
        }
        $url = $base . ($action === 'search' ? '/search' : '/many') . '?' . http_build_query($params);
    }
    [$st, $json] = notify_call($cfg, $url, 'GET', null);
    if ($st >= 200 && $st < 300 && isset($json['data'])) { echo json_encode($json['data']); exit; }
    if ($st === 404) notify_fail(404, 'not found');
    notify_fail(502, 'upstream error');
}

// ---------- 쓰기(관리자) ----------
if (in_array($action, ['create', 'update', 'delete'], true)) {
    if ($method !== 'POST') notify_fail(405, 'method not allowed');
    notify_require_admin();
    notify_check_csrf();
    $base = rtrim($cfg['api_base'], '/') . '/baseinfo/v1/default-notify';
    $b = notify_body();

    if ($action === 'delete') {
        $id = $b['id'] ?? '';
        if (!preg_match('/^[A-Za-z0-9_-]+$/', $id)) notify_fail(400, 'invalid id');
        [$st, $json] = notify_call($cfg, $base . '/delete/' . rawurlencode($id), 'DELETE', null);
        if ($st >= 200 && $st < 300) { echo json_encode(['ok' => true]); exit; }
        if ($st === 404) notify_fail(404, 'not found');
        notify_fail(502, 'upstream error');
    }

    // create / update 공통 검증
    $type = $b['type'] ?? '';
    if (!in_array($type, $TYPES, true)) notify_fail(400, 'invalid type');
    $title   = trim((string)($b['title'] ?? ''));
    $content = trim((string)($b['content'] ?? ''));
    if ($title === '' || $content === '') notify_fail(400, 'title/content required');

    $payload = [
        'type'            => $type,
        'title'           => $title,
        'content'         => $content,
        'thumbnailImage'  => '',
        'attachmentFiles' => [],
        'showYn'          => !empty($b['showYn']),
        'isPinned'        => !empty($b['isPinned']),
    ];
    $sd = notify_iso($b['startDate'] ?? '', false);
    $ed = notify_iso($b['endDate'] ?? '', true);
    if ($sd !== null) $payload['startDate'] = $sd;
    if ($ed !== null) $payload['endDate'] = $ed;

    if ($action === 'update') {
        $id = $b['id'] ?? '';
        if (!preg_match('/^[A-Za-z0-9_-]+$/', $id)) notify_fail(400, 'invalid id');
        $payload['id'] = $id;
        $url = $base . '/update';
    } else {
        $url = $base . '/create';
    }
    [$st, $json] = notify_call($cfg, $url, 'POST', $payload);
    if ($st >= 200 && $st < 300) {
        echo json_encode(['ok' => true, 'id' => $json['data']['id'] ?? ($payload['id'] ?? null)]);
        exit;
    }
    notify_fail(502, 'upstream error');
}

notify_fail(400, 'invalid action');
```

- [ ] **Step 2: 문법 + 조회 회귀 검증**

Run (repo root):

```
php -l page/support/notice_api.php
curl -s "http://localhost:8000/page/support/notice_api.php?board=notice&action=list&page=1"
curl -s "http://localhost:8000/page/support/notice_api.php?action=session"
```

Expected: `No syntax errors`; list `{"data":[...],"total":...}`; session `{"admin":false,"csrf":""}`.

- [ ] **Step 3: 쓰기 게이트 검증 (세션 없이 거부)**

Run:

```
curl -s -o /dev/null -w "%{http_code}\n" -X POST "http://localhost:8000/page/support/notice_api.php?action=create" -H "Content-Type: application/json" -d '{"type":"NOTICE","title":"x","content":"y"}'
```

Expected: `401` (세션 없음 → unauthorized)

- [ ] **Step 4: 로그인 → 세션 → create 전체 흐름 (쿠키 jar)**

Run:

```
CJ=/tmp/dv_admin_cj; rm -f $CJ
CSRF=$(curl -s -c $CJ -X POST "http://localhost:8000/page/support/notice_api.php?action=login" -H "Content-Type: application/json" -d '{"userId":"test","password":"test1234"}' | php -r 'echo json_decode(file_get_contents("php://stdin"),true)["csrf"]??"";')
echo "csrf len: ${#CSRF}"
curl -s -b $CJ "http://localhost:8000/page/support/notice_api.php?action=session"; echo
curl -s -b $CJ -X POST "http://localhost:8000/page/support/notice_api.php?action=create" -H "Content-Type: application/json" -H "X-CSRF-Token: $CSRF" -d '{"type":"NOTICE","title":"테스트 공지","content":"<p>본문</p>","showYn":true,"isPinned":false,"startDate":"2026-06-17","endDate":"2026-06-30"}'; echo
```

Expected: csrf 길이 64; session `{"admin":true,...}`; create `{"ok":true,"id":"<uuid>"}`.

- [ ] **Step 5: 생성 글이 조회에 노출되는지 (showYn=true 필터 실검증)**

Run:

```
curl -s "http://localhost:8000/page/support/notice_api.php?board=notice&action=list&page=1"
```

Expected: `total >= 1`, data 배열에 방금 만든 "테스트 공지" 포함. (만약 비면 showYn 필터값 재검토 — 백엔드 확인.)

- [ ] **Step 6: CSRF 누락 거부 + delete 흐름**

Run:

```
ID=$(curl -s "http://localhost:8000/page/support/notice_api.php?board=notice&action=list&page=1" | php -r '$d=json_decode(file_get_contents("php://stdin"),true);echo $d["data"][0]["id"]??"";')
echo "id: $ID"
curl -s -o /dev/null -w "no-csrf=%{http_code}\n" -b $CJ -X POST "http://localhost:8000/page/support/notice_api.php?action=delete" -H "Content-Type: application/json" -d "{\"id\":\"$ID\"}"
curl -s -b $CJ -X POST "http://localhost:8000/page/support/notice_api.php?action=delete" -H "Content-Type: application/json" -H "X-CSRF-Token: $CSRF" -d "{\"id\":\"$ID\"}"; echo
```

Expected: `no-csrf=403`; delete `{"ok":true}`.

- [ ] **Step 7: 커밋 — 생략** (검토 후 사용자 직접)

---

### Task 2: 글작성/수정 폼 (`notify_form.php` 신규)

**Files:**

- Create: `page/support/notify_form.php`

**Interfaces:**

- Consumes: `notice_api.php` (`session`, `detail`, `create`, `update`).
- Produces: `notify_form.php?board=notice|press` (신규), `notify_form.php?id=<id>` (수정).

- [ ] **Step 1: `notify_form.php` 작성**

```php
<?php
// 글작성/수정 폼 (관리자 전용). 신규 ?board=notice|press, 수정 ?id=<id>.
$board = $_GET['board'] ?? 'notice';
if (!in_array($board, ['notice', 'press'], true)) $board = 'notice';
include_once($_SERVER['DOCUMENT_ROOT'] . '/header.php');
$default_type = $board === 'press' ? 'NEWSROOM' : 'NOTICE';
?>
<style>
    #dv_form { margin-top: 80px; color:#191f28; font-family:'Pretendard',sans-serif; }
    #dv_form .t_inner { max-width: 860px; margin:0 auto; padding: 80px 20px 120px; }
    #dv_form h2 { font-size:30px; font-weight:800; margin:0 0 32px; }
    .dv_field { margin-bottom: 22px; }
    .dv_field label { display:block; font-size:14px; font-weight:700; color:#4e5968; margin-bottom:8px; }
    .dv_field input[type=text], .dv_field textarea, .dv_field select, .dv_field input[type=date] {
        width:100%; border:1px solid #e5e8eb; border-radius:12px; padding:13px 14px; font-size:15px;
        background:#fff; font-family:'Pretendard'; box-sizing:border-box;
    }
    .dv_field textarea { min-height: 280px; resize: vertical; }
    .dv_row { display:flex; gap:16px; flex-wrap:wrap; }
    .dv_row .dv_field { flex:1; min-width:200px; }
    .dv_checks { display:flex; gap:24px; align-items:center; }
    .dv_checks label { display:flex; gap:8px; align-items:center; font-weight:600; cursor:pointer; }
    .dv_actions { display:flex; gap:12px; margin-top:34px; }
    .dv_actions button { height:50px; padding:0 30px; border:none; border-radius:12px; font-weight:700; font-size:16px; cursor:pointer; font-family:'Pretendard'; }
    .dv_save { background:#d00000; color:#fff; }
    .dv_cancel { background:#e5e8eb; color:#4e5968; }
    .dv_err { color:#d00000; font-size:14px; margin-top:14px; min-height:18px; }
</style>

<div id="dv_form">
    <div class="t_inner">
        <h2 id="dvFormTitle">글 작성</h2>
        <form id="dvNotifyForm" onsubmit="return false;">
            <input type="hidden" id="dvId" value="">
            <div class="dv_field">
                <label>유형</label>
                <select id="dvType">
                    <option value="NOTICE">공지사항</option>
                    <option value="NEWSROOM">보도자료</option>
                </select>
            </div>
            <div class="dv_field">
                <label>제목</label>
                <input type="text" id="dvTitle" placeholder="제목을 입력하세요">
            </div>
            <div class="dv_field">
                <label>내용</label>
                <textarea id="dvContent" placeholder="내용을 입력하세요"></textarea>
            </div>
            <div class="dv_row">
                <div class="dv_field"><label>시작일</label><input type="date" id="dvStart"></div>
                <div class="dv_field"><label>종료일</label><input type="date" id="dvEnd"></div>
            </div>
            <div class="dv_field">
                <div class="dv_checks">
                    <label><input type="checkbox" id="dvShow" checked> 공개</label>
                    <label><input type="checkbox" id="dvPin"> 상단 고정</label>
                </div>
            </div>
            <div class="dv_actions">
                <button type="button" class="dv_save" id="dvSave">저장</button>
                <button type="button" class="dv_cancel" onclick="history.back()">취소</button>
            </div>
            <div class="dv_err" id="dvFormErr"></div>
        </form>
    </div>
</div>

<script>
window.FORM = {
    api: '/page/support/notice_api.php',
    board: '<?php echo $board; ?>',
    defaultType: '<?php echo $default_type; ?>',
    id: new URLSearchParams(location.search).get('id') || ''
};
var FORM_CSRF = '';

function dvBoardPath(type){ return type === 'NEWSROOM' ? '/page/support/press.php' : '/page/support/notice.php'; }
function dvIsoDate(s){ return s ? s.slice(0,10) : ''; }

function dvFillForm(it){
    $('#dvId').val(it.id || '');
    $('#dvType').val(it.type || FORM.defaultType);
    $('#dvTitle').val(it.title || '');
    $('#dvContent').val(it.content || '');
    $('#dvStart').val(dvIsoDate(it.startDate));
    $('#dvEnd').val(dvIsoDate(it.endDate));
    $('#dvShow').prop('checked', it.showYn !== false);
    $('#dvPin').prop('checked', !!it.isPinned);
}

function dvSubmit(){
    var id = $('#dvId').val();
    var type = $('#dvType').val();
    var title = $('#dvTitle').val().trim();
    var content = $('#dvContent').val().trim();
    if(!title || !content){ $('#dvFormErr').text('제목과 내용을 입력하세요.'); return; }
    var body = {
        type: type, title: title, content: content,
        showYn: $('#dvShow').is(':checked'), isPinned: $('#dvPin').is(':checked'),
        startDate: $('#dvStart').val(), endDate: $('#dvEnd').val()
    };
    var action = id ? 'update' : 'create';
    if(id) body.id = id;
    $('#dvSave').prop('disabled', true).text('저장 중...');
    $.ajax({ url: FORM.api + '?action=' + action, method:'POST', contentType:'application/json',
             headers:{'X-CSRF-Token': FORM_CSRF}, data: JSON.stringify(body) })
     .done(function(res){
        if(id){ location.href = dvBoardPath(type) + '?id=' + encodeURIComponent(id); }   // 수정 → 상세
        else  { location.href = dvBoardPath(type); }                                       // 신규 → 선택 type board 목록
     })
     .fail(function(xhr){
        if(xhr.status === 401){ alert('로그인이 필요합니다.'); location.href = dvBoardPath(FORM.defaultType); return; }
        $('#dvFormErr').text('저장에 실패했습니다. (' + xhr.status + ')');
        $('#dvSave').prop('disabled', false).text('저장');
     });
}

$(function(){
    // 관리자 세션 확인 — 아니면 board로 돌려보냄
    $.getJSON(FORM.api + '?action=session').done(function(s){
        if(!s || !s.admin){ alert('관리자만 접근할 수 있습니다.'); location.href = dvBoardPath(FORM.defaultType); return; }
        FORM_CSRF = s.csrf || '';
        if(FORM.id){
            $('#dvFormTitle').text('글 수정');
            $.getJSON(FORM.api + '?board=' + FORM.board + '&action=detail&id=' + encodeURIComponent(FORM.id))
             .done(function(it){ dvFillForm(it); })
             .fail(function(){ $('#dvFormErr').text('글을 불러오지 못했습니다.'); });
        } else {
            $('#dvType').val(FORM.defaultType);
        }
        $('#dvSave').on('click', dvSubmit);
    }).fail(function(){ location.href = dvBoardPath(FORM.defaultType); });
});
</script>

<?php include_once($_SERVER['DOCUMENT_ROOT'] . '/footer.php'); ?>
```

- [ ] **Step 2: 문법 + 미인증 접근 동작 검증**

Run:

```
php -l page/support/notify_form.php
curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:8000/page/support/notify_form.php?board=notice"
```

Expected: `No syntax errors`; 페이지 자체는 `200`(HTML 로드, 세션검사는 클라 JS가 수행해 미인증 시 board로 리다이렉트).

- [ ] **Step 3: 브라우저 확인 — 미인증/인증**

미로그인 상태로 `http://localhost:8000/page/support/notify_form.php?board=press` 접속 → "관리자만 접근할 수 있습니다" → press.php로 이동. (로그인 후 동작은 Task 3 통합 검증에서.)

- [ ] **Step 4: 커밋 — 생략**

---

### Task 3: 공개 페이지 관리 UI (`_board.php` 전체 교체)

**Files:**

- Modify(전체 교체): `page/support/_board.php`

**Interfaces:**

- Consumes: `notice_api.php` (`session`,`login`,`logout`,`list`,`search`,`detail`,`delete`), `notify_form.php`.
- Produces: 세션 상태로 토글되는 관리 UI(로그인 모달/버튼, 글작성/수정/삭제).

- [ ] **Step 1: `_board.php` 전체를 아래로 교체**

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

    .dv_search { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; justify-content: center; margin-bottom: 36px; }
    .dv_search input { height: 46px; border: 1px solid #e5e8eb; border-radius: 12px; padding: 0 14px; font-size: 15px; background:#fff; font-family:'Pretendard'; }
    .dv_search input[name=q] { width: 280px; max-width: 60vw; }
    .dv_search .dv_btn { height: 46px; padding: 0 22px; border: none; border-radius: 12px; font-weight: 700; cursor: pointer; font-family:'Pretendard'; font-size:15px; }
    .dv_btn_search { background: #d00000; color: #fff; }
    .dv_btn_reset { background: #e5e8eb; color: #4e5968; }

    .dv_toolbar { display:flex; justify-content:flex-end; margin-bottom:14px; }
    .dv_btn_write { height:44px; padding:0 22px; border:none; border-radius:12px; background:#191f28; color:#fff; font-weight:700; cursor:pointer; font-family:'Pretendard'; font-size:15px; }

    .dv_tbl { width: 100%; border-collapse: collapse; background:#fff; border-radius:16px; overflow:hidden; box-shadow:0 6px 24px rgba(0,0,0,.05); }
    .dv_tbl th, .dv_tbl td { padding: 16px 18px; border-bottom: 1px solid #eef0f3; font-size: 15px; }
    .dv_tbl th { background:#f9fafb; color:#4e5968; font-weight:700; text-align:left; }
    .dv_tbl td.c, .dv_tbl th.c { text-align:center; white-space:nowrap; color:#8b95a1; }
    .dv_tbl tr.is-pinned td { background:#fff7f5; }
    .dv_pin { display:inline-block; background:#ffe7d9; color:#f26f21; font-size:12px; font-weight:700; padding:2px 8px; border-radius:6px; margin-right:8px; }
    .dv_tbl a.dv_title { color:#191f28; font-weight:600; text-decoration:none; }
    .dv_tbl a.dv_title:hover { color:#d00000; text-decoration:underline; }

    .dv_empty { text-align:center; padding:80px 0; color:#8b95a1; font-size:16px; }

    .dv_pager { display:flex; gap:6px; justify-content:center; margin-top:34px; }
    .dv_pager button { min-width:38px; height:38px; border:1px solid #e5e8eb; background:#fff; border-radius:10px; cursor:pointer; font-family:'Pretendard'; color:#4e5968; }
    .dv_pager button.on { background:#d00000; color:#fff; border-color:#d00000; font-weight:700; }
    .dv_pager button:disabled { opacity:.4; cursor:default; }

    .dv_detail { background:#fff; border-radius:16px; box-shadow:0 6px 24px rgba(0,0,0,.05); padding:48px 44px; }
    .dv_detail h3 { font-size:28px; font-weight:800; margin:0 0 16px; }
    .dv_detail_meta { display:flex; gap:18px; color:#8b95a1; font-size:14px; border-bottom:1px solid #eef0f3; padding-bottom:20px; margin-bottom:28px; }
    .dv_detail_body { font-size:16px; line-height:1.8; color:#333d4b; word-break:keep-all; }
    .dv_detail_body img { max-width:100%; height:auto; }
    .dv_admin_actions { display:flex; gap:10px; justify-content:flex-end; margin-top:28px; border-top:1px solid #eef0f3; padding-top:20px; }
    .dv_admin_actions button { height:42px; padding:0 20px; border:none; border-radius:10px; font-weight:700; cursor:pointer; font-family:'Pretendard'; }
    .dv_edit { background:#191f28; color:#fff; }
    .dv_del  { background:#d00000; color:#fff; }
    .dv_back { margin-top:34px; text-align:center; }
    .dv_back a { display:inline-block; padding:13px 30px; background:#191f28; color:#fff; border-radius:12px; text-decoration:none; font-weight:700; }

    .dv_authbar { text-align:center; margin-top:50px; }
    .dv_authbar button { height:42px; padding:0 22px; border:1px solid #e5e8eb; border-radius:10px; background:#fff; color:#8b95a1; font-weight:700; cursor:pointer; font-family:'Pretendard'; }

    /* 모달 */
    .dv_ov { display:none; position:fixed; inset:0; background:rgba(0,0,0,.6); z-index:99999; align-items:center; justify-content:center; }
    .dv_modal { background:#fff; width:90%; max-width:380px; border-radius:18px; padding:30px; box-sizing:border-box; }
    .dv_modal h3 { margin:0 0 20px; font-size:20px; font-weight:800; }
    .dv_modal input { width:100%; height:46px; border:1px solid #e5e8eb; border-radius:10px; padding:0 13px; margin-bottom:12px; box-sizing:border-box; font-family:'Pretendard'; font-size:15px; }
    .dv_modal .dv_mbtns { display:flex; gap:10px; margin-top:8px; }
    .dv_modal .dv_mbtns button { flex:1; height:46px; border:none; border-radius:10px; font-weight:700; cursor:pointer; font-family:'Pretendard'; font-size:15px; }
    .dv_mok { background:#d00000; color:#fff; } .dv_mno { background:#e5e8eb; color:#4e5968; }
    .dv_merr { color:#d00000; font-size:13px; min-height:16px; margin-bottom:6px; }

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
            <div class="dv_authbar" id="dvAuthBar"></div>
        </div>
    </section>
</div>

<!-- 로그인 모달 -->
<div class="dv_ov" id="dvLoginModal">
    <div class="dv_modal">
        <h3>관리자 로그인</h3>
        <div class="dv_merr" id="dvLoginErr"></div>
        <input type="text" id="dvLoginId" placeholder="아이디" autocomplete="username">
        <input type="password" id="dvLoginPw" placeholder="비밀번호" autocomplete="current-password">
        <div class="dv_mbtns">
            <button class="dv_mok" onclick="dvLogin()">로그인</button>
            <button class="dv_mno" onclick="dvCloseLogin()">취소</button>
        </div>
    </div>
</div>

<!-- 삭제 확인 모달 -->
<div class="dv_ov" id="dvDelModal">
    <div class="dv_modal">
        <h3>정말 삭제하시겠습니까?</h3>
        <div class="dv_mbtns">
            <button class="dv_mok" id="dvDelYes">예</button>
            <button class="dv_mno" onclick="dvCloseDel()">아니오</button>
        </div>
    </div>
</div>

<script src="https://unpkg.com/aos@next/dist/aos.js"></script>
<script>
window.BOARD = { key: '<?php echo $board; ?>', api: '/page/support/notice_api.php', pageSize: 10, title: <?php echo json_encode($page_title); ?> };
window.ADMIN = { on: false, csrf: '' };

/**
 * @typedef {Object} NotifyEntity
 * @property {string} id @property {('NOTICE'|'RESOURCE'|'NEWSROOM')} type
 * @property {string} title @property {string} content
 * @property {string} [thumbnailImage] @property {string} attachmentFiles
 * @property {boolean} showYn @property {boolean} isPinned
 * @property {string} [startDate] @property {string} [endDate]
 * @property {{name?:string}} [writer] @property {string} createdAt
 */

function dvEsc(s){ return $('<div>').text(s == null ? '' : String(s)).html(); }
function dvAttr(s){ return dvEsc(s).replace(/"/g, '&quot;').replace(/'/g, '&#39;'); }
function dvSafeUrl(u){ u = (u == null ? '' : String(u)); return /^\s*javascript:/i.test(u) ? '' : u; }
function dvDate(s){ if(!s) return '-'; return String(s).slice(0,10); }
function dvQS(params){ return Object.entries(params).filter(function(e){ return e[1]!=='' && e[1]!=null; }).map(function(e){ return e[0]+'='+encodeURIComponent(e[1]); }).join('&'); }

function dvGetParams(){
    var p = new URLSearchParams(location.search);
    return { id:p.get('id')||'', q:p.get('q')||'', startDate:p.get('startDate')||'', endDate:p.get('endDate')||'', page:parseInt(p.get('page')||'1',10) };
}

function dvLoadList(){
    var cur = dvGetParams();
    var hasSearch = cur.q || cur.startDate || cur.endDate;
    var action = hasSearch ? 'search' : 'list';
    var url = BOARD.api + '?' + dvQS({ board:BOARD.key, action:action, page:cur.page, q:cur.q, startDate:cur.startDate, endDate:cur.endDate });
    $('#dvBoardList').html('<div class="dv_empty">불러오는 중...</div>');
    $.getJSON(url).done(function(payload){
        dvRenderSearch(cur);
        dvRenderList(payload, cur, hasSearch);
    }).fail(function(){
        $('#dvBoardList').html('<div class="dv_empty">일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.</div>');
    });
}

function dvRenderSearch(cur){
    var html = ''
      + '<form id="dvSearchForm" class="dv_search">'
      + '  <input type="text" name="q" placeholder="제목 / 내용 검색" value="'+dvAttr(cur.q)+'">'
      + '  <input type="date" name="startDate" value="'+dvAttr(cur.startDate)+'">'
      + '  <input type="date" name="endDate" value="'+dvAttr(cur.endDate)+'">'
      + '  <button type="submit" class="dv_btn dv_btn_search">검색</button>'
      + '  <button type="button" class="dv_btn dv_btn_reset" onclick="location.href=location.pathname">초기화</button>'
      + '</form>';
    if(!$('#dvSearchForm').length){ $('#dvBoardList').before(html); }
    else { $('#dvSearchForm input[name=q]').val(cur.q); }
}

function dvRenderList(payload, cur, hasSearch){
    var items = (payload && payload.data) || [];
    var total = (payload && payload.total) || 0;
    var toolbar = ADMIN.on ? '<div class="dv_toolbar"><button type="button" class="dv_btn_write" onclick="dvGoWrite()">글 작성</button></div>' : '';
    if(!items.length){
        var msg = hasSearch ? '검색 결과가 없습니다.' : '등록된 게시글이 없습니다.';
        $('#dvBoardList').html(toolbar + '<div class="dv_empty">'+msg+'</div>');
        return;
    }
    var startNo = total - (cur.page - 1) * BOARD.pageSize;
    var realIdx = 0;
    var rows = items.map(function(it){
        var no = it.isPinned ? '-' : (startNo - realIdx++);
        var titleLink = location.pathname + '?id=' + encodeURIComponent(it.id);
        var pin = it.isPinned ? '<span class="dv_pin">고정</span>' : '';
        return '<tr class="'+(it.isPinned?'is-pinned':'')+'">'
          + '<td class="c">'+no+'</td>'
          + '<td>'+pin+'<a class="dv_title" href="'+titleLink+'">'+dvEsc(it.title)+'</a></td>'
          + '<td class="c hide-m">'+dvEsc((it.writer&&it.writer.name)||'디알밸류')+'</td>'
          + '<td class="c">'+dvDate(it.startDate||it.createdAt)+'</td>'
          + '</tr>';
    }).join('');
    $('#dvBoardList').html(
        toolbar
        + '<table class="dv_tbl"><thead><tr>'
        + '<th class="c" style="width:70px">번호</th><th>제목</th>'
        + '<th class="c hide-m" style="width:120px">작성자</th><th class="c" style="width:120px">작성일</th>'
        + '</tr></thead><tbody>'+rows+'</tbody></table>'
        + dvRenderPager(total, cur.page)
    );
}

function dvRenderPager(total, page){
    var totalPages = Math.max(1, Math.ceil(total / BOARD.pageSize));
    if(totalPages <= 1) return '';
    var block = 5, startP = Math.floor((page-1)/block)*block + 1, endP = Math.min(startP+block-1, totalPages);
    function btn(p, label, opt){ opt=opt||{};
        return '<button '+(opt.disabled?'disabled':'')+' class="'+(opt.on?'on':'')+'" onclick="dvGoPage('+p+')">'+(label||p)+'</button>'; }
    var h = '<div class="dv_pager">';
    h += btn(page-1, '‹', {disabled: page<=1});
    for(var p=startP; p<=endP; p++) h += btn(p, p, {on: p===page});
    h += btn(page+1, '›', {disabled: page>=totalPages});
    h += '</div>';
    return h;
}

function dvGoPage(p){
    var cur = dvGetParams();
    location.href = location.pathname + '?' + dvQS({ q:cur.q, startDate:cur.startDate, endDate:cur.endDate, page:p });
}
function dvGoWrite(){ location.href = '/page/support/notify_form.php?board=' + BOARD.key; }

function dvLoadDetail(id){
    $('#dvBoardList').hide();
    $('#dvBoardDetail').show().html('<div class="dv_empty">불러오는 중...</div>');
    $.getJSON(BOARD.api + '?' + dvQS({ board:BOARD.key, action:'detail', id:id }))
     .done(function(entity){ dvRenderDetail(entity); })
     .fail(function(xhr){
        var msg = xhr.status === 404 ? '존재하지 않는 게시글입니다.' : '게시글을 불러오지 못했습니다.';
        $('#dvBoardDetail').html('<div class="dv_empty">'+msg+'</div>' + dvBackBtn());
     });
}

function dvBackBtn(){ return '<div class="dv_back"><a href="'+location.pathname+'">목록으로</a></div>'; }

function dvRenderContent(content){
    var s = content || '';
    if(/<[a-z][\s\S]*>/i.test(s)) return s;
    return '<p>' + dvEsc(s).replace(/\n/g, '<br>') + '</p>';
}

function dvRenderFiles(attachmentFiles){
    var arr = [];
    try { arr = JSON.parse(attachmentFiles || '[]'); } catch(e){ arr = []; }
    if(!Array.isArray(arr) || !arr.length) return '';
    var links = arr.map(function(f){
        var url = dvSafeUrl((typeof f === 'string') ? f : (f.url || f.path || ''));
        var name = (typeof f === 'string') ? f.split('/').pop() : (f.name || (url.split('/').pop()) || '첨부파일');
        if(!url) return '';
        return '<a href="'+dvAttr(url)+'" target="_blank" rel="noopener" style="margin-right:10px;color:#d00000;">📎 '+dvEsc(name)+'</a>';
    }).join('');
    return links ? '<div style="margin-top:24px;border-top:1px solid #eef0f3;padding-top:18px;">'+links+'</div>' : '';
}

function dvRenderDetail(it){
    if(!it || !it.id){ $('#dvBoardDetail').html('<div class="dv_empty">존재하지 않는 게시글입니다.</div>'+dvBackBtn()); return; }
    var thumb = it.thumbnailImage ? '<img src="'+dvAttr(dvSafeUrl(it.thumbnailImage))+'" alt="" style="max-width:100%;border-radius:12px;margin-bottom:24px;">' : '';
    var admin = ADMIN.on
      ? '<div class="dv_admin_actions">'
        + '<button class="dv_edit" onclick="dvGoEdit(\''+dvAttr(it.id)+'\')">수정</button>'
        + '<button class="dv_del" onclick="dvAskDelete(\''+dvAttr(it.id)+'\',\''+dvAttr(it.type)+'\')">삭제</button>'
        + '</div>'
      : '';
    var html = '<article class="dv_detail" data-aos="fade-up">'
      + '<h3>'+dvEsc(it.title)+'</h3>'
      + '<div class="dv_detail_meta">'
      +   '<span>작성자 '+dvEsc((it.writer&&it.writer.name)||'디알밸류')+'</span>'
      +   '<span>'+dvDate(it.startDate||it.createdAt)+'</span>'
      + '</div>'
      + thumb
      + '<div class="dv_detail_body">'+dvRenderContent(it.content)+'</div>'
      + dvRenderFiles(it.attachmentFiles)
      + admin
      + '</article>'
      + dvBackBtn();
    document.title = ((it.title||BOARD.title)) + ' | 디알밸류';
    $('#dvBoardDetail').html(html);
}

function dvGoEdit(id){ location.href = '/page/support/notify_form.php?id=' + encodeURIComponent(id); }

// ----- 관리자 인증/세션 -----
function dvRenderAuthBar(){
    $('#dvAuthBar').html(ADMIN.on
        ? '<button onclick="dvLogout()">로그아웃</button>'
        : '<button onclick="dvOpenLogin()">관리자 로그인</button>');
}
function dvOpenLogin(){ $('#dvLoginErr').text(''); $('#dvLoginModal').css('display','flex'); $('#dvLoginId').focus(); }
function dvCloseLogin(){ $('#dvLoginModal').hide(); }
function dvLogin(){
    var id = $('#dvLoginId').val(), pw = $('#dvLoginPw').val();
    $.ajax({ url:BOARD.api+'?action=login', method:'POST', contentType:'application/json', data:JSON.stringify({userId:id,password:pw}) })
     .done(function(){ location.reload(); })
     .fail(function(){ $('#dvLoginErr').text('아이디 또는 비밀번호가 올바르지 않습니다.'); });
}
function dvLogout(){
    $.ajax({ url:BOARD.api+'?action=logout', method:'POST', headers:{'X-CSRF-Token':ADMIN.csrf} })
     .always(function(){ location.href = location.pathname; });
}

// ----- 삭제 확인 -----
function dvAskDelete(id, type){
    $('#dvDelModal').css('display','flex');
    $('#dvDelYes').off('click').on('click', function(){ dvDoDelete(id, type); });
}
function dvCloseDel(){ $('#dvDelModal').hide(); }
function dvDoDelete(id, type){
    $.ajax({ url:BOARD.api+'?action=delete', method:'POST', contentType:'application/json',
             headers:{'X-CSRF-Token':ADMIN.csrf}, data:JSON.stringify({id:id}) })
     .done(function(){ location.href = (type === 'NEWSROOM') ? '/page/support/press.php' : '/page/support/notice.php'; })
     .fail(function(xhr){ dvCloseDel(); alert(xhr.status === 401 ? '로그인이 필요합니다.' : '삭제에 실패했습니다.'); });
}

$(function(){
    AOS.init({ duration: 800, once: true });
    $(document).on('submit', '#dvSearchForm', function(e){
        e.preventDefault();
        var q = $(this).find('[name=q]').val().trim();
        var sd = $(this).find('[name=startDate]').val();
        var ed = $(this).find('[name=endDate]').val();
        location.href = location.pathname + '?' + dvQS({ q:q, startDate:sd, endDate:ed, page:1 });
    });
    // 세션 먼저 확인 후 렌더 (관리 버튼 토글)
    $.getJSON(BOARD.api + '?action=session').always(function(){}).done(function(s){
        ADMIN.on = !!(s && s.admin); ADMIN.csrf = (s && s.csrf) || '';
    }).always(function(){
        dvRenderAuthBar();
        var p = dvGetParams();
        if(p.id){ $('#dvBoardList').hide(); dvLoadDetail(p.id); }
        else { dvLoadList(); }
    });
});
</script>

<?php include_once($_SERVER['DOCUMENT_ROOT'] . '/footer.php'); ?>
```

- [ ] **Step 2: 문법 + 페이지 로드 검증**

Run:

```
php -l page/support/_board.php
curl -s "http://localhost:8000/page/support/notice.php" | grep -c "dvAuthBar\|dvLoginModal\|dvDelModal\|action=session"
```

Expected: `No syntax errors`; grep ≥ 4.

- [ ] **Step 3: 브라우저 통합 검증 (전 흐름)**

`http://localhost:8000/page/support/notice.php`:

1. 비로그인: 하단 "관리자 로그인" 버튼만, 글작성/수정/삭제 버튼 없음.
2. 로그인 버튼 → 모달 → test/test1234 → 새로고침 → 하단 "로그아웃", 목록에 "글 작성" 버튼.
3. 글 작성 → 폼(유형 기본 공지사항) → 저장 → notice.php 목록에 노출.
4. 공지에서 글작성 → 유형 "보도자료" 선택 저장 → **press.php로 이동**.
5. 상세 진입 → "수정/삭제" 버튼. 수정 → 저장 → 그 글 상세로 복귀.
6. 삭제 → "정말 삭제하시겠습니까?" 예 → 해당 type board로 이동.

- [ ] **Step 4: 정리 — 테스트로 생성한 글 삭제 + 커밋 생략**

브라우저(또는 Task1 Step6 curl)로 테스트 생성 글 삭제. 커밋은 사용자 직접.

---

## Self-Review (작성자 점검)

**스펙 커버리지:**

- 인증(루트 로그인/세션/CSRF) → Task 1 ✅
- session/login/logout/create/update/delete 액션 → Task 1 ✅
- showYn boolean(읽기 `true`/쓰기 bool), isPinned bool, attachmentFiles `[]`, dates ISO → Task 1 ✅
- 관리 UI(로그인 버튼/모달, 글작성/수정/삭제, 삭제 확인 팝업) → Task 3 ✅
- 글작성/수정 폼, type 드롭다운, 진입 board별 기본값, 선택 type 기준 이동, 수정→상세 → Task 2 ✅
- 미인증 접근 차단(서버 게이트 + 폼 클라 리다이렉트) → Task 1·2 ✅

**미해결(라이브 확정):** showYn 필터값(`true` 가정 → Task1 Step5에서 실검증), thumbnailImage 미전송 허용 여부(create 응답으로 확인), update 성공 응답(`data:null`→봉투 status 판정).

**타입 일관성:** 액션명(session/login/logout/create/update/delete), `X-CSRF-Token` 헤더, `ADMIN.{on,csrf}`, `BOARD.{key,api,pageSize,title}`, `FORM_CSRF`, `dvBoardPath`/`dvGoWrite`/`dvGoEdit`/`dvAskDelete`/`dvDoDelete` 태스크 간 일치.
