"""홈은 원본과 "같음" 이 아니라 "덧붙임" 이다. 그걸 그대로 잰다.

홈은 이제 원본과 한 구역도 안 겹친다. 원본을 안 부른다.
그래서 compare-all 의 대상에서 뺐다. 대신 **세 가지**를 여기서 본다.

  1. 정한 뼈대가 그대로인가 (구역 차례·개수, 뺀 구역이 되살아나지 않았나).
     원본 PHP 홈은 이제 한 구역도 안 남아서 「원본 보존」 검사는 뜻을 잃었다.
  2. 새로 붙인 것이 실제로 그려지나 (구역·카드 개수)
  3. 그려진 것이 시연용 글이 아닌가 (`시연용`·`표본` 이 화면에 없나)

1번이 없으면 "추가" 를 핑계로 원본을 부숴도 아무도 모른다. 2번이 없으면
CMS 가 죽었을 때 빈 구역이 조용히 남는다. 3번이 없으면 카드 개수만 맞고
내용은 시연용인 채로 통과한다 — 실제로 22개가 전부 통과하는 동안 화면에는
시연용 글 6개가 떠 있었다.

실행: python3 scripts/check-home.py   (Next :3400 과 Nest :3500 이 떠 있어야 한다 — 소식이 거기서 온다)
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

NEXT = os.environ.get("NEXT_ORIGIN", "http://localhost:3400").rstrip("/") + "/"


def subsequence(small: list[str], big: list[str]) -> tuple[bool, int]:
    """small 이 big 안에 같은 차례로 다 들어 있나. 아니면 몇 번째에서 끊겼나."""
    i = 0
    for x in big:
        if i < len(small) and small[i] == x:
            i += 1
    return i == len(small), i


# 메인은 관리 화면 「메인 화면」에서 고친다(page_contents 'home'). 구역 차례·보이기·카드 수를
# 거기서 읽어 기대값으로 쓴다 — 편집자가 구역을 옮기거나 카드를 더해도 검사가 틀렸다고 하지 않고,
# 화면이 CMS 와 다르게 그려지면 잡는다. CMS 를 못 읽으면 씨앗(app/home/content.ts)의 값이 기대값이다.
SEED_ORDER = ["proof", "biz", "news", "cta"]
SECTION_MARK = {"proof": "t_section dvproof", "biz": "t_section dvbiz", "news": "t_section dvnews", "cta": "dvcta"}
SECTION_NAME = {"proof": "신뢰의 근거", "biz": "사업", "news": "소식", "cta": "문의"}
SEED = {"proof_cards": 11, "biz_cards": 3, "years": 3, "counts": {"patent": 6, "copyright": 5, "case": 9}}


def get_json(path: str):
    import json
    try:
        return json.loads(compare._OPENER.open(NEXT + path.lstrip("/"), timeout=30).read().decode("utf-8"))
    except Exception:
        return None


def expected() -> dict:
    """CMS 의 메인 글과 게시판 글 수. 못 읽은 것은 씨앗 값."""
    page = (get_json("/api/content/pages/home") or {}).get("data") or {}
    secs = page.get("sections") or [{"section": k, "visible": True} for k in SEED_ORDER]
    seen = {x.get("section") for x in secs}
    secs = secs + [{"section": k, "visible": True} for k in SEED_ORDER if k not in seen]
    proof = ((page.get("proof") or {}).get("cards")) or None
    biz = ((page.get("biz") or {}).get("cards")) or None
    counts = {}
    for board in ("patent", "copyright", "case"):
        total = (get_json(f"/api/content/posts?board={board}&limit=1") or {}).get("total")
        counts[board] = total if isinstance(total, int) else SEED["counts"][board]
    other_year = None
    if proof:
        years = sorted({c.get("year") for c in proof}, reverse=True)
        other = [c for c in proof if c.get("year") != years[0]]
        other_year = other[0].get("title") if other else None
    return {
        "from_cms": bool(page),
        "visible": [x["section"] for x in secs if x.get("visible")],
        "hidden": [x["section"] for x in secs if not x.get("visible")],
        "proof_cards": len(proof) if proof else SEED["proof_cards"],
        "biz_cards": len(biz) if biz else SEED["biz_cards"],
        "years": len({c.get("year") for c in proof}) if proof else SEED["years"],
        # 고른 해가 아닌 카드 하나 — DOM 에 남아 있어야 한다(씨앗: 2024년 ISO 9001).
        "other_year_title": other_year or "ISO 9001",
        "counts": counts,
    }


def main() -> None:
    import urllib.request
    html = compare._OPENER.open(NEXT, timeout=30).read().decode("utf-8", "replace")
    exp = expected()
    ok = fail = 0

    def check(name: str, cond: bool, detail: str = "") -> None:
        nonlocal ok, fail
        if cond:
            ok += 1
            print(f"  PASS  {name}")
        else:
            fail += 1
            print(f"  FAIL  {name}  {detail}")

    print(f"== 홈의 뼈대가 정한 대로인가 (기대값: {'CMS 메인 글' if exp['from_cms'] else '씨앗'})")
    # 원본 PHP 홈은 이제 한 구역도 안 남았다 — 머리 그림은 다시 그렸고, t_service ·
    # 역량(dvcap) · 제품 화면 띠 · 수행실적 미리보기는 사용자 결정으로 뺐다.
    # 그래서 「원본이 그대로 남았나」 대신 「정한 뼈대(= CMS 의 구역 차례)가 그대로인가」 를 잰다.
    # 강도는 같다 — 구역 차례가 뒤집히거나 하나가 사라지면 잡힌다.
    a, b = html.find('<div id="toss_container"'), html.find('<footer')
    check("본문 상자와 푸터가 있다", a >= 0 and b > a)
    body = html[a:b] if a >= 0 and b > a else ""
    order = ["dv_hero"] + [SECTION_MARK[k] for k in exp["visible"]]
    pos = [body.find(m) for m in order]
    label = " → ".join(["머리"] + [SECTION_NAME[k] for k in exp["visible"]])
    check(f"구역 차례 {label}", all(p >= 0 for p in pos) and pos == sorted(pos), f"위치 {pos}")
    secs = len(re.findall(r"<section\b", body))
    want = 1 + len(exp["visible"])
    check(f"본문 구역이 {want}개 ({secs}개)", secs == want)
    # 뺀 구역이 되살아나지 않았나. CSS 만 남아도 죽은 코드다.
    for gone in ["dvcap_visual", "t_service", "dvscr", "dvpf"]:
        check(f"뺀 구역 표식 {gone} 이 없다", gone not in html)
    # 머리 그림의 숫자. 게시판 공개 글 수와 같아야 하고, 마크업 그대로여야 한다. 세는 것은 브라우저에서만
    # 일어난다 — 서버 응답의 글자가 0 으로 바뀌어 있으면 자바스크립트가 꺼진 사람에게 영원히 0 으로 남는다.
    c = exp["counts"]
    for n in [f"<b>{c['patent']}개</b>", f"<b>{c['copyright']}개</b>", f"<b>{c['case']}건</b>"]:
        check(f"머리 그림 숫자 {n} 가 마크업에 그대로(게시판 글 수)", n in html)

    print("\n== 새로 붙인 것이 그려지나")
    news = len(re.findall(r'class="dvnews_row"', html))
    proof = len(re.findall(r'class="dvproof_card is-', html))
    vis = set(exp["visible"])
    # 숨긴 구역은 「없다」가 맞다 — 관리 화면에서 끈 것이 화면에 남으면 그게 결함이다.
    check("사업영역 구역이 " + ("있다" if "biz" in vis else "없다(숨김)"), ('class="t_section dvbiz"' in html) == ("biz" in vis))
    nbiz = len(re.findall(r'class="dvbiz_card', html))
    check(f"사업영역 카드 {exp['biz_cards'] if 'biz' in vis else 0}장 ({nbiz}장)", nbiz == (exp["biz_cards"] if "biz" in vis else 0))
    # 메인 본문에서 새 M.AX 페이지로 가는 길. 이게 0이면 헤더 드롭다운으로만
    # 갈 수 있다 — 실제로 그렇게 비어 있었다(머리 그림 첫째 버튼이나 사업 카드).
    check("본문에 M.AX 입구가 있다", body.count('/page/business/max') >= 1)
    check("문의 유도 띠가 " + ("있다" if "cta" in vis else "없다(숨김)"), ('dvcta_btn' in html) == ("cta" in vis))
    check("소식 구역이 " + ("있다" if "news" in vis else "없다(숨김)"), ('class="t_section dvnews"' in html) == ("news" in vis))
    check("신뢰의 근거 구역이 " + ("있다" if "proof" in vis else "없다(숨김)"), ('class="t_section dvproof"' in html) == ("proof" in vis))
    check(f"소식이 1건 이상 ({news}건, 목록 줄)", news >= 1 if "news" in vis else news == 0, "CMS 가 안 읽힌다")
    # 카드 개수는 무엇이 담겼는지를 말해 주지 않는다. 시연용 표본 글이
    # 그대로 실려도 위 검사는 통과한다 — 실제로 그렇게 통과했다.
    for word in ["시연용", "표본"]:
        check(f"'{word}' 이 화면에 없다", word not in html, "시연용 글이 남아 있다")
    want_proof = exp["proof_cards"] if "proof" in vis else 0
    check(f"신뢰의 근거 카드 {want_proof}장 ({proof}장)", proof == want_proof)
    # 숨긴 해의 카드도 DOM 에 남아야 한다 — 검색엔진이 봐야 하는 자리다.
    check("다른 해 카드도 DOM 에 있다", (exp["other_year_title"] in html) if "proof" in vis else True)
    # 감싸개(`dvnews_tabs`)까지 세지 않도록 뒤를 막는다.
    ntab = len(re.findall(r'class="dvnews_tab(?:"| )', html))
    ptab = len(re.findall(r'class="dvproof_tab(?:"| )', html))
    check(f"소식 고르개 3개 ({ntab}개)", ntab == (3 if "news" in vis else 0))
    want_years = exp["years"] if "proof" in vis else 0
    check(f"연도 고르개 {want_years}개 ({ptab}개)", ptab == want_years)

    print(f"\nPASS={ok} FAIL={fail}")
    raise SystemExit(1 if fail else 0)


if __name__ == "__main__":
    main()
