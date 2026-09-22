# verify.sh 가 읽는다(단독 실행 안 함). check · na · pick · adm · admj · dbq · AUTH · RUN · API · HERE · CLEANUP 을 쓴다.
#
# 관리 화면 홈 요약(/api/admin/dashboard) · 문의 하나(/api/admin/inquiries/:id) ·
# 지워진 첨부·그림으로 저장하면 409(예전에는 FK 에 걸려 500).

echo "== 홈 요약 · 문의 하나 · 지워진 첨부 =="

DB_HR="${VERIFY_EMAIL%%@*}-dash-hr@drvalue.local"
dbq "insert into admin_users(email,role,name) values ('$DB_HR','hr','verify.sh dash hr') on conflict (email) do update set enabled=true, role='hr'" >/dev/null
CLEANUP+=("dbq \"delete from admin_users where email='$DB_HR'\" >/dev/null")
DB_HRS=$(cd "$HERE" && node -e "const {issueSession}=require('./dist/common/session/session-token.js');console.log(issueSession(process.env.ADMIN_SESSION_SECRET,{email:'$DB_HR',role:'hr',name:'verify dash hr',exp:Date.now()+600000}))")
hrget() { curl -s -H "Cookie: dv_admin=$DB_HRS" "$API/api/admin$1" --max-time 30; }

# 게시판 하나의 수(없으면 0). $1 = drafts|scheduled, $2 = 게시판
dcount() { adm "/dashboard" | pick "xs=((d or {}).get('data') or {}).get('$1') or []; print(next((x.get('count') for x in xs if x.get('board')=='$2'), 0))"; }
mine() { adm "/dashboard" | pick "i=((d or {}).get('data') or {}).get('inquiries') or {}; print(i.get('mine_open', ''))"; }

check "홈 요약 모양(전체 권한)" "yes" \
  "$(adm "/dashboard" | pick 'x=(d or {}).get("data") or {}; i=x.get("inquiries") or {}; print("yes" if isinstance(i.get("new"),int) and isinstance(i.get("mine_open"),int) and isinstance(x.get("drafts"),list) and isinstance(x.get("scheduled"),list) and isinstance(x.get("recent"),list) and len(x["recent"])<=5 else "no")')"

