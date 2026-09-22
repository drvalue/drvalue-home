"""화면이 부르는 그림·CSS 가 public 안에 실제로 있는지 본다.

예전에는 public/css, public/img, public/icon 이 저장소 뿌리를 가리키는
심볼릭 링크였다. 그러면 web 폴더 하나만 떼어서 배포할 수가 없다
(배포 루트 밖을 가리켜서 Vercel 이 거부했다). 지금은 쓰는 것만 안에
복사해 뒀고, 그래서 **새 파일을 참조하면 조용히 404 가 난다.**
이 검사가 그것을 막는다.

실행: python3 scripts/check-assets.py
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

WEB = Path(__file__).resolve().parent.parent
PUBLIC = WEB / "public"
SRC = [WEB / "app", WEB / "components", WEB / "lib", PUBLIC / "css"]

# 절대경로로 부르는 것만 본다. 바깥 주소(http)는 우리 몫이 아니다.
REF = re.compile(r"(?<![\w.-])/(?:img|css|icon|opt|photo|screens|brand)/[A-Za-z0-9_.@/-]+\.[A-Za-z0-9]+")
# 주석 안의 예시는 참조가 아니다.
COMMENT = re.compile(r"^\s*(//|\*|/\*|#)")


def refs() -> dict[str, list[str]]:
    found: dict[str, list[str]] = {}
    for root in SRC:
        if not root.exists():
            continue
        for f in root.rglob("*"):
            if f.is_dir() or f.suffix not in {".ts", ".tsx", ".mjs", ".js", ".css"}:
                continue
            for n, line in enumerate(f.read_text(encoding="utf-8", errors="replace").splitlines(), 1):
                if COMMENT.match(line):
                    continue
                for m in REF.findall(line):
                    found.setdefault(m, []).append(f"{f.relative_to(WEB)}:{n}")
    return found


def main() -> None:
    found = refs()
    missing = [(p, w) for p, w in sorted(found.items()) if not (PUBLIC / p.lstrip("/")).exists()]
    print(f"참조 {len(found)}개 확인, 빠진 것 {len(missing)}개")
    for p, where in missing:
        print(f"  ! {p}  <- {where[0]}")
    raise SystemExit(1 if missing else 0)


if __name__ == "__main__":
    main()
