# verify.sh 가 읽는다(단독 실행 안 함). check · na · pick · adm · admj · AUTH · RUN · API 를 쓴다.
#
# 게시판 3종(뉴스 · 채용 · FAQ)과 예약 게시.
# 「응답 200」 이 아니라 공개 목록 · 상세 · 첨부 주소에 실제로 나오는지 · 안 나오는지를 본다.

echo "== 게시판 3종 (뉴스 · 채용 · FAQ) =="

# 본문 한 벌. 셸에서 JSON 을 만들지 않는다(zsh 중괄호).
bpost() { # board slug status [extra-json] → id
  B="$1" S="$2" ST="$3" X="${4:-{\}}" python3 -c '
import json, os, datetime
d = {"board": os.environ["B"], "slug": os.environ["S"], "status": os.environ["ST"],
     "published_date": datetime.date.today().isoformat(),
     "translations": [{"languages_code": "ko-KR", "title": "검증 " + os.environ["B"],
                       "summary": "검증 요약", "body": "<p>검증 본문</p>"}]}
d.update(json.loads(os.environ["X"]))
print(json.dumps(d))' | admj POST /posts | pick 'print((d.get("data") or {}).get("id",""))'
}
pub_slugs() { curl -s "$API/api/content/posts?board=$1&limit=100" --max-time 30 | pick 'print(" ".join(x.get("slug","") for x in (d.get("data") or [])))'; }
has() { case " $1 " in *" $2 "*) echo yes;; *) echo no;; esac; }

BN="$RUN-news"; BR="$RUN-rec"; BRO="$RUN-reco"; BF="$RUN-faq"
NID=$(bpost news "$BN" published '{"press_media":"검증일보"}')
RID=$(bpost recruit "$BR" published '{"employment_type":"contract","deadline":"2099-12-31"}')
ROID=$(bpost recruit "$BRO" published '{"employment_type":"fulltime","is_open_ended":true}')
FID_=$(bpost faq "$BF" published '{}')
# FAQ 분류는 번역 칸이라 한 번 더 — 위 본문에 넣으면 영어가 비어 번역 검사가 헷갈린다.
[ -n "$FID_" ] && adm "/posts/$FID_" | pick '
import json
x = d["data"]
x["translations"][0]["faq_category"] = "검증 분류"
keep = ["board","slug","status","published_date","translations"]
print(json.dumps({k: x[k] for k in keep}))' | admj PUT "/posts/$FID_" > /dev/null

check "뉴스 만들기" "yes" "$([ -n "$NID" ] && echo yes || echo no)"
check "채용 만들기" "yes" "$([ -n "$RID" ] && [ -n "$ROID" ] && echo yes || echo no)"
check "FAQ 만들기" "yes" "$([ -n "$FID_" ] && echo yes || echo no)"
check "뉴스가 공개 목록에" "yes" "$(has "$(pub_slugs news)" "$BN")"
check "뉴스에 매체명" "검증일보" \
  "$(curl -s "$API/api/content/posts/$BN" --max-time 30 | pick 'print((d.get("data") or {}).get("press_media",""))')"
check "채용이 공개 목록에" "yes" "$(has "$(pub_slugs recruit)" "$BR")"
check "채용 칸이 붙어 온다" "contract|2099-12-31|False" \
  "$(curl -s "$API/api/content/posts/$BR" --max-time 30 | pick 'x=d.get("data") or {}; print("%s|%s|%s" % (x.get("employment_type"), x.get("deadline"), x.get("is_open_ended")))')"
check "채용은 마감 있는 것이 상시보다 앞" "yes" \
  "$(curl -s "$API/api/content/posts?board=recruit&limit=100" --max-time 30 | pick "
s=[x.get('slug') for x in (d.get('data') or [])]
print('yes' if '$BR' in s and '$BRO' in s and s.index('$BR') < s.index('$BRO') else 'no')")"
check "FAQ 목록에 답(본문)과 분류" "<p>검증 본문</p>|검증 분류" \
  "$(curl -s "$API/api/content/posts?board=faq&limit=100" --max-time 30 | pick "
m=[x for x in (d.get('data') or []) if x.get('slug')=='$BF']
print('%s|%s' % (m[0].get('body'), m[0].get('faq_category')) if m else 'none')")"
check "FAQ 분류 목록에 뜬다" "yes" \
  "$(adm /posts/faq-categories | pick 'print("yes" if "검증 분류" in (d.get("data") or []) else "no")')"

echo "== 예약 게시 =="
LATER=$(python3 -c 'import datetime; print((datetime.datetime.now(datetime.timezone.utc)+datetime.timedelta(hours=1)).isoformat())')
EARLIER=$(python3 -c 'import datetime; print((datetime.datetime.now(datetime.timezone.utc)-datetime.timedelta(hours=1)).isoformat())')
SF="$RUN-sfut"; SP="$RUN-spast"; SU="$RUN-sunp"
# 첨부를 하나 올려 예약 전 글에 물린다 — 파일 주소로 새지 않는지 본다.
printf '예약 첨부' > "/tmp/dv_sched.$$.txt"
SFILE=$(curl -s -X POST "$API/api/admin/files" -H "$AUTH" -F "file=@/tmp/dv_sched.$$.txt;type=text/plain" --max-time 30 \
  | pick 'print((d.get("data") or {}).get("id",""))')
