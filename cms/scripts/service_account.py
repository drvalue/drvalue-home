"""Nest 백엔드가 Directus 를 읽을 계정을 만든다.

왜 역할이 아니라 정책을 직접 붙이나
-----------------------------------
Core 는 사용자 seat 이 3명이다(실측: 4번째 생성 시 `seats limit exceeded`).
서비스 계정에 역할을 주면 사람 자리를 하나 잡아먹는다.

`app_access: false` 정책을 사용자에게 **직접** 붙이면 관리 화면에는 못 들어가고
API 만 쓸 수 있다. 이건 seat 로 세지 않는다 — 사람 3명이 꽉 찬 상태에서도
서비스 계정 생성이 통과하는 것을 확인했다.

Nest 가 이 토큰으로 읽으면 Core 의 제약 몇 개가 의미가 없어진다.

  조건부 권한을 못 건다      → Nest 가 전부 읽고 코드에서 거른다
  필드를 못 좁힌다            → Nest 가 내보낼 필드만 골라 내려준다
  목록에 전체 건수가 없다     → Nest 가 Directus 에 직접 물어 meta 를 받는다
  공개 엔드포인트 주소가 uuid → Nest 가 /api/posts 같은 주소로 감싼다
  파일 목록이 통째로 열린다   → Directus 의 공개 권한을 닫고 Nest 가 중계한다

**seat 3명은 그대로 남는다.** 그건 CMS 를 직접 편집하는 사람 수 제한이다.

이 토큰을 가진 쪽은 **업로드한 파일 목록을 전부 읽을 수 있다**
(`directus_files` 읽기. `filename_download` · `uploaded_by` 포함). Nest 를 앞에
둔다고 그 노출이 없어지는 게 아니라 **공개 익명에서 백엔드로 옮겨지는 것**이다.
토큰이 새면 파일 목록도 같이 샌다.

토큰은 만들 때 한 번만 화면에 찍는다. 저장소에 넣지 말고 Nest 의 환경변수로
옮겨라. 다시 보려면 새로 발급해야 한다.

**`--rotate` 는 무중단이 아니다.** 옛 토큰이 그 자리에서 죽는다(실측: 200 →
401). Nest 가 돌고 있으면 환경변수를 바꾸고 재시작할 때까지 모든 요청이
실패한다. 순서를 지켜라 — 발급 → Nest 환경변수 교체 → Nest 재시작.

여러 번 돌려도 같은 결과가 나온다(토큰은 --rotate 를 줄 때만 새로 만든다).
실행: python3 scripts/service_account.py [--rotate]
"""

from __future__ import annotations

import secrets
import sys

sys.path.insert(0, "scripts")
from directus import Directus  # noqa: E402

# 이 주소는 scripts/smoke.sh 의 "서비스 계정에 역할이 없다" 검사도 쓴다.
# 바꾸려면 양쪽을 같이 바꿔야 한다. 한쪽만 바꾸면 검사가 조용히 통과한다.
EMAIL = "service@drvalue.co.kr"
POLICY = "백엔드 읽기 전용"

# Nest 가 공개 사이트에 내보낼 것만. 문의는 쓰기도 필요하다.
READ = [
    "pages", "page_blocks", "posts", "recruits", "hero_slides", "popups",
    "menu_items", "site_settings", "home_settings", "seo_defaults",
    "languages", "directus_files",
    # 첨부(m2m)의 중간 테이블. 빠뜨리면 첨부가 **오류 없이 빈 배열**로 온다
    # — 글은 보이는데 첨부만 사라진다(실측).
    "posts_files",
]
READ += [f"{c}_translations" for c in (
    "pages", "page_blocks", "posts", "recruits", "hero_slides", "popups",
    "menu_items", "site_settings", "home_settings", "seo_defaults",
)]
CREATE = ["inquiries"]


