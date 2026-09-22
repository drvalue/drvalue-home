# verify.sh 가 읽는다(단독 실행 안 함). check · na · pick · adm · admj · AUTH · RUN · API · dbq · HERE 를 쓴다.
#
# 변경 이력 · 되돌리기 · 권한(범위). 사람 행은 IAM 로그인 동기화를 흉내 내 dbq 로 넣고 끝에 지운다.
# 검사 계정 verify@drvalue.local(admin)은 verify.sh 본체가 넣고 지운다.

echo "== 변경 이력 · 되돌리기 =="

rpost() { # slug title → 본문 JSON (공지 초안)
  SLUG="$1" T="$2" python3 -c '
import json, os
print(json.dumps({"board": "notice", "slug": os.environ["SLUG"], "status": "draft",
                  "published_date": "2026-01-01",
                  "translations": [{"languages_code": "ko-KR", "title": os.environ["T"]}]}))'
}
ko_title='ts=(d.get("data") or {}).get("translations") or []; print(next((t.get("title") or "" for t in ts if t.get("languages_code")=="ko-KR"), ""))'
restore_code() { curl -s -o /dev/null -w '%{http_code}' -X POST -H "$AUTH" "$API/api/admin/revisions/$1/restore" --max-time 30; }
item_hist() { adm "/revisions/item/posts/$1"; }

RV="$RUN-rev"
RVID=$(rpost "$RV" "이력 A" | admj POST /posts | pick 'print((d.get("data") or {}).get("id",""))')
if [ -z "$RVID" ]; then
  na "이력 구간 전체" "검증 글을 못 만들었다"
else
  rpost "$RV" "이력 B" | admj PUT "/posts/$RVID" >/dev/null
  rpost "$RV" "이력 C" | admj PUT "/posts/$RVID" >/dev/null
  check "한 글의 이력 3건 (만듦·고침·고침)" "create,update,update" \
    "$(item_hist "$RVID" | pick 'print(",".join(r["action"] for r in reversed(d.get("data") or [])))')"
  check "목록에 무엇(제목)이 붙어 온다" "이력 C" \
    "$(item_hist "$RVID" | pick 'print((d.get("data") or [{}])[0].get("label",""))')"
  # 목록은 새 것부터 — 첫 수정(A→B)은 update 중 마지막
  FIRST_UPD=$(item_hist "$RVID" | pick 'rs=[r for r in (d.get("data") or []) if r["action"]=="update"]; print(rs[-1]["id"] if rs else "")')
  CREATE_REV=$(item_hist "$RVID" | pick 'rs=[r for r in (d.get("data") or []) if r["action"]=="create"]; print(rs[0]["id"] if rs else "")')
  check "첫 수정의 「전」은 이력 A" "이력 A" \
    "$(adm "/revisions/$FIRST_UPD" | pick 'b=(d.get("data") or {}).get("before") or {}; ts=b.get("translations") or []; print(next((t.get("title") or "" for t in ts if t.get("languages_code")=="ko-KR"), ""))')"
  check "첫 수정 전으로 되돌리기" "200" "$(restore_code "$FIRST_UPD")"
  check "되돌리면 제목이 이력 A" "이력 A" "$(adm "/posts/$RVID" | pick "$ko_title")"
  check "되돌리기도 이력 1건" "1" \
    "$(item_hist "$RVID" | pick 'print(sum(1 for r in (d.get("data") or []) if r["action"]=="restore"))')"
  check "만들기 이력은 되돌릴 수 없다" "400" "$(restore_code "$CREATE_REV")"

  # 지운 글 → 되돌리기 → 같은 주소로 다시 있다
  curl -s -o /dev/null -X DELETE -H "$AUTH" "$API/api/admin/posts/$RVID" --max-time 30
  check "지운 글은 없다" "404" "$(curl -s -o /dev/null -w '%{http_code}' -H "$AUTH" "$API/api/admin/posts/$RVID" --max-time 30)"
  DEL_REV=$(item_hist "$RVID" | pick 'rs=[r for r in (d.get("data") or []) if r["action"]=="delete"]; print(rs[0]["id"] if rs else "")')
  check "지우기 전으로 되돌리기" "200" "$(restore_code "$DEL_REV")"
  check "지운 글이 같은 주소로 돌아온다" "$RV" "$(adm "/posts/$RVID" | pick 'print((d.get("data") or {}).get("slug",""))')"
  check "돌아온 글의 제목도 그대로" "이력 A" "$(adm "/posts/$RVID" | pick "$ko_title")"

  # 주소가 다른 글에 넘어갔으면 되돌리지 않는다
  curl -s -o /dev/null -X DELETE -H "$AUTH" "$API/api/admin/posts/$RVID" --max-time 30
  DEL2=$(item_hist "$RVID" | pick 'rs=[r for r in (d.get("data") or []) if r["action"]=="delete"]; print(rs[0]["id"] if rs else "")')
  OTHER=$(rpost "$RV" "같은 주소의 다른 글" | admj POST /posts | pick 'print((d.get("data") or {}).get("id",""))')
  check "주소를 다른 글이 쓰면 409" "409" "$(restore_code "$DEL2")"
  [ -n "$OTHER" ] && curl -s -o /dev/null -X DELETE -H "$AUTH" "$API/api/admin/posts/$OTHER" --max-time 30
  check "검증 글이 남지 않음" "0" "$(dbq "select count(*) from posts where slug='$RV'")"
fi

