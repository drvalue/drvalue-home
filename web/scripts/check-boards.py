"""공지·보도·뉴스가 스크립트 없이 보이나 — 그리고 장마다 h1 이 하나(로고가 아닌 장 제목)인가.

2026-09-22 까지 세 게시판은 jQuery 가 빈 상자에 글을 채웠다. 스크립트가 꺼진 사람과 검색 로봇에게
게시판이 비어 보였고(절대 규칙 4), 글 상세는 목록 주소 `?id=` 라 제목·대표주소가 목록 것이었다.
서버가 그리게 바꾸면서 이 검사를 같이 만든다(standards: 다르게 만든 자리는 대신 볼 검사를 만든다).

본다:
  1. 목록 HTML(스크립트 없이 받은 그대로)에 api 가 공개 중이라 한 글의 제목이 전부 있다
  2. 글마다 제 주소가 200 · 대표주소가 자기 · h1 하나가 그 글 제목 · og:type article
  3. 옛 상세 `목록?id=<slug>` 는 글 주소로 308, 다른 게시판 글 주소는 제 게시판으로 308
  4. 없는 글은 404
  5. 공개 장 전부(사이트맵 + 숨김 장 + 글)에 h1 이 정확히 하나이고 로고(#toss_logo)가 아니다
  6. 홈 소식 링크가 글 주소를 가리킨다(`?id=` 가 아니다)

실행: NEXT_ORIGIN=http://localhost:3400 API_ORIGIN=http://localhost:3500 python3 scripts/check-boards.py
"""
from __future__ import annotations

import html as H
import json
import os
import re
import sys
import urllib.error
import urllib.request

NEXT = os.environ.get("NEXT_ORIGIN", "http://localhost:3400")
API = os.environ.get("API_ORIGIN", "http://localhost:3500")
SITE = "https://drvalue.co.kr"
BOARDS = ("notice", "press", "news")
HIDDEN = ("/page/tech/patent_old",)


class _NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *a, **k):  # noqa: ANN002, ANN003
        return None


_open = urllib.request.build_opener(_NoRedirect).open


def get(url: str) -> tuple[int, dict, str]:
    try:
        r = _open(url, timeout=30)
        return r.status, dict(r.headers), r.read().decode("utf-8", "replace")
    except urllib.error.HTTPError as e:
        return e.code, dict(e.headers), e.read().decode("utf-8", "replace")


def markup(page: str) -> str:
    """스크립트·스타일을 뺀 본문 — RSC 조각 안의 같은 글자를 세지 않는다."""
    b = page.split("<body", 1)[-1]
    return H.unescape(re.sub(r"<script[\s\S]*?</script>|<style[\s\S]*?</style>", "", b))


def h1s(page: str) -> list[str]:
    return re.findall(r"<h1\b[^>]*>[\s\S]*?</h1>", markup(page))


def main() -> int:
    ok = fail = 0

    def check(name: str, cond: bool, detail: str = "") -> None:
        nonlocal ok, fail
        if cond:
            ok += 1
            print(f"  PASS  {name}")
        else:
            fail += 1
            print(f"  FAIL  {name}  {detail}")

    details: list[str] = []
    for board in BOARDS:
        print(f"== {board}")
        posts = json.load(urllib.request.urlopen(f"{API}/api/content/posts?board={board}&limit=100", timeout=30))["data"]
        st, _, page = get(f"{NEXT}/page/support/{board}")
        body = markup(page)
        hit = [p["title"] for p in posts if p["title"] in body]
        check(f"목록 200 · JS 없이 제목 {len(hit)}/{len(posts)}", st == 200 and len(hit) == len(posts), f"status={st}")
        for p in posts:
            path = f"/page/support/{board}/{p['slug']}"
            details.append(path)
            st, _, page = get(NEXT + path)
            canon = re.search(r'<link rel="canonical" href="([^"]+)"', page)
            heads = h1s(page)
            check(f"{p['slug']} 200", st == 200, f"status={st}")
            check(f"{p['slug']} 대표주소가 자기", bool(canon) and canon.group(1) == SITE + path, canon.group(1) if canon else "없음")
            check(f"{p['slug']} h1 하나 = 제목", len(heads) == 1 and p["title"] in heads[0], f"h1 {len(heads)}")
            check(f"{p['slug']} og:type article", 'property="og:type" content="article"' in page)
            st, hd, _ = get(f"{NEXT}/page/support/{board}?id={p['slug']}")
            check(f"{p['slug']} 옛 ?id= 308 → 글 주소", st == 308 and hd.get("location", "").endswith(path), f"{st} {hd.get('location')}")
        st, _, _ = get(f"{NEXT}/page/support/{board}/no-such-post-check-boards")
        check("없는 글 404", st == 404, f"status={st}")

    print("== 다른 게시판 글 주소")
    press = json.load(urllib.request.urlopen(f"{API}/api/content/posts?board=press&limit=1", timeout=30))["data"]
    if press:
        st, hd, _ = get(f"{NEXT}/page/support/notice/{press[0]['slug']}")
        check("공지 주소의 보도자료 글 → 보도자료 주소 308", st == 308 and "/page/support/press/" in hd.get("location", ""), f"{st} {hd.get('location')}")

    print("== h1 (장마다 하나, 로고 아님)")
    sm = urllib.request.urlopen(NEXT + "/sitemap.xml", timeout=30).read().decode()
    paths = [re.sub(r"^https?://[^/]+", "", u) or "/" for u in re.findall(r"<loc>([^<]+)</loc>", sm)]
    bad = []
    for path in [*paths, *HIDDEN, *details]:
        st, _, page = get(NEXT + path)
        heads = h1s(page)
        if st != 200 or len(heads) != 1 or "toss_logo" in heads[0]:
            bad.append(f"{path}({st}, h1 {len(heads)})")
    check(f"공개 장 {len(paths) + len(HIDDEN) + len(details)}곳 h1 하나", not bad, ", ".join(bad))
    st, _, home = get(NEXT + "/")
    check("로고는 h1 이 아니다", st == 200 and not re.search(r"<h1[^>]*toss_logo", home))

    print("== 홈 소식")
    links = re.findall(r'href="(/page/support/(?:notice|press)[^"]*)"', markup(home))
    check(f"홈 소식 링크 {len(links)}개가 글 주소", bool(links) and all("?id=" not in l for l in links), str(links[:3]))

    print(f"\nPASS={ok} FAIL={fail}")
    return 1 if fail else 0


if __name__ == "__main__":
    sys.exit(main())
