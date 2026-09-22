# verify.sh 가 읽는다(단독 실행 안 함). check · na · pick · adm · admj · dbq · AUTH · RUN · API · HERE · CLEANUP 를 쓴다.
#
# 메인 화면(E8). 메인 글(페이지 엔진 'home')의 구역 차례 규칙 · 기간 배너 · 팝업 ·
# 기간 거르기(예약·끝난 것은 공개에 없다) · 그림 관문(살아 있는 동안만 공개) · 쓰이는 곳 · 인사 403 · 변경 이력.
# 검사는 원래 배너·팝업을 목록에 그대로 두고 제 것만 더했다가, 끝에 원래 목록으로 되돌린다.

echo "== 메인 화면(배너·팝업·구역 차례) =="

HM_TMP=$(mktemp -d)
printf '\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\rIDATx\x9cc\xf8\x0f\x00\x00\x01\x01\x00\x05\x18\xd8N\x00\x00\x00\x00IEND\xaeB`\x82' > "$HM_TMP/$RUN.png"
HM_FID=$(curl -s -X POST -H "$AUTH" -F "file=@$HM_TMP/$RUN.png;type=image/png" -F "title=$RUN-home" "$API/api/admin/files" --max-time 60 \
  | pick 'print((d.get("data") or {}).get("id",""))')
rm -rf "$HM_TMP"

# 저장 DTO 모양으로 옮긴 원래 목록(JSON 배열). 검사 뒤 이것으로 되돌린다.
as_save='import json
rows = (d or {}).get("data") or []
keep = ("id","visible","link_href","starts_at","ends_at","width","dismiss_days")
out = []
for r in rows:
    x = {k: r[k] for k in keep if k in r}
    x["image"] = (r.get("image") or {}).get("id")
    x["translations"] = [{k: v for k, v in t.items()} for t in (r.get("translations") or [])]
    out.append(x)
print(json.dumps(out, ensure_ascii=False))'
HB_ORIG=$(adm "/home/banners" | pick "$as_save")
HP_ORIG=$(adm "/home/popups" | pick "$as_save")

