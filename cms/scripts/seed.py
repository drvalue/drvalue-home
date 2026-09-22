"""로컬 검증용 계정과 표본 데이터.

Core 는 사용자 seat 이 3명이다. 관리자·마케팅·인사로 정확히 3명을 쓴다.
운영 데이터를 만들지 않는다 — 실제로 등록된 것이 없는 게시판은 비워 둔다.

실행: python3 scripts/seed.py
"""

from __future__ import annotations

import sys
from datetime import date

sys.path.insert(0, "scripts")
from directus import Directus  # noqa: E402

PASSWORD = "drvalue1234!"

ACCOUNTS = [
    ("marketing@drvalue.co.kr", "마케팅", "담당", "마케팅"),
    ("hr@drvalue.co.kr", "인사", "담당", "인사"),
]


def main() -> None:
    d = Directus()
    d.login()

    _, body = d.request("GET", "/roles?limit=-1")
    roles = {r["name"]: r["id"] for r in body.get("data", [])}

    _, body = d.request("GET", "/users?limit=-1&fields=id,email")
    users = {u["email"] for u in body.get("data", []) if u.get("email")}

    made, skipped, failed = [], 0, []
    for email, first, last, role_name in ACCOUNTS:
        if email in users:
            skipped += 1
            continue
        role_id = roles.get(role_name)
        if role_id is None:
            failed.append(f"역할 없음: {role_name}")
            continue
        status, res = d.request(
            "POST",
            "/users",
            {
                "email": email,
                "password": PASSWORD,
                "first_name": first,
                "last_name": last,
                "role": role_id,
                "status": "active",
            },
        )
        if status == 200:
            made.append(f"{email} ({role_name})")
        else:
            failed.append(f"{email}: HTTP {status} {res}")

    # 표본 데이터. 화면이 전부 비어 있으면 무엇이 되는지 확인할 수가 없고,
    # 공개 엔드포인트도 빈 배열만 돌려준다. 실제 원고는 넣지 않는다.
    #
    # 글로 된 값은 원본이 아니라 translations 로 들어간다(요구사항 11번).
    # 원본에는 주소·상태·정렬만 남는다.
    def once(collection: str, key: str, value: str, payload: dict, label: str):
        """같은 키가 이미 있으면 건너뛴다. 여러 번 돌려도 하나만 남는다."""
        st, res = d.request(
            "GET", f"/items/{collection}?filter[{key}][_eq]={value}&limit=1&fields=id"
        )
        if st != 200:
            failed.append(f"{label} 조회: HTTP {st} {res}")
            return None
        if res.get("data"):
            return res["data"][0]["id"]
        st, res = d.request("POST", f"/items/{collection}", payload)
        if st != 200:
            failed.append(f"{label}: HTTP {st} {res}")
            return None
        made.append(label)
        return res["data"]["id"]

    def t(ko: dict, en: dict) -> list[dict]:
        return [
            {"languages_code": "ko-KR", **ko},
            {"languages_code": "en-US", **en},
        ]

    # 공개 목록에 나오면 안 되는 표본이라 draft 로 둔다. published 로 두면
    # import_board.py --purge-demo 가 지운 뒤에 이게 다시 돌 때 메인·공지에
    # "표본 글이다" 가 되살아난다 — 실행 순서에 결과가 매이지 않게 한다.
    once("posts", "slug", "seed-notice-sample", {
        "board": "notice", "status": "draft", "slug": "seed-notice-sample",
        # 표시 날짜는 필수다. 비우면 목록 정렬에서 맨 앞으로 튄다(schema.py 참고).
        "published_date": date.today().isoformat(),
        "translations": t(
            {"title": "홈페이지 관리자 도입 안내",
             "summary": "게시판이 동작하는지 확인하는 표본 글이다. 실제 공지로 쓰지 않는다."},
            {"title": "Introducing the site admin",
             "summary": "Sample notice used to verify the board works."},
        ),
    }, "표본 공지")

    page_id = once("pages", "path", "/about", {
        "path": "/about", "status": "published",
        "translations": t(
            {"title": "회사소개",
             "lead": "페이지와 본문 섹션이 어떻게 붙는지 보여주는 표본이다.",
             "seo_title": "회사소개 | 디알밸류",
             "seo_description": "표본 SEO 설명이다."},
            {"title": "About Us",
             "lead": "Sample page showing how sections attach to a page.",
             "seo_title": "About Us | DR Value",
             "seo_description": "Sample SEO description."},
        ),
    }, "표본 페이지 /about")

    # 페이지 본문은 pages 한 줄이 아니라 page_blocks 여러 줄로 쌓인다.
    if page_id is not None:
        for order, (btype, ko, en) in enumerate([
            ("hero",
             {"heading": "디알밸류", "lead": "본문 섹션 1 — 제목과 소개문"},
             {"heading": "DR Value", "lead": "Section 1 — heading and lead"}),
            ("text",
             {"heading": "무엇을 하는 회사인가",
              "lead": "본문 섹션 2 — 순서를 바꾸면 화면 순서가 바뀐다"},
             {"heading": "What we do", "lead": "Section 2 — reorder to reorder on screen"}),
        ]):
            st, res = d.request(
                "GET",
                f"/items/page_blocks?filter[page][_eq]={page_id}"
                f"&filter[type][_eq]={btype}&limit=1&fields=id",
            )
            if st == 200 and not res.get("data"):
                d.request("POST", "/items/page_blocks", {
                    "page": page_id, "type": btype, "sort": order,
                    "translations": t(ko, en),
                })
                made.append(f"표본 본문 섹션 {btype}")

    for order, (location, path, ko, en) in enumerate([
        ("header", "/about", "회사소개", "About"),
        ("header", "/notice", "공지사항", "Notice"),
        ("footer", "/privacy", "개인정보처리방침", "Privacy Policy"),
    ]):
        once("menu_items", "path", path, {
            "location": location, "path": path, "is_visible": True, "sort": order,
            "translations": t({"label": ko}, {"label": en}),
        }, f"표본 메뉴 {ko}")

    once("hero_slides", "code", "seed-hero", {
        "code": "seed-hero", "status": "published", "sort": 0,
        "translations": t(
            {"nav_label": "표본", "title_line1": "디알밸류", "title_line2": "표본 배너",
             "description": "메인 배너가 어떻게 나오는지 보는 표본이다."},
            {"nav_label": "Sample", "title_line1": "DR Value", "title_line2": "Sample banner",
             "description": "Sample hero banner."},
        ),
    }, "표본 배너")

    print(f"생성 {len(made)}건, 기존 유지 {skipped}건, 실패 {len(failed)}건")
    for line in made:
        print(f"  + {line}")
    for line in failed:
        print(f"  ! {line}")
    raise SystemExit(1 if failed else 0)


if __name__ == "__main__":
    main()
