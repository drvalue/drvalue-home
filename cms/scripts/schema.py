"""디알밸류 홈페이지 CMS 스키마.

여러 번 돌려도 같은 결과가 나온다. 이미 있는 컬렉션·필드는 건드리지 않는다.

Directus Core 는 사용자 컬렉션 25개가 한도다. 번역 테이블까지 세어 설계했다
(현재 15개). 한도를 넘기면 Team 요금제가 필요하다.

실행: python3 scripts/schema.py
"""

from __future__ import annotations

from datetime import date

import sys

sys.path.insert(0, "scripts")
from directus import Directus  # noqa: E402

LOCALES = [("ko-KR", "한국어"), ("en-US", "English")]

# 채용공고(recruits)는 posts 에서 뺐다.
# Directus Core 는 조건부 권한(custom permission rules)이 막혀 있어
# "인사는 채용공고만" 을 한 컬렉션 안에서 행 조건으로 표현할 수 없다.
# 컬렉션을 나누면 컬렉션 단위 권한만으로 같은 결과가 나온다.
BOARDS = [
    ("notice", "공지사항"),
    ("news", "뉴스"),
    ("press", "보도자료"),
    ("faq", "FAQ"),
    ("library", "자료실"),
    ("case", "수행실적"),
    ("support_program", "지원사업"),
    # 회사 소개 자료. 컬렉션 한도(25) 때문에 게시판으로 둔다 — 화면은 특허·저작권·연혁 장.
    ("patent", "특허"),
    ("copyright", "저작권"),
    ("history", "연혁"),
]

STATUSES = [("published", "게시"), ("draft", "초안"), ("archived", "보관")]


# 목록의 표시 이름(display_template)은 제목이 아니라 slug·path 를 쓴다.
# 제목은 언어별로 갈려 *_translations 로 옮겨졌고, display_template 은 번역을
# 따라가지 못한다. 없는 필드를 가리키면 목록에 빈 칸이 나온다.


def choices(pairs: list[tuple[str, str]]) -> list[dict]:
    return [{"text": label, "value": value} for value, label in pairs]


