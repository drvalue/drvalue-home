# verify.sh 가 읽는다(단독 실행 안 함). check · na · pick · adm · admj · dbq · AUTH · RUN · API · CLEANUP 을 쓴다.
#
# 소개 장 15장(E7 — 회사·사업·서비스)이 페이지 편집 엔진으로 도는가.
#  · 씨앗 글(db/migrations/0008)이 스키마를 그대로 통과한다 — GET 한 글을 PUT → 200, 공개 API 가 같은 글
#  · 틀마다 틀린 값 하나씩 400(칸 이름·형식 문구로)
#  · 끝나면 고친 사람·때를 원래대로(검사가 관리 목록의 「마지막 수정」을 제 이름으로 남기지 않게)

echo "== 소개 장 15장 =="

IP_KEYS="company-intro company-vision business-max business-pcb-mes business-cosmetics-mes business-mes-ai business-smart-fac business-ai-sol service-autoform service-cuton service-cadon service-chat service-hangeon service-growtok service-growxd"

ip_orig() { adm "/pages/$1" | pick 'import json; print(json.dumps(((d.get("data") or {}).get("languages") or {}).get("ko-KR",{}).get("content") or {}, ensure_ascii=False, sort_keys=True))'; }
# $1 = 원래 글(JSON), $2 = 파이썬 식(c 를 고친다) → PUT 본문
ip_body() { ORIG="$1" EDIT="$2" python3 -c '
import json, os
c = json.loads(os.environ["ORIG"])
exec(os.environ["EDIT"])
print(json.dumps({"languages_code": "ko-KR", "content": c}, ensure_ascii=False))'; }
ip_put() { admj PUT "/pages/$1"; }
ip_msg() { pick 'print((d or {}).get("resultCode"), (d or {}).get("message"))'; }

check "관리 목록에 페이지 17장(메인 + 오시는 길 + 15)" "17" \
  "$(adm "/pages" | pick 'print(len(d.get("data") or []))')"

IP_SEEDED=0
for k in $IP_KEYS; do
  orig=$(ip_orig "$k")
  if [ -z "$orig" ] || [ "$orig" = "{}" ]; then
    na "$k 씨앗" "행이 없다 — db/migrations/0008 을 돌려라"
    continue
  fi
  IP_SEEDED=$((IP_SEEDED+1))
  by=$(dbq "select coalesce(updated_by,'') from page_contents where key='$k' and languages_code='ko-KR'")
  on=$(dbq "select updated_on::text from page_contents where key='$k' and languages_code='ko-KR'")
  code=$(ip_body "$orig" 'pass' | curl -s -o /dev/null -w '%{http_code}' -X PUT -H "$AUTH" -H 'Content-Type: application/json' --data-binary @- "$API/api/admin/pages/$k" --max-time 30)
  same=$(curl -s "$API/api/content/pages/$k" --max-time 30 | ORIG="$orig" pick 'import json, os; print("same" if json.dumps(d.get("data"), ensure_ascii=False, sort_keys=True)==os.environ["ORIG"] else "diff")')
  check "$k 씨앗 글이 그대로 저장·공개" "200 same" "$code $same"
  dbq "update page_contents set updated_by=nullif('$by',''), updated_on='$on'::timestamptz where key='$k' and languages_code='ko-KR'" >/dev/null
done

if [ "$IP_SEEDED" -gt 0 ]; then
  O=$(ip_orig company-intro)
  check "회사: 유튜브 번호 형식" "PAGE_INVALID 유튜브 주소의 v= 뒤 11글자를 적어 주세요." \
    "$(ip_body "$O" 'c["film"]["youtubeId"]="x"' | ip_put company-intro | ip_msg)"
  O=$(ip_orig business-smart-fac)
  check "기능 장: 기능 번호는 숫자" "PAGE_INVALID 번호는 숫자로 입력해 주세요." \
    "$(ip_body "$O" 'c["features"][0]["no"]="가"' | ip_put business-smart-fac | ip_msg)"
  O=$(ip_orig business-pcb-mes)
  check "업종 장: 구역의 기능 번호 형식" "PAGE_INVALID 기능 번호는 쉼표로 나눈 숫자로 적어 주세요(예: 1, 2, 3)." \
    "$(ip_body "$O" 'c["groups"][0]["nos"]="a,b"' | ip_put business-pcb-mes | ip_msg)"
  O=$(ip_orig service-autoform)
  check "시연 장: 말풍선 쪽은 me·them" "PAGE_INVALID 말한 쪽은 me(우리 쪽) 또는 them(상대 쪽)으로 적어 주세요." \
    "$(ip_body "$O" 'c["compare"]["before"]["bubbles"][0]["who"]="x"' | ip_put service-autoform | ip_msg)"
  O=$(ip_orig business-ai-sol)
  check "허브: 개인정보 증서 그림은 못 가리킨다" "PAGE_INVALID yes" \
    "$(ip_body "$O" 'c["autoformTabs"][0]["image"]["src"]="/img/patent2.png"' | ip_put business-ai-sol | pick 'print((d or {}).get("resultCode"), "yes" if "그림 주소가 올바르지 않습니다" in ((d or {}).get("message") or "") else (d or {}).get("message"))')"
  O=$(ip_orig business-max)
  check "허브: 모르는 칸은 400" "PAGE_INVALID yes" \
    "$(ip_body "$O" 'c["pcbCard"]["oops"]="x"' | ip_put business-max | pick 'print((d or {}).get("resultCode"), "yes" if "알 수 없는 칸" in ((d or {}).get("message") or "") else (d or {}).get("message"))')"
  O=$(ip_orig service-chat)
  check "채팅: 머리 그림은 빼지 못한다" "PAGE_INVALID yes" \
    "$(ip_body "$O" 'c["agentShot"]=None' | ip_put service-chat | pick 'print((d or {}).get("resultCode"), "yes" if "그림을 넣어 주세요" in ((d or {}).get("message") or "") else (d or {}).get("message"))')"
  check "틀린 값은 저장되지 않았다(회사 안내)" "same" \
    "$(curl -s "$API/api/content/pages/company-intro" --max-time 30 | ORIG="$(ip_orig company-intro)" pick 'import json, os; print("same" if json.dumps(d.get("data"), ensure_ascii=False, sort_keys=True)==os.environ["ORIG"] and (d.get("data") or {}).get("film",{}).get("youtubeId")!="x" else "diff")')"
fi
