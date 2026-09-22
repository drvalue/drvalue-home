#!/usr/bin/env bash
# Nest 가 Directus 를 제대로 읽고 쓰는지 본다.
#
# 문의 저장은 오래 조용히 깨져 있었다 — 컨트롤러가 없는 필드(subject)에 쓰고,
# Promise.allSettled 가 그 실패를 삼켰다. 화면에는 ok 가 떴다.
# 그래서 "응답이 200 이다" 로 끝내지 않고 CMS 에 실제로 행이 생겼는지까지 본다.
#
# 실행: bash scripts/verify.sh   (api 와 cms 가 떠 있어야 한다)
set -u
HERE="$(cd "$(dirname "$0")/.." && pwd)"
API="${API_URL:-http://localhost:3500}"

# 루트 .env 하나다. Nest 와 CMS 관리자 계정이 다 여기 있다.
set -a; [ -f "$HERE/../.env" ] && . "$HERE/../.env"; set +a
CMS="${DIRECTUS_URL:-http://localhost:3350}"

# 표본을 만들고 지우려면 관리자여야 한다. Nest 가 쓰는 서비스 토큰은 읽기만
# 되므로(그게 설계다) 검증용 쓰기에는 .env 의 관리자 계정을 쓴다.
if [ -z "${ADMIN_EMAIL:-}" ] || [ -z "${ADMIN_PASSWORD:-}" ]; then echo "루트 .env 에 ADMIN_EMAIL·ADMIN_PASSWORD 가 없다." >&2; exit 2; fi
# 셸에서 JSON 리터럴을 만들지 않는다 — zsh 가 중괄호를 확장해서 몸통이 깨진다.
# 시드 비밀번호로 먼저, 안 되면 IAM 다리 파생값으로(iam_bridge_sync.py 가 admin 을 바꾼 뒤).
ADMIN=$(CMS="$CMS" python3 <<'EOF'
import hashlib, hmac, json, os, urllib.request
def login(pw):
    body = json.dumps({"email": os.environ["ADMIN_EMAIL"], "password": pw})
    req = urllib.request.Request(
        os.environ["CMS"] + "/auth/login", data=body.encode(),
        headers={"Content-Type": "application/json"}, method="POST")
    try:
        return json.load(urllib.request.urlopen(req, timeout=30))["data"]["access_token"]
    except Exception:
        return ""
tok = login(os.environ["ADMIN_PASSWORD"])
if not tok and os.environ.get("DIRECTUS_SECRET"):
    tok = login(hmac.new(os.environ["DIRECTUS_SECRET"].encode(),
                         ("iam-bridge:" + os.environ["ADMIN_EMAIL"].strip().lower()).encode(),
                         hashlib.sha256).hexdigest())
print(tok)
EOF
)
if [ -z "$ADMIN" ]; then echo "Directus 관리자 로그인 실패" >&2; exit 2; fi

