#!/usr/bin/env bash
# IAM 로그인 다리 검증.
#
# Directus Core 는 SSO 를 막지만(실측: sso_enabled 라이선스 게이트) 확장은
# 막지 않는다. extensions/directus-extension-iam-bridge 가 IAM 4단계를 직접
# 확인하고, 통과한 사람에게만 Directus 세션을 준다.
#
# 운영 IAM 자격증명 없이 검증하려고 가짜 IAM 을 띄운다. 끝나면 원래 설정으로
# 되돌린다.
#
# 실행: bash scripts/verify-iam-bridge.sh
set -uo pipefail

BASE="${BASE:-http://localhost:3350}"
HERE="$(cd "$(dirname "$0")/.." && pwd)"
PASS=0
FAIL=0
FAKE_PORT=3360
OVERRIDE="$(mktemp -t iambridge).yml"
JAR="$(mktemp -t iamjar)"

check() {
  if [ "$2" = "$3" ]; then
    printf '  PASS  %-44s %s\n' "$1" "$3"; PASS=$((PASS + 1))
  else
    printf '  FAIL  %-44s 기대=%s 실제=%s\n' "$1" "$2" "$3"; FAIL=$((FAIL + 1))
  fi
}

cleanup() {
  [ -n "${FAKE_PID:-}" ] && kill "$FAKE_PID" 2>/dev/null
  # 파생 비밀번호를 원래 값으로 되돌린다. 안 되돌리면 이 저장소의 다른
  # 스크립트(스모크·프로비저닝)가 전부 로그인에 실패한다.
  if [ "${ROTATED:-0}" = "1" ]; then
    BODY=$(printf '{"email":"%s","password":"%s"}' "$ADMIN_EMAIL" "$DERIVED")
    TOK=$(curl -s -X POST "$BASE/auth/login" -H 'Content-Type: application/json' \
      -d "$BODY" --max-time 60 \
      | python3 -c 'import json,sys
try: print(json.load(sys.stdin)["data"]["access_token"])
except Exception: print("")')
    UID_=$(curl -s "$BASE/users/me?fields=id" -H "Authorization: Bearer $TOK" --max-time 60 \
      | python3 -c 'import json,sys
try: print(json.load(sys.stdin)["data"]["id"])
except Exception: print("")')
    RESTORE=$(printf '{"password":"%s"}' "$ADMIN_PW")
    [ -n "$UID_" ] && curl -s -o /dev/null -X PATCH "$BASE/users/$UID_" \
      -H "Authorization: Bearer $TOK" -H 'Content-Type: application/json' \
      -d "$RESTORE" --max-time 60
    # iam_bridge_sync.py 가 넣은 로그인 화면 링크도 지운다. 남겨 두면 다리가
    # 꺼진 상태에서 그 링크를 누르는 사람마다 503 을 본다.
    [ -n "$TOK" ] && curl -s -o /dev/null -X PATCH "$BASE/settings" \
      -H "Authorization: Bearer $TOK" -H 'Content-Type: application/json' \
      -d '{"public_note":null}' --max-time 60
  fi
  rm -f "$OVERRIDE" "$JAR"
  # 다리를 끈 원래 상태로 되돌린다. 켠 채로 두면 다음 사람이 이유 모를
  # 상태를 물려받는다.
  (cd "$HERE" && docker compose up -d --force-recreate directus >/dev/null 2>&1)
  for _ in $(seq 1 90); do
    [ "$(curl -s -o /dev/null -w '%{http_code}' "$BASE/server/ping" --max-time 5 2>/dev/null)" = "200" ] && break
    sleep 1
  done
}
trap cleanup EXIT

python3 "$HERE/scripts/iam-bridge-test/fake_iam.py" &
FAKE_PID=$!
sleep 1
check "가짜 IAM 기동" "200" \
  "$(curl -s -o /dev/null -w '%{http_code}' "http://localhost:$FAKE_PORT/auth/login" --max-time 10)"

cat > "$OVERRIDE" <<YML
services:
  directus:
    environment:
      IAM_BRIDGE_ENABLED: "true"
      IAM_BRIDGE_IAM_BASE: "http://host.docker.internal:$FAKE_PORT"
      IAM_BRIDGE_ROUTE_BASE: "http://host.docker.internal:$FAKE_PORT"
      IAM_BRIDGE_CALLBACK_URL: "$BASE/iam-bridge/callback"
      IAM_BRIDGE_TENANT_CODE: "drvalue"
      IAM_BRIDGE_ACCOUNTS: "dev@drvalue.co.kr:admin@drvalue.co.kr"
    extra_hosts:
      - "host.docker.internal:host-gateway"
YML
(cd "$HERE" && docker compose -f docker-compose.yml -f "$OVERRIDE" up -d >/dev/null 2>&1)
for _ in $(seq 1 90); do
  [ "$(curl -s -o /dev/null -w '%{http_code}' "$BASE/server/ping" --max-time 5 2>/dev/null)" = "200" ] && break
  sleep 1
done
sleep 2

ENABLED=$(curl -s "$BASE/iam-bridge/status" --max-time 30 | python3 -c 'import json,sys;print(json.load(sys.stdin).get("enabled"))')
check "다리가 켜짐" "True" "$ENABLED"

# 다리를 켜는 것만으로는 로컬 로그인이 안 막힌다. Core 는 로그인 창을 끌 수
# 없으므로 계정 비밀번호를 사람이 모르는 파생값으로 바꿔야 IAM 이 유일한
# 입구가 된다. 그게 실제로 문을 닫는지 확인한다.
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@drvalue.co.kr}"
ADMIN_PW="${ADMIN_PASSWORD:-drvalue1234!}"
SECRET_VAL=$(cd "$HERE" && grep -E '^DIRECTUS_SECRET=' .env 2>/dev/null | cut -d= -f2-)
DERIVED=$(python3 -c "
import hmac, hashlib, sys
print(hmac.new(sys.argv[1].encode(), f'iam-bridge:{sys.argv[2].lower()}'.encode(), hashlib.sha256).hexdigest())
" "$SECRET_VAL" "$ADMIN_EMAIL")

# 주의: $( ) 안에 JSON 리터럴을 직접 쓰면 \" 가 풀려 요청이 깨진다.
login_verdict() {
  local body
  body=$(printf '{"email":"%s","password":"%s"}' "$1" "$2")
  curl -s -X POST "$BASE/auth/login" -H 'Content-Type: application/json' \
    -d "$body" --max-time 60 | python3 -c 'import json,sys
d=json.load(sys.stdin)
print("ok" if "data" in d else d["errors"][0]["extensions"]["code"])'
}

check "다리 켜도 로컬 비밀번호가 아직 통한다" "ok" "$(login_verdict "$ADMIN_EMAIL" "$ADMIN_PW")"

(cd "$HERE" && DIRECTUS_SECRET="$SECRET_VAL" \
  IAM_BRIDGE_ACCOUNTS="dev@drvalue.co.kr:$ADMIN_EMAIL" \
  python3 scripts/iam_bridge_sync.py >/dev/null 2>&1) && ROTATED=1

check "파생값으로 바꾸면 로컬 비밀번호가 막힌다" "INVALID_CREDENTIALS" \
  "$(login_verdict "$ADMIN_EMAIL" "$ADMIN_PW")"
check "파생값 자체로는 들어가진다" "ok" "$(login_verdict "$ADMIN_EMAIL" "$DERIVED")"

# code 로 시나리오를 고른다. 각 회차마다 state 쿠키를 새로 받는다.
attempt() {
  rm -f "$JAR"
  curl -s -c "$JAR" -o /dev/null -D /tmp/iamh1 "$BASE/iam-bridge/login" --max-time 30
  local nonce
  nonce=$(grep -i '^location:' /tmp/iamh1 | tr -d '\r' | sed -n 's/.*state=\([a-f0-9]*\).*/\1/p')
  curl -s -b "$JAR" -c "$JAR" -o /dev/null -D /tmp/iamh2 \
    "$BASE/iam-bridge/callback?code=$1&state=$nonce" --max-time 30
  grep -i 'directus_session_token' "$JAR" | awk '{print $NF}'
}

# 1) 정상 — 4단계 통과한 사람은 실제로 로그인된 상태여야 한다.
SESS=$(attempt ok)
check "정상 로그인이 세션을 받음" "yes" "$([ -n "$SESS" ] && echo yes || echo no)"
WHO=$(curl -s "$BASE/users/me?fields=email" -H "Cookie: directus_session_token=$SESS" --max-time 30 \
  | python3 -c 'import json,sys
d=json.load(sys.stdin)
print(d["data"]["email"] if "data" in d else "무효")')
check "그 세션이 실제로 동작함" "admin@drvalue.co.kr" "$WHO"

# 2) 4단계(테넌트)에서 거부당하면 세션이 나가면 안 된다. 인가 판정이 거기다.
check "테넌트 인가 거부 시 세션 없음" "none" "$([ -z "$(attempt denied)" ] && echo none || echo leak)"

# 3) IAM 은 통과해도 Directus 계정 매핑이 없으면 거부. seat 가 3명이라
#    없는 사람을 자동 생성하지 않는다.
check "매핑 없는 사람은 거부" "none" "$([ -z "$(attempt unmapped)" ] && echo none || echo leak)"

# 4) state 없이 콜백만 때리면 거부돼야 한다(로그인 CSRF).
rm -f "$JAR"
curl -s -c "$JAR" -o /dev/null "$BASE/iam-bridge/callback?code=ok&state=deadbeef" --max-time 30
check "위조 state 는 거부" "none" \
  "$([ -z "$(grep -i 'directus_session_token' "$JAR" | awk '{print $NF}')" ] && echo none || echo leak)"

# 5) 세션 토큰이 주소로 새지 않아야 한다. PHP 쪽이 이 실수를 하고 있다.
LOC=$(grep -i '^location:' /tmp/iamh2 | tr -d '\r')
check "리다이렉트 주소에 토큰이 없음" "clean" \
  "$(printf '%s' "$LOC" | grep -qiE 'token|accessToken|iam_tok|app_tok' && echo leak || echo clean)"

echo
echo "PASS=$PASS FAIL=$FAIL"
[ "$FAIL" -eq 0 ]