# $1 = 앞에 붙일 배너(JSON 배열), $2 = 뒤에 붙일 배너 → {"items": [...]}
hm_items() { PRE="$1" POST="$2" ORIG="$3" python3 -c '
import json, os
print(json.dumps({"items": json.loads(os.environ["PRE"]) + json.loads(os.environ["ORIG"]) + json.loads(os.environ["POST"])}, ensure_ascii=False))'; }
at() { python3 -c "import datetime; print((datetime.datetime.now(datetime.timezone.utc)+datetime.timedelta(hours=$1)).isoformat())"; }
code_msg='print((d or {}).get("resultCode"))'

if [ -z "$HM_FID" ] || [ -z "$HB_ORIG" ] || [ -z "$HP_ORIG" ]; then
  na "메인 화면 구간 전체" "검사 그림을 못 올렸거나 배너·팝업 목록을 못 읽었다(migrations/0005)"
else
  # ── 메인 글(페이지 엔진)
  # 고친 사람·때도 끝에 되돌린다 — 검사가 관리 화면의 「마지막 수정」을 제 이름으로 남기지 않게.
  HM_BY=$(dbq "select coalesce(updated_by,'') from page_contents where key='home' and languages_code='ko-KR'")
  HM_ON=$(dbq "select updated_on::text from page_contents where key='home' and languages_code='ko-KR'")
  HM_CONTENT=$(adm "/pages/home" | pick 'import json; print(json.dumps(((d.get("data") or {}).get("languages") or {}).get("ko-KR",{}).get("content") or {}, ensure_ascii=False))')
  hm_page() { ORIG="$HM_CONTENT" EDIT="$1" python3 -c '
import json, os
c = json.loads(os.environ["ORIG"])
exec(os.environ["EDIT"])
print(json.dumps({"languages_code": "ko-KR", "content": c}, ensure_ascii=False))'; }
  check "메인 글 씨앗이 스키마를 통과한다" "200" \
    "$(hm_page 'pass' | curl -s -o /dev/null -w '%{http_code}' -X PUT -H "$AUTH" -H 'Content-Type: application/json' --data-binary @- "$API/api/admin/pages/home" --max-time 30)"
  check "구역이 두 번 오면 400" "PAGE_INVALID 겹칩니다" \
    "$(hm_page 'c["sections"][1]["section"]=c["sections"][0]["section"]' | admj PUT "/pages/home" | pick 'm=(d or {}).get("message",""); print((d or {}).get("resultCode"), "겹칩니다" if "겹칩니다" in m else m)')"
  check "모르는 구역 이름은 400" "PAGE_INVALID" \
    "$(hm_page 'c["sections"][0]["section"]="ad"' | admj PUT "/pages/home" | pick "$code_msg")"
  check "관리 목록의 메인은 /admin/home 으로 연다" "/admin/home" \
    "$(adm "/pages" | pick 'r=[x for x in (d.get("data") or []) if x.get("key")=="home"]; print(r[0].get("admin_path") if r else "")')"

  # ── 배너 규칙
  NOW_M1=$(at -1); NOW_P1=$(at 1); NOW_P24=$(at 24); NOW_M2=$(at -2)
  check "배너 그림이 없으면 400" "HOME_NEED_BANNER_IMAGE" \
    "$(hm_items '[{"visible":true,"translations":[]}]' '[]' "$HB_ORIG" | admj PUT "/home/banners" | pick "$code_msg")"
  # JSON 은 변수에 먼저 만든다 — "$( … )" 안에 \" 를 적으면 본문이 깨져 빈 요청이 나가고,
  # 그 400 이 우연히 기대와 맞아 통과한 적이 있다. 그래서 문구까지 본다.
  BAD_PERIOD="[{\"visible\":true,\"image\":\"$HM_FID\",\"starts_at\":\"$NOW_P1\",\"ends_at\":\"$NOW_M1\",\"translations\":[]}]"
  BAD_LINK="[{\"visible\":true,\"image\":\"$HM_FID\",\"link_href\":\"javascript:alert(1)\",\"translations\":[]}]"
  check "끝이 시작보다 앞이면 400" "HOME_BAD_PERIOD" \
    "$(hm_items "$BAD_PERIOD" '[]' "$HB_ORIG" | admj PUT "/home/banners" | pick "$code_msg")"
  check "javascript: 링크는 400(링크 문구)" "COMMON_INVALID_INPUT 링크는" \
    "$(hm_items "$BAD_LINK" '[]' "$HB_ORIG" | admj PUT "/home/banners" | pick 'print((d or {}).get("resultCode"), ((d or {}).get("message") or "")[:3])')"
  check "미디어에 없는 그림은 409" "HOME_IMAGE_GONE" \
    "$(hm_items '[{"visible":true,"image":"00000000-0000-4000-8000-000000000000","translations":[]}]' '[]' "$HB_ORIG" | admj PUT "/home/banners" | pick "$code_msg")"

  # 살아 있는 배너(맨 앞) + 내일 시작하는 배너(맨 뒤).
  LIVE="[{\"visible\":true,\"image\":\"$HM_FID\",\"link_href\":\"/page/support/notice\",\"starts_at\":\"$NOW_M1\",\"ends_at\":\"$NOW_P1\",\"translations\":[{\"languages_code\":\"ko-KR\",\"title\":\"$RUN 배너\",\"alt\":\"검사\",\"link_label\":\"공지 보기\"}]}]"
  SOON="[{\"visible\":true,\"image\":\"$HM_FID\",\"starts_at\":\"$NOW_P24\",\"translations\":[{\"languages_code\":\"ko-KR\",\"title\":\"$RUN 예약\"}]}]"
  HB_SAVED=$(hm_items "$LIVE" "$SOON" "$HB_ORIG" | admj PUT "/home/banners")
  check "배너 저장 — 원래 것 + 2" "yes" \
    "$(ORIG="$HB_ORIG" SAVED="$HB_SAVED" python3 -c '
import json, os
print("yes" if len(json.loads(os.environ["SAVED"]).get("data") or []) == len(json.loads(os.environ["ORIG"])) + 2 else "no")')"
  check "상태: 첫째 진행 중 · 끝 예약" "live scheduled" \
    "$(printf '%s' "$HB_SAVED" | pick 'r=d.get("data") or []; print(r[0].get("state"), r[-1].get("state"))')"
  HB_LIVE_ID=$(printf '%s' "$HB_SAVED" | pick 'print((d.get("data") or [{}])[0].get("id",""))')
  check "공개 메인의 배너는 살아 있는 첫째" "$RUN 배너 /page/support/notice 공지 보기" \
    "$(curl -s "$API/api/content/home" --max-time 30 | pick 'b=(d.get("data") or {}).get("banner") or {}; l=b.get("link") or {}; print(b.get("title"), l.get("href"), l.get("label"))')"
  check "예약 배너는 공개에 없다" "none" \
    "$(curl -s "$API/api/content/home" --max-time 30 | pick "print('leak' if '$RUN 예약' in str(d) else 'none')")"
  check "살아 있는 배너 그림은 관문으로 열린다" "200" \
    "$(curl -s -o /dev/null -w '%{http_code}' "$API/api/content/assets/$HM_FID" --max-time 30)"
  check "쓰이는 곳에 배너가 잡힌다" "2" \
    "$(adm "/files?q=$RUN-home" | pick "r=[x for x in (d.get('data') or []) if x.get('id')=='$HM_FID']; print(r[0].get('used') if r else '')")"

  # 같은 id 로 끝을 과거로 → 끝난 배너. 공개에서 빠지고 그림도 닫힌다.
  ENDED="[{\"id\":$HB_LIVE_ID,\"visible\":true,\"image\":\"$HM_FID\",\"starts_at\":\"$NOW_M2\",\"ends_at\":\"$NOW_M1\",\"translations\":[{\"languages_code\":\"ko-KR\",\"title\":\"$RUN 배너\"}]}]"
  HB_SAVED2=$(hm_items "$ENDED" "$SOON" "$HB_ORIG" | admj PUT "/home/banners")
  check "id 를 주면 같은 배너를 고친다" "$HB_LIVE_ID ended" \
    "$(printf '%s' "$HB_SAVED2" | pick 'r=(d.get("data") or [{}])[0]; print(r.get("id"), r.get("state"))')"
  check "끝난 배너는 공개에 없다" "none" \
    "$(curl -s "$API/api/content/home" --max-time 30 | pick "print('leak' if '$RUN 배너' in str(d) else 'none')")"

  # ── 팝업
  check "팝업에 그림도 글도 없으면 400" "HOME_NEED_POPUP_CONTENT" \
    "$(hm_items '[{"visible":true,"width":480,"dismiss_days":1,"translations":[]}]' '[]' "$HP_ORIG" | admj PUT "/home/popups" | pick "$code_msg")"
  check "창 폭이 범위 밖이면 400(창 폭 문구)" "COMMON_INVALID_INPUT 창 폭" \
    "$(hm_items '[{"visible":true,"width":2000,"dismiss_days":1,"translations":[{"languages_code":"ko-KR","title":"x"}]}]' '[]' "$HP_ORIG" | admj PUT "/home/popups" | pick 'print((d or {}).get("resultCode"), ((d or {}).get("message") or "")[:3])')"
  POP="[{\"visible\":true,\"image\":\"$HM_FID\",\"link_href\":\"/page/support/notice\",\"starts_at\":\"$NOW_M1\",\"width\":480,\"dismiss_days\":1,\"translations\":[{\"languages_code\":\"ko-KR\",\"title\":\"$RUN 팝업\",\"body\":\"<p>안내</p><script>alert(1)</script><img src=x onerror=alert(1)>\",\"alt\":\"검사\"}]}]"
  HP_SAVED=$(hm_items "$POP" '[]' "$HP_ORIG" | admj PUT "/home/popups")
  HP_ID=$(printf '%s' "$HP_SAVED" | pick 'print((d.get("data") or [{}])[0].get("id",""))')
  check "공개 팝업에 나온다(뜨는 차례 첫째)" "$RUN 팝업 1 480" \
    "$(curl -s "$API/api/content/home" --max-time 30 | pick 'p=((d.get("data") or {}).get("popups") or [{}])[0]; print(p.get("title"), p.get("dismiss_days"), p.get("width"))')"
  check "팝업 내용에서 script·onerror 가 빠진다" "clean" \
    "$(curl -s "$API/api/content/home" --max-time 30 | pick 'p=((d.get("data") or {}).get("popups") or [{}])[0]; b=p.get("body") or ""; print("dirty" if ("script" in b or "onerror" in b) else "clean")')"
  POP2="[{\"id\":$HP_ID,\"visible\":true,\"image\":\"$HM_FID\",\"starts_at\":\"$NOW_M1\",\"width\":400,\"dismiss_days\":7,\"translations\":[{\"languages_code\":\"ko-KR\",\"title\":\"$RUN 팝업2\"}]}]"
  check "id 를 주면 같은 팝업을 고친다(「보지 않기」 기록 유지)" "$HP_ID 7" \
    "$(hm_items "$POP2" '[]' "$HP_ORIG" | admj PUT "/home/popups" | pick 'r=(d.get("data") or [{}])[0]; print(r.get("id"), r.get("dismiss_days"))')"
  POP3="[{\"id\":$HP_ID,\"visible\":true,\"image\":\"$HM_FID\",\"starts_at\":\"$NOW_M2\",\"ends_at\":\"$NOW_M1\",\"width\":400,\"dismiss_days\":7,\"translations\":[{\"languages_code\":\"ko-KR\",\"title\":\"$RUN 팝업2\"}]}]"
  hm_items "$POP3" '[]' "$HP_ORIG" | admj PUT "/home/popups" >/dev/null
  check "끝난 팝업은 공개에 없다" "none" \
    "$(curl -s "$API/api/content/home" --max-time 30 | pick "print('leak' if '$RUN 팝업' in str(d) else 'none')")"
  check "끝난 배너·팝업뿐이면 그림이 닫힌다(예약 배너 그림도)" "404" \
    "$(curl -s -o /dev/null -w '%{http_code}' "$API/api/content/assets/$HM_FID" --max-time 30)"

  # ── 범위 · 이력
  HM_HR="hm-hr-$RUN@test.local"
  dbq "insert into admin_users(email,role,name,enabled) values ('$HM_HR','hr','검증 인사',true)" >/dev/null
  CLEANUP+=("dbq \"delete from admin_users where email='$HM_HR'\" >/dev/null")
  HM_HRS=$(cd "$HERE" && node -e "const {issueSession}=require('./dist/common/session/session-token.js');console.log(issueSession(process.env.ADMIN_SESSION_SECRET,{email:'$HM_HR',role:'hr',exp:Date.now()+600000}))")
  check "인사는 배너 목록 403" "403" \
    "$(curl -s -o /dev/null -w '%{http_code}' -H "Cookie: dv_admin=$HM_HRS" "$API/api/admin/home/banners" --max-time 30)"
  check "인사는 팝업 저장 403" "403" \
    "$(printf '{"items":[]}' | curl -s -o /dev/null -w '%{http_code}' -X PUT -H "Cookie: dv_admin=$HM_HRS" -H 'Content-Type: application/json' --data-binary @- "$API/api/admin/home/popups" --max-time 30)"
  dbq "delete from admin_users where email='$HM_HR'" >/dev/null
  check "변경 이력이 남는다(home_banners · home_popups)" "2" \
    "$(dbq "select count(distinct collection) from admin_revisions where collection in ('home_banners','home_popups') and item_id='list' and actor='$VERIFY_EMAIL'")"
  check "공개 메인은 무인증" "200" \
    "$(curl -s -o /dev/null -w '%{http_code}' "$API/api/content/home" --max-time 30)"

  # ── 되돌리기: 원래 목록 · 검사 그림
  printf '{"items":%s}' "$HB_ORIG" | admj PUT "/home/banners" >/dev/null
  printf '{"items":%s}' "$HP_ORIG" | admj PUT "/home/popups" >/dev/null
  check "배너·팝업이 원래 수로 돌아왔다" "yes" \
    "$(ORIG_B="$HB_ORIG" ORIG_P="$HP_ORIG" B="$(adm /home/banners)" P="$(adm /home/popups)" python3 -c '
import json, os
ok = len(json.loads(os.environ["B"]).get("data") or []) == len(json.loads(os.environ["ORIG_B"])) and \
     len(json.loads(os.environ["P"]).get("data") or []) == len(json.loads(os.environ["ORIG_P"]))
print("yes" if ok else "no")')"
  hm_page 'pass' | admj PUT "/pages/home" >/dev/null
  [ -n "$HM_ON" ] && dbq "update page_contents set updated_by=nullif('$HM_BY',''), updated_on='$HM_ON' where key='home' and languages_code='ko-KR'" >/dev/null
  curl -s -o /dev/null -X DELETE -H "$AUTH" "$API/api/admin/files/$HM_FID?force=1" --max-time 30
  check "검사 그림이 남지 않는다" "404" \
    "$(curl -s -o /dev/null -w '%{http_code}' -H "$AUTH" "$API/api/admin/files/$HM_FID" --max-time 30)"
fi
