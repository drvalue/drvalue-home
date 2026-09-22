"""운영 게시판의 실제 글을 CMS 로 옮긴다.

지금 CMS 에는 시연용 표본 글만 있다. 그 상태로 전환하면 메인 소식 카드에
"시연용 표본 글이다" 가 뜬다. 실제 글은 운영 게시판 API 에만 있다.

**전환 당일에 다시 돌려야 한다.** 그 사이에 올라온 글이 빠지기 때문이다.
여러 번 돌려도 같은 결과가 나온다(같은 원본 id 는 건너뛴다).

  python3 scripts/import_board.py              # 옮기기만
  python3 scripts/import_board.py --purge-demo # 시연용 글까지 지우고 옮기기
  python3 scripts/import_board.py --dry-run    # 무엇을 할지만 보기

원본 주소는 SOURCE_BASE 로 바꾼다(기본은 운영).
"""

from __future__ import annotations

import html as htmllib
import json
import os
import re
import sys
import urllib.request
from datetime import datetime, timezone
from difflib import SequenceMatcher
from zoneinfo import ZoneInfo

sys.path.insert(0, "scripts")
from directus import Directus  # noqa: E402

SOURCE_BASE = os.environ.get("SOURCE_BASE", "https://drvalue.co.kr")
API = f"{SOURCE_BASE}/page/support/notice_api.php"

# 옛 게시판의 type → CMS 의 board
BOARD_OF = {"NOTICE": "notice", "NEWSROOM": "press"}

# 시연용으로 넣었던 글. 이것만 골라 지운다 — 사람이 쓴 글을 지우면 안 된다.
DEMO_SLUGS = {
    "seed-notice-sample", "demo-support", "demo-press", "demo-move",
    "admin-ui-demo", "scheduled-demo", "demo-holiday", "demo-update",
    "demo-max",
}


def fetch(board: str) -> list[dict]:
    """옛 게시판 목록. 쪽이 나뉘어 있으면 끝까지 따라간다."""
    out: list[dict] = []
    page = 1
    while True:
        url = f"{API}?action=list&board={board}&page={page}"
        with urllib.request.urlopen(url, timeout=60) as r:
            body = json.loads(r.read().decode("utf-8", "replace"))
        rows = body.get("data") or []
        out.extend(rows)
        total = body.get("total")
        if not rows or total is None or len(out) >= total or page > 50:
            break
        page += 1
    return out


def to_html(text: str) -> str:
    """줄글을 본문 HTML 로. 옛 게시판은 순수 글자에 줄바꿈만 있다.

    글자를 먼저 이스케이프한다 — 원본에 `<` 가 들어 있으면 그대로 붙였을 때
    본문이 태그로 읽혀 화면이 깨진다.
    """
    blocks = [b.strip() for b in re.split(r"\n\s*\n", text.strip()) if b.strip()]
    return "".join(
        "<p>" + htmllib.escape(b).replace("\n", "<br />") + "</p>" for b in blocks
    )


# 인사말. 이 글들은 전부 "안녕하세요. / 디알밸류입니다." 로 시작해서, 안 거르면
# 모든 글의 요약이 똑같아진다. **줄 단위로** 본다 — 한 문단 안에 인사가 두 줄로
# 들어 있어서 문단째 비교하면 안 걸린다(실측).
GREETING = re.compile(
    r"^(안녕하세요|반갑습니다|.{0,24}(디알밸류|전문기업)\s*(입니다|이에요))[.!]*$"
)


def _bare(s: str) -> str:
    """견줄 때 쓸 알맹이. 띄어쓰기·문장부호·이모지를 다 뗀다."""
    return re.sub(r"[^0-9A-Za-z가-힣]", "", s)


def summarize(text: str, title: str = "", limit: int = 90) -> str:
    """목록·카드에 쓸 한 줄. 지어내지 않고 **본문 첫 알맹이 줄**을 자른다.

    제목을 거의 그대로 되풀이하는 줄은 넘긴다. 카드에 제목과 요약이 나란히
    붙는데 둘이 같으면 한 줄을 버리는 셈이다.
    """
    t = _bare(title)
    for raw in text.strip().splitlines():
        line = " ".join(raw.split())
        if not line or GREETING.match(line):
            continue
        # 앞에 붙은 이모지·기호를 떼면 첫 글자가 글이 된다.
        line = re.sub(r"^[^\w가-힣]+", "", line).strip()
        if len(line) < 12:
            continue
        b = _bare(line)
        # 글자가 몇 개 끼어들면 "포함" 으로는 안 걸린다("CUTON 서비스가 …" vs
        # "AI 기반 CUTON 서비스가 …"). 닮은 정도로 본다.
        if t and (b in t or t in b or SequenceMatcher(None, b, t).ratio() > 0.72):
            continue
        return line if len(line) <= limit else line[: limit - 1].rstrip() + "…"
    return ""


