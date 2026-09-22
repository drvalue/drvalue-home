#!/usr/bin/env bash
# notice_api.php 를 Nest 로 옮긴 것이 원본과 같게 동작하는지 본다.
#
# 진짜 게이트웨이는 사내망이라 로컬에서 못 부른다. 기다리면 이 코드는
# 배포 직전까지 한 번도 안 돌아 본 채로 남는다. 그래서 가짜 게이트웨이를
# 세우고, 거기에 **우리가 무엇을 보냈는지**까지 확인한다.
#
# 실행: bash scripts/verify-notify.sh
set -u
HERE="$(cd "$(dirname "$0")/.." && pwd)"
GW_PORT=${GW_PORT:-3901}
API_PORT=${API_PORT:-3902}
GW="http://127.0.0.1:$GW_PORT"
API="http://127.0.0.1:$API_PORT"
JAR=$(mktemp -d)/cookies

PASS=0; FAIL=0
check() { if [ "$2" = "$3" ]; then PASS=$((PASS+1)); printf '  PASS  %-42s %s\n' "$1" "$3"
          else FAIL=$((FAIL+1)); printf '  FAIL  %-42s 기대=%s 실제=%s\n' "$1" "$2" "$3"; fi }
pick() { python3 -c "import json,sys
try: d=json.load(sys.stdin)
except Exception: d=None
$1" 2>/dev/null; }
code() { curl -s -o /dev/null -w '%{http_code}' "$@" --max-time 20; }
log() { curl -s "$GW/_log" --max-time 20; }

# 빈 값을 0 으로 흘리면 안 된다. `kill 0` 은 프로세스 그룹 전체 —
# 이 스크립트 자신까지 죽인다(실제로 당했다).
cleanup() {
  for pid in "${GW_PID:-}" "${API_PID:-}" "${TLS_PID:-}"; do
    [ -n "$pid" ] && kill "$pid" 2>/dev/null
  done
  rm -rf "$(dirname "$JAR")" "$STATE"
}
trap cleanup EXIT

STATE=$(mktemp -d)
python3 "$HERE/scripts/notify-test/fake_gateway.py" "$GW_PORT" &
GW_PID=$!
for _ in $(seq 1 40); do [ "$(code "$GW/_log")" = "200" ] && break; sleep 0.25; done

# env -i 로 지워도 ConfigModule 은 api/.env 를 파일에서 읽는다.
# 거기 적힌 SESSION_SECURE=false 에 기대면, 운영 기본값(true)에서
# 세션 쿠키가 안 나가는 것을 이 검사가 영영 못 잡는다. 그래서 명시한다.
env -i PATH="$PATH" HOME="$HOME" \
  PORT="$API_PORT" \
  NOTIFY_API_BASE="$GW" \
  NOTIFY_ROOT_ID=svc NOTIFY_ROOT_PW=svc-pw \
  NOTIFY_IAM_BASE_URL="$GW" \
  NOTIFY_CALLBACK_URL="$API/page/support/notice_login_callback.php" \
  NOTIFY_TENANT_CODE=drvalue \
  NOTIFY_CHAT_RESOLVE_KEY=chat-secret-key \
  NOTIFY_STATE_DIR="$STATE" \
  SESSION_SECRET=verify-only \
  SESSION_SECURE=false \
  IAM_ENFORCE_GATEWAY=false \
  node "$HERE/dist/main.js" > "$STATE/nest.log" 2>&1 &
API_PID=$!
for _ in $(seq 1 60); do
  [ "$(code "$API/page/support/notice_api.php?action=session")" = "200" ] && break; sleep 0.5
done

echo "== 익명 =="
check "세션은 비어 있다" "false|" \
  "$(curl -s "$API/page/support/notice_api.php?action=session" --max-time 20 \
     | pick 'print(str(d.get("admin")).lower()+"|"+d.get("csrf",""))')"
check "없는 게시판은 거부" "400" "$(code "$API/page/support/notice_api.php?action=list&board=zzz")"
# 화면이 읽는 자리(data.data / data.total)까지 맞는지 본다. 모양이 틀리면
# 화면은 "등록된 게시글이 없습니다" 만 띄우고 아무 오류도 안 낸다.
check "목록 조회" "1|1" \
  "$(curl -s "$API/page/support/notice_api.php?action=list&board=notice" --max-time 20 \
     | pick 'print(str(len(d.get("data") or []))+"|"+str(d.get("total")))')"
# 봉투와 항목 키는 운영 API 를 실제로 불러 확인한 것이다.
check "봉투 모양이 운영과 같다" "data,skip,take,total" \
  "$(curl -s "$API/page/support/notice_api.php?action=list&board=notice" --max-time 20 \
     | pick 'print(",".join(sorted(d)))')"
check "항목 키가 운영과 같다" "attachmentFiles,content,createdAt,endDate,id,isPinned,showYn,startDate,thumbnailImage,title,type,updatedAt,writer" \
  "$(curl -s "$API/page/support/notice_api.php?action=list&board=notice" --max-time 20 \
     | pick 'print(",".join(sorted((d.get("data") or [{}])[0])))')"
# 목록 조건은 클라이언트가 아니라 서버가 정해야 한다. 요청을 직접 본다.
check "type/showYn 을 서버가 강제한다" "NOTICE|true" \
  "$(log | pick '
q=[x["query"] for x in d if x["path"].endswith("/many")][-1]
print(q.get("type","")+"|"+q.get("showYn",""))')"
check "board=press 는 NEWSROOM 으로 간다" "NEWSROOM" \
  "$(curl -s -o /dev/null "$API/page/support/notice_api.php?action=list&board=press" --max-time 20
     log | pick '
q=[x["query"] for x in d if x["path"].endswith("/many")][-1]
print(q.get("type",""))')"
check "공개 글 상세는 보인다" "200" \
  "$(code "$API/page/support/notice_api.php?action=detail&board=notice&id=open-1")"
check "비공개 글은 익명에게 404" "404" \
  "$(code "$API/page/support/notice_api.php?action=detail&board=notice&id=hidden-1")"
check "이상한 id 는 거부" "400" \
  "$(code "$API/page/support/notice_api.php?action=detail&board=notice&id=../etc")"
check "로그인 없이 쓰기 거부" "410" \
  "$(code -X POST "$API/page/support/notice_api.php?action=create" \
     -H 'Content-Type: application/json' -d '{"type":"NOTICE","title":"x","content":"y"}')"

echo "== 로그인 =="
check "로그인은 IAM 으로 보낸다" "302" \
  "$(code -c "$JAR" "$API/page/support/notice_api.php?action=login&return=/page/support/notice.php")"
check "바깥 주소로는 못 돌아온다" "/" \
  "$(curl -s -o /dev/null -c "$JAR" "$API/page/support/notice_api.php?action=login&return=https://evil.test" --max-time 20
     curl -s -o /dev/null -w '%{redirect_url}' -b "$JAR" -c "$JAR" \
       "$API/page/support/notice_login_callback.php?code=test-code" --max-time 20 \
     | sed 's#^http://[^/]*##' | cut -d'?' -f1)"