PASS=0; FAIL=0; NA=0
check() { # 이름 기대 실제
  if [ "$2" = "$3" ]; then PASS=$((PASS+1)); printf '  PASS  %-36s %s\n' "$1" "$3"
  else FAIL=$((FAIL+1)); printf '  FAIL  %-36s 기대=%s 실제=%s\n' "$1" "$2" "$3"; fi
}
na() { NA=$((NA+1)); printf '  판정불가 %-38s %s\n' "$1" "$2"; }
pick() { python3 -c "import json,sys
try: d=json.load(sys.stdin)
except Exception: d=None
$1" 2>/dev/null; }
# -g 는 필수다. curl 은 URL 의 [ ] 를 글로빙으로 해석해서 filter[..][..] 가
# 들어간 주소를 "malformed" 로 거절한다(종료코드 3, 본문은 빈 문자열).
cms() { curl -s -g -H "Authorization: Bearer $ADMIN" "$CMS$1" --max-time 30; }

RUN="verify-$(date +%s)-$RANDOM"

echo "== 콘텐츠 읽기 =="
check "게시판 목록" "yes" \
  "$(curl -s "$API/api/content/posts?board=notice" --max-time 30 | pick 'print("yes" if isinstance(d.get("data"),list) else "no")')"

echo "== 회사 자료 게시판 (특허·저작권·수행실적·연혁) =="
# import_site_content.py 가 넣은 것이 api 로 나오는지. CMS 에서 지우면 여기서 잡힌다.
check "특허 6건" "6" "$(curl -s "$API/api/content/posts?board=patent&limit=100" --max-time 30 | pick 'print(len(d.get("data") or []))')"
check "특허에 번호·상태가 붙어 온다" "yes" \
  "$(curl -s "$API/api/content/posts?board=patent&limit=100" --max-time 30 | pick 'r=(d.get("data") or [{}])[0]; print("yes" if r.get("cert_no") and r.get("cert_state") else "no")')"
check "특허 증서 그림이 우리 주소로 열린다" "200" \
  "$(curl -s -o /dev/null -w '%{http_code}' "$API$(curl -s "$API/api/content/posts?board=patent&limit=1" --max-time 30 | pick 'print((d.get("data") or [{}])[0].get("thumbnail") or "/none")')" --max-time 30)"
check "저작권에 종류·창작일" "yes" \
  "$(curl -s "$API/api/content/posts?board=copyright&limit=100" --max-time 30 | pick 'r=(d.get("data") or [{}])[0]; print("yes" if r.get("cert_kind") and r.get("cert_made_date") else "no")')"
check "연혁은 10건 넘게 한 번에 온다" "yes" \
  "$(curl -s "$API/api/content/posts?board=history&limit=100" --max-time 30 | pick 'print("yes" if len(d.get("data") or [])>10 else "no")')"
check "연혁은 최신 연도부터" "yes" \
  "$(curl -s "$API/api/content/posts?board=history&limit=100" --max-time 30 | pick 'y=[r.get("history_year") or "" for r in d.get("data") or []]; print("yes" if y==sorted(y,reverse=True) else "no")')"
check "수행실적에 기간·구분" "yes" \
  "$(curl -s "$API/api/content/posts?board=case&limit=100" --max-time 30 | pick 'r=(d.get("data") or [{}])[0]; print("yes" if r.get("period_start") and r.get("case_category_label") else "no")')"
check "limit 은 100 을 넘지 않는다" "100" \
  "$(curl -s "$API/api/content/posts?board=notice&limit=999" --max-time 30 | pick 'print(d.get("pageSize"))')"

echo "== 초안이 새지 않는다 =="
# Directus Core 는 권한에 조건을 못 걸어서 토큰이 초안까지 다 본다.
# 거르는 일은 Nest 가 한다 — 실제로 초안을 하나 만들어 확인한다.
DRAFT=$(curl -s -X POST "$CMS/items/posts" -H "Authorization: Bearer $ADMIN" \
  -H 'Content-Type: application/json' \
  -d "$(printf '{"board":"notice","slug":"%s","status":"draft","published_date":"%s","translations":[{"languages_code":"ko-KR","title":"검증용 초안"}]}' "$RUN" "$(date +%Y-%m-%d)")" \
  --max-time 30 | pick 'print(d.get("data",{}).get("id",""))')
check "초안 만들기" "yes" "$([ -n "$DRAFT" ] && echo yes || echo no)"
check "초안이 목록에 없다" "absent" \
  "$(curl -s "$API/api/content/posts?board=notice" --max-time 30 | pick "
slugs=[x.get('slug') for x in (d.get('data') or [])]
print('leak' if '$RUN' in slugs else 'absent')")"
check "초안 낱개 조회는 404" "404" \
  "$(curl -s -o /dev/null -w '%{http_code}' "$API/api/content/posts/$RUN" --max-time 30)"

echo "== 게시판이 CMS 에서 온다 =="
# 옛 게시판은 사내 게이트웨이에서 읽었다. 이제 CMS 다. 화면 JS 가 쓰는 것을
# 그대로 재지 않으면 "응답 200" 만 보고 빈 목록을 넘기게 된다 — 옛날에 한 번
# 그렇게 당했다(스크립트가 죽어 목록이 영원히 비어 있었다).
A="$RUN-a"; B="$RUN-b"; C="$RUN-c"; D_="$RUN-d"
mkpost() {  # 슬러그 제목 표시날짜 상태 고정여부
  SLUG="$1" T="$2" DT="$3" ST="$4" PIN="$5" python3 <<'EOF' | \
    curl -s -o /dev/null -X POST "$CMS/items/posts" -H "Authorization: Bearer $ADMIN" \
      -H 'Content-Type: application/json' --data-binary @- --max-time 30
import json, os
print(json.dumps({
    "board": "notice", "slug": os.environ["SLUG"], "status": os.environ["ST"],
    "published_date": os.environ["DT"], "is_pinned": os.environ["PIN"] == "1",
    "translations": [{"languages_code": "ko-KR", "title": os.environ["T"],
                      "summary": "검증 요약", "body": "<p>검증 본문</p>"}],
}))
EOF
}
mkpost "$A" "검증 가나다"  2024-01-10 published 0
mkpost "$B" "검증 라마바"  2024-06-20 published 0
mkpost "$C" "검증 고정글"  2023-01-01 published 1
mkpost "$D_" "검증 초안글" 2024-03-03 draft     0

# curl 은 주소 안의 한글을 그대로 못 보낸다(종료코드 3, HTTP 400). 검색어가
# 한글이라 여기서 반드시 인코딩해야 한다 — 안 하면 검색 검사가 통째로 죽는다.
list() {
  url=$(Q="${1:-}" API="$API" python3 -c '
import os, urllib.parse
q = os.environ["Q"]
parts = dict(p.split("=", 1) for p in q.split("&")) if q else {}
parts["board"] = "notice"
print(os.environ["API"] + "/api/content/posts?" + urllib.parse.urlencode(parts))')
  curl -s "$url" --max-time 30
}
mine='[x for x in (d.get("data") or []) if str(x.get("slug","")).startswith("'"$RUN"'-")]'

check "목록에 표본 3건이 온다" "3" "$(list | pick "print(len($mine))")"
check "초안은 목록에 없다" "0" \
  "$(list | pick "print(len([x for x in $mine if str(x.get('slug','')).endswith('-d')]))")"
check "고정글이 맨 앞에 온다" "yes" \
  "$(list | pick "m=$mine
print('yes' if m and m[0].get('is_pinned') else 'no')")"
check "제목이 펴져서 온다" "검증 고정글" \
  "$(list | pick "m=$mine
print(m[0].get('title','') if m else '')")"
check "번역 배열은 안 보낸다" "none" \
  "$(list | pick "m=$mine
print('leak' if m and 'translations' in m[0] else 'none')")"
check "한 쪽 크기를 알려 준다" "10" "$(list | pick 'print(d.get("pageSize"))')"
check "검색어가 걸린다" "1" "$(list 'q=라마바' | pick "print(len($mine))")"
check "요약도 검색된다" "3" "$(list 'q=검증 요약' | pick "print(len($mine))")"
check "기간으로 거른다" "1" \
  "$(list 'startDate=2024-06-01&endDate=2024-12-31' | pick "print(len($mine))")"
check "없는 검색어는 0건" "0" "$(list 'q=절대로없는말XYZ' | pick "print(len($mine))")"
# 화면의 쪽 번호는 total 과 pageSize 로 계산한다. 둘 중 하나가 어긋나면
# 마지막 쪽이 조용히 사라진다 — 한 쪽에 1건씩 끊어서 확인한다.
one() { curl -s "$API/api/content/posts?board=notice&limit=1&page=$1" --max-time 30; }
check "전체 건수를 준다" "yes" \
  "$(list | pick 'print("yes" if isinstance(d.get("total"), int) and d["total"] > 0 else "no")')"
check "2쪽이 1쪽과 다르다" "different" \
  "$(P1=$(list 'page=1' | pick "m=$mine
print(m[0].get('slug','') if m else '')")
     P2=$(list 'page=2' | pick "m=$mine
print(m[0].get('slug','') if m else '')")
     [ -n "$P1" ] && [ "$P1" != "$P2" ] && echo different || echo same)"

detail() { curl -s "$API/api/content/posts/$1" --max-time 30; }
check "상세가 본문을 준다" "<p>검증 본문</p>" \
  "$(detail "$A" | pick 'print((d.get("data") or {}).get("body",""))')"
# 영어 번역이 없는 글을 영어로 부르면, 예비가 없을 때 제목 없는 글이
# **정상 응답으로** 나간다. 화면에는 빈 줄만 남는다.
check "영어 번역이 없으면 한국어로 준다" "검증 가나다" \
  "$(curl -s "$API/api/content/posts/$A?lang=en-US" --max-time 30 \
     | pick 'print((d.get("data") or {}).get("title",""))')"
check "초안 상세는 404" "404" \
  "$(curl -s -o /dev/null -w '%{http_code}' "$API/api/content/posts/$D_" --max-time 30)"
check "없는 글은 404" "404" \
  "$(curl -s -o /dev/null -w '%{http_code}' "$API/api/content/posts/$RUN-nope" --max-time 30)"
check "파일 주소는 uuid 만 받는다" "400" \
  "$(curl -s -o /dev/null -w '%{http_code}' "$API/api/content/assets/not-a-uuid" --max-time 30)"

# 첨부. 파일은 Directus 에 있고 브라우저는 우리 주소로만 받는다.
printf '검증 첨부 내용' > "/tmp/dv_att.$$.txt"
FID=$(curl -s -X POST "$CMS/files" -H "Authorization: Bearer $ADMIN" \
    -F "file=@/tmp/dv_att.$$.txt;type=text/plain" --max-time 30 \
    | pick 'print((d.get("data") or {}).get("id",""))')
rm -f "/tmp/dv_att.$$.txt"
PID=$(cms "/items/posts?filter[slug][_eq]=$A&limit=1&fields=id" | pick 'print((d.get("data") or [{}])[0].get("id",""))')
if [ -z "$FID" ] || [ -z "$PID" ]; then
  na "첨부" "Directus 업로드 또는 글 조회가 안 됐다 (file=${FID:-없음} post=${PID:-없음})"
else
  PID="$PID" FID="$FID" python3 -c '
import json, os
print(json.dumps({"posts_id": int(os.environ["PID"]), "directus_files_id": os.environ["FID"]}))' | \
    curl -s -o /dev/null -X POST "$CMS/items/posts_files" -H "Authorization: Bearer $ADMIN" \
      -H 'Content-Type: application/json' --data-binary @- --max-time 30
  check "첨부가 상세에 붙는다" "1" \
    "$(detail "$A" | pick 'print(len((d.get("data") or {}).get("attachments") or []))')"
  AURL=$(detail "$A" | pick 'a=((d.get("data") or {}).get("attachments") or [{}])[0]
print(a.get("url",""))')
  check "첨부 주소가 우리 것이다" "yes" \
    "$(printf '%s' "$AURL" | grep -q '^/api/content/assets/' && echo yes || echo no)"
  check "첨부를 내려받을 수 있다" "검증 첨부 내용" "$(curl -s "$API$AURL" --max-time 30)"
  # uuid 만 보고 흘려보내면 서비스 토큰 권한으로 CMS 파일이 전부 나간다.
  # 아무 글도 가리키지 않는 파일을 하나 올려서 막히는지 확인한다.
  printf '아무도 안 가리키는 파일' > "/tmp/dv_orphan.$$.txt"
  OID=$(curl -s -X POST "$CMS/files" -H "Authorization: Bearer $ADMIN" \
      -F "file=@/tmp/dv_orphan.$$.txt;type=text/plain" --max-time 30 \
      | pick 'print((d.get("data") or {}).get("id",""))')
  rm -f "/tmp/dv_orphan.$$.txt"
  if [ -z "$OID" ]; then
    na "참조 없는 파일은 막힌다" "업로드가 안 됐다"
  else
    check "참조 없는 파일은 막힌다" "404" \
      "$(curl -s -o /dev/null -w '%{http_code}' "$API/api/content/assets/$OID" --max-time 30)"
    curl -s -o /dev/null -X DELETE "$CMS/files/$OID" -H "Authorization: Bearer $ADMIN" --max-time 30
  fi
  # 초안 글의 첨부도 나가면 안 된다. 같은 파일을 초안에 물리고 본다.
  DPID=$(cms "/items/posts?filter[slug][_eq]=$D_&limit=1&fields=id" | pick 'print((d.get("data") or [{}])[0].get("id",""))')
  if [ -n "$DPID" ]; then
    DPID="$DPID" FID="$FID" python3 -c '
import json, os
print(json.dumps({"posts_id": int(os.environ["DPID"]), "directus_files_id": os.environ["FID"]}))' | \
      curl -s -o /dev/null -X POST "$CMS/items/posts_files" -H "Authorization: Bearer $ADMIN" \
        -H 'Content-Type: application/json' --data-binary @- --max-time 30
    # 이 파일은 게시된 글도 가리키고 있으므로 여전히 나가야 한다.
    check "게시글이 가리키면 여전히 나간다" "200" \
      "$(curl -s -o /dev/null -w '%{http_code}' "$API$AURL" --max-time 30)"
  fi
  curl -s -o /dev/null -X DELETE "$CMS/files/$FID" -H "Authorization: Bearer $ADMIN" --max-time 30
  check "파일이 지워지면 404 다" "404" \
    "$(curl -s -o /dev/null -w '%{http_code}' "$API$AURL" --max-time 30)"
fi

for slug in "$A" "$B" "$C" "$D_"; do
  PID=$(cms "/items/posts?filter[slug][_eq]=$slug&limit=1&fields=id" | pick 'print((d.get("data") or [{}])[0].get("id",""))')
  [ -n "$PID" ] && curl -s -o /dev/null -X DELETE "$CMS/items/posts/$PID" \
    -H "Authorization: Bearer $ADMIN" --max-time 30
done
check "검증 게시글이 남지 않음" "0" \
  "$(cms "/items/posts?filter[slug][_starts_with]=$RUN-&limit=-1&fields=id" | pick 'print(len(d.get("data") or []))')"

echo "== 문의 =="
BODY=$(printf '{"user_name":"%s","user_tel":"010-0000-0000","user_type":"지원사업","user_msg":"검증"}' "$RUN")
# 이 구간은 POST 를 3번 쓴다. 한도가 분당 5회라, 1분 안에 두 번 돌리면
# 두 번째는 전부 429 다. 그때 429 본문을 읽으면 "내부 상태가 샌다" 같은
# 엉뚱한 실패가 난다(실제로 당했다). 못 잰 것은 통과도 실패도 아니다.
INQ_CODE=$(curl -s -o /tmp/dv_inq.$$ -w '%{http_code}' -X POST "$API/api/inquiry" \
  -H 'Content-Type: application/json' -d "$BODY" --max-time 60)
INQ_BODY=$(cat "/tmp/dv_inq.$$" 2>/dev/null); rm -f "/tmp/dv_inq.$$"
if [ "$INQ_CODE" = "429" ]; then
  na "문의 구간 전체" "속도 제한(분 5회)에 걸렸다 — 1분 뒤 다시 돌려라"
  INQ_SKIP=1
else
  INQ_SKIP=0
  check "문의 접수 응답" "ok" \
    "$(printf '%s' "$INQ_BODY" | pick 'print("ok" if d.get("ok") else "no")')"
fi
if [ "$INQ_SKIP" = "0" ]; then
# 여기가 핵심이다. 응답 ok 는 저장을 뜻하지 않는다.
ROW=$(cms "/items/inquiries?filter[name][_eq]=$RUN&limit=1&fields=id,type,phone,message,status")
check "CMS 에 행이 생겼다" "1" "$(printf '%s' "$ROW" | pick 'print(len(d.get("data") or []))')"
check "문의 유형이 원문 그대로" "지원사업" \
  "$(printf '%s' "$ROW" | pick 'print((d.get("data") or [{}])[0].get("type",""))')"
check "연락처가 phone 으로 들어간다" "010-0000-0000" \
  "$(printf '%s' "$ROW" | pick 'print((d.get("data") or [{}])[0].get("phone",""))')"
check "상태는 접수" "new" \
  "$(printf '%s' "$ROW" | pick 'print((d.get("data") or [{}])[0].get("status",""))')"
check "선택지 밖 유형은 거부" "400" \
  "$(curl -s -o /dev/null -w '%{http_code}' -X POST "$API/api/inquiry" -H 'Content-Type: application/json' \
     -d '{"user_name":"x","user_tel":"010","user_type":"없는유형","user_msg":"m"}' --max-time 30)"
# 응답이 어느 쪽이 실패했는지 흘리면 익명 제출자가 내부 상태를 읽는다.
check "응답에 내부 상태가 없다" "none" \
  "$(curl -s -X POST "$API/api/inquiry" -H 'Content-Type: application/json' -d "$BODY" --max-time 60 \
     | pick 'print("leak" if set(d) - {"ok"} else "none")')"
fi

# 속도 제한은 창을 태워 버린다 — 켜고 나면 1분 안의 재실행이 429 로 막힌다.
# 그래서 기본은 끈다. mail_send.php 가 하던 방어라 한 번은 확인해야 한다.
if [ "${RL_CHECK:-0}" = "1" ]; then
  echo "== 속도 제한 =="
  hit=""
  for _ in 1 2 3 4 5 6 7 8 9 10; do
    c=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$API/api/inquiry" \
        -H 'Content-Type: application/json' -d "$BODY" --max-time 30)
    [ "$c" = "429" ] && { hit=429; break; }
  done
  check "한도를 넘으면 429" "429" "${hit:-none}"
else
  echo "== 속도 제한 == (건너뜀 — RL_CHECK=1 로 켠다)"
fi

echo "== 뒷정리 =="
[ -n "$DRAFT" ] && curl -s -o /dev/null -X DELETE "$CMS/items/posts/$DRAFT" -H "Authorization: Bearer $ADMIN" --max-time 30
for i in $(cms "/items/inquiries?filter[name][_eq]=$RUN&limit=-1&fields=id" | pick 'print(" ".join(str(x["id"]) for x in (d.get("data") or [])))'); do
  curl -s -o /dev/null -X DELETE "$CMS/items/inquiries/$i" -H "Authorization: Bearer $ADMIN" --max-time 30
done
check "검증 초안이 남지 않음" "0" \
  "$(cms "/items/posts?filter[slug][_eq]=$RUN&limit=1&fields=id" | pick 'print(len(d.get("data") or []))')"
check "검증 문의가 남지 않음" "0" \
  "$(cms "/items/inquiries?filter[name][_eq]=$RUN&limit=1&fields=id" | pick 'print(len(d.get("data") or []))')"

echo "== 기본값이 닫힌 쪽인가 =="
# 환경변수를 빠뜨린 배포에서 무엇이 열리는지 본다. `.env` 가 없는 곳에서
# 띄워야 한다 — ConfigModule 이 .env 를 읽으면 로컬 설정이 섞인다.
NOENV=$(mktemp -d)
BIN="/usr/bin:/bin:$(dirname "$(command -v node)")"
BOOT_PID=""
boot() {  # 환경변수들… → 떴으면 0, 죽었으면 1
  # exec 로 바꿔치기해서 $! 가 진짜 node 프로세스가 되게 한다. pkill 로
  # 잡으면 이 검사 바깥에서 돌고 있는 Nest 까지 같이 죽는다.
  ( cd "$NOENV" && exec env -i PATH="$BIN" HOME="$HOME" PORT=3907 "$@" \
      node "$HERE/dist/main.js" > "$NOENV/boot.log" 2>&1 ) &
  BOOT_PID=$!
  for _ in $(seq 1 30); do
    [ "$(curl -s -o /dev/null -w '%{http_code}' http://localhost:3907/api/content/posts --max-time 2 2>/dev/null)" != "000" ] && return 0
    kill -0 "$BOOT_PID" 2>/dev/null || return 1
    sleep 0.5
  done
  return 1
}
stop() { [ -n "$BOOT_PID" ] && kill "$BOOT_PID" 2>/dev/null; wait "$BOOT_PID" 2>/dev/null; BOOT_PID=""; }

# 게이트웨이 검증은 기본이 켜짐이고, 켜졌는데 공유 비밀이 없으면 안 뜬다.
boot && r=up || r=down; stop
check "게이트웨이 비밀 없이는 안 뜬다" "down" "$r"

boot IAM_GATEWAY_SECRET=gw && r=up || r=down
check "비밀을 주면 뜬다" "up" "$r"
check "게이트웨이 검증이 켜져 있다" "0" \
  "$(grep -c 'enforceGatewayOnly is false' "$NOENV/boot.log" 2>/dev/null || :)"
# 공개 API 는 @SkipGatewaySignature() 로 표시돼 있어야 통과한다.
# 표시를 빼면 403 이 된다(돌연변이로 확인함).
check "공개 콘텐츠 API 는 막히지 않는다" "not403" \
  "$([ "$(curl -s -o /dev/null -w '%{http_code}' http://localhost:3907/api/content/posts --max-time 10)" = "403" ] && echo 403 || echo not403)"
check "공개 문의 API 는 막히지 않는다" "not403" \
  "$([ "$(curl -s -o /dev/null -w '%{http_code}' -X POST http://localhost:3907/api/inquiry \
        -H 'Content-Type: application/json' -d '{}' --max-time 10)" = "403" ] && echo 403 || echo not403)"

stop

# TRUST_PROXY 를 문자열 그대로 넘기면 Express 는 홉 수가 아니라 신뢰 대역
# 목록으로 읽어서 아무것도 신뢰하지 않는다. 설정을 넣고도 증상이 그대로다.
# 숫자로 바뀌었는지는 IP 별 한도가 정말 갈리는지로 본다.
boot IAM_GATEWAY_SECRET=gw TRUST_PROXY=1 MAIL_RL_PER_MINUTE=2 && r=up || r=down
check "프록시 설정을 주면 뜬다" "up" "$r"
ask() {  # X-Forwarded-For → 상태코드
  curl -s -o /dev/null -w '%{http_code}' -X POST http://localhost:3907/api/inquiry \
    -H 'Content-Type: application/json' -H "X-Forwarded-For: $1" -d '{}' --max-time 10
}
for _ in 1 2; do ask 203.0.113.10 > /dev/null; done
check "같은 IP 는 한도에 걸린다" "429" "$(ask 203.0.113.10)"
check "다른 IP 는 한도를 나눠 쓰지 않는다" "not429" \
  "$([ "$(ask 203.0.113.20)" = "429" ] && echo 429 || echo not429)"
stop
rm -rf "$NOENV"


echo
if [ "${NA:-0}" -gt 0 ]; then echo "PASS=$PASS FAIL=$FAIL 판정불가=$NA"; else echo "PASS=$PASS FAIL=$FAIL"; fi
[ "$FAIL" -eq 0 ]