rm -f "/tmp/dv_sched.$$.txt"
FUTID=$(bpost notice "$SF" published "{\"publish_at\":\"$LATER\",\"file_ids\":[\"$SFILE\"],\"thumbnail\":\"$SFILE\"}")
PASTID=$(bpost notice "$SP" published "{\"publish_at\":\"$EARLIER\"}")
UNPID=$(bpost notice "$SU" published "{\"unpublish_at\":\"$EARLIER\"}")
check "예약 글 만들기" "yes" "$([ -n "$FUTID" ] && [ -n "$PASTID" ] && [ -n "$UNPID" ] && echo yes || echo no)"
check "예약 시각이 저장된다" "yes" \
  "$(adm "/posts/$FUTID" | pick 'print("yes" if (d.get("data") or {}).get("publish_at") else "no")')"
NS="$(pub_slugs notice)"
check "1시간 뒤 예약 글은 목록에 없다" "no" "$(has "$NS" "$SF")"
check "1시간 뒤 예약 글 상세는 404" "404" \
  "$(curl -s -o /dev/null -w '%{http_code}' "$API/api/content/posts/$SF" --max-time 30)"
if [ -n "$SFILE" ]; then
  check "예약 글의 첨부도 안 나간다" "404" \
    "$(curl -s -o /dev/null -w '%{http_code}' "$API/api/content/assets/$SFILE" --max-time 30)"
else
  na "예약 글의 첨부" "업로드가 안 됐다"
fi
check "지난 예약 시각이면 나온다" "yes" "$(has "$NS" "$SP")"
check "자동 내림 시각이 지나면 안 나온다" "no" "$(has "$NS" "$SU")"
check "내림 지난 글 상세도 404" "404" \
  "$(curl -s -o /dev/null -w '%{http_code}' "$API/api/content/posts/$SU" --max-time 30)"

echo "== 본문 안 그림 (편집기) =="
# 편집기는 그림을 올려 /api/content/assets/<id> 를 본문에 넣는다. 대표 그림·첨부가 아니어도
# 게시된 글의 본문이 가리키면 공개여야 하고, 그 글이 초안이 되면 다시 막혀야 한다.
printf 'GIF89a\001\000\001\000\000\000\000;' > "/tmp/dv_inbody.$$.gif"
IBF=$(curl -s -X POST "$API/api/admin/files" -H "$AUTH" -F "file=@/tmp/dv_inbody.$$.gif;type=image/gif" --max-time 30 \
  | pick 'print((d.get("data") or {}).get("id",""))')
rm -f "/tmp/dv_inbody.$$.gif"
if [ -z "$IBF" ]; then
  na "본문 안 그림" "업로드가 안 됐다"
  IBID=""
else
  SB="$RUN-inbody"
  IBID=$(B=notice S="$SB" F="$IBF" python3 -c '
import json, os, datetime
print(json.dumps({"board": os.environ["B"], "slug": os.environ["S"], "status": "published",
  "published_date": datetime.date.today().isoformat(),
  "translations": [{"languages_code": "ko-KR", "title": "본문 그림 검증",
    "body": "<p>앞</p><p><img src=\"/api/content/assets/%s\"></p>" % os.environ["F"]}]}))' \
    | admj POST /posts | pick 'print((d.get("data") or {}).get("id",""))')
  check "본문에만 넣은 그림이 공개 글에서 열린다" "200" \
    "$(curl -s -o /dev/null -w '%{http_code}' "$API/api/content/assets/$IBF" --max-time 30)"
  adm "/posts/$IBID" | pick '
import json
x = d["data"]; x["status"] = "draft"
keep = ["board","slug","status","published_date","translations"]
print(json.dumps({k: x[k] for k in keep}))' | admj PUT "/posts/$IBID" > /dev/null
  check "그 글이 초안이 되면 그림도 막힌다" "404" \
    "$(curl -s -o /dev/null -w '%{http_code}' "$API/api/content/assets/$IBF" --max-time 30)"
fi

# 뒷정리
for id in $NID $RID $ROID $FID_ $FUTID $PASTID $UNPID $IBID; do
  [ -n "$id" ] && curl -s -o /dev/null -X DELETE "$API/api/admin/posts/$id" -H "$AUTH" --max-time 30
done
for f in $SFILE $IBF; do
  [ -n "$f" ] && curl -s -o /dev/null -X DELETE "$API/api/admin/files/$f?force=1" -H "$AUTH" --max-time 30
done
check "게시판 3종·예약·본문 그림 검증 글이 남지 않음" "0" \
  "$(adm "/posts?q=$RUN" | pick 'print(d.get("total", "x"))')"
