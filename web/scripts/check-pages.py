"""새로 채운 화면 24장의 내용이 비지 않았나.

이 24장(홈 · M.AX 4 · 스마트팩토리 · AI솔루션 8 · 회사소개 4 · 기술력 2 · 수행실적 · 고객센터 3)에는 원본 대조가 없다 — 원본이 없거나 일부러
다르게 만들었기 때문이다. 그래서 글이 비어도 그림이 빠져도 빌드는 통과했다.
이 검사는 장마다 넷을 본다:

  1. 본문 글자 수가 바닥 이상인가 (헤더 메뉴·문의 모달·푸터 껍데기 약 855자를
     뺀 값이다 — 안 빼면 내용이 0인 장도 820점을 갖고 출발한다)
  2. 그림(<img>)이 바닥 이상인가
  3. 등장 표시(data-rv, 옮긴 장은 data-aos)가 하나 이상 있는가
  4. 화면 파일(/screens/…)이 전부 실재하고, 안 쓰는 화면이 0장인가

바닥은 2026-09-18 의 현재값이다 — 「채운 결과」가 아니라 「여기서 줄면 되돌린다」는 선이다.
같은 날 사용자 결정으로 오히려 줄어든 장이 있다(아래 FLOORS 주석).
숫자를 낮추는 쪽으로 고치려면 왜 줄어도 되는지를 먼저 적는다.

실행: python3 scripts/check-pages.py   (Next :3400, Nest :3500 이 떠 있어야 한다)
"""
from __future__ import annotations

import os
import re
import sys
import urllib.request

NEXT = os.environ.get("NEXT_ORIGIN", "http://localhost:3400")
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SHELL = 853  # 헤더 메뉴 591 + 문의 모달 108 + 푸터 154. 2026-09-22 메뉴의 한건 설명 「한국건축」→「건설」로 2자 줄었다(09-18 실측 855).

# 주소: (본문 글자 바닥, 그림 바닥)
# 낮춘 기록 — pcb-mes 2290→1874·19→9, cuton 767→733·5→4: 「기능마다 화면 한 장만」
# (결정 0011)로 나머지 화면과 그 설명글이 여는 창 안으로 들어갔다. 내용이 준 게 아니라
# 첫 화면에서 보이는 양이 준 것이다.
# 2026-09-18 옛 꾸밈 5장을 새 틀로 옮기며 다시 쟀다(스톡 사진 셋을 뺐다 — 제품 화면 아님).
# 2026-09-21 v3 꾸밈(SolutionShell look="v3")으로 M.AX·AI솔루션 12장을 옮기며 7장을 낮췄다
# (pcb 1839→1799, smart_fac 1002→985, ai_sol 1243→1183, cuton 981→932, chat 1146→1070,
# growtok 897→833, growxd 1021→963). 뺀 것은 기능마다 붙어 있던 해시태그 칩과 번호 —
# 눌리지 않는 장식이라 블라인드 비평에서 지적됐다. 문장은 하나도 안 뺐다.
# 2026-09-22 저녁: 「인증·선정」 판을 허브 둘(M.AX·AI솔루션 개발)에만 두고 제품 장에서 뺐다(사용자 지시,
# 약 130자) · 3열 카드의 「자세히 보기 ›」 글을 aria-label 로 옮겼다(카드마다 7자). 문장은 안 뺐다.
# 같은 날 한건 Biz 구역의 전체 화면 판 하나를 뺐다(사진 판과 연속이라 전달이 안 됨) — 그림 2→1.
# 오토폼 맨 밑 3열 요약은 머리말 요약과 겹쳐 뺐다(2089→1848) · CADON 되접기 화면은 시연에 이미 있어 판을 뺐다(그림 9→8),
# 이어 「AutoCAD 명령 셋」 구역도 시연과 겹쳐 뺐다(2378→2071). 채팅 장은 머리말 요약 2열 대신 선언 구역(alf-customer).
FLOORS: dict[str, tuple[int, int]] = {
    "/": (1525, 2),
    # 2026-09-22 v4 허브(채널웍스 골격): 「무엇이 달라집니까」 고르개 여섯·하위 장 카드 셋을
    # 제품군 구역 셋(판 화면 1장씩)이 대신한다. 글자는 고르개 요점, 그림은 고르개 6장+카드 3장이 빠진 것.
    # 09-22 탭으로: 구역마다 있던 알약 탭 셋이 하나로 (2704→2664).
    # 2026-09-22 밤 두 레퍼런스(marketing·documents) 재작업: Tabbed·Group·CaseCard·MaxFlow 제거, Showcase 카드 한 장씩 → 글 1176, 그림 = 머리말 넘김 4 + Showcase 1 + FlowBand 0 + 인증 0.
    "/page/business/max": (1176, 5),
    # 2026-09-22 밤: FeatureBlock 지그재그 → ShowTabs 게이지 탭(한 번에 화면 한 장) + KPI 화면 제외(사용자 「우리 KPI 아니잖아」) → 1243/7.
    # 2026-09-22 밤 2차: FeatureShow — 기능 7개 전문(요점·콜아웃·칩) 복원, KPI 화면 제외 → 1497/7.
    "/page/business/max/pcb-mes": (1556, 7),
    # 2026-09-22 밤: ShowTabs 게이지 탭 + 모니터링 Cols(화면 없음) → 849/4.
    # 2026-09-22 밤 2차: mes-cosmetics-front 실제 화면 목록으로 기능 5→9(영업·구매·생산·품질검사·규제·설비) → 1642/4.
    # 머리말 화면을 뺐다(넷 있는 캡처가 전부 본문 판에 쓰여 겹침) → 3. workspace 캡처가 오면 올린다.
    "/page/business/max/cosmetics-mes": (1652, 3),
    # 2026-09-22 밤: Bento(화면 3) + FlowCard 단계 + 머리말 넘김 3 → 1288/8.
    "/page/business/max/mes-ai": (1288, 8),
    "/page/business/smart_fac": (852, 2),
    "/page/business/ai_sol": (1183, 2),
    "/page/service/autoform": (1848, 5),
    # 09-22 컷온: 기능 칸의 화면(머리말 판과 같은 그림)을 뺐다 — 화면 하나뿐인 장은 한 곳에만. 그림 3→2.
    "/page/service/cuton": (1942, 4),
    "/page/service/cadon": (2071, 8),
    "/page/service/chat": (1070, 3),
    "/page/service/hangeon": (726, 1),
    "/page/service/growtok": (700, 2),
    "/page/service/growxd": (838, 3),
    # 2026-09-18 옛 꾸밈 8장을 새 틀로 옮긴 뒤 잰 값. 게시판 두 장은 글이 스크립트로
    # 들어오므로 본문 바닥이 낮다(껍데기만 센다).
    "/page/company/intro": (611, 4),
    "/page/company/vision": (870, 2),
    "/page/company/history": (686, 2),
    "/page/company/location": (481, 2),
    "/page/portfolio/portfolio": (904, 2),
    "/page/tech/patent": (745, 8),
    "/page/tech/copyright": (713, 7),
    "/page/support/notice": (233, 2),
    "/page/support/press": (231, 2),
    # 2026-09-22 게시판 3종. 글이 없는 빈 상태(안내 문구)에서 잰 껍데기 바닥 — 공지·보도와 같은 방식(실측의 약 70%).
    "/page/support/news": (214, 2),
    "/page/support/recruit": (250, 2),
    "/page/support/faq": (238, 2),
    "/page/support/notify_form": (231, 2),
}


