"""언어별 콘텐츠(요구사항 11번).

`en_ready` 플래그만으로는 다국어가 아니다. "영어 번역이 끝났다" 는 표시일 뿐
영어 원고를 넣을 칸이 없다. 실제로 언어별로 다른 값을 저장하려면 칸이 나뉘어야
한다.

Directus 의 방식은 **번역 전용 컬렉션**이다. 원본 컬렉션에는 언어와 무관한 것만
남기고(주소·상태·날짜·정렬), 글로 된 것은 `<컬렉션>_translations` 로 옮긴다.
한 원본에 언어 수만큼 행이 붙는다.

    pages                 id, path, status, publish_at, sort, ...
    pages_translations    id, pages(→pages), languages_code(→languages),
                          title, lead, seo_title, seo_description

관리 화면에서는 원본을 열면 언어 탭이 생긴다. 공개 API 는
`?lang=en-US` 로 고른다(scripts/public_router.js).

컬렉션 한도 주의: Core 는 25개까지다. 원본 12 + languages 1 + 번역 10 = 23.
**남는 자리가 2개뿐이다.** 새 컬렉션을 만들 때 이 숫자를 먼저 본다.

주소·slug 는 번역하지 않는다. 언어별로 다른 주소를 쓰려면 라우팅까지 바뀌어야
하는데 공개 사이트가 아직 그걸 못 받는다 — 지금은 한 주소에 언어만 갈린다.

여러 번 돌려도 같은 결과가 나온다.
실행: python3 scripts/i18n_content.py
"""

from __future__ import annotations

import sys

sys.path.insert(0, "scripts")
from directus import Directus  # noqa: E402

LANGUAGES = [
    ("ko-KR", "한국어", "ltr"),
    ("en-US", "English", "ltr"),
]
DEFAULT_LANGUAGE = "ko-KR"

# 원본에 남는 것: 주소·slug·상태·날짜·정렬·분류값·링크 경로.
# 옮기는 것: 사람이 읽는 글.
#
# (필드명, 타입, 인터페이스, 설명[, 옵션])
# 이 정의가 원본이다. schema.py 에는 이 필드들이 없다 — 있으면 schema.py 재실행이
# 지운 컬럼을 되살려 같은 값이 두 곳에 생긴다.
TRANSLATED_FIELDS = {
    'pages': [
        ('title', 'string', 'input', '제목'),
        ('parent_label', 'string', 'input', '상위 메뉴 표기'),
        ('lead', 'text', 'input-multiline', '리드 문장'),
        ('seo_title', 'string', 'input', '검색 제목'),
        ('seo_description', 'text', 'input-multiline', '검색 설명'),
    ],
    'page_blocks': [
        ('heading', 'string', 'input', '제목'),
        ('lead', 'text', 'input-multiline', '리드 문장'),
        ('body', 'text', 'input-rich-text-html', '본문'),
        ('link_label', 'string', 'input', '링크 문구'),
    ],
    'posts': [
        ('title', 'string', 'input', '제목'),
        ('summary', 'text', 'input-multiline', '요약'),
        ('body', 'text', 'input-rich-text-html', '본문'),
        ('case_category_label', 'string', 'input', '사업유형 표기(원본 그대로)'),
        ('faq_category', 'string', 'input', 'FAQ 분류'),
        ('seo_title', 'string', 'input', '검색 제목'),
        ('seo_description', 'text', 'input-multiline', '검색 설명'),
    ],
    'recruits': [
        ('title', 'string', 'input', '공고 제목'),
        ('department', 'string', 'input', '부서'),
        ('location', 'string', 'input', '근무지'),
        ('summary', 'text', 'input-multiline', '요약'),
        ('body', 'text', 'input-rich-text-html', '본문'),
    ],
    'hero_slides': [
        ('nav_label', 'string', 'input', '슬라이드 이름'),
        ('eyebrow', 'string', 'input', '윗줄 문구'),
        ('title_line1', 'string', 'input', '제목 1행'),
        ('title_line2', 'string', 'input', '제목 2행'),
        ('description', 'text', 'input-multiline', '설명'),
        ('primary_label', 'string', 'input', '주 버튼 문구'),
        ('secondary_label', 'string', 'input', '보조 버튼 문구'),
    ],
    'popups': [
        ('title', 'string', 'input', '제목'),
        ('body', 'text', 'input-rich-text-html', '내용'),
        ('link_label', 'string', 'input', '버튼 문구'),
    ],
    'menu_items': [
        ('label', 'string', 'input', '메뉴 이름'),
        ('description', 'string', 'input', '설명(메가메뉴용)'),
        ('promo_title', 'string', 'input', '메가메뉴 제목'),
        ('promo_caption', 'string', 'input', '메가메뉴 영문 캡션'),
        ('promo_desc', 'text', 'input-multiline', '메가메뉴 설명'),
        ('preview_caption', 'string', 'input', '미리보기 캡션'),
    ],
    'site_settings': [
        ('company_name', 'string', 'input', '상호'),
        ('ceo', 'string', 'input', '대표자'),
        ('address', 'text', 'input-multiline', '주소'),
        ('copyright', 'string', 'input', '저작권 표기'),
    ],
    'home_settings': [
        ('cta_title', 'text', 'input-multiline', '하단 상담 제목'),
        ('cta_description', 'text', 'input-multiline', '하단 상담 설명'),
        ('cta_button_label', 'string', 'input', '버튼 문구'),
    ],
    'seo_defaults': [
        ('site_name', 'string', 'input', '사이트 이름'),
        ('title_suffix', 'string', 'input', '제목 뒤 문구'),
        ('description', 'text', 'input-multiline', '기본 설명'),
    ],
}


