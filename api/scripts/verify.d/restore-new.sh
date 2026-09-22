# verify.sh 가 읽는다(단독 실행 안 함). check · na · pick · adm · admj · dbq · AUTH · RUN · API · HERE · VERIFY_EMAIL · CLEANUP 을 쓴다.
#
# 변경 이력 되돌리기 — 글·문의 밖의 표(R1). 페이지 글 · 메뉴 · 검색 정보(page_meta) · 메인 배너 · 메인 팝업을
# 바꾸고 → 이력으로 되돌리고 → 내용이 돌아왔는지 본다. 되돌리는 글도 그 기능의 저장 규칙을 거친다(틀린 이력은
# 합니다체 400), 지워진 그림은 비우고 알린다, 인사·마케팅은 되돌리지 못한다. 바꾼 것은 전부 원래대로 돌린다.
#
# 중간에 죽어도 원래대로 돌리는 명령은 CLEANUP 앞에 붙인다 — 뒷정리는 순서대로 돌고, 본체가 먼저 검사 계정을
# 지우면 저장이 막힌다. 정상으로 돌려 두었으면(…_DONE=1) 건너뛴다.

echo "== 되돌리기: 페이지 · 메뉴 · 검색 정보 · 메인 배너 · 팝업 =="

RN_TMP=$(mktemp -d)
CLEANUP+=("rm -rf \"$RN_TMP\"")

# 이 검사 계정이 남긴 그 항목의 마지막 이력 id. $3(action)을 주면 그 동작만.
rn_last() {
  if [ -n "${3:-}" ]; then
    dbq "select coalesce(max(id),0) from admin_revisions where collection='$1' and item_id='$2' and actor='$VERIFY_EMAIL' and action='$3'"
  else
    dbq "select coalesce(max(id),0) from admin_revisions where collection='$1' and item_id='$2' and actor='$VERIFY_EMAIL'"
  fi
}
# 되돌리기 → 「200 첫 경고(없으면 -)」 또는 「상태코드 문구」.
rn_restore() {
  curl -s -w '\n%{http_code}' -X POST -H "$AUTH" "$API/api/admin/revisions/$1/restore" --max-time 30 | python3 -c '
import json, sys
body, code = sys.stdin.read().rsplit("\n", 1)
try: d = json.loads(body)
except Exception: d = {}
if code == "200": print(code, ((d.get("warnings") or ["-"])[0]))
else: print(code, d.get("message"))'
}
rn_detail() { adm "/revisions/$1" | pick "x=d.get('data') or {}; $2"; }
# 그 기능의 저장 규칙에 걸리는 before 를 가진 이력 한 줄. actor 가 검사 계정이라 끝에 같이 지워진다.
rn_bad_rev() {
  dbq "insert into admin_revisions(actor,action,collection,item_id,before,after) values ('$VERIFY_EMAIL','update','$1','$2','$3'::jsonb,null) returning id"
}
rn_upload() { # 제목 → 파일 id (1×1 PNG)
  printf '\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\rIDATx\x9cc\xf8\x0f\x00\x00\x01\x01\x00\x05\x18\xd8N\x00\x00\x00\x00IEND\xaeB`\x82' > "$RN_TMP/$1.png"
  curl -s -X POST -H "$AUTH" -F "file=@$RN_TMP/$1.png;type=image/png" -F "title=$1" "$API/api/admin/files" --max-time 60 \
    | pick 'print((d.get("data") or {}).get("id",""))'
}

