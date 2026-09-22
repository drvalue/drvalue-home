# verify.sh 가 source 한다 — check · na · pick · adm · admj · dbq · AUTH · API · HERE · VERIFY_EMAIL · CLEANUP 을 쓴다.
#
# 메뉴 관리(E9). 관리 API 로 메뉴 전체를 읽어 저장 본문으로 바꾸고, 한 칸을 숨겨 공개 메뉴에서
# 빠지는지 본 뒤 원래대로 되돌린다. 공유 DB 의 메뉴를 잠깐 바꾸므로 중간에 죽어도 EXIT 트랩이 되돌린다.

echo "== 메뉴 =="

MN_TMP=$(mktemp -d)
cat > "$MN_TMP/body.py" <<'PY'
# 관리 트리({top, footer, updated_on}) → 저장 본문. MODE 로 한 군데를 바꾼다.
import json, os, sys
tree = json.load(open(os.environ["TREE"]))
mode = os.environ.get("MODE", "same")
def labels(n):
    return [{"languages_code": t["languages_code"], "label": t["label"], "description": t.get("description")} for t in n["translations"]]
def child(c):
    return {"href": c["href"], "visible": c["visible"], "hidden_in_dropdown": c["hidden_in_dropdown"], "translations": labels(c)}
body = {
    "top": [{"href": n["href"], "visible": n["visible"], "match": n.get("match"), "translations": labels(n),
             "children": [child(c) for c in n["children"]]} for n in tree["top"]],
    "footer": [child(c) for c in tree["footer"]],
}
if mode == "hide-news":
    for n in body["top"]:
        for c in n["children"]:
            if c["href"] == "/page/support/news":
                c["visible"] = False
elif mode == "deep":
    body["top"][0]["children"][0]["children"] = [{"href": "/x", "visible": True, "translations": [{"languages_code": "ko-KR", "label": "셋째 단"}]}]
elif mode == "bad-href":
    body["top"][0]["href"] = "javascript:alert(1)"
elif mode == "no-ko":
    body["top"][0]["translations"] = [{"languages_code": "en-US", "label": "Company"}]
elif mode == "bad-match":
    body["top"][0]["match"] = ["page/company/"]
print(json.dumps(body, ensure_ascii=False))
PY
adm "/menu" | pick 'import json; print(json.dumps((d or {}).get("data") or {}, ensure_ascii=False))' > "$MN_TMP/orig.json"
mn_body() { TREE="$MN_TMP/orig.json" MODE="$1" python3 "$MN_TMP/body.py"; }
mn_put() { mn_body "$1" | admj PUT "/menu"; }
pub_labels() { curl -s "$API/api/content/menu" --max-time 30 | pick 'print(",".join(c["label"] for n in (d.get("data") or {}).get("top", []) for c in n["children"]))'; }

if ! python3 -c "import json,sys; t=json.load(open('$MN_TMP/orig.json')); sys.exit(0 if t.get('top') else 1)" 2>/dev/null; then
  na "메뉴 절 전체" "관리 메뉴를 못 읽었다(표가 비었나 — migrations/0006)"