def main() -> None:
    rotate = "--rotate" in sys.argv
    d = Directus()
    d.login()
    made, skipped, failed = [], 0, []

    # 1) 정책. app_access=false 가 핵심이다 — 이게 true 면 seat 를 먹는다.
    _, body = d.request("GET", "/policies?limit=-1&fields=id,name")
    policy = next((p["id"] for p in body.get("data", []) if p["name"] == POLICY), None)
    if policy is None:
        st, res = d.request("POST", "/policies", {
            "name": POLICY,
            "icon": "api",
            "description": "Nest 백엔드용. 관리 화면에는 못 들어간다.",
            "app_access": False,
            "admin_access": False,
            "enforce_tfa": False,
        })
        if st != 200:
            raise SystemExit(f"정책 생성 실패 HTTP {st} {res}")
        policy = res["data"]["id"]
        made.append(f"정책 {POLICY}")
    else:
        skipped += 1

    # 2) 권한
    _, body = d.request("GET", f"/permissions?limit=-1&filter[policy][_eq]={policy}")
    have = {(p["collection"], p["action"]) for p in body.get("data", [])}
    for collection in READ:
        if (collection, "read") in have:
            skipped += 1
            continue
        st, res = d.request("POST", "/permissions", {
            "policy": policy, "collection": collection, "action": "read", "fields": ["*"],
        })
        made.append(f"읽기 {collection}") if st == 200 else failed.append(
            f"읽기 {collection}: HTTP {st} {res}")
    for collection in CREATE:
        if (collection, "create") in have:
            skipped += 1
            continue
        st, res = d.request("POST", "/permissions", {
            "policy": policy, "collection": collection, "action": "create", "fields": ["*"],
        })
        made.append(f"쓰기 {collection}") if st == 200 else failed.append(
            f"쓰기 {collection}: HTTP {st} {res}")

    # 3) 사용자. role 은 반드시 null 이다.
    _, body = d.request("GET", f"/users?limit=1&fields=id,token&filter[email][_eq]={EMAIL}")
    rows = body.get("data") or []
    if rows:
        user = rows[0]["id"]
        skipped += 1
    else:
        st, res = d.request("POST", "/users", {
            "email": EMAIL,
            "status": "active",
            "role": None,
            "first_name": "백엔드",
            "last_name": "서비스",
        })
        if st != 200:
            raise SystemExit(f"서비스 계정 생성 실패 HTTP {st} {res}")
        user = res["data"]["id"]
        made.append(f"서비스 계정 {EMAIL}")

    # 4) 정책 연결
    _, body = d.request("GET", "/access?limit=-1&fields=user,policy")
    if not any(a.get("user") == user and a.get("policy") == policy for a in body.get("data", [])):
        st, res = d.request("POST", "/access", {"user": user, "policy": policy})
        made.append("정책 연결") if st == 200 else failed.append(f"정책 연결: HTTP {st} {res}")
    else:
        skipped += 1

    # 5) 토큰
    token = None
    if rotate or not (rows and rows[0].get("token")):
        token = secrets.token_urlsafe(32)
        st, res = d.request("PATCH", f"/users/{user}", {"token": token})
        if st != 200:
            failed.append(f"토큰 발급: HTTP {st} {res}")
            token = None
        else:
            made.append("정적 토큰 발급")
    else:
        skipped += 1

    print(f"생성 {len(made)}건, 기존 유지 {skipped}건, 실패 {len(failed)}건")
    for line in made:
        print(f"  + {line}")
    for line in failed:
        print(f"  ! {line}")
    if token:
        print("\n" + "=" * 62)
        print("아래 토큰은 지금 한 번만 보인다. Nest 환경변수로 옮겨라.")
        print("저장소에 넣지 마라. 잃어버리면 --rotate 로 새로 발급한다.")
        print(f"\n  DIRECTUS_TOKEN={token}\n")
        print("=" * 62)
    raise SystemExit(1 if failed else 0)


if __name__ == "__main__":
    main()
