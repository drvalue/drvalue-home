"""특허·저작권·수행실적·연혁을 화면 코드에서 CMS 로 옮긴다.

web 의 네 장(특허·저작권·수행실적·연혁)은 값이 코드에 배열로 박혀 있었다.
관리 화면에서 고칠 수 있으려면 CMS 에 있어야 한다. 이 스크립트가 그 값을
posts 의 board(patent · copyright · case · history)로 넣는다.

- 여러 번 돌려도 같다. slug 가 이미 있으면 건너뛴다(값은 안 덮는다 —
  관리 화면에서 고친 것을 스크립트가 되돌리면 안 된다).
- 증서 그림은 web/public/img 의 것을 올린다. **루트 img/ 를 쓰지 않는다** —
  patent2·3 은 개인정보를 덮은 사본이 public 에만 있다.
- 값은 web 의 배열을 그대로 옮긴 것이다. 여기서 새로 짓지 않는다.

실행: python3 scripts/import_site_content.py            (루트 .env 를 올린 뒤)
      python3 scripts/import_site_content.py --dry-run
"""

from __future__ import annotations

import json
import mimetypes
import os
import sys
import urllib.request
import uuid
from pathlib import Path

sys.path.insert(0, "scripts")
from directus import Directus  # noqa: E402

HERE = Path(__file__).resolve().parent.parent
IMG = HERE.parent / "web" / "public" / "img"

# ── 값 (web 의 배열 그대로) ─────────────────────────────────────────────

PATENTS = [
    ("patent1.png", "마이크로서비스 아키텍처를 활용한 SaaS 서비스 제공 서버 및 방법", "registered", "10-2820498", "2025-06-10"),
    ("patent2.png", "SaaS 서비스를 제공하는 방법 및 그 시스템", "applied", "10-2024-0130375", "2024-09-26"),
    ("patent3.png", "SaaS 어플리케이션 통합 관리 시스템 및 방법", "applied", "10-2024-0130376", "2024-09-26"),
    ("patent4.png", "AI 에이전트를 활용한 도면인식 기반의 BOM 및 공정 자동 매칭 서버 및 방법", "applied", "10-2025-0152877", "2025-10-21"),
    ("patent5.png", "인공지능 모델 기반의 건축 분야 온톨로지 구축 방법 및 그 전자 장치", "applied", "10-2026-0088448", "2026-05-15"),
    ("patent6.png", "도면 인식 결과 검증을 위해 온톨로지를 이용하는 방법 및 그 전자 장치", "applied", "10-2026-0088465", "2026-05-15"),
]

COPYRIGHTS = [
    ("copyright1.png", "클라우드 네이티브(CloudNative) 환경의 마이크로 서비스 아키텍처(MSA) 기반 사스(SaaS) 생산관리시스템(MES)", "응용프로그램 · 산업용 S/W", "2024-01-25", "2024-04-04"),
    ("copyright2.png", "그로우톡", "응용프로그램 · 고객관계관리(CRM) S/W", "2025-09-25", "2025-10-20"),
    ("copyright3.png", "AI 하이브리드 LLM 기반 클라우드 MES 와 탄소절감형 제조매칭플랫폼 통합 연계 시스템", "응용프로그램 · 사무관리", "2025-12-31", "2026-03-04"),
    ("copyright4.png", "차량관제 및 관리 시스템", "응용프로그램 · 지리정보시스템(GIS) S/W", "2024-04-01", "2024-05-02"),
    ("copyright5.png", "마이크로 서비스 아키텍처(MSA) 기반 제조 입찰 플랫폼", "응용프로그램 · 산업용 S/W", "2024-01-25", "2024-04-04"),
]

# (과제명, 시작 YY.MM, 끝 YY.MM, 구분)
PORTFOLIO = [
    ("화장품 디지털 제조, 연구 R&D-제조 연계 및 자율제어 시스템", "25.10", "26.07", "부처협업형(중간2)"),
    ("AI 하이브리드 LLM 기반 클라우드 MES와 탄소절감형 제조매칭플랫폼 통합 연계", "25.05", "25.11", "경기도형 스마트공장 공급기술 상용화"),
    ("클라우드형 제조기업 도면인식 및 데이터 처리 자동화 AI 엔진 고도화", "25.10", "25.12", "한양대학교 R&D"),
    ("클라우드형 제조기업 도면인식 및 데이터 처리 자동화 AI 엔진 개발", "25.05", "25.10", "안산스마트허브 기술혁신"),
    ("고객/상담원 다자간 채팅 상담 솔루션", "25.07", "25.12", "자체"),
    ("설계·협업 · 제조 프로젝트 관리", "24.09", "25.05", "대중소 상생형"),
    ("다품종 소량의 샘플 PCB 생산에 대한 생산계획 최적화시스템 구축 및 레거시 시스템 통합 연계", "24.06", "24.11", "안산스마트공장 보급"),
    ("주문제작에 대한 내·외부 진행 일정 및 원가 관리 시스템 구축", "24.06", "24.11", "안산스마트공장 보급"),
    ("수주 및 프로젝트 관리 시스템(PMS) 구축", "24.06", "24.11", "안산스마트공장 보급"),
]

