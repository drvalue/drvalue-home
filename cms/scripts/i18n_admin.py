"""관리 화면을 한국어로 만든다.

컬렉션 이름이 영어 슬러그로 보이면 담당자가 못 쓴다.
프로젝트 기본 언어도 한국어로 바꾼다(로그인 화면까지 한국어가 된다).

여러 번 돌려도 같은 결과가 나온다.
실행: python3 scripts/i18n_admin.py
"""

from __future__ import annotations

import sys

sys.path.insert(0, "scripts")
from directus import Directus  # noqa: E402

LANG = "ko-KR"

# 담당자가 쓰는 말로 둔다. 슬러그가 아니라.
NAMES = {
    "pages": "페이지",
    "page_blocks": "페이지 섹션",
    "posts": "게시판",
    "recruits": "채용공고",
    "hero_slides": "메인 배너",
    "popups": "팝업",
    "menu_items": "메뉴",
    "inquiries": "문의 관리",
    "inquiry_notes": "문의 메모",
    "site_settings": "사이트 정보",
    "home_settings": "메인 화면 설정",
    "seo_defaults": "SEO 기본값",
}

# 번역 컬렉션도 돌아야 한다. 안 돌면 언어 탭 안의 필드 이름만 영어로 남는다
# — 원본은 한국어인데 탭을 여는 순간 Title/Lead 가 나온다.
# i18n_content.py 의 TRANSLATABLE 과 같아야 한다.
TRANSLATED = [
    "pages", "page_blocks", "posts", "recruits", "hero_slides", "popups",
    "menu_items", "site_settings", "home_settings", "seo_defaults",
]
NAMES.update({f"{c}_translations": f"{NAMES[c]} 번역" for c in TRANSLATED})
NAMES["languages"] = "언어"


# 목록 열 머리글과 편집 화면의 필드 이름. note 는 도움말이라 여기서 따로 준다.
FIELD_NAMES = {
    # 번역 컬렉션 전용
    "languages_code": "언어", "translations": "언어별 내용",
    # 역방향 별칭. 비워 두면 화면에 Blocks / Children 처럼 영어로 뜬다.
    "blocks": "본문 섹션", "children": "하위 메뉴", "notes": "메모",
    "code": "코드", "name": "표시 이름", "direction": "쓰기 방향",
    "status": "상태", "sort": "노출 순서", "title": "제목", "slug": "주소",
    "board": "게시판", "summary": "요약", "body": "본문", "thumbnail": "대표 이미지",
    "published_date": "표시 날짜", "publish_at": "게시 예약", "unpublish_at": "내림 예약",
    "is_pinned": "상단 고정", "is_featured": "메인 노출", "en_ready": "영어 번역 완료",
    "press_media": "매체명", "case_category": "사례 구분",
    "case_category_label": "사업유형 표기", "period_start": "시작", "period_end": "종료",
    "program_status": "모집 상태", "program_field": "지원 분야",
    "program_region": "모집 지역", "deadline": "접수 마감", "faq_category": "FAQ 분류",
    "path": "주소", "code": "식별 코드", "layout": "레이아웃",
    "parent_label": "상위 메뉴 표기", "lead": "리드 문장",
    "seo_title": "검색 제목", "seo_description": "검색 설명", "og_image": "공유 이미지",
    "no_index": "검색 노출 차단", "canonical": "대표 주소",
    "type": "종류", "heading": "제목", "image": "이미지", "media_side": "이미지 위치",
    "link_label": "링크 문구", "link_path": "링크 경로", "items": "항목",
    "page": "소속 페이지",
    "nav_label": "슬라이드 이름", "eyebrow": "윗줄 문구",
    "title_line1": "제목 1행", "title_line2": "제목 2행", "description": "설명",
    "extra_kind": "곁들임 목록 종류", "extra_items": "곁들임 목록",
    "primary_label": "주 버튼 문구", "primary_path": "주 버튼 링크",
    "secondary_label": "보조 버튼 문구", "secondary_path": "보조 버튼 링크",
    "visual": "이미지 배치", "shots": "화면 이미지",
    "position": "위치", "hide_for_days": "다시 보지 않기(일)", "show_on_paths": "노출 경로",
    "location": "위치", "parent": "상위 메뉴", "label": "메뉴 이름",
    "is_visible": "노출", "match_prefixes": "활성 판정 경로",
    "promo_title": "메가메뉴 제목", "promo_caption": "메가메뉴 영문 캡션",
    "promo_desc": "메가메뉴 설명", "preview_image": "메가메뉴 미리보기",
    "preview_caption": "미리보기 캡션",
    "assignee": "담당자", "name": "이름", "email": "이메일", "company": "회사",
    "phone": "연락처", "message": "문의 내용", "consent": "개인정보 수집 동의",
    "source_path": "들어온 페이지", "website": "(허니팟)",
    "inquiry": "문의", "note": "메모",
    "company_name": "상호", "ceo": "대표자", "biz_no": "사업자등록번호",
    "tel": "대표전화", "address": "주소", "logo_light": "로고(밝은 배경)",
    "logo_dark": "로고(어두운 배경)", "copyright": "저작권 표기",
    "sections": "섹션 노출과 순서", "cta_title": "하단 상담 제목",
    "cta_description": "하단 상담 설명", "cta_button_label": "버튼 문구",
    "cta_button_path": "버튼 링크",
    "site_name": "사이트 이름", "title_suffix": "제목 뒤 문구",
    "canonical_base": "대표 주소",
    "department": "부서", "employment_type": "고용 형태",
    "is_open_ended": "상시 채용",
}


