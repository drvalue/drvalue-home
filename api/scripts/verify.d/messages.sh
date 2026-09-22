# verify.sh 가 읽는다(단독 실행 안 함). check · pick · adm · admj · AUTH · RUN · API · VERIFY_EMAIL 을 쓴다.
#
# 에러 응답이 사용자에게 보일 말인가. 본문 모양 { data:null, status, resultCode, message } ·
# message 는 합니다체 · 로그인 실패는 JSON 이 아니라 로그인 화면으로 돌아간다.

echo "== 에러 응답 · 문구 =="

polite='m=(d or {}).get("message") or ""; print("ok" if m.endswith(("니다.","세요.")) else "bad:"+m[:40])'

check "없는 주소는 COMMON_NOT_FOUND" "COMMON_NOT_FOUND" \
  "$(curl -s "$API/api/nope-$RUN" --max-time 30 | pick 'print((d or {}).get("resultCode",""))')"
check "없는 주소 문구가 합니다체" "ok" \
  "$(curl -s "$API/api/nope-$RUN" --max-time 30 | pick "$polite")"
check "에러 본문에 data:null · status" "yes" \
  "$(curl -s "$API/api/nope-$RUN" --max-time 30 | pick 'print("yes" if d and d.get("data") is None and d.get("status")==404 else "no")')"
check "무인증 관리 API 문구가 합니다체" "ok" \
  "$(curl -s "$API/api/admin/posts" --max-time 30 | pick "$polite")"
check "검증 실패는 DTO 의 한국어 문구" "400 권한 범위는" \
  "$(printf '{"role":"owner"}' | admj PATCH "/users/$VERIFY_EMAIL" | pick 'print(str((d or {}).get("status"))+" "+((d or {}).get("message") or "")[:6])')"
check "없는 글 문구가 합니다체" "ok" \
  "$(adm "/posts/999999999" | pick "$polite")"
check "로그인 콜백 실패는 로그인 화면으로" "302 /admin/login?error=ADMIN_AUTH_BAD_STATE" \
  "$(curl -s -o /dev/null -w '%{http_code} %{redirect_url}' "$API/api/admin/auth/callback?code=x&state=forged-$RUN" --max-time 30 \
     | sed -E 's#https?://[^/]+##')"