def markup(html: str) -> str:
    """스크립트·스타일을 뺀 본문 마크업. 스크립트 안에도 같은 글자가 한 번 더 있어서(RSC)
    안 빼면 두 배로 센다."""
    b = html.split("<body", 1)[-1]
    return re.sub(r"<script[\s\S]*?</script>|<style[\s\S]*?</style>|<noscript[\s\S]*?</noscript>|<!--[\s\S]*?-->", "", b)


def body_chars(html: str) -> int:
    b = re.sub(r"<[^>]+>", " ", markup(html))
    return len(re.sub(r"\s+", " ", b).strip())


def main() -> int:
    measure = "--measure" in sys.argv
    ok = fail = 0

    def check(name: str, cond: bool, detail: str = "") -> None:
        nonlocal ok, fail
        if cond:
            ok += 1
            print(f"  PASS  {name}")
        else:
            fail += 1
            print(f"  FAIL  {name}  {detail}")

    used: set[str] = set()
    for path, (min_chars, min_img) in FLOORS.items():
        try:
            html = urllib.request.urlopen(NEXT + path, timeout=30).read().decode("utf-8", "replace")
        except Exception as e:  # noqa: BLE001
            check(f"{path} 응답", False, str(e))
            continue
        body = html.split("<body", 1)[-1]
        chars = body_chars(html) - SHELL
        imgs = len(re.findall(r"<img\b", body))
        rv = len(re.findall(r"data-rv", markup(html)))
        shots = set(re.findall(r"/screens/([A-Za-z0-9._-]+)", body))
        used |= {os.path.splitext(s)[0] for s in shots}
        if measure:
            print(f"  {path:36} 본문 {chars:5}  그림 {imgs:2}  rv {rv:2}")
            continue
        print(f"== {path}")
        check(f"본문 {chars}자 ≥ {min_chars}", chars >= min_chars, "내용이 줄었다")
        check(f"그림 {imgs}장 ≥ {min_img}", imgs >= min_img, "그림이 빠졌다")
        check(f"등장 표시 {rv}곳 ≥ 1", rv >= 1, "data-rv 가 없다")
        missing = [s for s in shots if not os.path.exists(os.path.join(ROOT, "public", "screens", s))]
        check(f"화면 파일 {len(shots)}장 실재", not missing, f"없음: {missing}")

    if measure:
        return 1 if fail else 0
    have = {os.path.splitext(f)[0] for f in os.listdir(os.path.join(ROOT, "public", "screens"))}
    # 응답에 안 나오는 화면도 코드가 부를 수 있다(다른 장). 코드 전수로 다시 센다.
    code_used: set[str] = set()
    for d in ("app", "lib", "components"):
        for dp, _, fs in os.walk(os.path.join(ROOT, d)):
            for f in fs:
                if f.endswith((".ts", ".tsx")):
                    with open(os.path.join(dp, f), encoding="utf-8") as fh:
                        code_used |= set(re.findall(r"screens/([A-Za-z0-9._-]+?)\.(?:jpg|png|webp)", fh.read()))
    unused = sorted(have - code_used)
    missing = sorted(code_used - have)
    print("== 화면 파일")
    check(f"코드가 부르는 화면이 전부 있다 ({len(code_used)}장)", not missing, f"없음: {missing}")
    check(f"안 쓰는 화면 0장 ({len(unused)}장)", not unused, f"{unused}")
    print(f"\nPASS={ok} FAIL={fail}")
    return 1 if fail else 0


if __name__ == "__main__":
    sys.exit(main())
