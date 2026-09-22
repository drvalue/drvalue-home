# verify.sh 가 읽는다(단독 실행 안 함). check · na · pick · adm · admj · dbq · AUTH · RUN · API 를 쓴다.
#
# @Transactional 이 정말 되돌리나. 글 고치기는 첨부를 먼저 떼고(deleteByPost) 새 목록을 붙인다.
# 없는 파일 id 를 붙이면 FK(migrations/0003)에 걸려 실패한다 — 트랜잭션이 없으면 떼어 낸 첨부가
# 이미 사라진 뒤다. 되돌렸다면 원래 첨부와 이력이 그대로다. 응답은 사용자에게 하는 말(500)이다.

echo "== 트랜잭션 · 실패하면 되돌린다 =="

TX_TMP=$(mktemp -d)
printf 'tx' > "$TX_TMP/$RUN.txt"
TX_FID=$(curl -s -X POST -H "$AUTH" -F "file=@$TX_TMP/$RUN.txt;type=text/plain" -F "title=$RUN-tx" "$API/api/admin/files" --max-time 60 \
  | pick 'print((d.get("data") or {}).get("id",""))')
rm -rf "$TX_TMP"

txpost() { # slug 파일id → 공지 초안 JSON
  SLUG="$1" FID="$2" python3 -c '
import json, os
print(json.dumps({"board": "notice", "slug": os.environ["SLUG"], "status": "draft",
                  "published_date": "2026-01-01", "file_ids": [os.environ["FID"]],
                  "translations": [{"languages_code": "ko-KR", "title": "트랜잭션 검사"}]}))'
}

if [ -z "$TX_FID" ]; then
  na "트랜잭션 구간 전체" "검사 파일을 못 올렸다"
else
  TX_PID=$(txpost "$RUN-tx" "$TX_FID" | admj POST /posts | pick 'print((d.get("data") or {}).get("id",""))')
  TX_REV=$(dbq "select count(*) from admin_revisions where collection='posts' and item_id='${TX_PID:-0}'")
  TX_RES=$(txpost "$RUN-tx" "00000000-0000-4000-8000-000000000000" \
    | curl -s -w '\n%{http_code}' -X PUT -H "$AUTH" -H 'Content-Type: application/json' --data-binary @- "$API/api/admin/posts/${TX_PID:-0}" --max-time 30)
  check "없는 파일을 붙이면 500" "500" "$(printf '%s' "$TX_RES" | tail -1)"
  check "그 500 은 사용자에게 하는 말" "ADMIN_POST_SAVE_UNKNOWN 글을 저장하지 못했습니다." \
    "$(printf '%s' "$TX_RES" | sed '$d' | pick 'print((d or {}).get("resultCode","")+" "+((d or {}).get("message") or "")[:14])')"
  check "되돌려서 원래 첨부가 남아 있다" "$TX_FID" \
    "$(dbq "select directus_files_id from posts_files where posts_id=${TX_PID:-0}")"
  check "실패한 고치기는 이력을 안 남긴다" "$TX_REV" \
    "$(dbq "select count(*) from admin_revisions where collection='posts' and item_id='${TX_PID:-0}'")"
  [ -n "$TX_PID" ] && curl -s -o /dev/null -X DELETE -H "$AUTH" "$API/api/admin/posts/$TX_PID" --max-time 30
  curl -s -o /dev/null -X DELETE -H "$AUTH" "$API/api/admin/files/$TX_FID?force=1" --max-time 30
fi
check "트랜잭션 검사 글이 남지 않음" "0" "$(dbq "select count(*) from posts where slug='$RUN-tx'")"