# 보도자료 본문에 "OO를 통해 보도되었습니다" 로 매체가 적혀 있다. 스키마에
# press_media 칸이 있으니 비워 두지 않는다 — 나중에 손으로 채우면 빠뜨린다.
MEDIA = re.compile(r"([가-힣A-Za-z0-9]{2,12})(?:를|을)\s*통해\s*보도")


def press_media(text: str) -> str:
    m = MEDIA.search(text)
    return m.group(1) if m else ""


def slug_of(row: dict) -> str:
    """원본 id 로 주소를 만든다. 제목으로 만들면 제목을 고칠 때 주소가 바뀐다."""
    return "legacy-" + str(row["id"])[:8]


KST = ZoneInfo("Asia/Seoul")


def kst_date(value: str) -> str:
    """`2026-06-18T04:48:12.794Z` → `2026-06-18`. **서울 시각으로 자른다.**

    원본은 UTC 다(끝에 `Z`). 그냥 앞 10글자를 자르면 새벽 0시부터 아침 9시
    (KST) 사이에 올린 글이 하루 전날로 들어간다 — UTC 15:00~23:59 구간이다.
    목록 정렬과 표시 날짜가 같이 틀어진다.

    파이썬 3.9 의 `fromisoformat` 은 `Z` 도, 3·6자리가 아닌 소수점 이하도
    못 읽는다. 날짜만 쓰므로 소수점 이하는 떼고 `Z` 만 바꿔 준다.
    시간대가 아예 없는 값은 UTC 로 본다(원본이 UTC 다).
    """
    s = (value or "").strip()
    if not s:
        return ""
    s = re.sub(r"\.\d+", "", s)
    if s.endswith(("Z", "z")):
        s = s[:-1] + "+00:00"
    try:
        dt = datetime.fromisoformat(s)
    except ValueError:
        # 못 읽는 모양이 하나 섞였다고 이관 전체를 멈추지 않는다.
        # 예전처럼 앞 10글자를 쓴다 — 날짜가 하루 어긋날 뿐 글은 넘어간다.
        return (value or "")[:10]
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(KST).date().isoformat()


def main() -> None:
    dry = "--dry-run" in sys.argv
    purge = "--purge-demo" in sys.argv

    d = Directus()
    d.login()

    made, skipped, removed, failed = [], 0, [], []

    # 이미 옮긴 것을 다시 넣지 않는다.
    st, body = d.request("GET", "/items/posts?limit=-1&fields=id,slug")
    if st != 200:
        print(f"기존 글 조회 실패: HTTP {st} {body}")
        raise SystemExit(1)
    existing = {r["slug"]: r["id"] for r in (body.get("data") or [])}

    for legacy_board, rows in (("notice", fetch("notice")), ("press", fetch("press"))):
        for row in rows:
            board = BOARD_OF.get(row.get("type") or "", legacy_board)
            slug = slug_of(row)
            title = (row.get("title") or "").strip()
            content = row.get("content") or ""
            if slug in existing:
                skipped += 1
                continue
            if not title:
                failed.append(f"{slug}: 제목이 비어 있다")
                continue
            # 첨부·대표 이미지는 파일을 따로 올려야 한다. 지금 원본에는 없다.
            # 생기면 조용히 버리지 말고 알린다.
            if row.get("attachmentFiles") or row.get("thumbnailImage"):
                failed.append(f"{slug}: 첨부/대표 이미지가 있다 — 파일은 손으로 올려야 한다")
            payload = {
                "board": board,
                "status": "published" if row.get("showYn", True) else "draft",
                "slug": slug,
                "published_date": kst_date(row.get("createdAt") or ""),
                "is_pinned": bool(row.get("isPinned")),
                "translations": [{
                    "languages_code": "ko-KR",
                    "title": title,
                    "summary": summarize(content, title),
                    "body": to_html(content),
                }],
            }
            if board == "press":
                media = press_media(content)
                if media:
                    payload["press_media"] = media
            if dry:
                made.append(f"[안 씀] {board} {slug} {title[:40]}")
                continue
            st, res = d.request("POST", "/items/posts", payload)
            if st == 200:
                made.append(f"{board} {slug} {title[:40]}")
            else:
                failed.append(f"{slug}: HTTP {st} {res}")

    if purge:
        for slug in sorted(DEMO_SLUGS & set(existing)):
            if dry:
                removed.append(f"[안 씀] {slug}")
                continue
            st, res = d.request("DELETE", f"/items/posts/{existing[slug]}")
            if st in (200, 204):
                removed.append(slug)
            else:
                failed.append(f"{slug} 삭제: HTTP {st} {res}")

    print(f"옮김 {len(made)}건, 이미 있음 {skipped}건, 지움 {len(removed)}건, 실패 {len(failed)}건")
    for line in made:
        print(f"  + {line}")
    for line in removed:
        print(f"  - {line}")
    for line in failed:
        print(f"  ! {line}")
    raise SystemExit(1 if failed else 0)


if __name__ == "__main__":
    main()
