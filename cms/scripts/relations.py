"""컬렉션 사이 관계를 건다.

필드만 만들면 정수 컬럼일 뿐이라 조인도 관리 화면의 선택 UI 도 동작하지 않는다.
여러 번 돌려도 같은 결과가 나온다.

실행: python3 scripts/relations.py
"""

from __future__ import annotations

import sys

sys.path.insert(0, "scripts")
from directus import Directus  # noqa: E402

# (컬렉션, 필드, 연결 대상, 역방향 필드 이름 | None, 삭제 시 동작)
RELATIONS = [
    # 페이지를 지우면 그 본문 섹션도 같이 사라져야 한다.
    ("page_blocks", "page", "pages", "blocks", "CASCADE"),
    # 메뉴 트리. 상위를 지우면 하위는 최상위로 올라온다.
    ("menu_items", "parent", "menu_items", "children", "SET NULL"),
    # 문의를 지우면 메모도 같이.
    ("inquiry_notes", "inquiry", "inquiries", "notes", "CASCADE"),
    # 담당자는 Directus 사용자다. 계정이 사라져도 문의는 남긴다.
    ("inquiries", "assignee", "directus_users", None, "SET NULL"),
    # 대표 이미지. special=["file"] 만으로는 관계가 안 생겨 fields=thumbnail.width
    # 같은 중첩 조회가 빈 값으로 온다(실측). 파일을 지워도 글은 남긴다.
    ("posts", "thumbnail", "directus_files", None, "SET NULL"),
]


def main() -> None:
    d = Directus()
    d.login()
    existing = d.relations_of()

    made, skipped, failed = [], 0, []
    for collection, field, related, one_field, on_delete in RELATIONS:
        if (collection, field) in existing:
            skipped += 1
            continue
        body = {
            "collection": collection,
            "field": field,
            "related_collection": related,
            "schema": {"on_delete": on_delete},
            "meta": {"one_field": one_field, "sort_field": None},
        }
        status, res = d.request("POST", "/relations", body)
        if status == 200:
            made.append(f"{collection}.{field} → {related}")
        else:
            failed.append(f"{collection}.{field}: HTTP {status} {res}")

    # 관계에 one_field 를 적어두는 것만으로는 역방향을 읽을 수 없다.
    # directus_fields 에 alias 행이 있어야 fields=blocks.* 같은 중첩 조회가
    # 통하고, 관리 화면에서도 하위 항목이 같이 보인다.
    for collection, field, related, one_field, _ in RELATIONS:
        if one_field is None or related.startswith("directus_"):
            continue
        if one_field in d.fields_of(related):
            skipped += 1
            continue
        status, res = d.request(
            "POST",
            f"/fields/{related}",
            {
                "field": one_field,
                "type": "alias",
                "schema": None,
                "meta": {
                    "interface": "list-o2m",
                    "special": ["o2m"],
                    "options": {"enableCreate": True, "enableSelect": False},
                },
            },
        )
        if status == 200:
            made.append(f"{related}.{one_field} (역방향 별칭)")
        else:
            failed.append(f"{related}.{one_field}: HTTP {status} {res}")

    print(f"생성 {len(made)}건, 기존 유지 {skipped}건, 실패 {len(failed)}건")
    for line in made:
        print(f"  + {line}")
    for line in failed:
        print(f"  ! {line}")
    raise SystemExit(1 if failed else 0)


if __name__ == "__main__":
    main()
