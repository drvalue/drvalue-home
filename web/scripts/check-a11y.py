"""문의 모달의 입력 칸이 **이름을 갖고 있나**를 전 페이지에서 본다.

왜 따로 있나: 이 모달은 원본 PHP 에서 <label> 과 <input> 이 묶여 있지 않았다.
라벨을 눌러도 칸이 안 잡히고, 화면 읽개는 「편집 상자」 라고만 읽는다. 묶는
순간 원본과 속성이 달라지므로 compare.py 의 REDESIGNED 에 등록해 양쪽에서
떼고 비교한다 — **뗀 자리를 대신 보는 것이 이 파일이다.** 등록만 하고 검사를
안 만들면 그건 구멍이다.

실행: python3 scripts/check-a11y.py   (Next :3400 이 떠 있어야 한다)
"""

from __future__ import annotations

import importlib.util
import pathlib
import os
import re
import sys

_spec = importlib.util.spec_from_file_location(
    "compare", pathlib.Path(__file__).with_name("compare.py")
)
assert _spec and _spec.loader
compare = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(compare)

NEXT = os.environ.get("NEXT_ORIGIN", "http://localhost:3400").rstrip("/")

# 모달이 실려야 하는 곳. 헤더·푸터가 모든 장에 있으므로 모든 장이 대상이다.
PAGES = [
    "/",
    "/page/company/intro", "/page/company/vision", "/page/company/history", "/page/company/location",
    "/page/business/max", "/page/business/max/pcb-mes", "/page/business/max/cosmetics-mes",
    "/page/business/max/mes-ai",
    "/page/service/autoform", "/page/service/cuton", "/page/service/cadon",
    "/page/service/chat", "/page/service/hangeon",
    "/page/portfolio/portfolio", "/page/tech/patent", "/page/tech/copyright",
    "/page/support/notice", "/page/support/press",
]

# (입력 이름, 묶는 id, 라벨 글)
FIELDS = [
    ("user_name", "dvq_name", "회사명 / 성함"),
    ("user_tel", "dvq_tel", "연락처"),
    ("user_email", "dvq_email", "이메일"),
    ("user_type", "dvq_type", "문의 유형"),
    ("user_msg", "dvq_msg", "문의 내용"),
]


def main() -> None:
    ok = fail = 0

    def check(name: str, cond: bool, detail: str = "") -> None:
        nonlocal ok, fail
        if cond:
            ok += 1
        else:
            fail += 1
            print(f"  FAIL  {name}  {detail}")

    for path in PAGES:
        try:
            html = compare._OPENER.open(NEXT + path, timeout=30).read().decode("utf-8", "replace")
        except Exception as e:  # noqa: BLE001
            print(f"  FAIL  {path} 를 못 읽었다: {e}")
            fail += 1
            continue

        form = re.search(r'<form[^>]*\sid="dvContactForm"[\s\S]*?</form>', html)
        check(f"{path} 문의 모달이 있다", bool(form))
        if not form:
            continue
        f = form.group(0)

        for name, fid, label in FIELDS:
            # 칸에 그 id 가 달려 있나
            has_id = re.search(rf'<(?:input|select|textarea)[^>]*\sid="{fid}"[^>]*\sname="{name}"', f) or \
                     re.search(rf'<(?:input|select|textarea)[^>]*\sname="{name}"[^>]*\sid="{fid}"', f)
            check(f"{path} {label} 칸에 id", bool(has_id), f"{name} 에 id={fid} 가 없다")
            # 그 id 를 가리키는 라벨이 있고 글까지 같나
            lab = re.search(rf'<label[^>]*\sfor="{fid}"[^>]*>([^<]*)</label>', f)
            check(f"{path} {label} 라벨이 칸을 가리킨다", bool(lab), f"for={fid} 인 <label> 이 없다")
            if lab:
                check(f"{path} {label} 라벨 글", lab.group(1).strip() == label,
                      f"적힌 글: {lab.group(1).strip()!r}")

        # 연락처는 전화 자판이 떠야 한다.
        check(f"{path} 연락처가 전화 칸이다",
              bool(re.search(r'<input[^>]*\sid="dvq_tel"[^>]*\stype="tel"', f)
                   or re.search(r'<input[^>]*\stype="tel"[^>]*\sid="dvq_tel"', f)),
              "type=tel 이 아니다")

    print(f"\nPASS={ok} FAIL={fail}")
    sys.exit(1 if fail else 0)


if __name__ == "__main__":
    main()
