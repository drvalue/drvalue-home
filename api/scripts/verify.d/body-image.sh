# verify.sh 가 읽는다(단독 실행 안 함). check · na · pick · adm · admj · AUTH · RUN · API 를 쓴다.
#
# 글 게시판(공지·보도·뉴스)의 목록 썸네일은 본문의 첫 그림이다. 따로 올리는 칸이 없다.
# 관리 미리보기 주소는 초안의 그림도 보여 준다(공개 주소는 게시된 글의 그림만).

echo "== 본문 그림 · 목록 썸네일 =="

BI_TMP=$(mktemp -d)
# 1×1 PNG. 치수를 읽는 코드가 헤더를 보므로 진짜 PNG 여야 한다.
printf '\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\rIDATx\x9cc\xf8\x0f\x00\x00\x01\x01\x00\x05\x18\xd8N\x00\x00\x00\x00IEND\xaeB`\x82' > "$BI_TMP/$RUN.png"
BI_FID=$(curl -s -X POST -H "$AUTH" -F "file=@$BI_TMP/$RUN.png;type=image/png" -F "title=$RUN-body" "$API/api/admin/files" --max-time 60 \
  | pick 'print((d.get("data") or {}).get("id",""))')
rm -rf "$BI_TMP"

bpost() { # slug body [status] [첨부 파일 id] → 공지 JSON (기본 초안)
  SLUG="$1" BODY="$2" ST="${3:-draft}" FID="${4:-}" python3 -c '
import json, os
print(json.dumps({"board": "notice", "slug": os.environ["SLUG"], "status": os.environ["ST"],
                  "published_date": "2026-01-01",
                  "file_ids": [os.environ["FID"]] if os.environ["FID"] else [],
                  "translations": [{"languages_code": "ko-KR", "title": "본문 그림 검사", "body": os.environ["BODY"]}]}))'
}

if [ -z "$BI_FID" ]; then
  na "본문 그림 구간 전체" "검사 그림을 못 올렸다"
else
  BI_SLUG="$RUN-bodyimg"
  BI_PID=$(bpost "$BI_SLUG" "<p>앞</p><p><img src=\"/api/content/assets/$BI_FID\"></p>" | admj POST /posts \
    | pick 'print((d.get("data") or {}).get("id",""))')
  check "본문 첫 그림이 목록 썸네일" "$BI_FID" \
    "$(adm "/posts/$BI_PID" | pick 'print((d.get("data") or {}).get("thumbnail") or "")')"
  check "초안 그림은 관리 미리보기로 보인다" "200" \
    "$(curl -s -o /dev/null -w '%{http_code}' -H "$AUTH" "$API/api/admin/files/$BI_FID" --max-time 30)"
  check "초안 그림은 공개 주소로 안 나간다" "404" \
    "$(curl -s -o /dev/null -w '%{http_code}' "$API/api/content/assets/$BI_FID" --max-time 30)"
  # 게시하면 공개 목록의 썸네일이 공개 주소가 되고, 관문이 그 그림을 내 준다.
  bpost "$BI_SLUG" "<p>앞</p><p><img src=\"/api/content/assets/$BI_FID\"></p>" published | admj PUT "/posts/$BI_PID" >/dev/null
  check "게시하면 공개 목록 썸네일이 그 그림" "/api/content/assets/$BI_FID" \
    "$(curl -s "$API/api/content/posts?board=notice&limit=100" --max-time 30 | pick "r=[x for x in (d.get('data') or []) if x.get('slug')=='$BI_SLUG']; print(r[0].get('thumbnail') if r else 'absent')")"
  check "게시된 글의 본문 그림은 공개 주소로 열린다" "200" \
    "$(curl -s -o /dev/null -w '%{http_code}' "$API/api/content/assets/$BI_FID" --max-time 30)"
  bpost "$BI_SLUG" "<p>그림을 뺐다</p>" draft "$BI_FID" | admj PUT "/posts/$BI_PID" >/dev/null
  check "본문에서 그림을 빼면 썸네일도 빠진다" "none" \
    "$(adm "/posts/$BI_PID" | pick 'print((d.get("data") or {}).get("thumbnail") or "none")')"
  check "첨부로 물렸다" "1" "$(dbq "select count(*) from posts_files where posts_id=$BI_PID")"
  curl -s -o /dev/null -X DELETE -H "$AUTH" "$API/api/admin/posts/$BI_PID" --max-time 30
  # 첨부 표에 FK 가 없어 글을 지워도 행이 남았다(migrations/0003).
  check "글을 지우면 첨부 행도 사라진다" "0" "$(dbq "select count(*) from posts_files where posts_id=$BI_PID")"
  BI_DEL=$(adm "/revisions/item/posts/$BI_PID" | pick 'r=[x for x in (d.get("data") or []) if x.get("action")=="delete"]; print(r[0].get("id") if r else "")')
  curl -s -o /dev/null -X POST -H "$AUTH" "$API/api/admin/revisions/$BI_DEL/restore" --max-time 30
  check "지운 글을 되돌리면 첨부도 돌아온다" "1" "$(dbq "select count(*) from posts_files where posts_id=$BI_PID")"
  curl -s -o /dev/null -X DELETE -H "$AUTH" "$API/api/admin/posts/$BI_PID" --max-time 30
  curl -s -o /dev/null -X DELETE -H "$AUTH" "$API/api/admin/files/$BI_FID?force=1" --max-time 30
  dbq "delete from admin_revisions where collection='posts' and item_id='$BI_PID'" >/dev/null
  dbq "delete from admin_revisions where collection='files' and item_id='$BI_FID'" >/dev/null
  check "검사 그림이 남지 않는다" "404" \
    "$(curl -s -o /dev/null -w '%{http_code}' -H "$AUTH" "$API/api/admin/files/$BI_FID" --max-time 30)"
fi
