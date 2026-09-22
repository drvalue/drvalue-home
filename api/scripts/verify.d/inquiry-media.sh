# 문의 담당자·메모·이력 + 미디어 목록·형식·쓰이는 곳·강제 삭제.
# verify.sh 가 source 한다 — check · na · pick · adm · admj · dbq · AUTH · RUN · API · HERE 를 쓴다.
#
# 담당자는 admin_users 에 있어야 한다. 검사 계정(verify@)을 담당자로 쓰려고 잠시 넣고,
# 인사 역할을 재려고 verify-hr@ 도 잠시 넣는다. 이 절 끝에서 둘 다 지운다 — 빈 표에 사람이
# 남으면 첫 관리자 자동 등록이 막힌다. 중간에 죽어도 EXIT 트랩이 지운다.

echo "== 문의: 담당자 · 메모 · 이력 =="
IM_V="$VERIFY_EMAIL"
IM_HR="${VERIFY_EMAIL%%@*}-hr@drvalue.local"
IM_HAD_V=$(dbq "select count(*) from admin_users where email='$IM_V'")
dbq "insert into admin_users(email,role,name) values ('$IM_V','admin','verify.sh') on conflict (email) do update set enabled=true, role='admin'" >/dev/null
dbq "insert into admin_users(email,role,name) values ('$IM_HR','hr','verify.sh hr') on conflict (email) do update set enabled=true, role='hr'" >/dev/null
CLEANUP+=("dbq \"delete from admin_users where email='$IM_HR'\" >/dev/null")

# 공개 /api/inquiry 는 분당 5회 한도를 앞 절이 거의 다 썼다 — 표본은 DB 에 바로 넣는다.
IM_IID=$(dbq "insert into inquiries(type,status,name,phone,email,message,consent) values ('기타','new','$RUN-inq','010-1111-2222','im@example.com','담당자 검사',false) returning id")
if [ -z "$IM_IID" ]; then
  na "문의 담당자 절 전체" "표본 문의를 못 넣었다"
else
  check "담당자 후보에 검사 계정이 있다" "yes" \
    "$(adm "/inquiries/assignees" | pick "print('yes' if any(x.get('email')=='$IM_V' for x in (d.get('data') or [])) else 'no')")"
  check "담당자 지정" "$IM_V" \
    "$(printf '{"assignee_email":"%s"}' "$IM_V" | admj PATCH "/inquiries/$IM_IID" | pick 'print((d.get("data") or {}).get("assignee_email",""))')"
  check "「내 담당」 필터에 걸린다" "yes" \
    "$(adm "/inquiries?assignee=me&q=$RUN-inq" | pick "print('yes' if any(x.get('id')==$IM_IID for x in (d.get('data') or [])) else 'no')")"
  check "「미지정」 필터에는 없다" "no" \
    "$(adm "/inquiries?assignee=none&q=$RUN-inq" | pick "print('yes' if any(x.get('id')==$IM_IID for x in (d.get('data') or [])) else 'no')")"
  check "권한 목록에 없는 담당자는 400" "400" \
    "$(printf '{"assignee_email":"nobody@example.com"}' | curl -s -o /dev/null -w '%{http_code}' -X PATCH -H "$AUTH" -H 'Content-Type: application/json' --data-binary @- "$API/api/admin/inquiries/$IM_IID" --max-time 30)"
  check "메모 저장" "검사 메모" \
    "$(printf '{"note":"검사 메모","status":"in_progress"}' | admj PATCH "/inquiries/$IM_IID" | pick 'print((d.get("data") or {}).get("note",""))')"
  check "메모와 함께 상태도 바뀐다" "in_progress" \
    "$(adm "/inquiries?q=$RUN-inq" | pick "r=[x for x in (d.get('data') or []) if x.get('id')==$IM_IID]; print(r[0].get('status') if r else '')")"
  check "담당자 비우기(null)" "none" \
    "$(printf '{"assignee_email":null}' | admj PATCH "/inquiries/$IM_IID" | pick 'print((d.get("data") or {}).get("assignee_email") or "none")')"
  check "고칠 때마다 이력이 남는다" "3" \
    "$(dbq "select count(*) from admin_revisions where collection='inquiries' and item_id='$IM_IID' and action='update'")"
  check "이력에 이전 값이 있다" "new" \
    "$(dbq "select before->>'status' from admin_revisions where collection='inquiries' and item_id='$IM_IID' order by id asc limit 1")"

  # 인사(hr)는 문의를 못 본다.
  IM_HRS=$(cd "$HERE" && node -e "const {issueSession}=require('./dist/common/session/session-token.js');console.log(issueSession(process.env.ADMIN_SESSION_SECRET,{email:'$IM_HR',role:'hr',name:'verify hr',exp:Date.now()+600000}))")
  check "인사 역할은 문의 목록 403" "ADMIN_AUTH_FORBIDDEN" \
    "$(curl -s -H "Cookie: dv_admin=$IM_HRS" "$API/api/admin/inquiries" --max-time 30 | pick 'print(d.get("resultCode",""))')"
  # 화면은 게시판 규칙을 따로 들지 않고 /me 의 boards 만 본다.
  check "인사 /me 는 채용 게시판만" "recruit" \
    "$(curl -s -H "Cookie: dv_admin=$IM_HRS" "$API/api/admin/auth/me" --max-time 30 | pick 'print(",".join((d.get("data") or {}).get("boards") or []))')"
  check "전체 권한 /me 는 게시판 9개" "9" \
    "$(adm "/auth/me" | pick 'print(len((d.get("data") or {}).get("boards") or []))')"

  curl -s -o /dev/null -X DELETE -H "$AUTH" "$API/api/admin/inquiries/$IM_IID" --max-time 30
  check "검사 문의가 남지 않음" "0" "$(dbq "select count(*) from inquiries where id=$IM_IID")"
  dbq "delete from admin_revisions where collection='inquiries' and item_id='$IM_IID'" >/dev/null