# 깨끗한 쿠키로 다시
rm -f "$JAR"
curl -s -o /dev/null -c "$JAR" "$API/page/support/notice_api.php?action=login&return=/page/support/notice.php" --max-time 20
check "콜백이 세션을 만든다" "true" \
  "$(curl -s -o /dev/null -b "$JAR" -c "$JAR" "$API/page/support/notice_login_callback.php?code=test-code" --max-time 20
     curl -s -b "$JAR" "$API/page/support/notice_api.php?action=session" --max-time 20 \
     | pick 'print(str(d.get("admin")).lower())')"
CSRF=$(curl -s -b "$JAR" "$API/page/support/notice_api.php?action=session" --max-time 20 | pick 'print(d.get("csrf",""))')
check "csrf 토큰을 준다" "64" "${#CSRF}"
check "by-root 에 테넌트 코드를 보낸다" "drvalue" \
  "$(log | pick '
r=[x for x in d if x["path"].endswith("/by-root")][-1]
print(r["tenant"])')"
check "채팅 쿠키(PHPSESSID)가 붙는다" "yes" \
  "$(grep -q 'PHPSESSID' "$JAR" && echo yes || echo no)"
check "채팅 쿠키에 토큰이 들어 있지 않다" "none" \
  "$(grep -c 'tenant-token-ccc' "$JAR" | sed 's/^0$/none/')"