TRANSLATABLE = list(TRANSLATED_FIELDS)


class I18n:
    def __init__(self, d: Directus) -> None:
        self.d = d
        self.made: list[str] = []
        self.skipped = 0
        self.failed: list[str] = []
        self.collections = d.user_collections()
        _, body = d.request("GET", "/relations")
        self.relations = {(r["collection"], r["field"]) for r in body.get("data", [])}

    # ------------------------------------------------------------------
    def collection(self, name: str, meta: dict, fields: list[dict] | None = None) -> bool:
        """컬렉션을 만든다.

        `fields` 를 주지 않으면 Directus 가 자동 증가 정수 `id` 를 기본키로
        붙인다. 기본키를 다른 것으로 하려면 **만들 때 같이 선언해야 한다** —
        만든 뒤에 `is_primary_key` 필드를 추가하면
        "multiple primary keys for table are not allowed" 로 500 이 난다.
        """
        if name in self.collections:
            self.skipped += 1
            return True
        body = {"collection": name, "schema": {}, "meta": meta}
        if fields:
            body["fields"] = fields
        status, res = self.d.request("POST", "/collections", body)
        if status != 200:
            self.failed.append(f"컬렉션 {name}: HTTP {status} {res}")
            return False
        self.collections.add(name)
        self.made.append(f"컬렉션 {name}")
        return True

    def field(self, collection: str, name: str, payload: dict) -> bool:
        if name in self.d.fields_of(collection):
            self.skipped += 1
            return True
        status, res = self.d.request("POST", f"/fields/{collection}", payload)
        if status != 200:
            self.failed.append(f"{collection}.{name}: HTTP {status} {res}")
            return False
        self.made.append(f"{collection}.{name}")
        return True

    def relation(self, collection: str, field: str, body: dict) -> bool:
        if (collection, field) in self.relations:
            self.skipped += 1
            return True
        status, res = self.d.request("POST", "/relations", body)
        if status != 200:
            self.failed.append(f"관계 {collection}.{field}: HTTP {status} {res}")
            return False
        self.relations.add((collection, field))
        self.made.append(f"관계 {collection}.{field}")
        return True

    # ------------------------------------------------------------------
    def languages(self) -> None:
        """언어 목록. code 가 기본키다(자동 증가 정수가 아니다)."""
        if not self.collection("languages", {
            "icon": "translate",
            "note": "이 사이트가 지원하는 언어",
            "display_template": "{{name}}",
            "accountability": "all",
            "hidden": True,
        }, fields=[{
            "field": "code", "type": "string",
            "meta": {"interface": "input", "note": "BCP 47 코드"},
            "schema": {"is_primary_key": True, "is_nullable": False, "length": 16},
        }]):
            return
        self.field("languages", "name", {
            "field": "name", "type": "string",
            "meta": {"interface": "input", "note": "표시 이름"},
            "schema": {"is_nullable": False},
        })
        self.field("languages", "direction", {
            "field": "direction", "type": "string",
            "meta": {"interface": "select-dropdown", "note": "쓰기 방향",
                     "options": {"choices": [{"text": "왼→오", "value": "ltr"},
                                             {"text": "오→왼", "value": "rtl"}]}},
            "schema": {"default_value": "ltr", "is_nullable": False},
        })
        for code, name, direction in LANGUAGES:
            status, _ = self.d.request("GET", f"/items/languages/{code}")
            if status == 200:
                self.skipped += 1
                continue
            st, res = self.d.request("POST", "/items/languages", {
                "code": code, "name": name, "direction": direction,
            })
            if st == 200:
                self.made.append(f"언어 {code}")
            else:
                self.failed.append(f"언어 {code}: HTTP {st} {res}")

    # ------------------------------------------------------------------
    def translate(self, parent: str) -> None:
        tc = f"{parent}_translations"
        if not self.collection(tc, {
            "icon": "translate",
            "note": f"{parent} 의 언어별 값",
            "accountability": "all",
            # 사이드바에는 원본만 보이면 된다. 번역은 원본 안에서 다룬다.
            "hidden": True,
        }):
            return

        # 원본을 가리키는 칸. 원본 기본키가 정수라 정수다.
        self.field(tc, parent, {
            "field": parent, "type": "integer",
            "meta": {"interface": "select-dropdown-m2o", "hidden": True},
            "schema": {},
        })
        self.field(tc, "languages_code", {
            "field": "languages_code", "type": "string",
            "meta": {"interface": "select-dropdown-m2o", "hidden": True},
            "schema": {"length": 16},
        })

        for spec in TRANSLATED_FIELDS[parent]:
            name, type_, interface, note = spec[:4]
            options = spec[4] if len(spec) > 4 else {}
            self.field(tc, name, {
                "field": name, "type": type_,
                "meta": {"interface": interface, "options": options,
                         "note": note, "width": "full"},
                "schema": {"is_nullable": True},
            })

        # 관계 둘. junction_field 가 있어야 Directus 가 이걸 단순 O2M 이 아니라
        # 번역으로 알아본다.
        self.relation(tc, parent, {
            "collection": tc, "field": parent, "related_collection": parent,
            "schema": {"on_delete": "CASCADE"},
            "meta": {"one_field": "translations", "junction_field": "languages_code",
                     "sort_field": None, "one_deselect_action": "delete"},
        })
        self.relation(tc, "languages_code", {
            "collection": tc, "field": "languages_code",
            "related_collection": "languages",
            "schema": {"on_delete": "CASCADE"},
            "meta": {"one_field": None, "junction_field": parent,
                     "sort_field": None, "one_deselect_action": "nullify"},
        })

        # 원본 쪽 별칭. 이게 있어야 관리 화면에 언어 탭이 뜨고
        # fields=translations.* 로 읽힌다.
        self.field(parent, "translations", {
            "field": "translations", "type": "alias", "schema": None,
            "meta": {
                "interface": "translations",
                "special": ["translations"],
                "note": "언어별 내용",
                "options": {
                    "languageField": "name",
                    "languageDirectionField": "direction",
                    "defaultLanguage": DEFAULT_LANGUAGE,
                    "userLanguage": False,
                },
            },
        })


    # ------------------------------------------------------------------
    def migrate(self, parent: str) -> None:
        """원본에 남아 있는 글을 ko-KR 번역으로 옮기고 원본 칸을 지운다.

        옮기지 않으면 같은 제목이 두 곳에 있게 된다. 원본 칸을 고쳐도 사이트는
        번역을 읽으므로 아무 일도 일어나지 않는다 — 조용히 틀리는 종류의 버그다.

        이미 옮긴 뒤에는 원본에 그 칸이 없으므로 하는 일이 없다.
        """
        names = [spec[0] for spec in TRANSLATED_FIELDS[parent]]
        have = self.d.fields_of(parent)
        present = [n for n in names if n in have]
        if not present:
            self.skipped += 1
            return

        status, body = self.d.request(
            "GET", f"/items/{parent}?limit=-1&fields=id,{','.join(present)}"
        )
        if status != 200:
            self.failed.append(f"{parent} 원본 조회 실패 HTTP {status} {body}")
            return
        rows = body.get("data")
        # 싱글톤은 배열이 아니라 객체 하나로 온다.
        rows = [rows] if isinstance(rows, dict) else (rows or [])

        # 이미 옮긴 것을 다시 만들지 않는다. 중첩 조회는 설정에 따라 id 문자열만
        # 올 때가 있어 번역 컬렉션을 직접 본다.
        _, tb = self.d.request(
            "GET",
            f"/items/{parent}_translations?limit=-1&fields={parent}"
            f"&filter[languages_code][_eq]={DEFAULT_LANGUAGE}",
        )
        done = set()
        for t in tb.get("data") or []:
            v = t.get(parent) if isinstance(t, dict) else t
            done.add(v.get("id") if isinstance(v, dict) else v)

        moved = 0
        for row in rows:
            if row["id"] in done:
                continue
            payload = {n: row.get(n) for n in present if row.get(n) is not None}
            if not payload:
                continue
            payload[parent] = row["id"]
            payload["languages_code"] = DEFAULT_LANGUAGE
            st, res = self.d.request(
                "POST", f"/items/{parent}_translations", payload
            )
            if st == 200:
                moved += 1
            else:
                self.failed.append(f"{parent} #{row['id']} 이관: HTTP {st} {res}")
        if moved:
            self.made.append(f"{parent} 기존 내용 {moved}건을 {DEFAULT_LANGUAGE} 로 이관")

        for name in present:
            st, res = self.d.request("DELETE", f"/fields/{parent}/{name}")
            if st in (200, 204):
                self.made.append(f"{parent}.{name} 원본 칸 제거")
            else:
                self.failed.append(f"{parent}.{name} 제거: HTTP {st} {res}")


def main() -> None:
    d = Directus()
    d.login()
    i = I18n(d)

    i.languages()
    for parent in TRANSLATABLE:
        i.translate(parent)
    # 구조를 다 만든 뒤에 옮긴다. 번역 컬렉션이 없으면 옮길 곳이 없다.
    for parent in TRANSLATABLE:
        i.migrate(parent)

    total = len(i.collections)
    print(f"생성 {len(i.made)}건, 기존 유지 {i.skipped}건, 실패 {len(i.failed)}건")
    for line in i.made:
        print(f"  + {line}")
    for line in i.failed:
        print(f"  ! {line}")
    print(f"\n컬렉션 {total}/25 (Core 한도). 남은 자리 {25 - total}개.")
    raise SystemExit(1 if i.failed else 0)


if __name__ == "__main__":
    main()
