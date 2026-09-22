# verify.sh 가 읽는다(단독 실행 안 함). check · na · pick · adm · admj · dbq · AUTH · RUN · API · CLEANUP 을 쓴다.
#
# 게시판 본문 소독. 관리자 글이라도 공개 화면에 HTML 로 나간다 — 저장할 때 편집기가 만드는 태그만 남기고,
# 공개로 낼 때 한 번 더 거른다. 편집기 글은 바이트 그대로 돌아와야 한다(다듬다가 글을 바꾸면 안 된다).

echo "== 본문 소독 =="

SZ_SLUG="$RUN-sanitize"
spost() { # body [status] → 공지 JSON
  SLUG="$SZ_SLUG" BODY="$1" ST="${2:-draft}" python3 -c '
import json, os
print(json.dumps({"board": "notice", "slug": os.environ["SLUG"], "status": os.environ["ST"],
                  "published_date": "2026-01-01",
                  "translations": [{"languages_code": "ko-KR", "title": "본문 소독 검사", "body": os.environ["BODY"]}]}))'
}
body_of() { adm "/posts/$1" | pick 'ts=(d.get("data") or {}).get("translations") or []; print(next((t.get("body") or "" for t in ts if t.get("languages_code")=="ko-KR"), ""))'; }
bad_bits='import sys; b=sys.stdin.read().lower(); print(",".join(k for k in ["<script","onerror","javascript:","<iframe","<style","onclick"] if k in b) or "clean")'

EVIL='<p onclick="x()">가<script>alert(1)</script></p><img src="x" onerror="alert(1)"><p><a href="javascript:alert(1)">링크</a><a href="jav&#x61;script:alert(1)">둘</a></p><iframe src="https://evil"></iframe><style>p{}</style>'
SZ_ID=$(spost "$EVIL" | admj POST /posts | pick 'print((d.get("data") or {}).get("id",""))')
if [ -z "$SZ_ID" ]; then
  na "본문 소독 구간 전체" "검사 글을 못 만들었다"
else
  CLEANUP+=("curl -s -o /dev/null -X DELETE -H \"\$AUTH\" \"\$API/api/admin/posts/$SZ_ID\" --max-time 30")
  check "저장된 본문에 스크립트·이벤트·javascript: 가 없다" "clean" "$(body_of "$SZ_ID" | python3 -c "$bad_bits")"
  check "저장된 본문은 남길 글을 지킨다" "<p>가</p><p><a>링크</a><a>둘</a></p>" "$(body_of "$SZ_ID")"

  # 공개로 낸 본문도 깨끗해야 한다. DB 에 직접 써 넣어 저장 규칙을 비켜 간 경우를 흉내 낸다(되돌리기·옛 행).
  spost "$EVIL" published | admj PUT "/posts/$SZ_ID" >/dev/null
  dbq "update posts_translations set body='<p>가</p><script>alert(1)</script><img src=x onerror=alert(1)>' where posts=$SZ_ID" >/dev/null
  check "DB 에 직접 넣은 스크립트도 공개 API 는 안 낸다" "clean" \
    "$(curl -s "$API/api/content/posts/$SZ_SLUG" --max-time 30 | pick 'print((d.get("data") or {}).get("body") or "")' | python3 -c "$bad_bits")"

  # 편집기(Quill) 글은 바이트 그대로 저장되고 그대로 나간다.
  QUILL='<p>안녕하세요.</p><p><br></p><ol><li data-list="bullet">첫째</li></ol><p class="ql-align-center"><strong>굵게</strong>&nbsp;끝 &amp; &lt;tag&gt;</p><p><a href="https://x.com/a?b=1&amp;c=2" rel="noopener noreferrer" target="_blank">링크</a></p><h2>제목</h2><blockquote>인용</blockquote>'
  spost "$QUILL" published | admj PUT "/posts/$SZ_ID" >/dev/null
  check "편집기 글은 저장 뒤 바이트 그대로" "same" \
    "$(body_of "$SZ_ID" | Q="$QUILL" python3 -c 'import os,sys; print("same" if sys.stdin.read().rstrip("\n")==os.environ["Q"] else "changed")')"
  check "편집기 글은 공개 API 에서도 바이트 그대로" "same" \
    "$(curl -s "$API/api/content/posts/$SZ_SLUG" --max-time 30 | pick 'print((d.get("data") or {}).get("body") or "")' | Q="$QUILL" python3 -c 'import os,sys; print("same" if sys.stdin.read().rstrip("\n")==os.environ["Q"] else "changed")')"

  curl -s -o /dev/null -X DELETE -H "$AUTH" "$API/api/admin/posts/$SZ_ID" --max-time 30
  check "본문 소독 검사 글이 남지 않음" "0" "$(dbq "select count(*) from posts where slug='$SZ_SLUG'")"
fi
