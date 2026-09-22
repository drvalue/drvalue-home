# verify.sh 가 읽는다(단독 실행 안 함). check · na · pick · adm · admj · dbq · AUTH · RUN · API · HERE · CLEANUP 를 쓴다.
#
# 페이지 글(오시는 길 시범). 스키마 검사 · 저장 → 공개 API · 변경 이력 · 범위(인사 403) ·
# 그림은 미디어 파일만, 공개 관문과 「쓰이는 곳」에 잡힌다. 끝나면 원래 글로 되돌린다.

echo "== 페이지 글 =="

PG_KEY="company-location"
PG_ORIG=$(adm "/pages/$PG_KEY" | pick 'import json; print(json.dumps(((d.get("data") or {}).get("languages") or {}).get("ko-KR",{}).get("content") or {}, ensure_ascii=False))')
# 고친 사람·때도 끝에 되돌린다 — 검사가 관리 목록의 「마지막 수정」을 제 이름으로 남기지 않게.
PG_BY=$(dbq "select coalesce(updated_by,'') from page_contents where key='$PG_KEY' and languages_code='ko-KR'")
PG_ON=$(dbq "select updated_on::text from page_contents where key='$PG_KEY' and languages_code='ko-KR'")
# 원래 글에 손을 대 PUT 본문을 만든다. $1 = 파이썬 식(c 를 고친다).
pg_body() { ORIG="$PG_ORIG" EDIT="$1" python3 -c '
import json, os
c = json.loads(os.environ["ORIG"])
exec(os.environ["EDIT"])
print(json.dumps({"languages_code": "ko-KR", "content": c}, ensure_ascii=False))'; }
pg_put() { admj PUT "/pages/$PG_KEY"; }
pub() { curl -s "$API/api/content/pages/$PG_KEY" --max-time 30; }

check "페이지 목록에 오시는 길" "yes" \
  "$(adm "/pages" | pick 'print("yes" if any(x.get("key")=="company-location" for x in (d.get("data") or [])) else "no")')"
if [ -z "$PG_ORIG" ] || [ "$PG_ORIG" = "{}" ]; then
  na "페이지 구간 전체" "오시는 길 씨앗이 없다 — db/migrations/0004 를 돌려라"
else
  check "편집 화면이 칸 구조를 준다" "company-location 3" \
    "$(adm "/pages/$PG_KEY" | pick 's=(d.get("data") or {}).get("schema") or {}; print(s.get("key"), len(s.get("fields") or []))')"
  check "씨앗 글이 스키마를 통과한다" "200" \
    "$(pg_body 'pass' | curl -s -o /dev/null -w '%{http_code}' -X PUT -H "$AUTH" -H 'Content-Type: application/json' --data-binary @- "$API/api/admin/pages/$PG_KEY" --max-time 30)"
  check "모르는 칸은 400" "PAGE_INVALID 알 수 없는 칸" \
    "$(pg_body 'c["shell"]["oops"]="x"' | pg_put | pick 'm=(d or {}).get("message",""); print((d or {}).get("resultCode"), "알 수 없는 칸" if "알 수 없는 칸" in m else m)')"
  check "너무 긴 칸은 400(칸 이름으로)" "PAGE_INVALID 「장 이름」 칸은 40자까지 입력할 수 있습니다." \
    "$(pg_body 'c["shell"]["kicker"]="가"*41' | pg_put | pick 'print((d or {}).get("resultCode"), (d or {}).get("message"))')"
  check "주소 줄을 비우면 400(몇 번째인지)" "「주소」 1번째 항목의 「주소 줄」 칸을 입력해 주세요." \
    "$(pg_body 'c["place"]["address"][0]["line"]=""' | pg_put | pick 'print((d or {}).get("message"))')"
  check "대표전화 형식이 틀리면 400" "대표전화는 숫자와 하이픈(-)만 입력해 주세요." \
    "$(pg_body 'c["place"]["tel"]="javascript:alert(1)"' | pg_put | pick 'print((d or {}).get("message"))')"

  pg_body "c['shell']['desc']='$RUN 검사 문장'" | pg_put >/dev/null
  check "저장하면 공개 API 에 바로 나온다" "yes" \
    "$(pub | pick "print('yes' if '$RUN 검사 문장' in ((d or {}).get('data') or {}).get('shell',{}).get('desc','') else 'no')")"
  check "공개 응답에 고친 사람이 없다" "none" \
    "$(pub | pick 'print("leak" if set(d or {}) - {"data", "language"} else "none")')"
  check "변경 이력이 남는다(pages · key/언어)" "yes" \
    "$(dbq "select case when count(*)>0 then 'yes' else 'no' end from admin_revisions where collection='pages' and item_id='$PG_KEY/ko-KR' and actor='$VERIFY_EMAIL'")"

  # 인사 범위는 페이지를 못 만진다.
  PG_HR="pg-hr-$RUN@test.local"
  dbq "insert into admin_users(email,role,name,enabled) values ('$PG_HR','hr','검증 인사',true)" >/dev/null
  CLEANUP+=("dbq \"delete from admin_users where email='$PG_HR'\" >/dev/null")
  PG_HRS=$(cd "$HERE" && node -e "const {issueSession}=require('./dist/common/session/session-token.js');console.log(issueSession(process.env.ADMIN_SESSION_SECRET,{email:'$PG_HR',role:'hr',exp:Date.now()+600000}))")
  check "인사는 페이지 목록 403" "403" \
    "$(curl -s -o /dev/null -w '%{http_code}' -H "Cookie: dv_admin=$PG_HRS" "$API/api/admin/pages" --max-time 30)"
  check "인사는 페이지 저장 403" "403" \
    "$(pg_body 'pass' | curl -s -o /dev/null -w '%{http_code}' -X PUT -H "Cookie: dv_admin=$PG_HRS" -H 'Content-Type: application/json' --data-binary @- "$API/api/admin/pages/$PG_KEY" --max-time 30)"
  dbq "delete from admin_users where email='$PG_HR'" >/dev/null

  # 그림: 미디어 파일만 · 공개 관문 · 쓰이는 곳 · 강제 삭제는 칸을 비운다.
  PG_TMP=$(mktemp -d)
  printf '\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\rIDATx\x9cc\xf8\x0f\x00\x00\x01\x01\x00\x05\x18\xd8N\x00\x00\x00\x00IEND\xaeB`\x82' > "$PG_TMP/$RUN.png"
  PG_FID=$(curl -s -X POST -H "$AUTH" -F "file=@$PG_TMP/$RUN.png;type=image/png" -F "title=$RUN-pg" "$API/api/admin/files" --max-time 60 \
    | pick 'print((d.get("data") or {}).get("id",""))')
  rm -rf "$PG_TMP"
  if [ -z "$PG_FID" ]; then
    na "페이지 그림" "검사 그림을 못 올렸다"
  else
    check "없는 파일을 넣으면 400" "PAGE_FILE_GONE" \
      "$(pg_body 'c["guide"]["photo"]={"id":"00000000-0000-4000-8000-000000000000","alt":"x"}' | pg_put | pick 'print((d or {}).get("resultCode"))')"
    pg_body "c['guide']['photo']={'id':'$PG_FID','alt':'건물'}" | pg_put >/dev/null
    check "페이지에 넣은 그림은 공개 주소로 열린다" "200" \
      "$(curl -s -o /dev/null -w '%{http_code}' "$API/api/content/assets/$PG_FID" --max-time 30)"
    check "페이지 그림도 「쓰이는 곳」에 잡힌다" "1" \
      "$(adm "/files?q=$RUN-pg" | pick "r=[x for x in (d.get('data') or []) if x.get('id')=='$PG_FID']; print(r[0].get('used') if r else '')")"
    check "쓰이는 그림은 그냥 못 지운다(409)" "409" \
      "$(curl -s -o /dev/null -w '%{http_code}' -X DELETE -H "$AUTH" "$API/api/admin/files/$PG_FID" --max-time 30)"
    curl -s -o /dev/null -X DELETE -H "$AUTH" "$API/api/admin/files/$PG_FID?force=1" --max-time 30
    check "강제로 지우면 페이지의 그림 칸이 빈다" "none" \
      "$(pub | pick 'p=((d or {}).get("data") or {}).get("guide",{}).get("photo"); print("none" if not p or not p.get("id") else p.get("id"))')"
    check "지운 그림은 공개 주소에서도 404" "404" \
      "$(curl -s -o /dev/null -w '%{http_code}' "$API/api/content/assets/$PG_FID" --max-time 30)"
  fi

  # 원래 글로 되돌린다.
  pg_body 'pass' | pg_put >/dev/null
  check "원래 글로 되돌렸다" "same" \
    "$(ORIG="$PG_ORIG" API="$API" python3 -c '
import json, os, sys, urllib.request
now = json.load(urllib.request.urlopen(os.environ["API"] + "/api/content/pages/company-location"))["data"]
print("same" if now == json.loads(os.environ["ORIG"]) else "diff")' 2>/dev/null)"
  [ -n "$PG_ON" ] && dbq "update page_contents set updated_by=nullif('$PG_BY',''), updated_on='$PG_ON'::timestamptz where key='$PG_KEY' and languages_code='ko-KR'" >/dev/null
  check "마지막 수정 사람도 원래대로" "${PG_BY:-none}" \
    "$(dbq "select coalesce(updated_by,'none') from page_contents where key='$PG_KEY' and languages_code='ko-KR'")"
fi
