"""역할과 권한(요구사항 8번).

Directus 12 는 역할(role) 과 정책(policy) 이 분리돼 있다.
권한은 정책에 붙고, 역할이 정책을 갖는다.

  관리자   전부
  마케팅   콘텐츠·메인화면·메뉴 읽기·미디어·문의. 사용자 관리는 못 한다.
  인사     채용공고만. 그 외 게시판은 보이지도 않는다.

여러 번 돌려도 같은 결과가 나온다.
실행: python3 scripts/roles.py
"""

from __future__ import annotations

import sys

sys.path.insert(0, "scripts")
from directus import Directus  # noqa: E402

CRUD = ["create", "read", "update", "delete"]

# i18n_content.py 의 TRANSLATABLE 과 같아야 한다. 여기서는 어떤 컬렉션에
# <이름>_translations 가 딸려 있는지만 알면 된다.
TRANSLATABLE = {
    "pages", "page_blocks", "posts", "recruits", "hero_slides", "popups",
    "menu_items", "site_settings", "home_settings", "seo_defaults",
}

# Directus Core 는 조건부 권한(custom permission rules)이 막혀 있다.
#   custom_permission_rules_enabled is a restricted resource (실측)
# 그래서 "인사는 채용공고만" 을 행 조건이 아니라 컬렉션 분리로 표현한다.
#   posts    = 공지·뉴스·보도자료·FAQ·자료실·수행사례·지원사업  → 마케팅
#   recruits = 채용공고                                        → 인사

ROLES = {
    "마케팅": {
        "icon": "campaign",
        "description": "페이지·메인화면·게시판(채용 제외)·미디어·문의를 다룬다.",
        "permissions": [
            # (컬렉션, 동작들, 조건 | None, 필드)
            ("pages", ["create", "read", "update"], None, "*"),
            ("page_blocks", CRUD, None, "*"),
            ("posts", CRUD, None, "*"),
            # 첨부(m2m)의 중간 테이블. 원본만 열어 주면 첨부 저장이 403 이
            # 난다 — 번역 컬렉션과 같은 이유다.
            ("posts_files", CRUD, None, "*"),
            ("hero_slides", CRUD, None, "*"),
            ("popups", CRUD, None, "*"),
            ("home_settings", ["read", "update"], None, "*"),
            ("seo_defaults", ["read", "update"], None, "*"),
            ("site_settings", ["read"], None, "*"),
            ("menu_items", ["read"], None, "*"),
            ("inquiries", ["read", "update"], None, "*"),
            ("inquiry_notes", CRUD, None, "*"),
            ("directus_files", ["create", "read", "update"], None, "*"),
        ],
    },
    "인사": {
        "icon": "badge",
        "description": "채용공고만 등록·수정한다.",
        "permissions": [
            ("recruits", CRUD, None, "*"),
            ("directus_files", ["create", "read"], None, "*"),
        ],
    },
}


def with_translations(permissions: list) -> list:
    """번역 컬렉션 권한을 원본에서 파생시킨다(요구사항 11번).

    원본만 열어 주면 관리 화면에 언어 탭은 뜨는데 저장이 403 이 난다.
    글을 고칠 수 있는 컬렉션이면 번역 행은 만들고 지울 수도 있어야 한다
    (언어를 추가·삭제하는 것이 곧 행 추가·삭제다). 읽기만 되는 컬렉션은
    번역도 읽기만 한다.

    `languages` 는 언어 탭 자체를 그리는 데 필요해서 모두 읽기를 준다.
    """
    out = list(permissions)
    for collection, actions, condition, fields in permissions:
        if collection not in TRANSLATABLE:
            continue
        derived = CRUD if "update" in actions else ["read"]
        out.append((f"{collection}_translations", derived, condition, fields))
    out.append(("languages", ["read"], None, "*"))
    return out


def main() -> None:
    d = Directus()
    d.login()

    for spec in ROLES.values():
        spec["permissions"] = with_translations(spec["permissions"])

    made, skipped, failed = [], 0, []

    _, body = d.request("GET", "/roles?limit=-1")
    roles = {r["name"]: r for r in body.get("data", [])}
    _, body = d.request("GET", "/policies?limit=-1")
    policies = {p["name"]: p for p in body.get("data", [])}
    _, body = d.request("GET", "/permissions?limit=-1")
    have = {
        (p.get("policy"), p.get("collection"), p.get("action"))
        for p in body.get("data", [])
    }
    _, body = d.request("GET", "/access?limit=-1")
    access_pairs = {
        (a.get("role"), a.get("policy")) for a in body.get("data", [])
    }

    for name, spec in ROLES.items():
        policy_name = f"{name} 권한"
        policy = policies.get(policy_name)
        if policy is None:
            status, res = d.request(
                "POST",
                "/policies",
                {
                    "name": policy_name,
                    "icon": spec["icon"],
                    "description": spec["description"],
                    "app_access": True,   # 관리 화면에 들어올 수 있어야 한다
                    "admin_access": False,
                },
            )
            if status != 200:
                failed.append(f"정책 {policy_name}: HTTP {status} {res}")
                continue
            policy = res["data"]
            made.append(f"정책 {policy_name}")
        else:
            skipped += 1

        role = roles.get(name)
        if role is None:
            # policies 를 생성 요청에 같이 넣으면 403 이 난다. 역할을 먼저 만들고
            # /access 로 정책을 붙인다.
            status, res = d.request(
                "POST",
                "/roles",
                {"name": name, "icon": spec["icon"], "description": spec["description"]},
            )
            if status != 200:
                failed.append(f"역할 {name}: HTTP {status} {res}")
                continue
            role = res["data"]
            made.append(f"역할 {name}")
        else:
            skipped += 1

        # 역할 ↔ 정책 연결
        if (role["id"], policy["id"]) not in access_pairs:
            status, res = d.request(
                "POST", "/access", {"role": role["id"], "policy": policy["id"]}
            )
            if status == 200:
                made.append(f"{name} ↔ {policy_name}")
                access_pairs.add((role["id"], policy["id"]))
            else:
                failed.append(f"{name} 정책 연결: HTTP {status} {res}")
        else:
            skipped += 1

        for collection, actions, conditions, fields in spec["permissions"]:
            for action in actions:
                if (policy["id"], collection, action) in have:
                    skipped += 1
                    continue
                payload = {
                    "policy": policy["id"],
                    "collection": collection,
                    "action": action,
                    "fields": [fields],
                    "permissions": conditions or {},
                    # create 에는 permissions 조건이 안 먹는다. validation 이 막는다.
                    "validation": conditions if action == "create" and conditions else {},
                }
                status, res = d.request("POST", "/permissions", payload)
                if status == 200:
                    made.append(f"{name}: {collection}.{action}")
                else:
                    failed.append(f"{name} {collection}.{action}: HTTP {status} {res}")

    print(f"생성 {len(made)}건, 기존 유지 {skipped}건, 실패 {len(failed)}건")
    for line in failed:
        print(f"  ! {line}")
    raise SystemExit(1 if failed else 0)


if __name__ == "__main__":
    main()
