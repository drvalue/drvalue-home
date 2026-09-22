"""공개 사이트가 읽을 엔드포인트를 만든다.

왜 권한이 아니라 플로우인가
---------------------------
Directus Core 는 권한에 조건을 못 건다. 아래 둘 다 403 이 난다.

    permissions: {"status": {"_eq": "published"}}   → RESOURCE_RESTRICTED
    fields: ["name", "email"]  (일부만)             → RESOURCE_RESTRICTED
    (에러: custom_permission_rules_enabled is a restricted resource)

남는 선택지는 fields:["*"] + 조건 없음뿐인데, 그러면 익명이 초안까지 본다
(실측: status=draft 인 /leak-test 가 익명 조회에 그대로 나왔다).

그래서 공개 읽기를 웹훅 플로우로 돌린다. 플로우 안의 조회는 `$full` 권한으로
돌아가므로 조건과 필드를 마음대로 쓸 수 있고, 밖에서는 결과 JSON 만 보인다.
Public 정책에는 초안 개념이 없는 싱글톤과 파일 외에는 아무 권한도 주지 않는다.

왜 엔드포인트가 컬렉션마다 하나가 아닌가
----------------------------------------
Core 는 플로우를 5개까지만 허용한다(flows limit exceeded). 예약 게시 크론이
하나를 쓰므로 공개용으로는 사실상 4개뿐이다. 그래서 읽기는 라우터 하나로
합치고(?resource=), 쓰기는 문의 등록 하나만 둔다. 합계 3개.

    GET  /flows/trigger/<읽기 uuid>?resource=posts&board=notice
    POST /flows/trigger/<문의 uuid>

읽을 수 있는 목록과 각 질의는 scripts/public_router.js 에 있다.

시도했다가 버린 것
------------------
PostgreSQL 뷰. Directus 12 는 뷰를 컬렉션으로 인식하지 못한다. 등록은 200 이
떨어지지만 관리자조차 조회에서 403 이 난다("or it does not exist" — 필드를
하나도 못 읽는다).

uuid 는 uuid5 로 키에서 만든다. 다시 프로비저닝해도 주소가 바뀌지 않는다.
전체 주소는 실행 후 public-endpoints.json 에 쓴다.

여러 번 돌려도 같은 결과가 나온다.
실행: python3 scripts/public_api.py
"""

from __future__ import annotations

import json
import pathlib
import sys
import uuid

sys.path.insert(0, "scripts")
from directus import Directus  # noqa: E402

NAMESPACE = uuid.uuid5(uuid.NAMESPACE_URL, "drvalue.co.kr/cms/public")
ROUTER_JS = pathlib.Path(__file__).with_name("public_router.js")

READ_FLOW = str(uuid.uuid5(NAMESPACE, "read"))
INQUIRY_FLOW = str(uuid.uuid5(NAMESPACE, "inquiry"))

# public_router.js 의 routes 와 같아야 한다. 여기 있는 것은 문서와 스모크용이다.
RESOURCES = [
    ("pages", "페이지 목록", ""),
    ("page", "페이지 상세", "path=/about"),
    ("posts", "게시판 목록", "board=notice&page=1"),
    ("posts-latest", "최신 글 (게시판 무관)", ""),
    ("post", "게시글 상세", "slug=xxx"),
    ("recruits", "채용공고 목록", "page=1"),
    ("recruit", "채용공고 상세", "slug=xxx"),
    ("hero-slides", "메인 배너", ""),
    ("popups", "메인 팝업", ""),
    ("menu", "상단·하단 메뉴", ""),
]

# 초안 개념이 없고 개인정보도 없다. 플로우로 감쌀 이유가 없어 그냥 연다.
# directus_files 를 열지 않으면 썸네일·OG 이미지 uuid 가 전부 깨진 이미지가 된다.
PUBLIC_READ = ["site_settings", "home_settings", "seo_defaults", "directus_files"]

# 문의 등록에서 받을 필드. 권한으로 열면 Core 가 필드를 못 좁혀서 익명이
# status 와 assignee 까지 넣을 수 있다. 그래서 여기서 직접 적는다.
INQUIRY_FIELDS = ["name", "email", "phone", "company", "subject", "message"]


def public_policy_id(d: Directus) -> str:
    """Public 정책 id. 이름이 i18n 키($t:public_label)라 그대로 비교한다."""
    _, body = d.request("GET", "/policies?limit=-1")
    for p in body.get("data", []):
        if p["name"] in ("$t:public_label", "Public"):
            return p["id"]
    raise SystemExit("Public 정책을 찾지 못했다")


