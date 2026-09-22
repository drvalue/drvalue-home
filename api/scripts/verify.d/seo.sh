# verify.sh 가 읽는다(단독 실행 안 함). check · na · pick · adm · admj · dbq · AUTH · RUN · API · HERE · VERIFY_EMAIL · CLEANUP 를 쓴다.
#
# SEO(E10): 글의 검색 제목·설명·공유 그림·검색 제외가 저장되고 공개 API 로 나가나.
# 정적 장의 덮어쓰기(page_meta)가 저장·공개·되돌리기 되나. 인사 범위는 못 만진다.

echo "== SEO: 글 · 정적 장 =="

SEO_TMP=$(mktemp -d)
printf '\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\rIDATx\x9cc\xf8\x0f\x00\x00\x01\x01\x00\x05\x18\xd8N\x00\x00\x00\x00IEND\xaeB`\x82' > "$SEO_TMP/$RUN.png"
SEO_FID=$(curl -s -X POST -H "$AUTH" -F "file=@$SEO_TMP/$RUN.png;type=image/png" -F "title=$RUN-og" "$API/api/admin/files" --max-time 60 \
  | pick 'print((d.get("data") or {}).get("id",""))')
rm -rf "$SEO_TMP"

spost() { # slug status og_image no_index → 공지 JSON (검색 제목·설명 포함)
  SLUG="$1" ST="$2" OG="$3" NI="$4" python3 -c '
import json, os
print(json.dumps({"board": "notice", "slug": os.environ["SLUG"], "status": os.environ["ST"],
                  "published_date": "2026-01-01",
                  "og_image": os.environ["OG"] or None,
                  "no_index": os.environ["NI"] == "1",
                  "translations": [{"languages_code": "ko-KR", "title": "SEO 검사 글",
                                    "seo_title": "검색에 보일 제목", "seo_description": "검색에 보일 설명입니다."}]}))'
}

if [ -z "$SEO_FID" ]; then
  na "SEO 구간 전체" "검사 그림을 못 올렸다"