echo "== 옛 게시판 쓰기는 닫혔다 =="
# 게시판이 CMS 로 옮겨간 뒤에도 이 경로가 살아 있으면, 성공 응답을 받으면서
# 사이트에는 안 나오는 글이 생긴다. 화면에서 폼만 감추는 것으로는 북마크·
# 직접 호출·사내 자동화를 못 막는다 — 경로 자체가 닫혔는지 여기서 본다.
for act in create update delete; do
  check "$act 는 410" "410" \
    "$(code -X POST -b "$JAR" "$API/page/support/notice_api.php?action=$act" \
       -H 'Content-Type: application/json' -H "X-CSRF-Token: $CSRF" \
       -d '{"id":"open-1","type":"NOTICE","title":"x","content":"y"}')"
done
check "업스트림으로 쓰기가 나가지 않는다" "0" \
  "$(log | pick 'print(len([x for x in d if x["path"].endswith(("/create","/update")) or "/delete/" in x["path"]]))')"
check "모르는 action 은 그대로 400" "400" \
  "$(code -X POST -b "$JAR" "$API/page/support/notice_api.php?action=nope" \
     -H 'Content-Type: application/json' -H "X-CSRF-Token: $CSRF" -d '{}')"

check "관리자는 비공개 글도 본다" "200" \
  "$(code -b "$JAR" "$API/page/support/notice_api.php?action=detail&board=notice&id=hidden-1")"

echo "== 채팅 연동 =="
SID=$(grep 'PHPSESSID' "$JAR" | awk '{print $7}')
check "공유 키 없으면 거부" "401" "$(code "$API/page/support/notice_api.php?action=chat_resolve&sid=$SID")"
check "이상한 sid 는 거부" "400" \
  "$(code -H 'X-Chat-Resolve-Key: chat-secret-key' \
     "$API/page/support/notice_api.php?action=chat_resolve&sid=zzz")"
check "sid 로 테넌트 토큰을 준다" "tenant-token-ccc" \
  "$(curl -s -H 'X-Chat-Resolve-Key: chat-secret-key' \
     "$API/page/support/notice_api.php?action=chat_resolve&sid=$SID" --max-time 20 \
     | pick 'print(d.get("accessToken",""))')"

echo "== 로그아웃 =="
check "csrf 없으면 로그아웃도 거부" "403" \
  "$(code -X POST -b "$JAR" "$API/page/support/notice_api.php?action=logout")"
check "로그아웃" "true" \
  "$(curl -s -X POST -b "$JAR" -c "$JAR" "$API/page/support/notice_api.php?action=logout" \
     -H "X-CSRF-Token: $CSRF" --max-time 20 | pick 'print(str(d.get("ok")).lower())')"
check "로그아웃 뒤엔 관리자가 아니다" "false" \
  "$(curl -s -b "$JAR" "$API/page/support/notice_api.php?action=session" --max-time 20 \
     | pick 'print(str(d.get("admin")).lower())')"
check "로그아웃 뒤 sid 로 토큰이 안 나온다" "404" \
  "$(code -H 'X-Chat-Resolve-Key: chat-secret-key' \
     "$API/page/support/notice_api.php?action=chat_resolve&sid=$SID")"

echo "== 권한 없는 사람 =="
curl -s -o /dev/null -X POST "$GW/_deny_tenant" -H 'Content-Type: application/json' -d '{"on":true}' --max-time 20
rm -f "$JAR"
curl -s -o /dev/null -c "$JAR" "$API/page/support/notice_api.php?action=login&return=/page/support/notice.php" --max-time 20
DENIED=$(curl -s -o /dev/null -w '%{redirect_url}' -b "$JAR" -c "$JAR" \
  "$API/page/support/notice_login_callback.php?code=test-code" --max-time 20)
