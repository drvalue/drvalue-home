#!/usr/bin/env bash
# 사내 IAM·게이트웨이가 우리가 기대하는 모양으로 답하는지 본다.
#
# 자격증명 없이 할 수 있는 것까지만 한다 — 주소가 사는지, 우리가 보내는
# 필드 이름이 맞는지, 틀린 값에 어떤 모양으로 거절하는지. 값이 채워지면
# 로그인까지 이어서 본다.
#
# 게이트웨이 공유 비밀은 Doppler 에 있다. 파일에 적지 말고 이렇게 돌린다:
#   doppler run --project drvalue-chat-backend --config prd \
#     --only-secrets GATEWAY_SHARED_SECRET -- bash scripts/probe-upstream.sh
#
# 실행: bash scripts/probe-upstream.sh        (.env 를 읽는다)
set -u
HERE="$(cd "$(dirname "$0")/.." && pwd)"
set -a; [ -f "$HERE/.env" ] && . "$HERE/.env"; set +a
IAM="${NOTIFY_IAM_BASE_URL:-https://iam.drvalue.co.kr}"
# 실측으로 찾은 주소다. notice_config.sample.php 의 route.drvalue.co.kr 는
# 지금 actuator/health 말고는 전부 404 다 — 경로가 하나도 안 걸려 있다.
GW="${NOTIFY_API_BASE:-https://api.growchat.co.kr/api/serv}"
CB="${NOTIFY_CALLBACK_URL:-https://www.drvalue.co.kr/page/support/notice_login_callback.php}"
# 게이트웨이 서명 공유 비밀. .env 이름이 없으면 Doppler 이름으로도 받는다.
SECRET="${IAM_GATEWAY_SECRET:-${GATEWAY_SHARED_SECRET:-}}"

PASS=0; FAIL=0; SKIP=0
check() { if [ "$2" = "$3" ]; then PASS=$((PASS+1)); printf '  PASS  %-40s %s\n' "$1" "$3"
          else FAIL=$((FAIL+1)); printf '  FAIL  %-40s 기대=%s 실제=%s\n' "$1" "$2" "$3"; fi }