else
  # 중간에 죽어도 원래 메뉴로 되돌린다. 앞에 붙인다 — 뒷정리 목록은 순서대로 돌고, 본체가 먼저
  # 검사 계정과 그 이력을 지우면 되돌리기가 막히거나 이력 한 줄이 남는다. 정상으로 되돌렸으면 건너뛴다.
  MN_RESTORED=0
  CLEANUP=("[ \"\$MN_RESTORED\" = 1 ] || { TREE=\"$MN_TMP/orig.json\" MODE=same python3 \"$MN_TMP/body.py\" | curl -s -o /dev/null -X PUT -H \"$AUTH\" -H 'Content-Type: application/json' --data-binary @- \"$API/api/admin/menu\" --max-time 30; }; rm -rf \"$MN_TMP\"" "${CLEANUP[@]}")

  check "공개 메뉴 대분류 수가 관리 메뉴와 같다" \
    "$(python3 -c "import json; t=json.load(open('$MN_TMP/orig.json')); print(sum(1 for n in t['top'] if n['visible']))")" \
    "$(curl -s "$API/api/content/menu" --max-time 30 | pick 'print(len((d.get("data") or {}).get("top") or []))')"
  check "숨긴 하위도 이름은 나간다(hidden_in_dropdown)" "yes" \
    "$(curl -s "$API/api/content/menu" --max-time 30 | pick 'print("yes" if any(c.get("hidden_in_dropdown") for n in (d.get("data") or {}).get("top", []) for c in n["children"]) else "no")')"
  check "셋째 단은 400" "400 하위 메뉴 아래에는" \
    "$(mn_put deep | pick 'print(str((d or {}).get("status"))+" "+((d or {}).get("message") or "")[:10])')"
  check "스크립트 링크는 400" "400" \
    "$(mn_put bad-href | pick 'print((d or {}).get("status"))')"
  check "한국어 이름 없으면 400" "MENU_NEED_KO_LABEL" \
    "$(mn_put no-ko | pick 'print((d or {}).get("resultCode"))')"
  check "켜지는 주소가 / 로 안 시작하면 400" "MENU_BAD_MATCH" \
    "$(mn_put bad-match | pick 'print((d or {}).get("resultCode"))')"
  check "잘못된 저장은 메뉴를 안 바꾼다" "yes" \
    "$(pub_labels | python3 -c "import sys; print('yes' if '뉴스' in sys.stdin.read().split(',') else 'no')")"

  check "뉴스를 숨기면 저장된다" "200" \
    "$(mn_body hide-news | curl -s -o /dev/null -w '%{http_code}' -X PUT -H "$AUTH" -H 'Content-Type: application/json' --data-binary @- "$API/api/admin/menu" --max-time 30)"
  check "숨긴 뉴스는 공개 메뉴에 없다" "absent" \
    "$(pub_labels | python3 -c "import sys; print('present' if '뉴스' in sys.stdin.read().split(',') else 'absent')")"
  check "관리 메뉴에는 꺼진 채로 남는다" "False" \
    "$(adm "/menu" | pick 'print([c["visible"] for n in d["data"]["top"] for c in n["children"] if c["href"]=="/page/support/news"][0])')"

  MN_RESTORE_CODE=$(mn_body same | curl -s -o /dev/null -w '%{http_code}' -X PUT -H "$AUTH" -H 'Content-Type: application/json' --data-binary @- "$API/api/admin/menu" --max-time 30)
  [ "$MN_RESTORE_CODE" = "200" ] && MN_RESTORED=1
  check "되돌리면 저장된다" "200" "$MN_RESTORE_CODE"
  check "되돌린 뒤 뉴스가 공개 메뉴에 있다" "present" \
    "$(pub_labels | python3 -c "import sys; print('present' if '뉴스' in sys.stdin.read().split(',') else 'absent')")"
  check "되돌린 메뉴가 처음과 같다" "same" \
    "$(adm "/menu" | pick "import json; a=json.load(open('$MN_TMP/orig.json')); b=d['data']
strip=lambda t: [[n['href'],n['visible'],n.get('match'),n['translations'],[[c['href'],c['visible'],c['hidden_in_dropdown'],c['translations']] for c in n['children']]] for n in t['top']]
print('same' if strip(a)==strip(b) and len(a['footer'])==len(b['footer']) else 'diff')")"
  check "저장마다 변경 이력이 남는다" "2" \
    "$(dbq "select count(*) from admin_revisions where collection='menu' and item_id='site' and actor='$VERIFY_EMAIL'")"
  check "이력에 바꾸기 전 메뉴가 있다" "yes" \
    "$(dbq "select case when jsonb_array_length(before->'top') > 0 then 'yes' else 'no' end from admin_revisions where collection='menu' and actor='$VERIFY_EMAIL' order by id asc limit 1")"

  # 인사(hr)는 메뉴를 못 만진다.
  MN_HR="${VERIFY_EMAIL%%@*}-mhr@drvalue.local"
  dbq "insert into admin_users(email,role,name) values ('$MN_HR','hr','verify.sh menu hr') on conflict (email) do update set enabled=true, role='hr'" >/dev/null
  CLEANUP+=("dbq \"delete from admin_users where email='$MN_HR'\" >/dev/null")
  MN_HRS=$(cd "$HERE" && node -e "const {issueSession}=require('./dist/common/session/session-token.js');console.log(issueSession(process.env.ADMIN_SESSION_SECRET,{email:'$MN_HR',role:'hr',name:'verify menu hr',exp:Date.now()+600000}))")
  check "인사 역할은 메뉴 읽기 403" "403" \
    "$(curl -s -o /dev/null -w '%{http_code}' -H "Cookie: dv_admin=$MN_HRS" "$API/api/admin/menu" --max-time 30)"
  check "인사 역할은 메뉴 저장 403" "403" \
    "$(mn_body same | curl -s -o /dev/null -w '%{http_code}' -X PUT -H "Cookie: dv_admin=$MN_HRS" -H 'Content-Type: application/json' --data-binary @- "$API/api/admin/menu" --max-time 30)"
  check "공개 메뉴는 무인증" "200" \
    "$(curl -s -o /dev/null -w '%{http_code}' "$API/api/content/menu" --max-time 30)"
  dbq "delete from admin_users where email='$MN_HR'" >/dev/null
fi