# (연도, 제목, 부연). 순서 = 화면 순서. 부연이 빈 것은 회사가 알려 줘야 채운다.
HISTORY = [
    ("2026", "소상공인 AI 활용지원 사업 전문 AI 멘토 기업 선정", ""),
    ("2026", "AI 바우처 선정", ""),
    ("2026", "클라우드 바우처 선정", ""),
    ("2026", "S 바우처 재선정", ""),
    ("2025", "S 바우처 선정", ""),
    ("2025", "제조 AI 솔루션 100선 선정", ""),
    ("2025", "ISO 9001 / ISO 14001 인증", "품질경영시스템(9001)과 환경경영시스템(14001) 국제 규격 인증"),
    ("2025", "클라우드 서비스 적격 평가 인증", ""),
    ("2025", "AI V&V AI 성능 시험", ""),
    ("2025", "한양대학교 ERICA 스마트융합공학부 MOU 체결", "디알밸류가 자리한 한양대학교 ERICA 캠퍼스와의 산학 협력"),
    ("2025", "중소기업벤처부 통합 기술보호지원 자문 진행", ""),
    ("2024", "기업부설연구소 설립", ""),
    ("2024", "디알밸류 법인 설립", "한양대학교 ERICA 창업보육센터에서 시작 · 사업자등록번호 491-87-02850"),
]


def yymm(v: str) -> str:
    """'25.10' → '2025-10-01'. 표에는 월까지만 있어 1일로 둔다. 화면이 다시 YY.MM 으로 그린다."""
    yy, mm = v.split(".")
    return f"20{yy}-{mm}-01"


def upload(d: Directus, path: Path, title: str, dry: bool) -> str | None:
    """같은 이름의 파일이 있으면 그것을 쓴다. 없으면 올린다."""
    st, res = d.request("GET", f"/files?filter[filename_download][_eq]={path.name}&limit=1&fields=id")
    if st == 200 and res.get("data"):
        return res["data"][0]["id"]
    if dry:
        return "(dry-run)"
    boundary = uuid.uuid4().hex
    ctype = mimetypes.guess_type(path.name)[0] or "application/octet-stream"
    body = (
        f"--{boundary}\r\nContent-Disposition: form-data; name=\"title\"\r\n\r\n{title}\r\n"
        f"--{boundary}\r\nContent-Disposition: form-data; name=\"file\"; filename=\"{path.name}\"\r\n"
        f"Content-Type: {ctype}\r\n\r\n"
    ).encode() + path.read_bytes() + f"\r\n--{boundary}--\r\n".encode()
    req = urllib.request.Request(f"{d.base}/files", data=body, method="POST")
    req.add_header("Content-Type", f"multipart/form-data; boundary={boundary}")
    req.add_header("Authorization", f"Bearer {d.token}")
    with urllib.request.urlopen(req, timeout=120) as r:
        return json.loads(r.read())["data"]["id"]


def main() -> None:
    dry = "--dry-run" in sys.argv
    d = Directus()
    d.login()
    made, skipped, failed = [], 0, []

    def once(slug: str, payload: dict, label: str) -> None:
        nonlocal skipped
        st, res = d.request("GET", f"/items/posts?filter[slug][_eq]={slug}&limit=1&fields=id")
        if st != 200:
            failed.append(f"{label} 조회: HTTP {st} {res}")
            return
        if res.get("data"):
            skipped += 1
            return
        if dry:
            made.append(f"(dry) {label}")
            return
        st, res = d.request("POST", "/items/posts", payload)
        if st == 200:
            made.append(label)
        else:
            failed.append(f"{label}: HTTP {st} {res}")

    def ko(title: str, **extra) -> list[dict]:
        return [{"languages_code": "ko-KR", "title": title, **extra}]

    for i, (img, title, state, no, date) in enumerate(PATENTS, 1):
        fid = upload(d, IMG / img, f"{title} {'등록' if state == 'registered' else '출원'}증", dry)
        once(f"patent-{i}", {
            "board": "patent", "status": "published", "slug": f"patent-{i}",
            "published_date": date, "sort": i, "thumbnail": fid,
            "cert_state": state, "cert_no": no, "cert_date": date,
            "translations": ko(title),
        }, f"특허 {i}")

    for i, (img, title, kind, made_date, reg_date) in enumerate(COPYRIGHTS, 1):
        fid = upload(d, IMG / img, f"{title} 저작권 등록증", dry)
        once(f"copyright-{i}", {
            "board": "copyright", "status": "published", "slug": f"copyright-{i}",
            "published_date": reg_date, "sort": i, "thumbnail": fid,
            "cert_no": "", "cert_date": reg_date, "cert_made_date": made_date, "cert_kind": kind,
            "translations": ko(title),
        }, f"저작권 {i}")

    for i, (title, start, end, kind) in enumerate(PORTFOLIO, 1):
        once(f"portfolio-{i}", {
            "board": "case", "status": "published", "slug": f"portfolio-{i}",
            "published_date": yymm(start), "sort": i,
            "period_start": yymm(start), "period_end": yymm(end),
            "translations": ko(title, case_category_label=kind),
        }, f"수행실적 {i}")

    for i, (year, title, note) in enumerate(HISTORY, 1):
        once(f"history-{i}", {
            "board": "history", "status": "published", "slug": f"history-{i}",
            "published_date": f"{year}-01-01", "sort": i, "history_year": year,
            "translations": ko(title, summary=note or None),
        }, f"연혁 {year} {title[:12]}")

    print(f"만듦 {len(made)}건, 이미 있음 {skipped}건, 실패 {len(failed)}건")
    for line in made:
        print(f"  + {line}")
    for line in failed:
        print(f"  ! {line}")
    raise SystemExit(1 if failed else 0)


if __name__ == "__main__":
    main()