fi

echo "== 미디어: 목록 · 형식 · 쓰이는 곳 · 강제 삭제 =="
IM_TMP=$(mktemp -d)
# 내용은 상관없다 — 형식은 multipart 의 type 으로 정해진다(서버는 목록·상한만 본다).
printf '\x00\x00\x00\x18ftypmp42verify' > "$IM_TMP/$RUN.mp4"
printf 'zip' > "$IM_TMP/$RUN.zip"
IM_FID=$(curl -s -X POST -H "$AUTH" -F "file=@$IM_TMP/$RUN.mp4;type=video/mp4" -F "title=$RUN-video" "$API/api/admin/files" --max-time 60 \
  | pick 'print((d.get("data") or {}).get("id",""))')
check "허용 안 된 형식은 400" "400" \
  "$(curl -s -o /dev/null -w '%{http_code}' -X POST -H "$AUTH" -F "file=@$IM_TMP/$RUN.zip;type=application/zip" "$API/api/admin/files" --max-time 60)"
rm -rf "$IM_TMP"
if [ -z "$IM_FID" ]; then
  na "미디어 절 전체" "mp4 업로드가 안 됐다"
else
  check "영상 필터에 나온다" "yes" \
    "$(adm "/files?type=video&q=$RUN-video" | pick "print('yes' if any(x.get('id')=='$IM_FID' for x in (d.get('data') or [])) else 'no')")"
  check "그림 필터에는 없다" "no" \
    "$(adm "/files?type=image&q=$RUN-video" | pick "print('yes' if any(x.get('id')=='$IM_FID' for x in (d.get('data') or [])) else 'no')")"
  check "이름 바꾸기" "$RUN-renamed" \
    "$(printf '{"title":"%s"}' "$RUN-renamed" | admj PATCH "/files/$IM_FID" | pick 'print((d.get("data") or {}).get("title",""))')"
  check "바뀐 이름으로 찾힌다" "yes" \
    "$(adm "/files?q=$RUN-renamed" | pick "print('yes' if any(x.get('id')=='$IM_FID' for x in (d.get('data') or [])) else 'no')")"

  # 글(초안) 본문에 넣고 지워 본다. 공지의 대표 이미지는 본문 첫 그림이라 둘 다 물린다 — 쓰는 글은 1곳.
  IM_PID=$(printf '{"board":"notice","status":"draft","slug":"%s-media","published_date":"%s","translations":[{"languages_code":"ko-KR","title":"미디어 검사","body":"<p><img src=\\"/api/content/assets/%s\\"></p>"}]}' \
      "$RUN" "$(date +%Y-%m-%d)" "$IM_FID" | admj POST "/posts" | pick 'print((d.get("data") or {}).get("id",""))')
  if [ -z "$IM_PID" ]; then
    na "쓰이는 파일 삭제" "검사 글을 못 만들었다"
  else
    check "쓰이는 곳 수가 1 이다" "1" \
      "$(adm "/files?q=$RUN-renamed" | pick "r=[x for x in (d.get('data') or []) if x.get('id')=='$IM_FID']; print(r[0].get('used') if r else '')")"
    check "쓰이는 파일은 그냥 못 지운다(409)" "409" \
      "$(curl -s -o /dev/null -w '%{http_code}' -X DELETE -H "$AUTH" "$API/api/admin/files/$IM_FID" --max-time 30)"
    check "force 로는 지워진다" "200" \
      "$(curl -s -o /dev/null -w '%{http_code}' -X DELETE -H "$AUTH" "$API/api/admin/files/$IM_FID?force=1" --max-time 30)"
    check "글에서 그림이 빠졌다" "none" \
      "$(adm "/posts/$IM_PID" | pick 'print((d.get("data") or {}).get("thumbnail") or "none")')"
    check "본문의 그림 태그도 빠졌다" "none" \
      "$(adm "/posts/$IM_PID" | pick "ts=(d.get('data') or {}).get('translations') or []; print('left' if any('$IM_FID' in (t.get('body') or '') for t in ts) else 'none')")"
    check "지운 파일은 미리보기도 404" "404" \
      "$(curl -s -o /dev/null -w '%{http_code}' -H "$AUTH" "$API/api/admin/files/$IM_FID" --max-time 30)"
    curl -s -o /dev/null -X DELETE -H "$AUTH" "$API/api/admin/posts/$IM_PID" --max-time 30
    dbq "delete from admin_revisions where collection='posts' and item_id='$IM_PID'" >/dev/null
  fi
  check "파일 올리기·이름·지우기가 이력에 남는다" "create,delete,update" \
    "$(dbq "select string_agg(action, ',' order by action) from (select distinct action from admin_revisions where collection='files' and item_id='$IM_FID') a")"
  dbq "delete from admin_revisions where collection='files' and item_id='$IM_FID'" >/dev/null
fi

# 이 절에서 넣은 계정을 되돌린다. verify@ 는 원래 있었으면(=verify.sh 가 넣었으면) 둔다.
dbq "delete from admin_users where email='$IM_HR'" >/dev/null
[ "$IM_HAD_V" = "0" ] && dbq "delete from admin_users where email='$IM_V'" >/dev/null