FREV=$(adm "/revisions?collection=files" | pick 'print(((d.get("data") or [{}])[0]).get("id",""))')
if [ -n "$FREV" ]; then
  check "파일 이력은 되돌리지 않는다" "400" "$(restore_code "$FREV")"
else
  na "파일 이력은 되돌리지 않는다" "파일 이력이 아직 없다"
fi

echo "== 권한 (고칠 수 있는 범위) =="

mint() { (cd "$HERE" && node -e "const {issueSession}=require('./dist/common/session/session-token.js');console.log(issueSession(process.env.ADMIN_SESSION_SECRET,{email:'$1',role:'$2',exp:Date.now()+600000}))"); }
HRE="hr-$RUN@test.local"
OFFE="off-$RUN@test.local"
# IAM 로그인 동기화 흉내: 켜진 인사 한 명, IAM 에서 해제된 사람 한 명
dbq "insert into admin_users(email,role,name,enabled) values ('$HRE','hr','검증 인사',true),('$OFFE','marketing','검증 해제',false)" >/dev/null
HRS="Cookie: dv_admin=$(mint "$HRE" hr)"
code_as() { curl -s -o /dev/null -w '%{http_code}' -H "$1" "$API/api/admin$2" --max-time 30; }

check "권한 목록에 사람이 보인다" "yes" \
  "$(adm /users | pick 'print("yes" if any(u.get("email")=="'"$HRE"'" for u in (d.get("data") or [])) else "no")')"
check "해제된 사람은 enabled=false 로 보인다" "False" \
  "$(adm /users | pick 'print(next((u.get("enabled") for u in (d.get("data") or []) if u.get("email")=="'"$OFFE"'"), "없음"))')"
HNOTE=$(rpost "$RUN-hrnote" "인사 검사용 공지" | admj POST /posts | pick 'print((d.get("data") or {}).get("id",""))')
check "인사가 공지를 고치면 403" "403" \
  "$(rpost "$RUN-hrnote" "인사가 고침" | curl -s -o /dev/null -w '%{http_code}' -X PUT -H "$HRS" -H 'Content-Type: application/json' --data-binary @- "$API/api/admin/posts/$HNOTE" --max-time 30)"
check "인사가 채용 목록을 보면 200" "200" "$(code_as "$HRS" '/posts?board=recruit')"
check "인사가 권한 목록을 보면 403" "403" "$(code_as "$HRS" /users)"
check "인사가 전체 이력을 보면 403" "403" "$(code_as "$HRS" /revisions)"
[ -n "$HNOTE" ] && curl -s -o /dev/null -X DELETE -H "$AUTH" "$API/api/admin/posts/$HNOTE" --max-time 30

check "범위 바꾸기 (인사 → 마케팅)" "marketing" \
  "$(printf '{"role":"marketing"}' | admj PATCH "/users/$HRE" | pick 'print((d.get("data") or {}).get("role",""))')"
check "범위 변경이 이력에 남는다" "yes" \
  "$(adm "/revisions?collection=admin_users" | pick 'print("yes" if any(r.get("item_id")=="'"$HRE"'" for r in (d.get("data") or [])) else "no")')"
check "없는 범위는 400" "400" \
  "$(printf '{"role":"boss"}' | curl -s -o /dev/null -w '%{http_code}' -X PATCH -H "$AUTH" -H 'Content-Type: application/json' --data-binary @- "$API/api/admin/users/$HRE" --max-time 30)"
check "없는 사람은 404" "404" \
  "$(printf '{"role":"hr"}' | curl -s -o /dev/null -w '%{http_code}' -X PATCH -H "$AUTH" -H 'Content-Type: application/json' --data-binary @- "$API/api/admin/users/nobody-$RUN@test.local" --max-time 30)"
check "사람 추가(POST)는 없다" "404" \
  "$(printf '{"email":"x@y.z","role":"hr"}' | curl -s -o /dev/null -w '%{http_code}' -X POST -H "$AUTH" -H 'Content-Type: application/json' --data-binary @- "$API/api/admin/users" --max-time 30)"

# 마지막 「전부」: 검사 계정 말고 켜진 admin 이 있으면 그 사람을 건드리지 않고는 흉내 못 낸다.
ADMINS=$(dbq "select count(*) from admin_users where enabled and role='admin'")
if [ "$ADMINS" = "1" ]; then
  check "마지막 「전부」를 내리면 409" "409" \
    "$(printf '{"role":"marketing"}' | curl -s -o /dev/null -w '%{http_code}' -X PATCH -H "$AUTH" -H 'Content-Type: application/json' --data-binary @- "$API/api/admin/users/$VERIFY_EMAIL" --max-time 30)"
else
  na "마지막 「전부」를 내리면 409" "켜진 admin 이 $ADMINS 명 — 실제 사람을 끄지 않고는 못 잰다(규칙은 last-admin.test.mjs 가 본다)"
fi

# IAM 에서 해제된 사람(enabled=false)은 세션이 있어도 못 들어온다. 새 이메일이라 60초 캐시를 안 탄다.
check "IAM 에서 해제된 사람은 403" "403" "$(code_as "Cookie: dv_admin=$(mint "$OFFE" marketing)" /auth/me)"

dbq "delete from admin_users where email in ('$HRE','$OFFE')" >/dev/null
check "검사로 넣은 사람이 남지 않음" "0" "$(dbq "select count(*) from admin_users where email like '%$RUN@test.local'")"
