#!/usr/bin/env python3
"""위쪽 탭 막대가 제대로 그려지나.

왜 따로 있나: 헤더는 더 이상 원본 PHP 의 이식이 아니다. 대분류를
「서비스·비즈니스」에서 「MAX·AI솔루션」 으로 바꾸고, 탭 아래 작은 상자를
폭 전체 메뉴판으로 새로 그렸다. 그래서 compare.py 가 양쪽에서 헤더를 통째로
떼고 비교한다(거기의 REDESIGNED). **뗀 자리를 아무도 안 보면 그냥 구멍이다.**
이 파일이 그 자리를 본다.

보는 것:
  - 탭 여섯 개가 정해진 글자·차례로 있나
  - 하위 항목 열다섯 개가 전부 있고, 각자 설명 한 줄을 달고 있나
  - 페이지마다 현재 탭 표시가 **정확히 하나** 켜지나
    (MAX 와 AI솔루션 이 같은 `/page/business/` 밑을 쓴다 — 여기서 틀리기 쉽다)
  - 옛 이름(「서비스」·「비즈니스」)이 안 남아 있나

  NEXT_ORIGIN 으로 주소를 바꿀 수 있다.
"""
import os
import pathlib
import re
import sys
import urllib.request

NEXT = os.environ.get("NEXT_ORIGIN", "http://localhost:3400").rstrip("/")

# 탭 글자와 하위 목록은 **lib/menu.ts 에서 읽는다.** 여기 손으로 베껴 두면
# 메뉴를 바꿀 때 두 군데를 고쳐야 하고, 한쪽을 잊으면 검사가 옛 모습을
# 통과시킨다. 아래 ACTIVE(페이지→탭)만 손으로 둔다 — 그건 베낀 것이 아니라
# "이 주소를 열면 이 탭이 켜져야 한다" 는 **따로 세운 기대값**이라서다.
MENU_TS = pathlib.Path(__file__).resolve().parents[1] / "lib" / "menu.ts"


def read_menu() -> tuple[list[str], list[tuple[str, str]]]:
    src = MENU_TS.read_text(encoding="utf-8")
    tabs = re.findall(r"title: '([^']+)', link:", src)
    # `hidden: true` 인 항목은 드롭다운에 안 그리는 것이 정상이다 — 이름만
    # 남겨 둔 것이라 여기서 찾으면 안 된다. 항목 한 줄을 통째로 잡아 거른다.
    subs = [
        (m.group(1), m.group(2))
        for m in re.finditer(r"\{ t: '([^']+)', l: '([^']+)'([^}]*)\}", src)
        if "hidden" not in m.group(3)
    ]
    return tabs, subs


TABS, SUBS = read_menu()

# 주소 → 이름. `hidden` 까지 포함한다 — 현재 위치 줄은 숨긴 장도 자기 이름으로
# 찍어야 하므로, 기대값은 전체 목록에서 가져온다.
SUBS_ALL = [
    (m.group(2), m.group(1))
    for m in re.finditer(r"\{ t: '([^']+)', l: '([^']+)'", MENU_TS.read_text(encoding="utf-8"))
]

# 이 주소를 열면 이 탭 하나만 켜져 있어야 한다.
ACTIVE = [
    ("/page/company/history", "회사소개"),
    ("/page/business/max", "M.AX"),
    ("/page/business/max/pcb-mes", "M.AX"),
    ("/page/business/max/cosmetics-mes", "M.AX"),
    ("/page/business/max/mes-ai", "M.AX"),
    ("/page/business/smart_fac", "M.AX"),
    ("/page/business/ai_sol", "AI솔루션"),
    ("/page/service/growtok", "AI솔루션"),
    ("/page/service/autoform", "AI솔루션"),
    ("/page/service/cadon", "AI솔루션"),
    ("/page/service/chat", "AI솔루션"),
    ("/page/service/hangeon", "AI솔루션"),
    # 메뉴에서 내렸지만 주소는 살아 있는 넷. 탭과 현재 위치 줄이 **자기 이름으로**
    # 찍혀야 한다 — 여기가 비어 있던 동안 GrowTalk 이 「오토폼」 으로 찍혔다.
    ("/page/business/smart_fac", "M.AX"),
    ("/page/business/ai_sol", "AI솔루션"),
    ("/page/service/growtok", "AI솔루션"),
    ("/page/service/growxd", "AI솔루션"),
    ("/page/service/cuton", "AI솔루션"),
    ("/page/portfolio/portfolio", "수행실적"),
    ("/page/tech/copyright", "기술력"),
    ("/page/support/press", "고객센터"),
]

