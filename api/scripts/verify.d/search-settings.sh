# verify.sh 가 읽는다(단독 실행 안 함). check · na · pick · adm · admj · dbq · RUN · API · HERE · VERIFY_EMAIL · CLEANUP 를 쓴다.
#
# 검색엔진 설정(site_search_settings 한 행): 저장이 공개 API 로 나가나 · 틀린 코드는 400 · 인사 범위 403 ·
# IndexNow 키는 어디에도 안 실린다. 지울 것이 없는 한 행이라 처음 값을 읽어 두고 끝에 그대로 되돌려 놓는다.

echo "== 검색엔진 설정 =="

SS_ORIG=$(adm /search-settings | pick 'import json
x=d.get("data") or {}
keys=["naver_site_verification","google_site_verification","bing_site_verification","ai_search_allowed","ai_training_allowed"]
print(json.dumps({k:x[k] for k in keys}) if all(k in x for k in keys) else "")')
if [ -z "$SS_ORIG" ]; then
  na "검색엔진 설정 구간 전체" "관리 GET /api/admin/search-settings 를 못 읽었다"
else
  # 되돌리기는 CLEANUP 에도 건다 — 중간에 끊겨도 사람이 넣은 값이 검사 값으로 남지 않게.
  CLEANUP+=("printf '%s' '$SS_ORIG' | admj PUT /search-settings >/dev/null")
  # 저장하면 고친 사람·시각이 검사 계정으로 바뀐다 — 관리 화면 「마지막 저장」이 검사 계정이 되지 않게 그것도 되돌린다
  # (위 PUT 뒤에 돈다. PUT 이 updated_on 을 다시 찍기 때문).
  SS_WHO=$(dbq "select coalesce(updated_by,'') from site_search_settings where id=1")
  SS_WHEN=$(dbq "select updated_on::text from site_search_settings where id=1")
  if [ -n "$SS_WHO" ]; then SS_WHO_SQL="'$SS_WHO'"; else SS_WHO_SQL="null"; fi
  CLEANUP+=("dbq \"update site_search_settings set updated_by=$SS_WHO_SQL, updated_on='$SS_WHEN' where id=1\" >/dev/null")

  check "관리: IndexNow 상태가 온다(켜짐·최근 목록)" "yes" \
    "$(adm /search-settings | pick 'n=(d.get("data") or {}).get("index_now") or {}; print("yes" if isinstance(n.get("enabled"),bool) and isinstance(n.get("recent"),list) else "no")')"

  SS_CODE="verify-${RUN##*-}"
  ssbody() { C="$1" S="$2" T="$3" python3 -c '
import json, os
print(json.dumps({"naver_site_verification": os.environ["C"], "google_site_verification": "",
                  "bing_site_verification": None,
                  "ai_search_allowed": os.environ["S"] == "1", "ai_training_allowed": os.environ["T"] == "1"}))'; }
  check "관리: 저장(두 스위치 끔 + 네이버 코드)" "$SS_CODE|False|False|None" \
    "$(ssbody "$SS_CODE" 0 0 | admj PUT /search-settings | pick 'x=d.get("data") or {}; print("|".join(str(x.get(k)) for k in ["naver_site_verification","ai_search_allowed","ai_training_allowed","google_site_verification"]))')"
  check "공개: 코드·스위치가 나가고 고친 사람은 안 나간다" "$SS_CODE|False|False|absent" \
    "$(curl -s "$API/api/content/search-settings" --max-time 30 | pick 'x=d.get("data") or {}; print("|".join([str(x.get("naver_site_verification")), str(x.get("ai_search_allowed")), str(x.get("ai_training_allowed")), "absent" if "updated_by" not in x else "present"]))')"
  check "공개: 칸은 여섯뿐(IndexNow 키·기록 없음)" "ai_search_allowed,ai_training_allowed,bing_site_verification,google_site_verification,index_now_enabled,naver_site_verification" \
    "$(curl -s "$API/api/content/search-settings" --max-time 30 | pick 'print(",".join(sorted((d.get("data") or {}).keys())))')"
  # 키 값은 출력하지 않는다 — 응답 본문에 들었는지만 본다.
  SS_KEY=$(cd "$HERE" && node -e "const {AppConfig}=require('./dist/common/config/app-config.js');process.stdout.write(AppConfig.indexNowKey||'')")
  if [ -n "$SS_KEY" ]; then
    check "공개·관리 응답에 IndexNow 키가 없다" "absent" \
      "$( { curl -s "$API/api/content/search-settings" --max-time 30; adm /search-settings; } | grep -qF "$SS_KEY" && echo present || echo absent)"
  else
    na "공개·관리 응답에 IndexNow 키가 없다" "이 환경에 INDEXNOW_KEY 가 없다(꺼짐)"
  fi
  check "관리: 태그째 붙인 코드는 400" "400" \
    "$(ssbody '<meta name="x" content="y">' 1 1 | curl -s -o /dev/null -w '%{http_code}' -X PUT -H "$AUTH" -H 'Content-Type: application/json' --data-binary @- "$API/api/admin/search-settings" --max-time 30)"
  check "관리: 400 문구가 칸을 짚는다" "yes" \
    "$(ssbody 'a b' 1 1 | admj PUT /search-settings | pick 'print("yes" if "네이버 확인 코드" in (d.get("message") or "") else "no")')"
  check "관리: 스위치를 빼면 400" "400" \
    "$(printf '%s' '{"naver_site_verification":""}' | curl -s -o /dev/null -w '%{http_code}' -X PUT -H "$AUTH" -H 'Content-Type: application/json' --data-binary @- "$API/api/admin/search-settings" --max-time 30)"
  SS_HR="${VERIFY_EMAIL%%@*}-sshr@drvalue.local"
  dbq "insert into admin_users(email,role,name,enabled) values ('$SS_HR','hr','verify ss hr',true) on conflict (email) do update set enabled=true, role='hr'" >/dev/null
  CLEANUP+=("dbq \"delete from admin_users where email='$SS_HR'\" >/dev/null")
  SS_HRS=$(cd "$HERE" && node -e "const {issueSession}=require('./dist/common/session/session-token.js');console.log(issueSession(process.env.ADMIN_SESSION_SECRET,{email:'$SS_HR',role:'hr',name:'verify ss hr',exp:Date.now()+600000}))")
  check "관리: 인사 범위는 403" "403" \
    "$(curl -s -o /dev/null -w '%{http_code}' -H "Cookie: dv_admin=$SS_HRS" "$API/api/admin/search-settings" --max-time 30)"
  check "관리: 세션 없으면 401" "401" \
    "$(curl -s -o /dev/null -w '%{http_code}' "$API/api/admin/search-settings" --max-time 30)"
  check "변경 이력: 저장이 한 줄(update · item site)" "update|site" \
    "$(dbq "select action||'|'||item_id from admin_revisions where collection='site_search_settings' and actor='$VERIFY_EMAIL' order by id desc limit 1")"
  check "되돌려 놓기: 처음 값" "$SS_ORIG" \
    "$(printf '%s' "$SS_ORIG" | admj PUT /search-settings | pick 'import json
x=d.get("data") or {}
print(json.dumps({k:x.get(k) for k in ["naver_site_verification","google_site_verification","bing_site_verification","ai_search_allowed","ai_training_allowed"]}))')"
fi