# 예약 글 하나를 만들면 초안·예약 수가 하나씩 는다.
D0=$(dcount drafts notice); S0=$(dcount scheduled notice)
TOMORROW=$(python3 -c 'import datetime; print((datetime.datetime.now(datetime.timezone.utc)+datetime.timedelta(days=1)).isoformat())')
DB_PID=$(SLUG="$RUN-dash" PA="$TOMORROW" python3 -c '
import json, os
print(json.dumps({"board": "notice", "slug": os.environ["SLUG"], "status": "draft", "published_date": "2026-01-01",
                  "publish_at": os.environ["PA"], "translations": [{"languages_code": "ko-KR", "title": "홈 요약 검사"}]}))' \
  | admj POST /posts | pick 'print((d.get("data") or {}).get("id",""))')
if [ -z "$DB_PID" ]; then
  na "홈 요약 수 세기" "검사 글을 못 만들었다"
else
  check "예약 글이 홈의 예약 수에 든다" "$((S0 + 1))" "$(dcount scheduled notice)"
  check "초안이 홈의 초안 수에 든다" "$((D0 + 1))" "$(dcount drafts notice)"
fi

# 내 담당 — 검사 계정에게 맡긴 접수 문의 하나.
M0=$(mine)
DB_IID=$(dbq "insert into inquiries(type,status,name,phone,email,message,consent,assignee_email) values ('기타','new','$RUN-dash','010-1111-2222','dash@example.com','홈 요약 검사',false,'$VERIFY_EMAIL') returning id")
CLEANUP+=("dbq \"delete from inquiries where name='$RUN-dash'\" >/dev/null")
check "내게 맡긴 문의가 내 담당 수에 든다" "$((M0 + 1))" "$(mine)"

# 인사는 채용 게시판만 · 문의와 최근 변경은 비어 온다.
check "인사 홈 요약: 문의·최근 변경은 null" "null null" \
  "$(hrget "/dashboard" | pick 'x=(d or {}).get("data") or {}; print(("null" if x.get("inquiries") is None else "set")+" "+("null" if x.get("recent") is None else "set"))')"
check "인사 홈 요약: 게시판 수는 채용만" "yes" \
  "$(hrget "/dashboard" | pick 'x=(d or {}).get("data") or {}; b={y.get("board") for y in (x.get("drafts") or [])+(x.get("scheduled") or [])}; print("yes" if b <= {"recruit"} and isinstance(x.get("drafts"),list) else "no")')"

# 문의 하나 — 목록 쪽에 없는 문의도 ?id= 로 연다.
check "문의 하나 200" "$RUN-dash" \
  "$(adm "/inquiries/$DB_IID" | pick 'print((d.get("data") or {}).get("name",""))')"
check "없는 문의 하나는 404" "404 ADMIN_INQUIRY_NOT_FOUND" \
  "$(adm "/inquiries/999999999" | pick 'print(str((d or {}).get("status"))+" "+str((d or {}).get("resultCode")))')"
check "인사는 문의 하나도 403" "403" \
  "$(curl -s -o /dev/null -w '%{http_code}' -H "Cookie: dv_admin=$DB_HRS" "$API/api/admin/inquiries/$DB_IID" --max-time 30)"

# 지워진 첨부·그림 — FK 에 걸려 500 이던 것. 사용자가 고칠 수 있으니 409 와 안내 문구.
GONE=$(python3 -c 'import uuid; print(uuid.uuid4())')
gonepost() { # board slug file_ids-json thumbnail
  B="$1" SLUG="$2" F="$3" T="$4" python3 -c '
import json, os
b = {"board": os.environ["B"], "slug": os.environ["SLUG"], "status": "draft", "published_date": "2026-01-01",
     "file_ids": json.loads(os.environ["F"]), "translations": [{"languages_code": "ko-KR", "title": "지워진 첨부 검사"}]}
if os.environ["T"]: b["thumbnail"] = os.environ["T"]
print(json.dumps(b))'
}
check "지워진 첨부로 만들면 409" "409 ADMIN_POST_FILE_GONE 첨부 파일 중 지워진 것이 있습니다. 첨부 목록을 확인해 주세요." \
  "$(gonepost notice "$RUN-gone" "[\"$GONE\"]" "" | admj POST /posts | pick 'print(str((d or {}).get("status"))+" "+str((d or {}).get("resultCode"))+" "+str((d or {}).get("message")))')"
check "지워진 첨부로 만들면 글이 안 생긴다" "0" "$(dbq "select count(*) from posts where slug='$RUN-gone'")"
if [ -n "$DB_PID" ]; then
  check "지워진 첨부로 고치면 409" "409" \
    "$(gonepost notice "$RUN-dash" "[\"$GONE\"]" "" | admj PUT "/posts/$DB_PID" | pick 'print((d or {}).get("status"))')"
fi
check "지워진 증서 그림으로 만들면 409" "409 ADMIN_POST_THUMB_GONE" \
  "$(gonepost patent "$RUN-gone-p" "[]" "$GONE" | admj POST /posts | pick 'print(str((d or {}).get("status"))+" "+str((d or {}).get("resultCode")))')"

[ -n "$DB_PID" ] && curl -s -o /dev/null -X DELETE -H "$AUTH" "$API/api/admin/posts/$DB_PID" --max-time 30
dbq "delete from inquiries where name='$RUN-dash'" >/dev/null
check "홈 요약 검사가 남긴 글·문의 0" "0 0" \
  "$(dbq "select (select count(*) from posts where slug like '$RUN-dash%' or slug like '$RUN-gone%') || ' ' || (select count(*) from inquiries where name='$RUN-dash')")"