# ── 페이지 글(오시는 길 · 한국어)
RN_PG="company-location"
RN_PG_ORIG=$(adm "/pages/$RN_PG" | pick 'import json; print(json.dumps(((d.get("data") or {}).get("languages") or {}).get("ko-KR",{}).get("content") or {}, ensure_ascii=False))')
RN_PG_BY=$(dbq "select coalesce(updated_by,'') from page_contents where key='$RN_PG' and languages_code='ko-KR'")
RN_PG_ON=$(dbq "select updated_on::text from page_contents where key='$RN_PG' and languages_code='ko-KR'")
rn_pg() { ORIG="$RN_PG_ORIG" EDIT="$1" python3 -c '
import json, os
c = json.loads(os.environ["ORIG"])
exec(os.environ["EDIT"])
print(json.dumps({"languages_code": "ko-KR", "content": c}, ensure_ascii=False))'; }
rn_pg_pub() { curl -s "$API/api/content/pages/$RN_PG" --max-time 30 | pick "x=(d.get('data') or {}); $1"; }

if [ -z "$RN_PG_ORIG" ] || [ "$RN_PG_ORIG" = "{}" ]; then
  na "되돌리기: 페이지" "오시는 길 씨앗이 없다 — db/migrations/0004"
else
  RN_PG_DONE=0
  rn_pg 'pass' > "$RN_TMP/page.json"
  CLEANUP=("[ \"\$RN_PG_DONE\" = 1 ] || curl -s -o /dev/null -X PUT -H \"$AUTH\" -H 'Content-Type: application/json' --data-binary @\"$RN_TMP/page.json\" \"$API/api/admin/pages/$RN_PG\" --max-time 30" "${CLEANUP[@]}")

  rn_pg "c['shell']['desc']='$RUN 되돌리기 A'" | admj PUT "/pages/$RN_PG" >/dev/null
  rn_pg "c['shell']['desc']='$RUN 되돌리기 B'" | admj PUT "/pages/$RN_PG" >/dev/null
  RN_PG_REV=$(rn_last pages "$RN_PG/ko-KR" update)
  check "페이지: 이력 이름은 장 이름(주소가 아니다)" "yes" \
    "$(rn_detail "$RN_PG_REV" 'print("yes" if x.get("label") and x.get("label") != x.get("item_id") else x.get("label"))')"
  check "페이지: 고친 이력은 되돌릴 수 있다" "True" "$(rn_detail "$RN_PG_REV" 'print(x.get("restorable"))')"
  check "페이지: 되돌리기" "200 -" "$(rn_restore "$RN_PG_REV")"
  check "페이지: 공개 글이 A 로 돌아왔다" "$RUN 되돌리기 A" "$(rn_pg_pub 'print(x.get("shell",{}).get("desc"))')"
  check "페이지: 되돌리기도 이력 한 줄" "1" \
    "$(dbq "select count(*) from admin_revisions where collection='pages' and item_id='$RN_PG/ko-KR' and actor='$VERIFY_EMAIL' and action='restore'")"

  RN_PG_BAD=$(rn_bad_rev pages "$RN_PG/ko-KR" '{"shell":{"oops":"x"}}')
  check "페이지: 규칙에 안 맞는 이력은 400(합니다체)" "400 PAGE_INVALID 알 수 없는 칸" \
    "$(curl -s -X POST -H "$AUTH" "$API/api/admin/revisions/$RN_PG_BAD/restore" --max-time 30 | pick 'm=d.get("message") or ""; print(d.get("status"), d.get("resultCode"), "알 수 없는 칸" if "알 수 없는 칸" in m else m)')"
  check "페이지: 거절된 되돌리기는 글을 안 바꾼다" "$RUN 되돌리기 A" "$(rn_pg_pub 'print(x.get("shell",{}).get("desc"))')"

  # 그림이 든 글 → 그림 뺀 글 → 파일 강제 삭제 → 「그림이 든 글」로 되돌리면 그림 칸은 비우고 알린다.
  RN_PG_FID=$(rn_upload "$RUN-rn-pg")
  if [ -z "$RN_PG_FID" ]; then
    na "페이지: 지워진 그림" "검사 그림을 못 올렸다"
  else
    rn_pg "c['shell']['desc']='$RUN 그림';c['guide']['photo']={'id':'$RN_PG_FID','alt':'건물'}" | admj PUT "/pages/$RN_PG" >/dev/null
    rn_pg "c['shell']['desc']='$RUN 그림 뺌'" | admj PUT "/pages/$RN_PG" >/dev/null
    RN_PG_IMG_REV=$(rn_last pages "$RN_PG/ko-KR" update)
    curl -s -o /dev/null -X DELETE -H "$AUTH" "$API/api/admin/files/$RN_PG_FID?force=1" --max-time 30
    check "페이지: 지워진 그림은 비우고 되돌린다(알림)" "200 그림 1개는 파일이 지워져 있어 비워 두었습니다." "$(rn_restore "$RN_PG_IMG_REV")"
    check "페이지: 나머지 칸은 돌아왔다" "$RUN 그림" "$(rn_pg_pub 'print(x.get("shell",{}).get("desc"))')"
    check "페이지: 그림 칸은 비었다" "none" "$(rn_pg_pub 'p=x.get("guide",{}).get("photo"); print("none" if not p else p.get("id"))')"
  fi

  rn_pg 'pass' | admj PUT "/pages/$RN_PG" >/dev/null
  RN_PG_SAME=$(ORIG="$RN_PG_ORIG" API="$API" KEY="$RN_PG" python3 -c '
import json, os, urllib.request
now = json.load(urllib.request.urlopen(os.environ["API"] + "/api/content/pages/" + os.environ["KEY"]))["data"]
print("same" if now == json.loads(os.environ["ORIG"]) else "diff")' 2>/dev/null)
  [ "$RN_PG_SAME" = "same" ] && RN_PG_DONE=1
  check "페이지: 원래 글로 돌려 두었다" "same" "$RN_PG_SAME"
  [ -n "$RN_PG_ON" ] && dbq "update page_contents set updated_by=nullif('$RN_PG_BY',''), updated_on='$RN_PG_ON'::timestamptz where key='$RN_PG' and languages_code='ko-KR'" >/dev/null
fi

# ── 메뉴
adm "/menu" | pick 'import json; print(json.dumps((d or {}).get("data") or {}, ensure_ascii=False))' > "$RN_TMP/menu.json"
cat > "$RN_TMP/menu.py" <<'PY'
# 관리 트리 → 저장 본문. MODE=rename 이면 첫 대분류의 한국어 이름을 바꾼다.
import json, os
tree = json.load(open(os.environ["TREE"]))
def labels(n):
    return [{"languages_code": t["languages_code"], "label": t["label"], "description": t.get("description")} for t in n["translations"]]
def child(c):
    return {"href": c["href"], "visible": c["visible"], "hidden_in_dropdown": c["hidden_in_dropdown"], "translations": labels(c)}
body = {
    "top": [{"href": n["href"], "visible": n["visible"], "match": n.get("match"), "translations": labels(n),
             "children": [child(c) for c in n["children"]]} for n in tree["top"]],
    "footer": [child(c) for c in tree["footer"]],
}
if os.environ.get("MODE") == "rename":
    for t in body["top"][0]["translations"]:
        if t["languages_code"] == "ko-KR":
            t["label"] = os.environ["LABEL"]
print(json.dumps(body, ensure_ascii=False))
PY
rn_mn() { TREE="$RN_TMP/menu.json" MODE="$1" LABEL="$RUN 메뉴" python3 "$RN_TMP/menu.py"; }
rn_mn_first() { curl -s "$API/api/content/menu" --max-time 30 | pick 'print(((d.get("data") or {}).get("top") or [{}])[0].get("label"))'; }

if ! python3 -c "import json,sys; t=json.load(open('$RN_TMP/menu.json')); sys.exit(0 if t.get('top') else 1)" 2>/dev/null; then
  na "되돌리기: 메뉴" "관리 메뉴를 못 읽었다(migrations/0006)"
else
  RN_MN_DONE=0
  rn_mn same > "$RN_TMP/menu-body.json"
  CLEANUP=("[ \"\$RN_MN_DONE\" = 1 ] || curl -s -o /dev/null -X PUT -H \"$AUTH\" -H 'Content-Type: application/json' --data-binary @\"$RN_TMP/menu-body.json\" \"$API/api/admin/menu\" --max-time 30" "${CLEANUP[@]}")
  RN_MN_LABEL=$(rn_mn_first)
  rn_mn rename | admj PUT "/menu" >/dev/null
  check "메뉴: 이름을 바꿨다" "$RUN 메뉴" "$(rn_mn_first)"
  RN_MN_REV=$(rn_last menu site)
  check "메뉴: 이력 이름" "사이트 메뉴" "$(rn_detail "$RN_MN_REV" 'print(x.get("label"))')"
  check "메뉴: 되돌리기" "200 -" "$(rn_restore "$RN_MN_REV")"
  check "메뉴: 공개 메뉴 이름이 돌아왔다" "$RN_MN_LABEL" "$(rn_mn_first)"
  RN_MN_SAME=$(adm "/menu" | pick "import json; a=json.load(open('$RN_TMP/menu.json')); b=d['data']
strip=lambda t: [[n['href'],n['visible'],n.get('match'),n['translations'],[[c['href'],c['visible'],c['hidden_in_dropdown'],c['translations']] for c in n['children']]] for n in t['top']]+[[c['href'],c['visible'],c['translations']] for c in t['footer']]
print('same' if strip(a)==strip(b) else 'diff')")
  [ "$RN_MN_SAME" = "same" ] && RN_MN_DONE=1
  check "메뉴: 관리 트리가 처음과 같다" "same" "$RN_MN_SAME"
  RN_MN_BAD=$(rn_bad_rev menu site '{"top":[{"href":"javascript:alert(1)","visible":true,"translations":[{"languages_code":"ko-KR","label":"x"}],"children":[]}],"footer":[]}')
  check "메뉴: 규칙에 안 맞는 이력은 400(합니다체)" "400 yes" \
    "$(curl -s -X POST -H "$AUTH" "$API/api/admin/revisions/$RN_MN_BAD/restore" --max-time 30 | pick 'import re; m=d.get("message") or ""; print(d.get("status"), "yes" if re.search("[가-힣]", m) and m.endswith(".") else m)')"
  check "메뉴: 거절된 되돌리기는 메뉴를 안 바꾼다" "$RN_MN_LABEL" "$(rn_mn_first)"
fi

# ── 검색 정보(page_meta) — 사람이 덮어쓴 적 없는 장에서만
RN_PATH="/page/company/vision"
if [ "$(dbq "select count(*) from page_meta where path='$RN_PATH'")" != "0" ]; then
  na "되돌리기: 검색 정보" "$RN_PATH 에 사람이 넣은 덮어쓰기가 있다 — 건드리지 않는다"
else
  CLEANUP=("curl -s -o /dev/null -X DELETE -H \"$AUTH\" \"$API/api/admin/seo/pages?path=$RN_PATH\" --max-time 30" "${CLEANUP[@]}")
  rn_pm() { P="$RN_PATH" T="$1" python3 -c '
import json, os
print(json.dumps({"path": os.environ["P"], "no_index": False, "og_image": None,
                  "translations": [{"languages_code": "ko-KR", "title": os.environ["T"], "description": "되돌리기 검사 설명입니다."}]}, ensure_ascii=False))'; }
  rn_pm_title() { curl -s "$API/api/content/page-meta" --max-time 30 | pick "r=[x for x in (d.get('data') or []) if x.get('path')=='$RN_PATH']; print(r[0].get('title') if r else 'absent')"; }
  rn_pm "$RUN 제목 A" | admj PUT "/seo/pages" >/dev/null
  RN_PM_CREATE=$(rn_last page_meta "$RN_PATH" create)
  rn_pm "$RUN 제목 B" | admj PUT "/seo/pages" >/dev/null
  RN_PM_UPDATE=$(rn_last page_meta "$RN_PATH" update)
  check "검색 정보: 이력 이름" "검색 정보 $RN_PATH" "$(rn_detail "$RN_PM_UPDATE" 'print(x.get("label"))')"
  check "검색 정보: 만든 이력은 되돌릴 수 없다(까닭이 온다)" "False 처음 만든 기록이라 되돌릴 이전 상태가 없습니다." \
    "$(rn_detail "$RN_PM_CREATE" 'print(x.get("restorable"), x.get("restore_note"))')"
  check "검색 정보: 만든 이력을 되돌리면 400(같은 문구)" "400 처음 만든 기록이라 되돌릴 이전 상태가 없습니다." "$(rn_restore "$RN_PM_CREATE")"
  check "검색 정보: 고친 것 되돌리기" "200 -" "$(rn_restore "$RN_PM_UPDATE")"
  check "검색 정보: 제목이 A 로 돌아왔다" "$RUN 제목 A" "$(rn_pm_title)"
  curl -s -o /dev/null -X DELETE -H "$AUTH" "$API/api/admin/seo/pages?path=$RN_PATH" --max-time 30
  check "검색 정보: 지웠다" "absent" "$(rn_pm_title)"
  RN_PM_DELETE=$(rn_last page_meta "$RN_PATH" delete)
  check "검색 정보: 지운 것 되돌리기" "200 -" "$(rn_restore "$RN_PM_DELETE")"
  check "검색 정보: 지운 덮어쓰기가 돌아왔다" "$RUN 제목 A" "$(rn_pm_title)"

  # 범위: 되돌리기는 전체 권한만.
  RN_HR="${VERIFY_EMAIL%%@*}-rnhr@drvalue.local"
  RN_MK="${VERIFY_EMAIL%%@*}-rnmk@drvalue.local"
  dbq "insert into admin_users(email,role,name,enabled) values ('$RN_HR','hr','verify restore hr',true),('$RN_MK','marketing','verify restore mk',true) on conflict (email) do update set enabled=true" >/dev/null
  CLEANUP+=("dbq \"delete from admin_users where email in ('$RN_HR','$RN_MK')\" >/dev/null")
  rn_mint() { (cd "$HERE" && node -e "const {issueSession}=require('./dist/common/session/session-token.js');console.log(issueSession(process.env.ADMIN_SESSION_SECRET,{email:'$1',role:'$2',exp:Date.now()+600000}))"); }
  check "검색 정보: 인사는 되돌리기 403" "403" \
    "$(curl -s -o /dev/null -w '%{http_code}' -X POST -H "Cookie: dv_admin=$(rn_mint "$RN_HR" hr)" "$API/api/admin/revisions/$RN_PM_UPDATE/restore" --max-time 30)"
  check "검색 정보: 마케팅도 되돌리기 403" "403" \
    "$(curl -s -o /dev/null -w '%{http_code}' -X POST -H "Cookie: dv_admin=$(rn_mint "$RN_MK" marketing)" "$API/api/admin/revisions/$RN_PM_UPDATE/restore" --max-time 30)"
  check "검색 정보: 거절된 되돌리기는 덮어쓰기를 안 바꾼다" "$RUN 제목 A" "$(rn_pm_title)"
  dbq "delete from admin_users where email in ('$RN_HR','$RN_MK')" >/dev/null

  curl -s -o /dev/null -X DELETE -H "$AUTH" "$API/api/admin/seo/pages?path=$RN_PATH" --max-time 30
  check "검색 정보: 검사 덮어쓰기가 남지 않는다" "0" "$(dbq "select count(*) from page_meta where path='$RN_PATH'")"
fi

# ── 메인 배너 · 팝업(목록 한 벌이 한 항목 — item_id list)
rn_as_save='import json
rows = (d or {}).get("data") or []
keep = ("id","visible","link_href","starts_at","ends_at","width","dismiss_days")
out = []
for r in rows:
    x = {k: r[k] for k in keep if k in r}
    x["image"] = (r.get("image") or {}).get("id")
    x["translations"] = [{k: v for k, v in t.items()} for t in (r.get("translations") or [])]
    out.append(x)
print(json.dumps({"items": out}, ensure_ascii=False))'
rn_ids() { adm "/home/$1" | pick 'print(",".join(sorted(str(r.get("id")) for r in (d.get("data") or []))))'; }
adm "/home/banners" | pick "$rn_as_save" > "$RN_TMP/banners.json"
adm "/home/popups" | pick "$rn_as_save" > "$RN_TMP/popups.json"
RN_HM_FID=$(rn_upload "$RUN-rn-home")
if [ -z "$RN_HM_FID" ] || [ ! -s "$RN_TMP/banners.json" ] || [ ! -s "$RN_TMP/popups.json" ]; then
  na "되돌리기: 메인 배너·팝업" "검사 그림을 못 올렸거나 목록을 못 읽었다(migrations/0005)"
else
  RN_HM_DONE=0
  CLEANUP=("[ \"\$RN_HM_DONE\" = 1 ] || { curl -s -o /dev/null -X PUT -H \"$AUTH\" -H 'Content-Type: application/json' --data-binary @\"$RN_TMP/banners.json\" \"$API/api/admin/home/banners\" --max-time 30; curl -s -o /dev/null -X PUT -H \"$AUTH\" -H 'Content-Type: application/json' --data-binary @\"$RN_TMP/popups.json\" \"$API/api/admin/home/popups\" --max-time 30; }; curl -s -o /dev/null -X DELETE -H \"$AUTH\" \"$API/api/admin/files/$RN_HM_FID?force=1\" --max-time 30" "${CLEANUP[@]}")
  RN_HB_IDS=$(rn_ids banners)
  RN_HP_IDS=$(rn_ids popups)
  # 원래 목록 + 검사용 A(꺼 둠) → A 의 제목을 바꾸고 C 를 더한다 → 그 이력을 되돌리면 A 는 같은 id 로
  # 제목이 돌아오고 C 는 빠진다(팝업은 id 에 「보지 않기」가 걸려 있다). 끝에 원래 목록으로 돌린다.
  rn_items() { ORIG="$RN_TMP/$1.json" EXTRA="$2" python3 -c '
import json, os
b = json.load(open(os.environ["ORIG"]))
b["items"] += json.loads(os.environ["EXTRA"])
print(json.dumps(b, ensure_ascii=False))'; }
  rn_id_of() { adm "/home/$1" | pick "r=[x for x in (d.get('data') or []) if any(t.get('title')=='$2' for t in (x.get('translations') or []))]; print(r[0].get('id') if r else '')"; }
  rn_home() { # 종류(banners·popups) 이름(배너·팝업) 더 붙일 칸(JSON 조각)
    local kind="$1" name="$2" more="$3" aid ids_a rev
    rn_items "$kind" "[{\"visible\":false,\"image\":\"$RN_HM_FID\"$more,\"translations\":[{\"languages_code\":\"ko-KR\",\"title\":\"$RUN $name A\"}]}]" | admj PUT "/home/$kind" >/dev/null
    aid=$(rn_id_of "$kind" "$RUN $name A")
    ids_a=$(rn_ids "$kind")
    rn_items "$kind" "[{\"id\":${aid:-0},\"visible\":false,\"image\":\"$RN_HM_FID\"$more,\"translations\":[{\"languages_code\":\"ko-KR\",\"title\":\"$RUN $name B\"}]},{\"visible\":false,\"image\":\"$RN_HM_FID\"$more,\"translations\":[{\"languages_code\":\"ko-KR\",\"title\":\"$RUN $name C\"}]}]" | admj PUT "/home/$kind" >/dev/null
    check "$name: 고친 뒤 A 는 B 가 되고 C 가 붙었다" "yes" \
      "$([ -n "$aid" ] && [ "$(rn_id_of "$kind" "$RUN $name B")" = "$aid" ] && [ -n "$(rn_id_of "$kind" "$RUN $name C")" ] && echo yes || echo no)"
    rev=$(rn_last "home_$kind" list)
    check "$name: 이력 이름" "메인 $name" "$(rn_detail "$rev" 'print(x.get("label"))')"
    check "$name: 되돌리기" "200 -" "$(rn_restore "$rev")"
    check "$name: 같은 id 로 제목이 돌아오고 C 는 빠진다" "$aid|$ids_a" "$(rn_id_of "$kind" "$RUN $name A")|$(rn_ids "$kind")"
    admj PUT "/home/$kind" < "$RN_TMP/$kind.json" >/dev/null
  }
  rn_home banners 배너 ''
  rn_home popups 팝업 ',"width":480,"dismiss_days":1'
  RN_HM_NOW="$(rn_ids banners)|$(rn_ids popups)"
  [ "$RN_HM_NOW" = "$RN_HB_IDS|$RN_HP_IDS" ] && RN_HM_DONE=1
  check "배너·팝업: 원래 목록으로 돌려 두었다" "$RN_HB_IDS|$RN_HP_IDS" "$RN_HM_NOW"

  curl -s -o /dev/null -X DELETE -H "$AUTH" "$API/api/admin/files/$RN_HM_FID?force=1" --max-time 30
  check "배너·팝업: 검사 그림이 남지 않는다" "404" \
    "$(curl -s -o /dev/null -w '%{http_code}' -H "$AUTH" "$API/api/admin/files/$RN_HM_FID" --max-time 30)"
fi
