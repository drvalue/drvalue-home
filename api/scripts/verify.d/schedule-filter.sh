# verify.sh 가 읽는다(단독 실행 안 함). check · na · pick · adm · admj · AUTH · RUN · API 를 쓴다.
#
# 관리 목록의 예약 거름(schedule=scheduled | unpublishing). 목록 한 줄에 publish_at · unpublish_at 이
# 실린다 — 관리 화면이 「예약 9/30 10:00」 배지와 「예약」 거름을 여기서 만든다.

echo "== 관리 목록 · 예약 거름 =="

sfpost() { # slug publish_at unpublish_at → 공지 초안 JSON
  SLUG="$1" PA="$2" UA="$3" python3 -c '
import json, os
print(json.dumps({"board": "notice", "slug": os.environ["SLUG"], "status": "draft",
                  "published_date": "2026-01-01",
                  "publish_at": os.environ["PA"] or None, "unpublish_at": os.environ["UA"] or None,
                  "translations": [{"languages_code": "ko-KR", "title": "예약 거름 검사"}]}))'
}
SOON=$(python3 -c 'import datetime; print((datetime.datetime.now(datetime.timezone.utc)+datetime.timedelta(days=1)).isoformat())')
LATER=$(python3 -c 'import datetime; print((datetime.datetime.now(datetime.timezone.utc)+datetime.timedelta(days=2)).isoformat())')
SF_A="$RUN-sched-a"   # 예약 공개만
SF_B="$RUN-sched-b"   # 자동 내림만
SF_AID=$(sfpost "$SF_A" "$SOON" "" | admj POST /posts | pick 'print((d.get("data") or {}).get("id",""))')
SF_BID=$(sfpost "$SF_B" "" "$LATER" | admj POST /posts | pick 'print((d.get("data") or {}).get("id",""))')

if [ -z "$SF_AID" ] || [ -z "$SF_BID" ]; then
  na "예약 거름 구간 전체" "검사 글을 못 만들었다"
else
  slugs() { adm "/posts?board=notice&schedule=$1" | pick 'print(" ".join(x.get("slug","") for x in (d.get("data") or [])))'; }
  inlist() { case " $1 " in *" $2 "*) echo yes;; *) echo no;; esac; }
  S_SCHED=$(slugs scheduled)
  S_UNPUB=$(slugs unpublishing)
  check "예약 거름에 예약 공개 글이 있다" "yes" "$(inlist "$S_SCHED" "$SF_A")"
  check "예약 거름에 자동 내림만 있는 글은 없다" "no" "$(inlist "$S_SCHED" "$SF_B")"
  check "내림 거름에 자동 내림 글이 있다" "yes" "$(inlist "$S_UNPUB" "$SF_B")"
  check "내림 거름에 예약 공개만 있는 글은 없다" "no" "$(inlist "$S_UNPUB" "$SF_A")"
  check "목록 한 줄에 publish_at 이 실린다" "yes" \
    "$(adm "/posts?board=notice&schedule=scheduled" | pick "r=[x for x in (d.get('data') or []) if x.get('slug')=='$SF_A']; print('yes' if r and r[0].get('publish_at') else 'no')")"
  check "모르는 거름 값은 400" "400" \
    "$(curl -s -o /dev/null -w '%{http_code}' -H "$AUTH" "$API/api/admin/posts?schedule=soon" --max-time 30)"
  curl -s -o /dev/null -X DELETE -H "$AUTH" "$API/api/admin/posts/$SF_AID" --max-time 30
  curl -s -o /dev/null -X DELETE -H "$AUTH" "$API/api/admin/posts/$SF_BID" --max-time 30
fi
check "예약 거름 검사 글이 남지 않음" "0" "$(dbq "select count(*) from posts where slug like '$RUN-sched-%'")"