class Schema:
    def __init__(self, d: Directus) -> None:
        self.d = d
        self.existing = d.user_collections()
        self.made: list[str] = []
        self.skipped = 0
        self.failed: list[str] = []

    # ------------------------------------------------------------------
    def collection(
        self,
        name: str,
        *,
        icon: str,
        note: str,
        display: str | None = None,
        singleton: bool = False,
        sort: bool = True,
        hidden: bool = False,
    ) -> None:
        """컬렉션을 만든다.

        sort=True 면 meta 에 sort_field 를 선언한다. 그 경우 반드시
        sort_field() 로 실제 컬럼도 만들어야 한다 — 선언만 하고 컬럼이 없으면
        관리자는 통과하지만 일반 역할은 목록 조회에서 403 이 난다
        (Directus 가 없는 필드를 정렬 기준으로 읽으려 한다).
        """
        meta = {
            "icon": icon,
            "note": note,
            "display_template": display,
            "singleton": singleton,
            # 누가 언제 무엇을 바꿨는지 전부 남긴다 (요구사항 9번).
            "accountability": "all",
            "hidden": hidden,
        }
        if sort and not singleton:
            meta["sort_field"] = "sort"
        # 이미 있으면 meta 만 맞춘다. 건너뛰기만 하면 아이콘·설명을 고쳐도
        # 재실행이 반영하지 못하고 스크립트와 실제 상태가 갈라진다.
        if name in self.existing:
            self.skipped += 1
            self.d.request("PATCH", f"/collections/{name}", {"meta": meta})
            return
        status, body = self.d.request(
            "POST", "/collections", {"collection": name, "schema": {}, "meta": meta}
        )
        if status == 200:
            self.made.append(f"컬렉션 {name}")
            self.existing.add(name)
        else:
            self.failed.append(f"컬렉션 {name}: HTTP {status} {body}")

    # ------------------------------------------------------------------
    def field(
        self,
        collection: str,
        name: str,
        type_: str,
        *,
        interface: str = "input",
        label: str = "",
        required: bool = False,
        options: dict | None = None,
        meta: dict | None = None,
        schema: dict | None = None,
        special: list[str] | None = None,
    ) -> None:
        already = name in self.d.fields_of(collection)
        m = {
            "interface": interface,
            "note": label or None,
            "required": required,
            "options": options or {},
        }
        if special:
            m["special"] = special
        m.update(meta or {})
        s = {"is_nullable": not required}
        s.update(schema or {})
        # 이미 있는 필드도 선언에 맞춘다. 건너뛰기만 하면 선택지나 필수 여부를
        # 고쳐도 기존 설치에 반영되지 않는다 — collection() 과 같은 이유다.
        if already:
            self.skipped += 1
            status, body = self.d.request(
                "PATCH", f"/fields/{collection}/{name}", {"meta": m, "schema": s}
            )
            if status != 200:
                self.failed.append(f"{collection}.{name} 갱신: HTTP {status} {body}")
            return
        status, body = self.d.request(
            "POST",
            f"/fields/{collection}",
            {"field": name, "type": type_, "meta": m, "schema": s},
        )
        if status == 200:
            self.made.append(f"{collection}.{name}")
        else:
            self.failed.append(f"{collection}.{name}: HTTP {status} {body}")

    def sort_field(self, collection: str) -> None:
        self.field(
            collection, "sort", "integer",
            label="노출 순서", meta={"hidden": True},
        )

    def status_field(self, collection: str) -> None:
        """게시 상태. 예약 게시(10번)의 기준이 된다."""
        self.field(
            collection, "status", "string",
            interface="select-dropdown", label="상태",
            options={"choices": choices(STATUSES)},
            meta={"width": "half"},
            schema={"default_value": "draft", "is_nullable": False},
        )

    def schedule_fields(self, collection: str) -> None:
        """예약 게시·내림 시각. 공개 조회가 이 창을 본다."""
        self.field(
            collection, "publish_at", "timestamp",
            interface="datetime", label="이 시각에 게시한다 (비우면 즉시)",
            meta={"width": "half"},
        )
        self.field(
            collection, "unpublish_at", "timestamp",
            interface="datetime", label="이 시각에 내린다 (비우면 계속)",
            meta={"width": "half"},
        )

    def backfill_date(self, collection: str, name: str) -> None:
        """비어 있는 날짜를 오늘로 채운다. 필수로 바꾸기 전에 불러야 한다.

        기존 행에 NULL 이 남아 있으면 not null 로 바꾸는 순간 실패한다.
        이미 다 차 있으면 아무 일도 안 한다.
        """
        if name not in self.d.fields_of(collection):
            return
        status, body = self.d.request(
            "GET", f"/items/{collection}?filter[{name}][_null]=true&limit=-1&fields=id"
        )
        rows = (body or {}).get("data") or [] if status == 200 else []
        if not rows:
            return
        today = date.today().isoformat()
        for row in rows:
            st, res = self.d.request(
                "PATCH", f"/items/{collection}/{row['id']}", {name: today}
            )
            if st != 200:
                self.failed.append(f"{collection}.{name} 채우기 #{row['id']}: HTTP {st} {res}")
        self.made.append(f"{collection}.{name} 빈 값 {len(rows)}건을 {today} 로 채움")

    def files_field(self, collection: str, name: str, label: str) -> None:
        """첨부 파일 여러 개(m2m). 게시판 상세의 첨부 목록이 이걸 읽는다.

        Directus 에서 파일 여러 개는 uuid 컬럼 하나로 안 된다. 중간 테이블
        하나와 관계 두 개가 있어야 관리 화면의 파일 선택 UI 가 뜬다. 필드만
        만들면 목록에 빈 칸만 나온다(실측).

        여러 번 돌려도 같은 결과가 나온다.
        """
        junction = f"{collection}_files"
        if junction not in self.existing:
            status, body = self.d.request(
                "POST", "/collections",
                {
                    "collection": junction,
                    "schema": {},
                    # 중간 테이블은 사람이 열어 볼 것이 아니다. 목록에서 숨긴다.
                    "meta": {"hidden": True, "icon": "attach_file"},
                    "fields": [
                        {
                            "field": "id", "type": "integer",
                            "schema": {"is_primary_key": True, "has_auto_increment": True},
                            "meta": {"hidden": True},
                        }
                    ],
                },
            )
            if status == 200:
                self.made.append(f"컬렉션 {junction}")
                self.existing.add(junction)
            else:
                self.failed.append(f"컬렉션 {junction}: HTTP {status} {body}")
                return

        owner, file_col = f"{collection}_id", "directus_files_id"
        for fname, ftype in ((owner, "integer"), (file_col, "uuid")):
            if fname in self.d.fields_of(junction):
                self.skipped += 1
                continue
            status, body = self.d.request(
                "POST", f"/fields/{junction}",
                {"field": fname, "type": ftype, "meta": {"hidden": True}, "schema": {}},
            )
            if status == 200:
                self.made.append(f"{junction}.{fname}")
            else:
                self.failed.append(f"{junction}.{fname}: HTTP {status} {body}")

        # 본 컬렉션 쪽은 컬럼이 아니라 별칭이다. 값은 중간 테이블에 있다.
        if name in self.d.fields_of(collection):
            self.skipped += 1
            self.d.request(
                "PATCH", f"/fields/{collection}/{name}",
                {"meta": {"interface": "files", "special": ["files"], "note": label}},
            )
        else:
            status, body = self.d.request(
                "POST", f"/fields/{collection}",
                {
                    "field": name, "type": "alias", "schema": None,
                    "meta": {"interface": "files", "special": ["files"], "note": label},
                },
            )
            if status == 200:
                self.made.append(f"{collection}.{name}")
            else:
                self.failed.append(f"{collection}.{name}: HTTP {status} {body}")

        existing = self.d.relations_of()
        # junction_field 를 서로 가리켜야 Directus 가 m2m 으로 읽는다.
        # 하나라도 빠지면 관계는 걸려 있는데 UI 는 o2m 으로 보인다.
        for field, related, one_field, other in (
            (owner, collection, name, file_col),
            (file_col, "directus_files", None, owner),
        ):
            meta = {
                "one_field": one_field, "junction_field": other,
                # 첨부를 떼면 중간 행도 지운다. 기본값으로 두면 posts_id 가
                # NULL 인 고아 행이 쌓인다.
                "sort_field": None, "one_deselect_action": "delete",
            }
            # 이미 있어도 meta 는 맞춘다. 건너뛰기만 하면 이 선언을 고쳐도
            # 기존 설치에 반영되지 않는다 — field()·collection() 과 같은 이유다.
            if (junction, field) in existing:
                self.skipped += 1
                st, res = self.d.request(
                    "PATCH", f"/relations/{junction}/{field}", {"meta": meta}
                )
                if st != 200:
                    self.failed.append(f"{junction}.{field} 갱신: HTTP {st} {res}")
                continue
            status, body = self.d.request(
                "POST", "/relations",
                {
                    "collection": junction, "field": field,
                    "related_collection": related,
                    "schema": {"on_delete": "CASCADE"},
                    "meta": meta,
                },
            )
            if status == 200:
                self.made.append(f"{junction}.{field} \u2192 {related}")
            else:
                self.failed.append(f"{junction}.{field}: HTTP {status} {body}")

    def i18n_ready(self, collection: str) -> None:
        self.field(
            collection, "en_ready", "boolean",
            interface="boolean", label="영어 번역 완료",
            meta={"width": "half"},
            schema={"default_value": False, "is_nullable": False},
        )