skip() { SKIP=$((SKIP+1)); printf '  건너뜀 %-40s %s\n' "$1" "$2"; }
code() { curl -s -o /dev/null -w '%{http_code}' "$@" --max-time 20; }
pick() { python3 -c "import json,sys
try: d=json.load(sys.stdin)
except Exception: d=None
$1" 2>/dev/null; }
# 셸에 JSON 리터럴을 쓰지 않는다 — zsh 가 중괄호를 확장해 몸통을 깨뜨린다.
json() { python3 -c "import json,sys; print(json.dumps(json.loads(sys.argv[1])))" "$1"; }

echo "== IAM ($IAM) =="
check "로그인 화면이 산다" "200" "$(code "$IAM/auth/login?redirect_url=$(python3 -c "import urllib.parse,sys;print(urllib.parse.quote(sys.argv[1],safe=''))" "$CB")")"
# 틀린 code 에 어떤 모양으로 거절하는지. 성공 시 access_token 을 주는 것과
# 같은 구조여야 우리 파서가 맞는다.
EX_BODY=$(CB="$CB" python3 <<'EOF'
import json, os
print(json.dumps({"code": "probe", "redirectUri": os.environ["CB"]}))
EOF
)
check "code 교환이 봉투 없이 답한다" "invalid_grant" \
  "$(printf '%s' "$EX_BODY" | curl -s -X POST "$IAM/auth/token/exchange" \
      -H 'Content-Type: application/json' --data-binary @- --max-time 20 \
      | pick 'print(d.get("error",""))')"

echo "== 게이트웨이 ($GW) =="
# 이 업스트림은 HTTP 200 에 본문 status 로 결과를 싣는다. 전송 코드만 보면
# 전부 성공으로 보인다 — 본문을 읽어야 한다.
EMPTY=$(json '{}')
check "root/basic 이 우리 필드 이름을 안다" "yes" \
  "$(printf '%s' "$EMPTY" | curl -s -X POST "$GW/auth/v1/login/root/basic" \
      -H 'Content-Type: application/json' --data-binary @- --max-time 20 \
      | pick 'm=(d or {}).get("message","");print("yes" if "userId" in m and "password" in m else "no")')"
# PHP 가 쓰던 목록 경로 그대로. 없는 경로면 404, 있으면 토큰이 없다고 401.
check "게시판 경로가 산다" "401" \
  "$(curl -s "$GW/baseinfo/v1/default-notify/many?take=1&skip=0&showYn=true" --max-time 20 \
      | pick 'print(str((d or {}).get("status","")))')"
# 404 가 아니면 경로가 있다는 뜻이다. 테넌트 코드가 맞는지는 여기서 못 잰다
# (앱 토큰이 있어야 한다) — 맞다고 세지 않는다.
check "by-root 경로가 산다" "yes" \
  "$(printf '%s' "$EMPTY" | curl -s -X POST "$GW/auth/v1/login/tenant/by-root" \
      -H 'Content-Type: application/json' -H 'X-Tenant-Code: drvalue' --data-binary @- --max-time 20 \
      | pick 'print("no" if (d or {}).get("status")==404 else "yes")')"

echo "== 게이트웨이 서명 =="
# root/iam 만 서명을 요구한다. 서명이 맞으면 거절 이유가 바뀐다 —
# "Invalid gateway signature" → "Missing IAM user headers".
check "서명 없이는 root/iam 이 거부된다" "signature-mismatch또는없음" \
  "$(printf '%s' "$EMPTY" | curl -s -X POST "$GW/auth/v1/login/root/iam" \
      -H 'Content-Type: application/json' --data-binary @- --max-time 20 \
      | pick 'print("signature-mismatch또는없음" if "gateway signature" in str((d or {}).get("message","")) else "다름")')"
if [ -z "$SECRET" ]; then
  skip "공유 비밀이 맞다" "IAM_GATEWAY_SECRET 이 비어 있다 (Doppler 로 주입해라)"
else
  SIG=$(SECRET="$SECRET" python3 <<'EOF'
import hashlib, hmac, os, time
# 서명 대상: 타임스탬프\nMETHOD\n경로(질의 제외)\n신원 헤더 7개를 \n 으로 이어붙인 것.
# 경로는 **프리픽스를 포함한 전체 경로**다(실측 — 빼면 signature-mismatch).
ORDER = 7  # x-user-id, -role, -groups, -groups-detail, -email, -name, -username
ts = str(int(time.time() * 1000))
canonical = "\n".join([ts, "POST", "/api/serv/auth/v1/login/root/iam", *([""] * ORDER)])
sig = hmac.new(os.environ["SECRET"].encode(), canonical.encode(), hashlib.sha256).hexdigest()
print(ts, sig)
EOF
)
  check "공유 비밀이 맞다" "게이트웨이로 인정됨" \
    "$(printf '%s' "$EMPTY" | curl -s -X POST "$GW/auth/v1/login/root/iam" \
        -H 'Content-Type: application/json' \
        -H "X-Gateway-Timestamp: ${SIG% *}" -H "X-Gateway-Signature: ${SIG#* }" \
        --data-binary @- --max-time 20 \
        | pick 'm=str((d or {}).get("message",""));print("게이트웨이로 인정됨" if "IAM user headers" in m else m[:40])')"
fi

echo "== 자격증명이 필요한 것 =="
if [ -z "${NOTIFY_ROOT_ID:-}" ] || [ -z "${NOTIFY_ROOT_PW:-}" ]; then
  skip "서비스 계정 로그인" "NOTIFY_ROOT_ID/PW 가 비어 있다"
  skip "게시판 목록 읽기" "서비스 토큰이 있어야 한다"
else
  TOK=$(python3 <<'EOF' | curl -s -X POST "$GW/auth/v1/login/root/basic" \
       -H 'Content-Type: application/json' --data-binary @- --max-time 20 \
       | pick 'print((d.get("data") or {}).get("accessToken") or "")'
import json, os
print(json.dumps({"userId": os.environ["NOTIFY_ROOT_ID"], "password": os.environ["NOTIFY_ROOT_PW"]}))
EOF
)
  check "서비스 계정 로그인" "yes" "$([ -n "$TOK" ] && echo yes || echo no)"
  if [ -n "$TOK" ]; then
    check "게시판 목록 읽기" "200" \
      "$(curl -s -H "Authorization: Bearer $TOK" \
          "$GW/baseinfo/v1/default-notify/many?take=1&skip=0&showYn=true" --max-time 20 \
          | pick 'print(str((d or {}).get("status","")))')"
  else
    skip "게시판 목록 읽기" "로그인이 실패했다"
  fi
fi

echo
echo "PASS=$PASS FAIL=$FAIL 건너뜀=$SKIP"
[ "$FAIL" -eq 0 ]
