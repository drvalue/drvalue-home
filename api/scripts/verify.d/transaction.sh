# verify.sh 가 읽는다(단독 실행 안 함). check · na · pick · adm · admj · dbq · AUTH · RUN · API · CLEANUP 을 쓴다.
#
# @Transactional 이 정말 되돌리나. 글 고치기는 첨부를 먼저 떼고(deleteByPost) 새 목록을 붙인다.
# 붙이는 도중에 DB 가 실패하면 — 트랜잭션이 없으면 떼어 낸 첨부가 이미 사라진 뒤다. 되돌렸다면
# 원래 첨부와 이력이 그대로다. 응답은 사용자에게 하는 말(500)이다.
#
# 실패는 검사 전용 트리거로 만든다: 이 검사가 올린 파일 하나(TX_BAD)를 첨부로 넣으려 하면 DB 가 거부한다.
# (예전에는 없는 파일 id 로 FK 를 걸었지만, 이제 서비스가 저장 전에 409 로 막는다 — dashboard.sh.)

echo "== 트랜잭션 · 실패하면 되돌린다 =="

TX_TMP=$(mktemp -d)
printf 'tx' > "$TX_TMP/$RUN.txt"
printf 'bad' > "$TX_TMP/$RUN-bad.txt"
TX_FID=$(curl -s -X POST -H "$AUTH" -F "file=@$TX_TMP/$RUN.txt;type=text/plain" -F "title=$RUN-tx" "$API/api/admin/files" --max-time 60 \
  | pick 'print((d.get("data") or {}).get("id",""))')
TX_BAD=$(curl -s -X POST -H "$AUTH" -F "file=@$TX_TMP/$RUN-bad.txt;type=text/plain" -F "title=$RUN-tx-bad" "$API/api/admin/files" --max-time 60 \
  | pick 'print((d.get("data") or {}).get("id",""))')
rm -rf "$TX_TMP"

txpost() { # slug 파일id → 공지 초안 JSON
  SLUG="$1" FID="$2" python3 -c '
import json, os
print(json.dumps({"board": "notice", "slug": os.environ["SLUG"], "status": "draft",
                  "published_date": "2026-01-01", "file_ids": [os.environ["FID"]],
                  "translations": [{"languages_code": "ko-KR", "title": "트랜잭션 검사"}]}))'
}

if [ -z "$TX_FID" ] || [ -z "$TX_BAD" ]; then
  na "트랜잭션 구간 전체" "검사 파일을 못 올렸다"
else
  # 트리거 이름은 실행마다 다르다 — 여러 곳에서 동시에 돌려도 서로의 것을 안 건드린다.
  TX_TRG="verify_tx_$(printf '%s' "$RUN" | tr -c 'a-z0-9' '_')"
  dbq "CREATE FUNCTION $TX_TRG() RETURNS trigger LANGUAGE plpgsql AS 'BEGIN RAISE EXCEPTION ''verify tx''; END';
       CREATE TRIGGER $TX_TRG BEFORE INSERT ON posts_files FOR EACH ROW
         WHEN (NEW.directus_files_id = '$TX_BAD') EXECUTE PROCEDURE $TX_TRG();" >/dev/null
  CLEANUP+=("dbq \"DROP TRIGGER IF EXISTS $TX_TRG ON posts_files; DROP FUNCTION IF EXISTS $TX_TRG();\" >/dev/null")

  TX_PID=$(txpost "$RUN-tx" "$TX_FID" | admj POST /posts | pick 'print((d.get("data") or {}).get("id",""))')
  TX_REV=$(dbq "select count(*) from admin_revisions where collection='posts' and item_id='${TX_PID:-0}'")
  TX_RES=$(txpost "$RUN-tx" "$TX_BAD" \
    | curl -s -w '\n%{http_code}' -X PUT -H "$AUTH" -H 'Content-Type: application/json' --data-binary @- "$API/api/admin/posts/${TX_PID:-0}" --max-time 30)
  check "첨부를 붙이다 DB 가 실패하면 500" "500" "$(printf '%s' "$TX_RES" | tail -1)"
  check "그 500 은 사용자에게 하는 말" "ADMIN_POST_SAVE_UNKNOWN 글을 저장하지 못했습니다." \
    "$(printf '%s' "$TX_RES" | sed '$d' | pick 'print((d or {}).get("resultCode","")+" "+((d or {}).get("message") or "")[:14])')"
  check "되돌려서 원래 첨부가 남아 있다" "$TX_FID" \
    "$(dbq "select directus_files_id from posts_files where posts_id=${TX_PID:-0}")"
  check "실패한 고치기는 이력을 안 남긴다" "$TX_REV" \
    "$(dbq "select count(*) from admin_revisions where collection='posts' and item_id='${TX_PID:-0}'")"
  dbq "DROP TRIGGER IF EXISTS $TX_TRG ON posts_files; DROP FUNCTION IF EXISTS $TX_TRG();" >/dev/null
  check "검사 트리거가 남지 않음" "0" "$(dbq "select count(*) from pg_trigger where tgname='$TX_TRG'")"
  [ -n "$TX_PID" ] && curl -s -o /dev/null -X DELETE -H "$AUTH" "$API/api/admin/posts/$TX_PID" --max-time 30
  curl -s -o /dev/null -X DELETE -H "$AUTH" "$API/api/admin/files/$TX_FID?force=1" --max-time 30
  curl -s -o /dev/null -X DELETE -H "$AUTH" "$API/api/admin/files/$TX_BAD?force=1" --max-time 30
fi
check "트랜잭션 검사 글이 남지 않음" "0" "$(dbq "select count(*) from posts where slug='$RUN-tx'")"