# ----------------------------------------------------------------------
# 기능별 스키마
# ----------------------------------------------------------------------


def build(s: Schema) -> None:
    # 2. 게시판 관리 ---------------------------------------------------
    # 8종을 한 컬렉션에 둔다. 목록·검색·권한·예약·이력이 전부 같은 모양이고
    # 다른 것은 부가 필드뿐이다. 8개로 쪼개면 권한 규칙도 8벌이 된다.
    s.collection("posts", icon="article", note="공지·뉴스·보도자료·채용공고·FAQ·자료실·수행사례·지원사업", display="{{slug}}")
    s.field("posts", "board", "string", interface="select-dropdown", label="게시판", required=True,
            options={"choices": choices(BOARDS)}, meta={"width": "half"})
    s.status_field("posts")
    s.field("posts", "slug", "string", label="주소", required=True,
            meta={"width": "half"}, schema={"is_unique": True})
    # 비워 두면 목록이 뒤집힌다. 정렬이 -published_date 인데 Postgres 는 NULL 을
    # 내림차순에서 맨 앞에 놓는다 — 날짜 없는 글이 최신 글을 제친다(실측).
    # 그래서 필수로 둔다. 기존 행은 아래 backfill 이 채운 뒤에 not null 이 걸린다.
    s.backfill_date("posts", "published_date")
    s.field("posts", "published_date", "date", interface="datetime", label="표시 날짜",
            required=True, meta={"width": "half"})
    s.schedule_fields("posts")
    s.field("posts", "thumbnail", "uuid", interface="file-image", label="대표 이미지",
            special=["file"])
    s.field("posts", "is_pinned", "boolean", interface="boolean", label="상단 고정",
            meta={"width": "half"}, schema={"default_value": False, "is_nullable": False})
    s.field("posts", "is_featured", "boolean", interface="boolean", label="메인 노출",
            meta={"width": "half"}, schema={"default_value": False, "is_nullable": False})
    # 게시판별 부가 필드. 해당 게시판일 때만 보이게 조건을 건다.
    s.field("posts", "press_media", "string", label="매체명",
            meta={"conditions": [{"rule": {"board": {"_neq": "press"}}, "hidden": True}]})
    s.field("posts", "case_category", "string", interface="select-dropdown", label="사례 구분",
            options={"choices": choices([("government", "정부지원사업"), ("internal", "자체프로젝트"), ("service", "서비스구축")])},
            meta={"conditions": [{"rule": {"board": {"_neq": "case"}}, "hidden": True}]})
    s.field("posts", "period_start", "date", interface="datetime", label="시작",
            meta={"width": "half", "conditions": [{"rule": {"board": {"_neq": "case"}}, "hidden": True}]})
    s.field("posts", "period_end", "date", interface="datetime", label="종료",
            meta={"width": "half", "conditions": [{"rule": {"board": {"_neq": "case"}}, "hidden": True}]})
    s.field("posts", "program_status", "string", interface="select-dropdown", label="모집 상태",
            options={"choices": choices([("open", "모집중"), ("upcoming", "준비중"), ("closed", "접수마감")])},
            meta={"conditions": [{"rule": {"board": {"_neq": "support_program"}}, "hidden": True}]})
    s.field("posts", "program_field", "string", label="지원 분야",
            meta={"conditions": [{"rule": {"board": {"_neq": "support_program"}}, "hidden": True}]})
    s.field("posts", "program_region", "string", label="모집 지역",
            meta={"conditions": [{"rule": {"board": {"_neq": "support_program"}}, "hidden": True}]})
    s.field("posts", "deadline", "date", interface="datetime", label="접수 마감",
            meta={"conditions": [{"rule": {"board": {"_neq": "support_program"}}, "hidden": True}]})
    # 특허·저작권 — 증서 그림은 thumbnail, 제목은 translations.title.
    # 번호·날짜는 그림 밖 글자로 나간다(검색엔진이 그림 안 글자를 못 읽는다).
    s.field("posts", "cert_state", "string", interface="select-dropdown", label="등록/출원",
            options={"choices": choices([("registered", "등록"), ("applied", "출원")])},
            meta={"width": "half", "conditions": [{"rule": {"board": {"_neq": "patent"}}, "hidden": True}]})
    s.field("posts", "cert_no", "string", label="번호 (등록·출원·저작권)",
            meta={"width": "half", "conditions": [{"rule": {"board": {"_nin": ["patent", "copyright"]}}, "hidden": True}]})
    s.field("posts", "cert_date", "date", interface="datetime", label="등록일 (출원이면 출원일)",
            meta={"width": "half", "conditions": [{"rule": {"board": {"_nin": ["patent", "copyright"]}}, "hidden": True}]})
    s.field("posts", "cert_made_date", "date", interface="datetime", label="창작일",
            meta={"width": "half", "conditions": [{"rule": {"board": {"_neq": "copyright"}}, "hidden": True}]})
    s.field("posts", "cert_kind", "string", label="저작물 종류 (등록증 그대로)",
            meta={"conditions": [{"rule": {"board": {"_neq": "copyright"}}, "hidden": True}]})
    # 연혁 — 연도 + 제목(translations.title) + 부연(translations.summary). 한 해 안 순서는 sort.
    s.field("posts", "history_year", "string", label="연도 (예: 2025)",
            meta={"width": "half", "conditions": [{"rule": {"board": {"_neq": "history"}}, "hidden": True}]})
    # 옛 게시판에는 첨부가 있었다(자료실·공지). 여기 없으면 옮길 데가 없다.
    s.files_field("posts", "attachments", "첨부 파일")
    s.i18n_ready("posts")
    s.sort_field("posts")

    # 2-b. 채용공고 -----------------------------------------------------
    # posts 와 분리한 이유는 위 BOARDS 주석 참고(Core 의 조건부 권한 제한).
    s.collection("recruits", icon="badge", note="채용공고", display="{{slug}}")
    s.status_field("recruits")
    s.field("recruits", "slug", "string", label="주소", required=True,
            meta={"width": "half"}, schema={"is_unique": True})
    s.field("recruits", "published_date", "date", interface="datetime", label="표시 날짜",
            meta={"width": "half"})
    s.schedule_fields("recruits")
    s.field("recruits", "employment_type", "string", interface="select-dropdown", label="고용 형태",
            options={"choices": choices([("fulltime", "정규직"), ("contract", "계약직"), ("intern", "인턴")])},
            meta={"width": "half"})
    s.field("recruits", "deadline", "date", interface="datetime", label="접수 마감",
            meta={"width": "half"})
    s.field("recruits", "is_open_ended", "boolean", interface="boolean", label="상시 채용",
            meta={"width": "half"}, schema={"default_value": False, "is_nullable": False})
    s.i18n_ready("recruits")
    s.sort_field("recruits")

    # 1. 페이지 관리 ---------------------------------------------------
    s.collection("pages", icon="description", note="회사소개·사업소개·서비스 소개·연혁·오시는 길 등", display="{{path}}")
    s.field("pages", "path", "string", label="주소 (/ 로 시작)", required=True,
            meta={"width": "half"}, schema={"is_unique": True})
    s.field("pages", "code", "string", label="식별 코드", meta={"width": "half"}, schema={"is_unique": True})
    s.status_field("pages")
    s.field("pages", "layout", "string", interface="select-dropdown", label="레이아웃",
            options={"choices": choices([("default", "기본"), ("home", "메인"), ("mesai", "제조AI")])},
            meta={"width": "half"}, schema={"default_value": "default"})
    s.schedule_fields("pages")
    # SEO (6번) — 페이지·게시글에 붙인다.
    # seo_title / seo_description 은 언어마다 달라야 하므로 여기 없다.
    # i18n_content.py 가 *_translations 에 만든다.
    for coll in ("pages", "posts"):
        s.field(coll, "og_image", "uuid", interface="file-image", label="공유 이미지", special=["file"])
        s.field(coll, "no_index", "boolean", interface="boolean", label="검색 노출 차단",
                meta={"width": "half"}, schema={"default_value": False, "is_nullable": False})
        s.field(coll, "canonical", "string", label="대표 주소", meta={"width": "half"})
    s.i18n_ready("pages")
    s.sort_field("pages")

    # 1-b. 페이지 본문 섹션 ---------------------------------------------
    # 자유 HTML 한 덩어리로 두지 않는다. 사이트의 섹션마다 레이아웃이 다르고
    # 리치텍스트로는 표현이 안 되며, 관리자가 마크업을 깨뜨린다.
    s.collection("page_blocks", icon="dashboard", note="페이지 본문 섹션", display="{{type}}")
    s.field("page_blocks", "page", "integer", interface="select-dropdown-m2o",
            label="소속 페이지", required=True, special=["m2o"])
    s.field("page_blocks", "type", "string", interface="select-dropdown", label="섹션 종류",
            required=True, options={"choices": choices([
                ("heading_lead", "제목 + 리드"),
                ("rich_text", "본문"),
                ("media_text", "이미지 + 글"),
                ("card_grid", "카드 목록"),
                ("image", "이미지"),
                ("timeline", "연혁"),
                ("location", "오시는 길"),
                ("metrics", "숫자 지표"),
                ("post_list", "게시글 목록"),
                ("cta", "상담 유도"),
                ("hero_ref", "메인 배너 자리"),
            ])})
    s.field("page_blocks", "image", "uuid", interface="file-image", label="이미지", special=["file"])
    s.field("page_blocks", "media_side", "string", interface="select-dropdown", label="이미지 위치",
            options={"choices": choices([("right", "오른쪽"), ("left", "왼쪽")])},
            meta={"width": "half", "conditions": [{"rule": {"type": {"_neq": "media_text"}}, "hidden": True}]})
    s.field("page_blocks", "link_path", "string", label="링크 경로", meta={"width": "half"})
    # 섹션마다 모양이 다른 항목들(카드·연혁·지표·교통편)은 JSON 으로 받는다.
    # 컬렉션을 더 만들면 Core 의 25개 한도를 금방 넘긴다.
    s.field("page_blocks", "items", "json", interface="list", label="항목",
            meta={"note": "카드·연혁·지표 등 섹션에 따라 반복되는 항목"})
    s.sort_field("page_blocks")

    # 3. 메인 화면 관리 -------------------------------------------------
    s.collection("hero_slides", icon="view_carousel", note="메인 배너", display="{{code}}")
    s.field("hero_slides", "code", "string", label="식별 코드", meta={"width": "half"},
            schema={"is_unique": True})
    s.status_field("hero_slides")
    s.schedule_fields("hero_slides")
    s.field("hero_slides", "extra_kind", "string", interface="select-dropdown", label="곁들임 목록 종류",
            options={"choices": choices([("none", "없음"), ("feature", "기능 목록"), ("industry", "업종 목록"), ("service", "서비스 목록")])},
            meta={"width": "half"}, schema={"default_value": "none"})
    s.field("hero_slides", "extra_items", "json", interface="list", label="곁들임 목록",
            meta={"conditions": [{"rule": {"extra_kind": {"_eq": "none"}}, "hidden": True}]})
    s.field("hero_slides", "primary_path", "string", label="주 버튼 링크", meta={"width": "half"})
    s.field("hero_slides", "secondary_path", "string", label="보조 버튼 링크", meta={"width": "half"})
    s.field("hero_slides", "visual", "string", interface="select-dropdown", label="이미지 배치",
            options={"choices": choices([("overlay", "겹침"), ("stair", "계단")])},
            meta={"width": "half"}, schema={"default_value": "overlay"})
    s.field("hero_slides", "shots", "json", interface="list", label="화면 이미지",
            meta={"note": "이미지·캡션·자리(primary/secondary/tertiary)"})
    s.i18n_ready("hero_slides")
    s.sort_field("hero_slides")

    s.collection("popups", icon="web_asset", note="메인 팝업", display="{{link_path}}")
    s.status_field("popups")
    s.schedule_fields("popups")
    s.field("popups", "image", "uuid", interface="file-image", label="이미지", special=["file"])
    s.field("popups", "link_path", "string", label="버튼 링크", meta={"width": "half"})
    s.field("popups", "position", "string", interface="select-dropdown", label="위치",
            options={"choices": choices([("center", "가운데"), ("bottom_left", "좌측 하단"), ("bottom_right", "우측 하단")])},
            meta={"width": "half"}, schema={"default_value": "center"})
    s.field("popups", "hide_for_days", "integer", label="다시 보지 않기(일)",
            meta={"width": "half"}, schema={"default_value": 1})
    s.field("popups", "show_on_paths", "json", interface="tags", label="노출 경로",
            meta={"note": "비우면 메인(/)에만 뜬다"})
    s.sort_field("popups")

    # 5. 메뉴 관리 ------------------------------------------------------
    # 상단·하단을 한 컬렉션에 두고 location 으로 나눈다. parent 로 3단까지 받는다.
    s.collection("menu_items", icon="menu", note="상단·하단 메뉴", display="{{path}}")
    s.field("menu_items", "location", "string", interface="select-dropdown", label="위치",
            required=True, options={"choices": choices([("header", "상단"), ("footer", "하단")])},
            meta={"width": "half"})
    s.field("menu_items", "parent", "integer", interface="select-dropdown-m2o",
            label="상위 메뉴", special=["m2o"], meta={"width": "half"})
    s.field("menu_items", "path", "string", label="링크")
    s.field("menu_items", "is_visible", "boolean", interface="boolean", label="노출",
            meta={"width": "half"}, schema={"default_value": True, "is_nullable": False})
    s.field("menu_items", "match_prefixes", "json", interface="tags", label="활성 판정 경로")
    s.field("menu_items", "preview_image", "uuid", interface="file-image", label="메가메뉴 미리보기", special=["file"])
    s.sort_field("menu_items")

    # 7. 문의 관리 ------------------------------------------------------
    s.collection("inquiries", icon="mail", note="홈페이지 문의",
                 display="{{name}} · {{company}}", sort=False)
    # 선택지는 header.php 문의 모달의 <option> 과 글자까지 같다.
    # 다른 값을 쓰면 Nest 가 변환을 해야 하고, 변환하는 순간 원문이 사라진다.
    s.field("inquiries", "type", "string", interface="select-dropdown", label="문의 종류",
            required=True, options={"choices": choices([
                ("지원사업", "지원사업"),
                ("CutON(레이저 견적)", "CutON (레이저 견적)"),
                ("growchat(채팅 솔루션)", "growchat (채팅 솔루션)"),
                ("솔루션 도입 문의", "솔루션 도입 문의"),
                ("기타", "기타"),
            ])},
            # 기본값은 반드시 선택지 안의 값이어야 한다. 선택지 밖 값이
            # 기본으로 들어가면 관리 화면에서 빈 칸으로 보인다.
            # 공개 문의 엔드포인트는 type 없이도 들어오므로 기본값이 필요하다 —
            # 없으면 "Value is required" 로 문의가 통째로 떨어진다.
            meta={"width": "half"}, schema={"default_value": "기타"})
    s.field("inquiries", "status", "string", interface="select-dropdown", label="처리 상태",
            required=True, options={"choices": choices([("new", "접수"), ("in_progress", "진행중"), ("answered", "답변완료"), ("closed", "종료"), ("spam", "스팸")])},
            meta={"width": "half"}, schema={"default_value": "new"})
    s.field("inquiries", "assignee", "uuid", interface="select-dropdown-m2o", label="담당자",
            special=["m2o"], meta={"width": "half"})
    s.field("inquiries", "name", "string", label="이름", required=True, meta={"width": "half"})
    # 문의 모달은 이름·연락처·유형·내용만 받는다. 필수로 두면 홈페이지에서
    # 들어온 문의가 저장 단계에서 통째로 떨어진다.
    s.field("inquiries", "email", "string", label="이메일", meta={"width": "half"})
    s.field("inquiries", "company", "string", label="회사", meta={"width": "half"})
    s.field("inquiries", "phone", "string", label="연락처", meta={"width": "half"})
    s.field("inquiries", "message", "text", interface="input-multiline", label="문의 내용", required=True)
    s.field("inquiries", "consent", "boolean", interface="boolean", label="개인정보 수집 동의",
            meta={"width": "half"}, schema={"default_value": False, "is_nullable": False})
    s.field("inquiries", "source_path", "string", label="들어온 페이지", meta={"width": "half"})
    # 스팸 봇은 보이는 입력란을 전부 채운다. 사람에게는 안 보이는 칸이라 비어 있어야 한다.
    s.field("inquiries", "website", "string", label="(허니팟 - 비워 둘 것)",
            meta={"hidden": True})

    s.collection("inquiry_notes", icon="sticky_note_2", note="문의 내부 메모",
                 display="{{note}}", sort=False)
    s.field("inquiry_notes", "inquiry", "integer", interface="select-dropdown-m2o",
            label="문의", required=True, special=["m2o"])
    s.field("inquiry_notes", "note", "text", interface="input-multiline", label="메모", required=True)

    # 사이트 공통 값 -----------------------------------------------------
    s.collection("site_settings", icon="settings", note="회사 정보와 사이트 공통 값", singleton=True)
    s.field("site_settings", "biz_no", "string", label="사업자등록번호", meta={"width": "half"})
    s.field("site_settings", "tel", "string", label="대표전화", meta={"width": "half"})
    s.field("site_settings", "email", "string", label="대표 이메일", meta={"width": "half"})
    s.field("site_settings", "logo_light", "uuid", interface="file-image", label="로고(밝은 배경)", special=["file"])
    s.field("site_settings", "logo_dark", "uuid", interface="file-image", label="로고(어두운 배경)", special=["file"])

    # 3-b. 메인 문구와 섹션 노출 순서 -------------------------------------
    s.collection("home_settings", icon="home", note="메인 화면 문구와 섹션 노출", singleton=True)
    s.field("home_settings", "sections", "json", interface="list", label="섹션 노출과 순서",
            meta={"note": "key / 노출 여부 / 제목 덮어쓰기"})
    s.field("home_settings", "cta_button_path", "string", label="버튼 링크", meta={"width": "half"})

    # 6-b. SEO 기본값 ----------------------------------------------------
    s.collection("seo_defaults", icon="search", note="SEO 기본값", singleton=True)
    s.field("seo_defaults", "og_image", "uuid", interface="file-image", label="기본 공유 이미지", special=["file"])
    s.field("seo_defaults", "canonical_base", "string", label="대표 주소")
    s.field("seo_defaults", "no_index", "boolean", interface="boolean", label="사이트 전체 검색 차단",
            schema={"default_value": False, "is_nullable": False})


def main() -> None:
    d = Directus()
    d.login()
    s = Schema(d)
    build(s)

    print(f"생성 {len(s.made)}건, 기존 유지 {s.skipped}건, 실패 {len(s.failed)}건")
    for line in s.made:
        print(f"  + {line}")
    for line in s.failed:
        print(f"  ! {line}")
    raise SystemExit(1 if s.failed else 0)


if __name__ == "__main__":
    main()
