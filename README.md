# 디알밸류 홈페이지 (drvalue.co.kr)

제조 현장용 시스템(M.AX · AI솔루션)을 파는 회사의 공개 사이트와 그 관리 화면. 화면의 목적은 하나 — **문의를 받는 것**.
옛 PHP 사이트를 대체했다. 2026-09-22 개인 작업 저장소에서 이관본만 옮겨 왔다(옛 이력에 개인정보가 든 그림이 있어 이력은 안 옮겼다).

```
web/     Next 16   공개 화면 + 관리 화면(/admin). 옛 .php 주소는 308 로 새 주소에 넘긴다
api/     Nest      콘텐츠 API · 관리 API(/api/admin) · 사내 IAM 로그인 · 문의 메일 · IndexNow. TypeORM 으로 DB 직결
db/      postgres  schema.sql(처음 까는 곳) + migrations/(api 가 뜰 때 자동으로 돈다)
deploy/            nginx 설정 · 콘텐츠 옮기기 스크립트
docs/              규칙 · 함정 · 운영 · 결정 기록 (아래 「문서 지도」)
```

## 로컬에서 띄우기

환경변수는 **루트 `.env` 하나**다. 이름과 뜻은 `.env.example` 이 정본이다.

```bash
cp .env.example .env
#  DB_PASSWORD · ADMIN_SESSION_SECRET(openssl rand -hex 32) 를 채우고 로컬 개발용 두 줄:
#    COMPOSE_FILE=docker-compose.yml:docker-compose.dev.yml   ← db 컨테이너 + 개발용 포트(db 3330 · api 3500)
#    WEB_PORT=3410                                            ← 3400 이 비어 있으면 빼도 된다
docker compose up -d --build        # db · api · web 한 번에 → http://localhost:3410
```

화면을 고치며 볼 때는 web 만 개발 서버로 띄운다(고치면 바로 반영):

```bash
docker compose up -d db api                                  # db · api 는 컨테이너
cd web && API_ORIGIN=http://localhost:3500 npx next dev -p 3420   # → http://localhost:3420
```

- 스키마·마이그레이션은 **api 가 뜰 때 맞춘다**. 손으로 psql 을 돌리지 않는다.
- api 는 `ADMIN_SESSION_SECRET` 이 비면 일부러 안 뜬다.
- 관리 화면 로그인 콜백 `ADMIN_IAM_CALLBACK_URL` 은 **화면을 여는 주소(포트까지)** 와 같아야 한다(IAM 허용 목록에도).
- 개발 서버는 `web/next-env.d.ts` 를 `.next/dev/…` 경로로 바꾼다 — 커밋하지 않는다(`git restore web/next-env.d.ts`).

자세한 것: `docs/operations.md` 「처음 한 번」.

## 관리 화면 (`/admin`)

사내 IAM 으로만 들어온다(버튼 하나). 입장은 IAM 이 정한다 — 토큰의 `role` 이 `ADMIN`·`PLATFORM_ADMIN` 인 계정만.
범위(전체 권한 · 마케팅 · 인사)는 관리 화면 「권한」에서 바꾼다. 고친 글은 변경 이력에 남아 되돌릴 수 있다.

| 메뉴 | 하는 일 |
|---|---|
| 게시판 9종 | 공지 · 보도 · 뉴스 · 채용 · FAQ · 특허 · 저작권 · 수행실적 · 연혁. 예약 게시, 글별 검색 노출 |
| 운영 | 문의(담당자·메모) · 미디어 · SEO(장별 검색 제목·설명·공유 그림·검색 제외) |
| 사이트 | 메인 화면(문구·배너·팝업) · 페이지(회사·사업·서비스 소개 장의 글) · 메뉴 |
| 관리 | 변경 이력 · 권한 (전체 권한만) |

규칙은 `api/AGENTS.md` 「관리 화면 인가」, 화면은 `web/AGENTS.md` 「관리 화면」.

## 검색 노출 (SEO · GEO)