else
  SEO_SLUG="$RUN-seo"
  SEO_PID=$(spost "$SEO_SLUG" draft "$SEO_FID" 1 | admj POST /posts | pick 'print((d.get("data") or {}).get("id",""))')
  check "글: 공유 그림·검색 제외가 저장된다" "$SEO_FID True" \
    "$(adm "/posts/$SEO_PID" | pick 'x=d.get("data") or {}; print(str(x.get("og_image"))+" "+str(x.get("no_index")))')"
  check "글: 없는 공유 그림은 409" "409 ADMIN_POST_OG_IMAGE_NOT_FOUND" \
    "$(spost "$SEO_SLUG-x" draft 00000000-0000-4000-8000-000000000000 0 | admj POST /posts | pick 'print(str(d.get("status"))+" "+str(d.get("resultCode")))')"
  spost "$SEO_SLUG" published "$SEO_FID" 1 | admj PUT "/posts/$SEO_PID" >/dev/null
  check "공개: 검색 제목·공유 그림·검색 제외가 나간다" "검색에 보일 제목|/api/content/assets/$SEO_FID|True" \
    "$(curl -s "$API/api/content/posts/$SEO_SLUG" --max-time 30 | pick 'x=d.get("data") or {}; print("|".join([str(x.get("seo_title")), str(x.get("og_image")), str(x.get("no_index"))]))')"
  check "공개: 게시된 글의 공유 그림은 열린다" "200" \
    "$(curl -s -o /dev/null -w '%{http_code}' "$API/api/content/assets/$SEO_FID" --max-time 30)"
  check "공개: 글 목록에 updated_on" "yes" \
    "$(curl -s "$API/api/content/posts?board=notice&limit=100" --max-time 30 | pick "r=[x for x in (d.get('data') or []) if x.get('slug')=='$SEO_SLUG']; print('yes' if r and r[0].get('updated_on') else 'no')")"
  curl -s -o /dev/null -X DELETE -H "$AUTH" "$API/api/admin/posts/$SEO_PID" --max-time 30

  # ── 정적 장(page_meta). 실제 장 주소를 쓰되 끝나면 지워 코드의 값으로 돌린다.
  SEO_PATH="/page/company/intro"
  HAD_PM=$(dbq "select count(*) from page_meta where path='$SEO_PATH'")
  if [ "$HAD_PM" != "0" ]; then
    na "정적 장 구간" "$SEO_PATH 에 사람이 넣은 덮어쓰기가 있다 — 지우지 않으려고 건너뛴다"
  else
    pm() { P="$1" T="$2" OG="$3" python3 -c '
import json, os
print(json.dumps({"path": os.environ["P"], "no_index": False, "og_image": os.environ["OG"] or None,
                  "translations": [{"languages_code": "ko-KR", "title": os.environ["T"], "description": "검사로 덮은 설명입니다."}]}))'; }
    check "장: 저장" "200 $SEO_PATH" \
      "$(pm "$SEO_PATH" "검사 제목" "$SEO_FID" | curl -s -w ' %{http_code}' -X PUT -H "$AUTH" -H 'Content-Type: application/json' --data-binary @- "$API/api/admin/seo/pages" --max-time 30 \
         | python3 -c 'import sys,json; s=sys.stdin.read(); b,c=s.rsplit(" ",1); d=json.loads(b); print(c+" "+str((d.get("data") or {}).get("path")))')"
    check "장: 공개 목록에 제목·공유 그림" "검사 제목|/api/content/assets/$SEO_FID" \
      "$(curl -s "$API/api/content/page-meta" --max-time 30 | pick "r=[x for x in (d.get('data') or []) if x.get('path')=='$SEO_PATH']; print((str(r[0].get('title'))+'|'+str(r[0].get('og_image'))) if r else 'absent')")"
    check "장: 공유 그림은 공개 파일" "200" \
      "$(curl -s -o /dev/null -w '%{http_code}' "$API/api/content/assets/$SEO_FID" --max-time 30)"
    check "장: 미디어 「쓰는 곳」에 센다" "1" \
      "$(adm "/files?q=$RUN-og" | pick "r=[x for x in (d.get('data') or []) if x.get('id')=='$SEO_FID']; print(r[0].get('used') if r else '')")"
    check "장: 주소 형식이 틀리면 400" "400" \
      "$(pm "no-slash" "x" "" | curl -s -o /dev/null -w '%{http_code}' -X PUT -H "$AUTH" -H 'Content-Type: application/json' --data-binary @- "$API/api/admin/seo/pages" --max-time 30)"
    SEO_HR="${VERIFY_EMAIL%%@*}-seohr@drvalue.local"
    dbq "insert into admin_users(email,role,name,enabled) values ('$SEO_HR','hr','verify seo hr',true) on conflict (email) do update set enabled=true, role='hr'" >/dev/null
    CLEANUP+=("dbq \"delete from admin_users where email='$SEO_HR'\" >/dev/null")
    SEO_HRS=$(cd "$HERE" && node -e "const {issueSession}=require('./dist/common/session/session-token.js');console.log(issueSession(process.env.ADMIN_SESSION_SECRET,{email:'$SEO_HR',role:'hr',name:'verify seo hr',exp:Date.now()+600000}))")
    check "장: 인사 범위는 403" "403" \
      "$(curl -s -o /dev/null -w '%{http_code}' -H "Cookie: dv_admin=$SEO_HRS" "$API/api/admin/seo/pages" --max-time 30)"
    check "장: 되돌리기(지우기)" "200" \
      "$(curl -s -o /dev/null -w '%{http_code}' -X DELETE -H "$AUTH" "$API/api/admin/seo/pages?path=$SEO_PATH" --max-time 30)"
    check "장: 되돌리면 공개 목록에서 빠진다" "absent" \
      "$(curl -s "$API/api/content/page-meta" --max-time 30 | pick "print('present' if any(x.get('path')=='$SEO_PATH' for x in (d.get('data') or [])) else 'absent')")"
    check "장: 변경 이력 create·delete" "create,delete" \
      "$(dbq "select string_agg(action, ',' order by action) from admin_revisions where collection='page_meta' and item_id='$SEO_PATH' and actor='$VERIFY_EMAIL'")"
  fi
  curl -s -o /dev/null -X DELETE -H "$AUTH" "$API/api/admin/files/$SEO_FID?force=1" --max-time 30
  check "SEO 검사 그림이 남지 않는다" "404" \
    "$(curl -s -o /dev/null -w '%{http_code}' -H "$AUTH" "$API/api/admin/files/$SEO_FID" --max-time 30)"
fi