class Provisioner:
    def __init__(self, d: Directus) -> None:
        self.d = d
        self.made: list[str] = []
        self.skipped = 0
        self.failed: list[str] = []
        _, body = d.request("GET", "/flows?limit=-1&fields=id,name")
        self.flows = {f["id"]: f["name"] for f in body.get("data", [])}
        _, body = d.request("GET", "/operations?limit=-1&fields=id,flow,key,options")
        self.ops = {(o["flow"], o["key"]): o for o in body.get("data", [])}

    # ------------------------------------------------------------------
    def flow(self, flow_id: str, name: str, method: str, note: str) -> bool:
        if flow_id in self.flows:
            self.skipped += 1
            return True
        status, res = self.d.request("POST", "/flows", {
            "id": flow_id,
            "name": name,
            "icon": "public",
            "description": note,
            "status": "active",
            # 익명 호출이므로 남길 계정이 없다.
            "accountability": None,
            "trigger": "webhook",
            "options": {"method": method, "async": False,
                        "return": "$last", "cacheEnabled": False},
        })
        if status != 200:
            self.failed.append(f"플로우 {name}: HTTP {status} {res}")
            return False
        self.made.append(f"플로우 {name}")
        return True

    def operation(self, flow_id: str, key: str, name: str, type_: str,
                  options: dict, x: int = 19) -> str | None:
        """작업을 만들거나, 이미 있으면 options 를 현재 값으로 맞춘다.

        건너뛰기만 하면 라우터 스크립트를 고쳐도 재실행이 반영하지 못한다.
        """
        have = self.ops.get((flow_id, key))
        if have is not None:
            if have.get("options") != options:
                st, res = self.d.request("PATCH", f"/operations/{have['id']}",
                                         {"options": options})
                if st == 200:
                    self.made.append(f"작업 {key} 갱신")
                else:
                    self.failed.append(f"작업 {key} 갱신: HTTP {st} {res}")
            else:
                self.skipped += 1
            return have["id"]
        status, res = self.d.request("POST", "/operations", {
            "flow": flow_id, "key": key, "name": name, "type": type_,
            "position_x": x, "position_y": 1, "options": options,
        })
        if status != 200:
            self.failed.append(f"작업 {key}: HTTP {status} {res}")
            return None
        self.made.append(f"작업 {key}")
        return res["data"]["id"]


def main() -> None:
    d = Directus()
    d.login()
    p = Provisioner(d)

    # 1) 공개 읽기 라우터: 화이트리스트 스크립트 → 조회
    if p.flow(READ_FLOW, "공개: 읽기 라우터", "GET",
              "공개 사이트 읽기. ?resource= 로 갈라진다. "
              "고치는 곳은 scripts/public_router.js 다."):
        guard = p.operation(
            READ_FLOW, "route", "요청 검증", "exec",
            {"code": ROUTER_JS.read_text(encoding="utf-8")},
        )
        # 라우터가 정한 컬렉션과 질의를 그대로 쓴다. 밖에서 고를 수 없다.
        read = p.operation(
            READ_FLOW, "read", "조회", "item-read",
            {"collection": "{{$last.collection}}", "query": "{{$last.query}}",
             "permissions": "$full"},
            x=37,
        )
        if guard and read:
            d.request("PATCH", f"/operations/{guard}", {"resolve": read})
            d.request("PATCH", f"/flows/{READ_FLOW}", {"operation": guard})

    # 2) 문의 등록
    if p.flow(INQUIRY_FLOW, "공개: 문의 등록", "POST",
              "홈페이지 문의 폼. 받는 필드는 public_api.py 의 INQUIRY_FIELDS 다."):
        create = p.operation(
            INQUIRY_FLOW, "create", "문의 저장", "item-create",
            {"collection": "inquiries", "permissions": "$full",
             "payload": {f: "{{$trigger.body.%s}}" % f for f in INQUIRY_FIELDS}},
        )
        if create:
            d.request("PATCH", f"/flows/{INQUIRY_FLOW}", {"operation": create})

    # 3) Public 정책: 싱글톤과 파일만 직접 연다.
    pub = public_policy_id(d)
    _, body = d.request("GET", f"/permissions?limit=-1&filter[policy][_eq]={pub}")
    current = body.get("data", [])
    have = {(x["collection"], x["action"]) for x in current}
    for collection in PUBLIC_READ:
        if (collection, "read") in have:
            p.skipped += 1
            continue
        st, res = d.request("POST", "/permissions", {
            "policy": pub, "collection": collection, "action": "read", "fields": ["*"],
        })
        if st == 200:
            p.made.append(f"공개 읽기 {collection}")
        else:
            p.failed.append(f"공개 읽기 {collection}: HTTP {st} {res}")

    # 나머지는 회수한다. 아이템 테이블에 직접 걸린 공개 권한은 조건을 못 걸어
    # 초안까지 새어 나간다.
    for x in current:
        if x["collection"] not in PUBLIC_READ:
            d.request("DELETE", f"/permissions/{x['id']}")
            p.made.append(f"직접 권한 회수 {x['collection']}.{x['action']}")

    # 4) 주소를 파일로 남긴다. 화면이 이걸 읽는다.
    endpoints = {
        "read": f"/flows/trigger/{READ_FLOW}",
        "inquiry": f"/flows/trigger/{INQUIRY_FLOW}",
        "resources": {key: {"설명": note, "예시": example}
                      for key, note, example in RESOURCES},
        "직접_읽기": [f"/items/{c}" for c in PUBLIC_READ if not c.startswith("directus_")]
                     + ["/assets/<파일 uuid>"],
    }
    out = pathlib.Path("public-endpoints.json")
    out.write_text(json.dumps(endpoints, ensure_ascii=False, indent=2) + "\n",
                   encoding="utf-8")

    print(f"생성 {len(p.made)}건, 기존 유지 {p.skipped}건, 실패 {len(p.failed)}건")
    for line in p.made:
        print(f"  + {line}")
    for line in p.failed:
        print(f"  ! {line}")
    print(f"\n주소는 {out} 에 적었다.")
    raise SystemExit(1 if p.failed else 0)


if __name__ == "__main__":
    main()