| 무엇 | 어디 |
|---|---|
| 장·글의 제목·설명·공유 카드·대표 주소 | `web/lib/seo.ts` · 관리 화면 「운영 › SEO」와 글 편집 「검색 노출」 |
| 구조화 데이터(회사 · 사이트 · 위치 줄 · 뉴스 · 채용 · FAQ) | `web/components/OrgJsonLd.tsx` · `JsonLd.tsx` |
| `/robots.txt` — AI 검색용·학습용 크롤러를 나눠 적음 | `web/app/robots.ts` |
| `/sitemap.xml` · `/rss.xml` · `/llms.txt` | `web/app/sitemap.ts` · `rss.xml/route.ts` · `llms.txt/route.ts` |
| 검색엔진 소유 확인 태그(네이버 · 구글 · 빙) | `web/app/(site)/layout.tsx` — `.env` 의 `*_SITE_VERIFICATION` |
| IndexNow — 공개 글·장이 바뀌면 빙·네이버에 알림 | `api/src/common/indexnow/` — `.env` 의 `INDEXNOW_KEY` 가 있을 때만 |

방법론과 근거는 2026-09-28 조사(결정 0018 · `docs/tracking/status.md`).

## 배포

운영 서버는 **`main` 을 받아 docker 로 띄운다.** 작업은 `heysep/<주제>` 가지에서 하고 PR 로 `main` 에 합친다 — `main` 을 직접 고치지 않는다.

```bash
cd /srv/drvalue && git pull && docker compose up -d --build
docker compose ps                         # api · web healthy
docker logs drvalue_api | grep migrate    # 새 마이그레이션이 돌았는지
```

새 서버에 처음 올릴 때(도커·nginx·certbot · `.env` · 업로드 폴더 · 콘텐츠 옮기기 · DNS · IAM 허용 목록 · 상담 위젯 도메인 등록)는
`docs/operations.md` 「새 서버 배포」.

## 검사

고치기 전과 후에 돌린다. **숫자가 줄면 되돌린다**(줄여도 되는 이유가 있으면 스크립트에 적는다).
전체 표와 현재 기준값은 `docs/standards.md` 「검사 통과 기준」이 정본이다.

```bash
cd web
python3 scripts/check-src.py          # 제일 먼저 — 페이지 CSS 문자열이 깨지면 모든 화면이 500
NEXT_ORIGIN=http://localhost:3420 python3 scripts/check-pages.py   # 그 밖의 check-*.py 도 같은 방식
npx tsc --noEmit && npx next build
cd ../api && npm run typecheck && npm run build && bash scripts/verify.sh
```

## 절대 어기지 않는 것

1. `main` 을 고치지 않는다 — 다음 배포에 그대로 서버로 간다.
2. 토큰 · 비밀번호 · 해시를 출력 · 로그 · 문서에 그대로 쓰지 않는다.
3. `img/patent2.png` · `img/patent3.png` 를 `web/public/` 으로 복사하지 않는다(개인정보).
4. 자바스크립트가 꺼진 사람에게 글이 사라지면 안 된다 — 등장 효과는 「보이는 것이 기본」.
5. 페이지 CSS 문자열 안에 역따옴표를 넣지 않는다.

## 문서 지도

| 문서 | 무엇 |
|---|---|
| `CLAUDE.md` · `AGENTS.md` | 개요와 절대 규칙, 무엇을 고치기 전에 무엇을 읽나 |
| `web/AGENTS.md` · `api/AGENTS.md` | 덩어리별 규칙 (주소 체계 · 관리 화면 · 인가 · 속도 제한) |
| `docs/standards.md` | 어겼을 때 깨지는 규칙 전부 · 검사 통과 기준 (정본) |
| `docs/engineering-notes.md` | 모르면 걸리는 함정 (증상 → 원인 → 대응) |
| `docs/operations.md` | 띄우기 · 검사 명령 · 환경변수 · 배포 |
| `docs/architecture.md` · `docs/contracts.md` | 무엇이 무엇을 부르나 · 바깥이 부르는 HTTP 약속 |
| `docs/business-rules.md` | 문의 · 게시판 규칙, 화면에 적는 숫자와 글의 기준 |
| `docs/tracking/status.md` · `decisions/` | 지금 어디까지 왔나 · 다르게 정할 수도 있었던 것들 |
| `docs/tracking/readme-notes-2026-09.md` | 옛 README 의 「왜 이렇게 했나」 기록(이관 시기, 그대로 옮김) |
| `docs/security.md` · `docs/tracking/findings.md` | **저장소에 없다**(열린 구멍이 적힌다). 작업자에게 사본을 받는다 |
