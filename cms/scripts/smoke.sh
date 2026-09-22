#!/usr/bin/env bash
# 디알밸류 CMS(Directus) 스모크 테스트.
#
# 완료 판정을 자기신고가 아니라 실제 응답으로 받는다.
# 사전 조건: docker compose up -d && python3 scripts/schema.py
#            && python3 scripts/relations.py && python3 scripts/roles.py
#            && python3 scripts/seed.py
set -uo pipefail

BASE="${BASE:-http://localhost:3350}"
PASS=0
FAIL=0
RUN="s$(date +%s)"

# 만든 문서 id. 뒷정리가 "못 찾아서 0건" 인지 "정말 지워서 0건" 인지 구분하려면
# 패턴 검색이 아니라 실제 id 로 확인해야 한다.
MADE_POSTS=""
MADE_RECRUITS=""

# 주의: $( ) 안에 JSON 리터럴을 그대로 쓰면 \" 가 풀린 뒤 {a,b} 가
# 중괄호 확장으로 쪼개져 요청이 깨진다(INVALID_PAYLOAD).
# 본문은 반드시 printf 로 변수에 담아 "$BODY" 로 넘긴다.

pick() { python3 -c "
import json,sys
try: d=json.load(sys.stdin)
except Exception: print(''); sys.exit(0)
$1"; }

login() {
  curl -s -X POST "$BASE/auth/login" -H 'Content-Type: application/json' \
    -d "{\"email\":\"$1\",\"password\":\"drvalue1234!\"}" --max-time 60 \
    | pick 'print(d.get("data",{}).get("access_token",""))'
}

check() {
  if [ "$2" = "$3" ]; then
    printf '  PASS  %-46s %s\n' "$1" "$3"; PASS=$((PASS + 1))
  else
    printf '  FAIL  %-46s 기대=%s 실제=%s\n' "$1" "$2" "$3"; FAIL=$((FAIL + 1))
  fi
}

# Directus 는 권한 거부를 HTTP 403 으로도 400 으로도 돌려준다(엔드포인트에 따라).
# HTTP 코드만 보면 "거부됐다" 와 "요청이 잘못됐다" 를 구분하지 못하므로
# 응답 본문의 오류 코드를 본다.
#
# verdict <토큰|""> <METHOD> <경로> [본문]
#   → "ok" (성공) | "FORBIDDEN" | "FAILED_VALIDATION" | 그 밖의 오류 코드
verdict() {
  local tok="$1" method="$2" path="$3" body="${4:-}"
  local args=(-s -X "$method" "$BASE$path" --max-time 60)
  [ -n "$tok" ] && args+=(-H "Authorization: Bearer $tok")
  [ -n "$body" ] && args+=(-H 'Content-Type: application/json' -d "$body")
  curl "${args[@]}" | pick '
errs = d.get("errors")
if errs:
    print(errs[0].get("extensions", {}).get("code", "UNKNOWN_ERROR"))
else:
    print("ok")'
}

# 존재 확인용. 성공/실패만 필요할 때 쓴다.
code() {
  local tok="$1" method="$2" path="$3" body="${4:-}"
  local args=(-s -o /dev/null -w '%{http_code}' -X "$method" "$BASE$path" --max-time 60)
  [ -n "$tok" ] && args+=(-H "Authorization: Bearer $tok")
  [ -n "$body" ] && args+=(-H 'Content-Type: application/json' -d "$body")
  curl "${args[@]}"
}

# 공개 엔드포인트 주소는 public_api.py 가 public-endpoints.json 에 적어 둔다.
HERE="$(cd "$(dirname "$0")/.." && pwd)"
READ_EP=$(pick 'print(d.get("read",""))' < "$HERE/public-endpoints.json" 2>/dev/null)
INQ_EP=$(pick 'print(d.get("inquiry",""))' < "$HERE/public-endpoints.json" 2>/dev/null)

# 익명으로 공개 읽기 라우터를 호출한다. pub <resource> [쿼리1] [쿼리2]
pub() {
  curl -s -G "$BASE$READ_EP" --data-urlencode "resource=$1" ${2:+--data-urlencode "$2"} \
    ${3:+--data-urlencode "$3"} --max-time 60
}

echo "== 신원 =="
ADMIN=$(login admin@drvalue.co.kr)
MKT=$(login marketing@drvalue.co.kr)
HR=$(login hr@drvalue.co.kr)
check "관리자 로그인" "yes" "$([ -n "$ADMIN" ] && echo yes || echo no)"
check "마케팅 로그인" "yes" "$([ -n "$MKT" ] && echo yes || echo no)"
check "인사 로그인"   "yes" "$([ -n "$HR" ] && echo yes || echo no)"

echo "== 권한 분리 (8번) =="
BODY=$(printf '{"board":"notice","slug":"%s-hr"}' "$RUN")
check "인사가 게시판 작성 거부" "FORBIDDEN" "$(verdict "$HR" POST /items/posts "$BODY")"
BODY=$(printf '{"slug":"%s-recruit","translations":[{"languages_code":"ko-KR","title":"백엔드 개발자 채용"}]}' "$RUN")
RECRUIT_ID=$(curl -s -X POST "$BASE/items/recruits" -H "Authorization: Bearer $HR" \
  -H 'Content-Type: application/json' -d "$BODY" --max-time 60 \
  | pick 'print(d.get("data",{}).get("id",""))')
check "인사가 채용공고 작성 허용" "yes" "$([ -n "$RECRUIT_ID" ] && echo yes || echo no)"
[ -n "$RECRUIT_ID" ] && MADE_RECRUITS="$MADE_RECRUITS $RECRUIT_ID"

check "인사가 게시판 조회 거부" "FORBIDDEN" "$(verdict "$HR" GET /items/posts)"
check "마케팅이 게시판 조회 허용" "ok" "$(verdict "$MKT" GET /items/posts)"
check "마케팅이 채용공고 조회 거부" "FORBIDDEN" "$(verdict "$MKT" GET /items/recruits)"
check "마케팅이 사용자 관리 거부" "FORBIDDEN" \
  "$(verdict "$MKT" POST /users '{"email":"x@x.kr","password":"aaaa1234!"}')"
check "마케팅이 메뉴 수정 거부" "FORBIDDEN" \
  "$(verdict "$MKT" POST /items/menu_items '{"location":"header","label":"x"}')"
BODY=$(printf '{"location":"header","label":"%s"}' "$RUN")
check "관리자가 메뉴 수정 허용" "ok" "$(verdict "$ADMIN" POST /items/menu_items "$BODY")"

# 권한을 줬다고 실제로 읽히는 것은 아니다. 컬렉션 meta 가 없는 필드를
# sort_field 로 선언하면 관리자는 통과하지만 일반 역할은 403 이 난다(실측).
# 그래서 각 역할이 닿아야 할 컬렉션을 전부 훑는다.
echo "  -- 마케팅이 닿아야 할 컬렉션 --"
for c in pages page_blocks posts hero_slides popups home_settings seo_defaults \
         site_settings menu_items inquiries inquiry_notes languages \
         pages_translations page_blocks_translations posts_translations \
         hero_slides_translations popups_translations home_settings_translations \
         seo_defaults_translations site_settings_translations menu_items_translations; do
  check "마케팅 $c 조회" "ok" "$(verdict "$MKT" GET "/items/$c")"
done
echo "  -- 인사가 닿아야 할 컬렉션 --"
check "인사 recruits 조회" "ok" "$(verdict "$HR" GET /items/recruits)"
check "인사 recruits_translations 조회" "ok" "$(verdict "$HR" GET /items/recruits_translations)"
check "인사 languages 조회" "ok" "$(verdict "$HR" GET /items/languages)"
check "인사가 게시판 번역 조회 거부" "FORBIDDEN" "$(verdict "$HR" GET /items/posts_translations)"
echo "  -- 관리자는 전부 --"
for c in pages page_blocks posts recruits hero_slides popups menu_items \
         inquiries inquiry_notes home_settings seo_defaults site_settings; do
  check "관리자 $c 조회" "ok" "$(verdict "$ADMIN" GET "/items/$c")"
done

echo "== 익명 차단 =="
# 공개 읽기는 전부 플로우를 거친다. 아이템 테이블에 직접 닿는 길은 막혀 있어야
# 한다 — Core 는 권한에 조건을 못 걸어서, 한 번 열면 초안까지 같이 나간다.
for c in posts pages page_blocks recruits menu_items hero_slides popups; do
  check "익명 $c 직접 조회 봉인" "FORBIDDEN" "$(verdict "" GET "/items/$c")"
done
# 문의는 익명이 쓸 수 있다. 읽기까지 열리면 남의 연락처가 통째로 새어 나간다.
check "익명 inquiries 직접 조회 봉인"     "FORBIDDEN" "$(verdict "" GET /items/inquiries)"
check "익명 inquiry_notes 직접 조회 봉인" "FORBIDDEN" "$(verdict "" GET /items/inquiry_notes)"
check "익명 inquiries 직접 작성 봉인" "FORBIDDEN" \
  "$(verdict "" POST /items/inquiries '{"name":"익명","email":"a@b.c","message":"x"}')"
BODY=$(printf '{"board":"notice","slug":"%s-anon"}' "$RUN")
check "익명이 게시판 작성 거부" "FORBIDDEN" "$(verdict "" POST /items/posts "$BODY")"

echo "== 공개 엔드포인트 =="
check "엔드포인트 주소 파일이 있다" "yes" "$([ -n "$READ_EP" ] && echo yes || echo no)"
for r in pages posts-latest recruits hero-slides popups menu; do
  check "공개 $r 조회" "list" "$(pub "$r" | pick 'print("list" if isinstance(d,list) else "no")')"
done
check "공개 page 조회 (path 필요)" "1" \
  "$(pub page "path=/about" | pick 'print(len(d) if isinstance(d,list) else "no")')"
check "공개 posts 조회 (board 필요)" "list" \
  "$(pub posts "board=notice" | pick 'print("list" if isinstance(d,list) else "no")')"
# 페이지 본문은 별도 컬렉션이다. 역방향 별칭이 없으면 blocks 가 통째로 빠진다.
check "공개 page 가 본문 섹션을 포함" "yes" \
  "$(pub page "path=/about" | pick 'print("yes" if d and isinstance(d,list) and d[0].get("blocks") else "no")')"
# 라우터에 없는 이름은 통과하면 안 된다. 통과하면 사용자 테이블까지 읽힌다.
check "공개 라우터가 directus_users 거부" "none" \
  "$(pub directus_users | pick 'print("none" if not d else "leak")')"
check "공개 라우터가 빈 resource 거부" "none" \
  "$(pub "" | pick 'print("none" if not d else "leak")')"
check "필수 파라미터 없으면 거부" "none" \
  "$(pub page | pick 'print("none" if not d else "leak")')"

# 초안이 공개로 새는지가 이 구조의 존재 이유다. 실제로 하나 만들어서 확인한다.
BODY=$(printf '{"board":"notice","slug":"%s-draft","status":"draft","published_date":"%s","translations":[{"languages_code":"ko-KR","title":"공개 누출 검사"}]}' "$RUN" "$(date +%Y-%m-%d)")
ID_DRAFT=$(curl -s -X POST "$BASE/items/posts" -H "Authorization: Bearer $ADMIN" \
  -H 'Content-Type: application/json' -d "$BODY" --max-time 60 \
  | pick 'print(d.get("data",{}).get("id",""))')
MADE_POSTS="$MADE_POSTS $ID_DRAFT"
check "초안이 공개 목록에 안 나옴" "absent" \
  "$(pub posts "board=notice" | pick "
slugs = [x.get('slug') for x in d] if isinstance(d, list) else []
print('leak' if '$RUN-draft' in slugs else 'absent')")"

# 익명 쓰기는 문의 등록 하나뿐이다. Core 는 권한으로 필드를 못 좁히므로
# 라우터가 받을 필드를 정한다 — status 와 assignee 는 무시돼야 한다.
INQ_BODY=$(printf '{"name":"%s-문의","email":"a@b.c","message":"스모크","status":"closed","assignee":"00000000-0000-0000-0000-000000000000"}' "$RUN")
INQ_ID=$(curl -s -X POST "$BASE$INQ_EP" -H 'Content-Type: application/json' \
  -d "$INQ_BODY" --max-time 60 | pick 'print(d[0] if isinstance(d,list) and d else "")')
check "익명이 문의를 등록함" "yes" "$([ -n "$INQ_ID" ] && echo yes || echo no)"
check "익명이 넣은 status 는 무시됨" "new" \
  "$(curl -s "$BASE/items/inquiries/$INQ_ID?fields=status" -H "Authorization: Bearer $ADMIN" \
     --max-time 60 | pick 'print(d.get("data",{}).get("status",""))')"
check "익명이 넣은 담당자는 무시됨" "none" \
  "$(curl -s "$BASE/items/inquiries/$INQ_ID?fields=assignee" -H "Authorization: Bearer $ADMIN" \
     --max-time 60 | pick 'print(d.get("data",{}).get("assignee") or "none")')"

# 초안 개념이 없는 싱글톤은 플로우 없이 그냥 연다.
for c in site_settings home_settings seo_defaults; do
  check "공개 $c 직접 조회 허용" "ok" "$(verdict "" GET "/items/$c")"
done

# 썸네일을 받으려면 directus_files 를 열어야 하는데 Core 는 조건을 못 건다.
# 그래서 목록 열람까지 같이 열린다 — 숨겨진 상태가 아니라 알려진 상태로 둔다.
check "익명이 파일 목록을 조회할 수 있다(의도된 노출)" "ok" "$(verdict "" GET /files)"

echo "== IAM 로그인 다리 =="
# Core 는 SSO 를 막지만 확장은 막지 않는다. 다리는 기본으로 꺼져 있어야 한다 —
# 설정이 안 된 채로 켜져 있으면 관리 화면 로그인이 통째로 막힌다.
# 전체 흐름 검증은 scripts/verify-iam-bridge.sh 가 한다(가짜 IAM 필요).
check "다리 확장이 로드됨" "200" "$(code "" GET /iam-bridge/status)"
check "기본은 꺼져 있음" "False" \
  "$(curl -s "$BASE/iam-bridge/status" --max-time 30 | pick 'print(d.get("enabled"))')"
check "꺼진 다리로는 로그인 못 함" "503" "$(code "" GET /iam-bridge/login)"
# 다리가 꺼져 있는데 로그인 화면에 IAM 링크가 남아 있으면 누르는 사람마다
# 503 을 본다. 켜는 쪽(iam_bridge_sync.py)이 링크를 넣으므로, 꺼진 상태에서는
# 없어야 한다.
check "꺼진 상태에선 로그인 화면에 IAM 링크가 없다" "none" \
  "$(curl -s "$BASE/server/info" --max-time 30 | pick '
n = d.get("data",{}).get("project",{}).get("public_note") or ""
print("남아있음" if "/iam-bridge/login" in n else "none")')"

echo "== 백엔드 서비스 계정 =="
# Nest 가 Directus 를 읽을 계정. 정적 토큰은 발급 때 한 번만 보이므로 여기서는
# 토큰 대신 정책 모양을 본다 — 넓어지면 그게 위험이다.
SVC=$(curl -s -G "$BASE/policies" --data-urlencode "filter[name][_eq]=백엔드 읽기 전용" \
  --data-urlencode "fields=id,app_access,admin_access" -H "Authorization: Bearer $ADMIN" \
  --max-time 60 | pick 'a=d.get("data",[]); print(a[0]["id"] if a else "")')
if [ -n "$SVC" ]; then
  # app_access 가 true 가 되는 순간 seat 를 먹는다. 사람 자리가 하나 줄어든다.
  check "서비스 정책은 관리 화면 권한이 없다" "False" \
    "$(curl -s "$BASE/policies/$SVC?fields=app_access" -H "Authorization: Bearer $ADMIN" \
       --max-time 60 | pick 'print(d.get("data",{}).get("app_access"))')"
  PERMS=$(curl -s -G "$BASE/permissions" --data-urlencode "filter[policy][_eq]=$SVC" \
    --data-urlencode "limit=-1" --data-urlencode "fields=collection,action" \
    -H "Authorization: Bearer $ADMIN" --max-time 60)
  check "서비스 계정이 사용자 목록을 못 읽는다" "none" \
    "$(printf '%s' "$PERMS" | pick '
bad = [x for x in d.get("data",[]) if x["collection"].startswith("directus_") and x["collection"] != "directus_files"]
print("열림" if bad else "none")')"
  # 문의는 넣기만 한다. 읽기까지 열리면 Nest 가 털렸을 때 연락처가 통째로 샌다.
  check "서비스 계정이 문의를 못 읽는다" "none" \
    "$(printf '%s' "$PERMS" | pick '
bad = [x for x in d.get("data",[]) if x["collection"] in ("inquiries","inquiry_notes") and x["action"] != "create"]
print("열림" if bad else "none")')"
  # 서비스 계정이 사람 자리를 잡아먹으면 안 된다.
  # 주소는 scripts/service_account.py 의 EMAIL 과 같아야 한다.
  check "서비스 계정에 역할이 없다" "none" \
    "$(curl -s -G "$BASE/users" --data-urlencode "filter[email][_eq]=service@drvalue.co.kr" \
       --data-urlencode "fields=role" -H "Authorization: Bearer $ADMIN" --max-time 60 \
       | pick 'a=d.get("data",[]); print("none" if a and a[0].get("role") is None else "역할있음")')"
fi

echo "== 예약 실행기 로그 =="
# accountability 를 "all" 로 두면 1분마다 action=run 이 activity 와 revisions 에
# 쌓인다. 하루 1,440행씩 늘고 마케팅이 보는 변경 이력에도 섞인다.
check "크론 실행 자체는 기록하지 않음" "none" \
  "$(curl -s -G "$BASE/flows" --data-urlencode "filter[trigger][_eq]=schedule" \
     --data-urlencode "fields=accountability" -H "Authorization: Bearer $ADMIN" --max-time 60 \
     | pick 'a=d.get("data",[]); print("none" if a and a[0].get("accountability") is None else "logging")')"

echo "== 게시판 (2번) =="
# 공개 API 검사에서도 쓰므로 발행 상태로 만든다. draft 면 공개 조회에 안 잡힌다.
# published_date 는 필수다. 비우면 목록 정렬에서 맨 앞으로 튀기 때문에
# 스키마에서 not null 로 잠갔다(schema.py 참고). 여기서도 줘야 한다.
BODY=$(printf '{"board":"press","status":"published","slug":"%s-press","published_date":"%s","press_media":"한국경제TV","translations":[{"languages_code":"ko-KR","title":"보도자료 하나"},{"languages_code":"en-US","title":"A press release"}]}' "$RUN" "$(date +%Y-%m-%d)")
POST_ID=$(curl -s -X POST "$BASE/items/posts" -H "Authorization: Bearer $MKT" \
  -H 'Content-Type: application/json' -d "$BODY" --max-time 60 \
  | pick 'print(d.get("data",{}).get("id",""))')
check "마케팅이 보도자료 작성" "yes" "$([ -n "$POST_ID" ] && echo yes || echo no)"
[ -n "$POST_ID" ] && MADE_POSTS="$MADE_POSTS $POST_ID"

echo "== 다국어 (11번) =="
# 제목은 posts 가 아니라 posts_translations 에 있다. 언어마다 다른 값이
# 저장되는지가 요구사항이다 — 한 칸에 하나만 들어가면 다국어가 아니다.
TR=$(curl -s -G "$BASE/items/posts/$POST_ID" \
  --data-urlencode "fields=translations.languages_code,translations.title" \
  -H "Authorization: Bearer $MKT" --max-time 60 \
  | pick '
t = {x["languages_code"]: x["title"] for x in d.get("data",{}).get("translations",[])}
print(t.get("ko-KR","-") + "|" + t.get("en-US","-"))')
check "언어별로 다른 제목이 저장됨" "보도자료 하나|A press release" "$TR"
check "공개 API 가 한국어를 준다" "보도자료 하나" \
  "$(pub post "slug=$RUN-press" | pick '
print(d[0]["translations"][0]["title"] if d and d[0].get("translations") else "none")')"
check "공개 API 가 영어를 준다" "A press release" \
  "$(pub post "slug=$RUN-press" "lang=en-US" | pick '
print(d[0]["translations"][0]["title"] if d and d[0].get("translations") else "none")')"
# 목록에 없는 코드를 그대로 필터에 넣으면 빈 배열이 조용히 돌아간다.
check "모르는 언어는 한국어로 떨어짐" "보도자료 하나" \
  "$(pub post "slug=$RUN-press" "lang=ja-JP" | pick '
print(d[0]["translations"][0]["title"] if d and d[0].get("translations") else "none")')"

# 제목이 *_translations 로 옮겨간 뒤로 목록에 기본 열을 지정하지 않으면
# 담당자가 slug 만 보게 된다. 편집 화면 머리글(display_template)은 번역을
# 따라가지 못해 대안이 되지 못한다 — 모든 언어를 이어붙인다.
check "게시판 목록 기본 열에 제목이 있다" "yes" \
  "$(curl -s -G "$BASE/presets" --data-urlencode "filter[collection][_eq]=posts" \
     --data-urlencode "fields=user,role,layout_query" \
     -H "Authorization: Bearer $ADMIN" --max-time 60 | pick '
rows = [p for p in d.get("data", []) if not p.get("user") and not p.get("role")]
f = rows[0]["layout_query"]["tabular"]["fields"] if rows else []
print("yes" if "translations.title" in f else "no")')"

echo "== 변경 이력 (9번) =="
# 글이 번역 컬렉션으로 옮겨졌으므로 이력도 거기서 확인한다. posts 만 보면
# 제목을 고쳐도 아무 이력이 없는 것처럼 보인다.
TR_ID=$(curl -s -G "$BASE/items/posts_translations" \
  --data-urlencode "filter[posts][_eq]=$POST_ID" \
  --data-urlencode "filter[languages_code][_eq]=ko-KR" --data-urlencode "fields=id" \
  -H "Authorization: Bearer $ADMIN" --max-time 60 \
  | pick 'a=d.get("data",[]); print(a[0]["id"] if a else "")')
curl -s -o /dev/null -X PATCH "$BASE/items/posts_translations/$TR_ID" \
  -H "Authorization: Bearer $MKT" -H 'Content-Type: application/json' \
  -d '{"title":"보도자료 하나 수정본"}' --max-time 60
REVS=$(curl -s -G "$BASE/revisions" --data-urlencode "filter[item][_eq]=$TR_ID" \
  --data-urlencode "filter[collection][_eq]=posts_translations" \
  -H "Authorization: Bearer $ADMIN" --max-time 60 \
  | pick 'print(len(d.get("data",[])))')
check "수정 후 이력이 쌓임" "yes" "$([ "${REVS:-0}" -ge 2 ] && echo yes || echo no)"
WHO=$(curl -s -G "$BASE/activity" --data-urlencode "filter[item][_eq]=$TR_ID" \
  --data-urlencode "filter[collection][_eq]=posts_translations" \
  --data-urlencode "fields=user.email" \
  --data-urlencode "sort=-timestamp" --data-urlencode "limit=1" \
  -H "Authorization: Bearer $ADMIN" --max-time 60 \
  | pick 'a=d.get("data",[]); print((a[0].get("user") or {}).get("email","none") if a else "none")')
check "누가 고쳤는지 기록됨" "marketing@drvalue.co.kr" "$WHO"

# 이력이 쌓이는 것과 되돌릴 수 있는 것은 다른 얘기다. 실제로 되돌려 본다.
FIRST_REV=$(curl -s -G "$BASE/revisions" --data-urlencode "filter[item][_eq]=$TR_ID" \
  --data-urlencode "filter[collection][_eq]=posts_translations" --data-urlencode "sort=id" \
  --data-urlencode "limit=1" -H "Authorization: Bearer $ADMIN" --max-time 60 \
  | pick 'a=d.get("data",[]); print(a[0]["id"] if a else "")')
curl -s -o /dev/null -X POST "$BASE/utils/revert/$FIRST_REV" \
  -H "Authorization: Bearer $ADMIN" --max-time 60
check "이전 버전으로 되돌아감" "보도자료 하나" \
  "$(curl -s "$BASE/items/posts_translations/$TR_ID?fields=title" \
     -H "Authorization: Bearer $ADMIN" --max-time 60 \
     | pick 'print(d.get("data",{}).get("title",""))')"

echo "== 미디어 (4번) =="
# 권한을 준 것과 실제로 올라가는 것은 다르다. 진짜 파일을 하나 올린다.
PNG="$(mktemp -t smokepng).png"
python3 -c "
import base64, sys
open(sys.argv[1], 'wb').write(base64.b64decode(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='))
" "$PNG"
FILE_ID=$(curl -s -X POST "$BASE/files" -H "Authorization: Bearer $MKT" \
  -F "title=$RUN-image" -F "file=@$PNG" --max-time 120 \
  | pick 'print(d.get("data",{}).get("id",""))')
check "마케팅이 파일 업로드" "yes" "$([ -n "$FILE_ID" ] && echo yes || echo no)"
# 올라가도 공개 사이트가 못 받으면 썸네일이 전부 깨진다.
check "익명이 올라간 파일을 받음" "200" \
  "$(curl -s -o /dev/null -w '%{http_code}' "$BASE/assets/$FILE_ID" --max-time 60)"
check "익명 업로드 거부" "403" \
  "$(curl -s -o /dev/null -w '%{http_code}' -X POST "$BASE/files" -F "file=@$PNG" --max-time 120)"
rm -f "$PNG"

echo "== 예약 게시 (10번) =="
# 필드만 두면 아무 일도 안 일어난다. 시각이 지났을 때 실제로 상태가 바뀌는지 본다.
# 플로우는 1분 크론이라 최대 70초를 기다린다.
PAST=$(python3 -c 'import datetime;print((datetime.datetime.now(datetime.timezone.utc)-datetime.timedelta(minutes=5)).isoformat().replace("+00:00","Z"))')
FUTURE=$(python3 -c 'import datetime;print((datetime.datetime.now(datetime.timezone.utc)+datetime.timedelta(days=1)).isoformat().replace("+00:00","Z"))')

BODY=$(printf '{"board":"notice","slug":"%s-past","status":"scheduled","published_date":"%s","publish_at":"%s"}' "$RUN" "$(date +%Y-%m-%d)" "$PAST")
ID_PAST=$(curl -s -X POST "$BASE/items/posts" -H "Authorization: Bearer $ADMIN" \
  -H 'Content-Type: application/json' -d "$BODY" --max-time 60 | pick 'print(d.get("data",{}).get("id",""))')
BODY=$(printf '{"board":"notice","slug":"%s-future","status":"scheduled","published_date":"%s","publish_at":"%s"}' "$RUN" "$(date +%Y-%m-%d)" "$FUTURE")
ID_FUTURE=$(curl -s -X POST "$BASE/items/posts" -H "Authorization: Bearer $ADMIN" \
  -H 'Content-Type: application/json' -d "$BODY" --max-time 60 | pick 'print(d.get("data",{}).get("id",""))')
BODY=$(printf '{"board":"notice","slug":"%s-down","status":"published","published_date":"%s","unpublish_at":"%s"}' "$RUN" "$(date +%Y-%m-%d)" "$PAST")
ID_DOWN=$(curl -s -X POST "$BASE/items/posts" -H "Authorization: Bearer $ADMIN" \
  -H 'Content-Type: application/json' -d "$BODY" --max-time 60 | pick 'print(d.get("data",{}).get("id",""))')
MADE_POSTS="$MADE_POSTS $ID_PAST $ID_FUTURE $ID_DOWN"

status_of() {
  curl -s "$BASE/items/posts/$1?fields=status" -H "Authorization: Bearer $ADMIN" --max-time 60 \
    | pick 'print(d.get("data",{}).get("status",""))'
}

for _ in $(seq 1 14); do
  [ "$(status_of "$ID_PAST")" = "published" ] && [ "$(status_of "$ID_DOWN")" = "archived" ] && break
  sleep 6
done
check "시각 지난 예약이 자동 게시됨" "published" "$(status_of "$ID_PAST")"
check "예약 시각 전에는 그대로"      "scheduled" "$(status_of "$ID_FUTURE")"
check "예약한 시각에 자동으로 내려감" "archived"  "$(status_of "$ID_DOWN")"

echo "== 뒷정리 =="
MADE_TOTAL=$(printf '%s %s' "$MADE_POSTS" "$MADE_RECRUITS" | wc -w | tr -d ' ')
check "이번 실행이 만든 문서를 기록했다" "yes" "$([ "$MADE_TOTAL" -gt 0 ] && echo yes || echo no)"
for entry in "posts:$MADE_POSTS" "recruits:$MADE_RECRUITS"; do
  coll="${entry%%:*}"; ids="${entry#*:}"
  [ -z "$(printf '%s' "$ids" | tr -d ' ')" ] && continue
  for id in $ids; do
    curl -s -o /dev/null -X DELETE "$BASE/items/$coll/$id" -H "Authorization: Bearer $ADMIN" --max-time 60
  done
  alive=0
  for id in $ids; do
    [ "$(code "$ADMIN" GET "/items/$coll/$id")" = "200" ] && alive=$((alive + 1))
  done
  check "$coll 검사 문서가 남지 않음" "0" "$alive"
done
# 검사로 만든 문의와 파일도 지운다. 문의는 개인정보 칸이라 특히 남기면 안 된다.
if [ -n "${INQ_ID:-}" ]; then
  curl -s -o /dev/null -X DELETE "$BASE/items/inquiries/$INQ_ID" \
    -H "Authorization: Bearer $ADMIN" --max-time 60
  check "검사 문의가 남지 않음" "403" "$(code "$ADMIN" GET "/items/inquiries/$INQ_ID")"
fi
if [ -n "${FILE_ID:-}" ]; then
  curl -s -o /dev/null -X DELETE "$BASE/files/$FILE_ID" \
    -H "Authorization: Bearer $ADMIN" --max-time 60
  check "검사 파일이 남지 않음" "403" "$(code "$ADMIN" GET "/files/$FILE_ID")"
fi
# 검사로 만든 메뉴 항목도 지운다.
MENU_IDS=$(curl -s -G "$BASE/items/menu_items" --data-urlencode "filter[label][_eq]=$RUN" \
  -H "Authorization: Bearer $ADMIN" --max-time 60 | pick 'print(" ".join(str(x["id"]) for x in d.get("data",[])))')
for id in $MENU_IDS; do
  curl -s -o /dev/null -X DELETE "$BASE/items/menu_items/$id" -H "Authorization: Bearer $ADMIN" --max-time 60
done

echo
echo "PASS=$PASS FAIL=$FAIL"
[ "$FAIL" -eq 0 ]