check "by-root 가 막으면 로그인 거부" "yes" "$(printf '%s' "$DENIED" | grep -q 'login=denied' && echo yes || echo no)"
check "관리자가 되지 않는다" "false" \
  "$(curl -s -b "$JAR" "$API/page/support/notice_api.php?action=session" --max-time 20 \
     | pick 'print(str(d.get("admin")).lower())')"
# 원본은 여기서 iam_tok·app_tok 을 주소창에 실어 보냈다. 옮기지 않았다 —
# 실토큰이 브라우저 기록·리퍼러·프록시 로그에 전부 남는다.
check "거부 주소에 토큰이 없다" "none" \
  "$(printf '%s' "$DENIED" | grep -oE 'iam_tok|app_tok|token-' | head -1 | sed 's/^$//' | grep . || echo none)"
curl -s -o /dev/null -X POST "$GW/_deny_tenant" -H 'Content-Type: application/json' -d '{"on":false}' --max-time 20

echo "== HTTPS 뒤에서 세션 쿠키가 나가는가 =="
# 운영 기본값은 secure 쿠키다. nginx 가 TLS 를 끊으면 이 프로세스가 받는
# 요청은 평문이라, trust proxy 없이는 express-session 이 쿠키를 **오류도
# 로그도 없이** 안 보낸다. 로그인은 성공한 것처럼 보이고 다음 요청에서
# 세션이 사라진다. 눈으로는 못 잡는 실패라 여기서 잰다.
TLS_PORT=${TLS_PORT:-3903}
TLS="http://127.0.0.1:$TLS_PORT"
TLS_STATE=$(mktemp -d)
( cd "$TLS_STATE" && exec env -i PATH="$PATH" HOME="$HOME" \
    PORT="$TLS_PORT" NOTIFY_API_BASE="$GW" \
    NOTIFY_ROOT_ID=svc NOTIFY_ROOT_PW=svc-pw NOTIFY_IAM_BASE_URL="$GW" \
    NOTIFY_CALLBACK_URL="$TLS/page/support/notice_login_callback.php" \
    NOTIFY_TENANT_CODE=drvalue NOTIFY_STATE_DIR="$TLS_STATE" \
    SESSION_SECRET=verify-only SESSION_SECURE=true TRUST_PROXY=1 \
    IAM_ENFORCE_GATEWAY=false \
    node "$HERE/dist/main.js" > "$TLS_STATE/nest.log" 2>&1 ) &
TLS_PID=$!
for _ in $(seq 1 60); do
  [ "$(code "$TLS/page/support/notice_api.php?action=session")" = "200" ] && break; sleep 0.5
done
setcookie() {  # 헤더들… → 세션 쿠키 줄 (없으면 빈 문자열)
  curl -s -o /dev/null -D - "$@" \
    "$TLS/page/support/notice_api.php?action=login&return=/page/support/notice.php" \
    --max-time 20 | grep -i '^set-cookie: DVADMINSID' || true
}
check "평문으로 오면 쿠키가 안 나간다(증상 재현)" "none" \
  "$(setcookie | grep -q . && echo sent || echo none)"
check "프록시가 https 라고 하면 쿠키가 나간다" "sent" \
  "$(setcookie -H 'X-Forwarded-Proto: https' | grep -q . && echo sent || echo none)"
check "그 쿠키에 Secure 가 붙는다" "yes" \
  "$(setcookie -H 'X-Forwarded-Proto: https' | grep -qi 'Secure' && echo yes || echo no)"
kill "$TLS_PID" 2>/dev/null; wait "$TLS_PID" 2>/dev/null
rm -rf "$TLS_STATE"

echo
echo "PASS=$PASS FAIL=$FAIL"
[ "$FAIL" -eq 0 ]