GONE = ["서비스", "비즈니스"]

ok = fail = 0


def say(good: bool, what: str, detail: str = "") -> None:
    global ok, fail
    if good:
        ok += 1
        print(f"  PASS  {what}" + (f" ({detail})" if detail else ""))
    else:
        fail += 1
        print(f"  FAIL  {what}" + (f" — {detail}" if detail else ""))


def get(path: str) -> str:
    with urllib.request.urlopen(NEXT + path, timeout=30) as r:
        return r.read().decode("utf-8", "replace")


def header_of(html: str) -> str:
    m = re.search(r"<header[^>]*\sid=\"toss_header\"[\s\S]*?</header>", html)
    return m.group(0) if m else ""


def main() -> None:
    home = get("/")
    hdr = header_of(home)
    if not hdr:
        say(False, "헤더를 찾음", "id=toss_header 가 없다")
        print(f"\nPASS={ok} FAIL={fail}")
        sys.exit(1)
    say(True, "헤더를 찾음", f"{len(hdr)}자")

    # 1. 탭 여섯 개, 차례까지
    got = re.findall(r'class="main_a"><span>([^<]+)</span>', hdr)
    say(got == TABS, "탭 여섯 개와 차례", " · ".join(got) if got != TABS else f"{len(got)}개")

    # 2. 하위 항목과 설명
    say(len(SUBS) >= 15, "하위 항목 개수", f"{len(SUBS)}개")
    for label, href in SUBS:
        pat = re.compile(
            r'<a href="' + re.escape(href) + r'">\s*<b>' + re.escape(label)
            + r"</b>\s*<span>([^<]*)</span>"
        )
        m = pat.search(hdr)
        if not m:
            say(False, f"하위 「{label}」", f"{href} 자리에 없다")
        else:
            desc = m.group(1).strip()
            say(bool(desc), f"하위 「{label}」", desc if desc else "설명이 비었다")

    # 3. 옛 이름이 안 남았나
    for word in GONE:
        say(f"<span>{word}</span>" not in hdr, f"옛 이름 「{word}」 없음")

    # 4. 페이지마다 현재 탭이 정확히 하나
    for path, want in ACTIVE:
        h = header_of(get(path))
        on = re.findall(
            r'class="gnb_li is-active"[\s\S]*?class="main_a"><span>([^<]+)</span>', h
        )
        if len(on) != 1:
            say(False, f"{path} 현재 탭", f"{len(on)}개가 켜졌다 {on}")
        else:
            say(on[0] == want, f"{path} 현재 탭", f"{on[0]} (원한 것 {want})")

    # 5. 현재 위치 줄. 탭 막대와 같은 자료를 읽으므로 여기도 같이 본다 —
    #    compare.py 가 이 펼침 목록도 떼기 때문에 안 보면 구멍이 된다.
    for path, want in ACTIVE:
        h = get(path)
        m = re.search(r'<nav class="dv_breadcrumb"[\s\S]*?</nav>', h)
        if not m:
            say(False, f"{path} 현재 위치 줄", "없다")
            continue
        bc = m.group(0)
        cur = re.search(r'<span>([^<]+)</span>', bc)
        drop = re.findall(r'<li[^>]*><a href="[^"]*">([^<]+)</a></li>', bc)
        say(bool(cur) and cur.group(1) == want,
            f"{path} 현재 위치 줄 대분류", cur.group(1) if cur else "못 읽음")
        say(drop[:6] == TABS, f"{path} 위치 줄 펼침 목록",
            " · ".join(drop[:6]) if drop[:6] != TABS else "탭 여섯 개")
        # 두 번째 칸이 **그 장 자신의 이름**인가. 메뉴에서 내린 장이 첫 하위로
        # 떨어지던 것이 여기서 잡힌다.
        subname = re.findall(r'<span>([^<]+)</span>', bc)
        want_sub = dict(SUBS_ALL).get(path)
        if want_sub and len(subname) > 1:
            say(subname[1] == want_sub, f"{path} 위치 줄 하위", f"{subname[1]} (원한 것 {want_sub})")

    print(f"\nPASS={ok} FAIL={fail}")
    sys.exit(1 if fail else 0)


if __name__ == "__main__":
    main()
