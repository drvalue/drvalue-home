"""예약 게시 실행기(요구사항 10번).

publish_at / unpublish_at 필드만 두면 아무 일도 일어나지 않는다.
그 시각에 status 를 바꿔 주는 것이 있어야 실제로 뜨고 내려간다.
실행기가 없으면 에러도 없이 조용히 안 뜬다.

Directus Flows 의 schedule 트리거(cron)를 쓴다. Core 에서 동작하는 것을 확인했다.
1분마다 아래를 수행한다:

  publish_at  <= 지금  이고 status=scheduled  →  published
  unpublish_at <= 지금 이고 status=published  →  archived

status 에 'scheduled' 를 추가한다. 'draft' 를 그대로 쓰면 "아직 안 쓴 글" 과
"시각을 기다리는 글" 이 구분되지 않는다.

여러 번 돌려도 같은 결과가 나온다.
실행: python3 scripts/flows.py
"""

from __future__ import annotations

import sys

sys.path.insert(0, "scripts")
from directus import Directus  # noqa: E402

SCHEDULED = [("pages", "페이지"), ("posts", "게시판"), ("recruits", "채용공고"),
              ("hero_slides", "메인 배너"), ("popups", "팝업")]

FLOW_NAME = "예약 게시·내림"


def main() -> None:
    d = Directus()
    d.login()
    made, skipped, failed = [], 0, []

    # 1) status 에 '예약' 선택지를 추가한다.
    for collection, label in SCHEDULED:
        status, body = d.request("GET", f"/fields/{collection}/status")
        if status != 200:
            failed.append(f"{collection}.status 조회 실패 HTTP {status}")
            continue
        meta = body["data"]["meta"]
        opts = meta.get("options") or {}
        choices = opts.get("choices") or []
        if any(c.get("value") == "scheduled" for c in choices):
            skipped += 1
            continue
        choices.insert(1, {"text": "예약", "value": "scheduled"})
        opts["choices"] = choices
        st, res = d.request("PATCH", f"/fields/{collection}/status",
                            {"meta": {"options": opts}})
        if st == 200:
            made.append(f"{collection}.status 에 '예약' 추가")
        else:
            failed.append(f"{collection}.status: HTTP {st} {res}")

    # 2) 1분 크론 플로우
    _, body = d.request("GET", "/flows?limit=-1&fields=id,name,accountability")
    flow = next((f for f in body.get("data", []) if f["name"] == FLOW_NAME), None)
    if flow is None:
        st, res = d.request("POST", "/flows", {
            "name": FLOW_NAME,
            "icon": "schedule",
            "description": "publish_at / unpublish_at 시각이 지나면 status 를 바꾼다.",
            "status": "active",
            "trigger": "schedule",
            # 실행 자체는 기록하지 않는다. "all" 로 두면 1분마다 아무 일이
            # 없어도 directus_activity 와 directus_revisions 에 action=run 이
            # 한 줄씩 쌓인다(하루 1,440행). 마케팅이 보는 변경 이력에도 섞인다.
            # null 로 둬도 실제 상태 변경은 posts 의 update 로 남는다(실측).
            "accountability": None,
            "options": {"cron": "* * * * *"},
        })
        if st != 200:
            failed.append(f"플로우 생성: HTTP {st} {res}")
            print_result(made, skipped, failed)
            return
        flow = res["data"]
        made.append(f"플로우 {FLOW_NAME}")
    elif flow.get("accountability") is not None:
        # 이미 있는 플로우도 맞춰 준다. 건너뛰기만 하면 먼저 만든 환경에서는
        # 계속 1분마다 로그가 쌓인다.
        d.request("PATCH", f"/flows/{flow['id']}", {"accountability": None})
        made.append(f"플로우 {FLOW_NAME} 실행 로그 끔")
    else:
        skipped += 1

    # 3) 컬렉션마다 게시·내림 두 작업을 잇는다.
    _, body = d.request("GET", "/operations?limit=-1")
    have = {o["key"] for o in body.get("data", []) if o.get("flow") == flow["id"]}

    previous_key = None
    first_key = None
    for collection, label in SCHEDULED:
        for kind, from_status, to_status, field in (
            ("publish", "scheduled", "published", "publish_at"),
            ("unpublish", "published", "archived", "unpublish_at"),
        ):
            key = f"{kind}_{collection}"
            if first_key is None:
                first_key = key
            if key in have:
                skipped += 1
                previous_key = key
                continue
            payload = {
                "flow": flow["id"],
                "key": key,
                "name": f"{label} {'게시' if kind == 'publish' else '내림'}",
                "type": "item-update",
                "position_x": 20 + len(have) * 2,
                "position_y": 1,
                "options": {
                    "collection": collection,
                    "query": {
                        "filter": {
                            "_and": [
                                {"status": {"_eq": from_status}},
                                {field: {"_nnull": True}},
                                {field: {"_lte": "$NOW"}},
                            ]
                        }
                    },
                    "payload": {"status": to_status},
                    "permissions": "$full",
                },
            }
            st, res = d.request("POST", "/operations", payload)
            if st != 200:
                failed.append(f"{key}: HTTP {st} {res}")
                continue
            made.append(f"작업 {key}")
            op_id = res["data"]["id"]
            if previous_key is None:
                d.request("PATCH", f"/flows/{flow['id']}", {"operation": op_id})
            else:
                prev = next(
                    (o for o in d.request("GET", "/operations?limit=-1")[1].get("data", [])
                     if o.get("flow") == flow["id"] and o["key"] == previous_key),
                    None,
                )
                if prev:
                    d.request("PATCH", f"/operations/{prev['id']}", {"resolve": op_id})
            previous_key = key

    print_result(made, skipped, failed)


def print_result(made, skipped, failed) -> None:
    print(f"생성 {len(made)}건, 기존 유지 {skipped}건, 실패 {len(failed)}건")
    for line in made:
        print(f"  + {line}")
    for line in failed:
        print(f"  ! {line}")
    raise SystemExit(1 if failed else 0)


if __name__ == "__main__":
    main()
