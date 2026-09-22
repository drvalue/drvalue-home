"""페이지 소스에 스스로를 깨뜨리는 것이 들어갔는지 본다.

지금 보는 것은 하나뿐이다. **PAGE_CSS 안의 백틱.** 그 블록은 템플릿 문자열
이라서, 주석에 백틱을 하나 넣으면 문자열이 거기서 끊기고 페이지가 통째로
문법 오류가 된다. 빌드가 잡아 주긴 하는데 오류 메시지가 CSS 를 가리켜서
원인을 찾는 데 시간이 걸린다(두 번 겪었다).

실행: python3 scripts/check-src.py
"""

from __future__ import annotations

import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]

bad: list[str] = []
checked = 0
# .tsx 만 보다가 .ts 도 본다. M.AX 계열이 여러 장으로 쪼개지면서 공용 CSS 를
# maxStyles.ts 로 뺐는데, 확장자만 달라졌다고 검사에서 빠지면 그게 구멍이다.
for f in sorted(
    [*ROOT.joinpath("app").rglob("*.tsx"), *ROOT.joinpath("app").rglob("*.ts")]
):
    text = f.read_text()
    for m in re.finditer(r"const PAGE_CSS = `(.*?)\n`", text, re.S):
        checked += 1
        body = m.group(1)
        rel = f.relative_to(ROOT)
        if "`" in body:
            line = text[: m.start(1)].count("\n") + 1 + body[: body.index("`")].count("\n")
            bad.append(f"{rel}:{line} PAGE_CSS 안에 백틱이 있다 — 문자열이 거기서 끊긴다")
        if "${" in body:
            bad.append(f"{rel} PAGE_CSS 안에 ${{ 가 있다 — 템플릿이 값을 끼워 넣으려 한다")

print(f"PAGE_CSS {checked}개 확인, 문제 {len(bad)}개")
for line in bad:
    print(f"  ! {line}")
sys.exit(1 if bad else 0)