def translate_fields(d: Directus, slug: str, made: list, skipped_box: list, failed: list) -> None:
    """필드 이름을 한국어로. 목록 열 머리글이 영어면 담당자가 못 읽는다."""
    st, body = d.request("GET", f"/fields/{slug}")
    if st != 200:
        failed.append(f"{slug} 필드 조회 실패 HTTP {st}")
        return
    for f in body.get("data", []):
        field = f["field"]
        name = FIELD_NAMES.get(field)
        if not name:
            continue
        meta = f.get("meta") or {}
        translations = meta.get("translations") or []
        if any(t.get("language") == LANG and t.get("translation") == name for t in translations):
            skipped_box[0] += 1
            continue
        translations = [t for t in translations if t.get("language") != LANG]
        translations.append({"language": LANG, "translation": name})
        st2, res = d.request(
            "PATCH", f"/fields/{slug}/{field}", {"meta": {"translations": translations}}
        )
        if st2 == 200:
            made.append(f"{slug}.{field} → {name}")
        else:
            failed.append(f"{slug}.{field}: HTTP {st2} {res}")


# 목록에 기본으로 보일 열. 제목이 *_translations 로 옮겨간 뒤로는 열을 직접
# 지정하지 않으면 담당자가 목록에서 제목을 볼 수 없다 — slug 만 나온다.
# user/role 이 모두 null 인 프리셋이 "이 컬렉션의 기본 화면" 이다.
DEFAULT_COLUMNS = {
    "posts": (["translations.title", "board", "status", "published_date"],
              ["-published_date", "-id"]),
    "recruits": (["translations.title", "status", "department", "deadline"],
                 ["-published_date", "-id"]),
    "pages": (["translations.title", "path", "status", "sort"], ["sort", "path"]),
    "page_blocks": (["translations.heading", "type", "page", "sort"], ["sort"]),
    "hero_slides": (["translations.title_line1", "code", "status", "sort"], ["sort"]),
    "popups": (["translations.title", "status", "position", "sort"], ["sort"]),
    "menu_items": (["translations.label", "location", "path", "is_visible", "sort"],
                   ["location", "sort"]),
}


def default_presets(d: Directus, made: list, skipped_box: list, failed: list) -> None:
    st, body = d.request("GET", "/presets?limit=-1&fields=id,collection,user,role,bookmark")
    if st != 200:
        failed.append(f"프리셋 조회 실패 HTTP {st}")
        return
    have = {
        p["collection"]
        for p in body.get("data", [])
        if p.get("user") is None and p.get("role") is None and p.get("bookmark") is None
    }
    for collection, (fields, sort) in DEFAULT_COLUMNS.items():
        if collection in have:
            skipped_box[0] += 1
            continue
        st2, res = d.request("POST", "/presets", {
            "collection": collection, "user": None, "role": None, "bookmark": None,
            "layout": "tabular",
            "layout_query": {"tabular": {"fields": fields, "sort": sort, "limit": 50}},
        })
        if st2 == 200:
            made.append(f"{collection} 기본 열 {len(fields)}개")
        else:
            failed.append(f"{collection} 프리셋: HTTP {st2} {res}")


def main() -> None:
    d = Directus()
    d.login()
    made, skipped, failed = [], 0, []

    # 프로젝트 기본 언어
    _, body = d.request("GET", "/settings")
    if body.get("data", {}).get("default_language") != LANG:
        st, res = d.request("PATCH", "/settings", {"default_language": LANG})
        if st == 200:
            made.append(f"프로젝트 기본 언어 → {LANG}")
        else:
            failed.append(f"기본 언어: HTTP {st} {res}")
    else:
        skipped += 1

    for slug, name in NAMES.items():
        st, body = d.request("GET", f"/collections/{slug}")
        if st != 200:
            failed.append(f"{slug} 조회 실패 HTTP {st}")
            continue
        meta = body["data"].get("meta") or {}
        translations = meta.get("translations") or []
        if any(t.get("language") == LANG and t.get("translation") == name for t in translations):
            skipped += 1
            continue
        translations = [t for t in translations if t.get("language") != LANG]
        translations.append({"language": LANG, "translation": name, "singular": name, "plural": name})
        st, res = d.request("PATCH", f"/collections/{slug}", {"meta": {"translations": translations}})
        if st == 200:
            made.append(f"{slug} → {name}")
        else:
            failed.append(f"{slug}: HTTP {st} {res}")

    skipped_box = [skipped]
    default_presets(d, made, skipped_box, failed)

    for slug in NAMES:
        translate_fields(d, slug, made, skipped_box, failed)
    skipped = skipped_box[0]

    print(f"적용 {len(made)}건, 기존 유지 {skipped}건, 실패 {len(failed)}건")
    for line in made:
        print(f"  + {line}")
    for line in failed:
        print(f"  ! {line}")
    raise SystemExit(1 if failed else 0)


if __name__ == "__main__":
    main()
