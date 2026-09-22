# 돌리는 법

## 처음 한 번 (로컬 개발)

환경변수는 **루트 `.env` 하나**다. 이름과 뜻은 `.env.example` 이 정본이다. 로컬 실행은 각 패키지가
`../.env` 를 읽는다. 스크립트를 돌리기 전에 루트에서 `set -a; . .env; set +a` 로 올린다.

```bash
cp .env.example .env
# DB_PASSWORD · ADMIN_SESSION_SECRET(openssl rand -hex 32) 를 채우고, 로컬 개발 두 줄을 넣는다:
#   COMPOSE_FILE=docker-compose.yml:docker-compose.dev.yml   ← db 컨테이너 + 개발용 포트(3330 · 3500)
#   WEB_PORT=3410                                            ← 3400 이 비어 있으면 빼도 된다
docker compose up -d --build        # db · api · web. web → http://localhost:3410 (127.0.0.1 에만)
```

- **스키마는 api 가 뜰 때 맞춘다**(`api/src/common/database/migrate.ts`). 빈 DB 면 `db/schema.sql`,
  그다음 `schema_migrations` 에 없는 `db/migrations/*.sql` 만 차례로(파일마다 한 트랜잭션). 하나라도
  실패하면 api 가 안 뜬다. 손으로 psql 을 돌리지 않는다. 컨테이너 밖에서 돌리려면
  `cd api && npm run build && node --env-file=../.env dist/common/database/migrate.js`.
- **컨테이너 없이** api·web 을 띄우려면 `cd api && npm ci && npm run build && node --env-file=../.env dist/main.js`,
  `cd web && npm ci && npm run build && npm start`.
- 업로드 파일은 저장소의 `data/uploads`(gitignore)를 api 컨테이너 `/data/uploads` 에 물린다.
- **web 의 `/api` 프록시 주소는 빌드 때 굳는다.** compose 가 빌드 인자로 `http://api:3500` 을 넘긴다.
  실행 환경에서 `API_ORIGIN` 만 바꾸면 프록시는 안 바뀐다 — 다시 빌드한다.
- `api` 는 `ADMIN_SESSION_SECRET` 이 비면 **안 뜬다.**

## 관리 화면에 들어가기

`http://localhost:3400/admin` → 버튼 하나 「사내 IAM 으로 로그인」. 콜백
`ADMIN_IAM_CALLBACK_URL` 은 **화면을 여는 그 주소(origin)** 여야 세션 쿠키가
거기 떨어진다. IAM 화이트리스트에 같은 값이 있어야 한다.

입장은 **사내 IAM 이 정한다**(결정 0015). 토큰 최상위 `role` 이 `ADMIN`·`PLATFORM_ADMIN` 인
계정만 들어온다. 관리자로 들어오면 `admin_users` 에 받아 적힌다(처음이면 범위 「전체 권한」).
관리 화면 「권한」에서는 사람을 넣거나 빼지 않고 **범위만** 바꾼다(전체 권한 · 마케팅 · 인사).
사람을 관리자로 만들거나 내리는 것은 IAM 에서 한다.

거부되면 로그인 화면에 안내 상자가 뜬다(`/admin/login?error=<코드>`). `api` 로그에는
`denied: IAM 관리자가 아니다 role=… groups=[…]` 한 줄이 남는다 — 그 계정의 IAM 최상위
`role` 을 IAM 에서 확인한다. 들어온 사람은 `admin login iamRole=… scope=…` 로 남는다.

## 원본 PHP 를 로컬에 띄우기 (대조 검사용)

원본과 비교하는 검사들은 PHP 가 `:3300` 에 떠 있어야 한다. 도커가 안 뜨면
운영본을 원본 삼아 돌린다 — 읽기만 한다.

```bash
PHP_ORIGIN=https://drvalue.co.kr bash web/scripts/compare-all.sh
```

## 매번 돌리는 검사

```bash
cd api  && npm run typecheck && npm run build
        && node --test src/common/typeorm/transactional.test.mjs src/core/admin-auth/service/authorize.test.mjs src/core/admin-user/service/last-admin.test.mjs src/core/page/service/page-content.test.mjs src/common/html/sanitize-body.test.mjs   # 43 (6 + 9 + 5 + 16 + 7)
        && bash scripts/verify.sh                # 331 통과 · 판정불가 1  (api:3500 + DB, .env 의 ADMIN_SESSION_SECRET 으로 세션을 만든다)
        && python3 scripts/check-pattern.py      # 모듈 모양 문제 0 (서버 없이 돈다)
cd web  && python3 scripts/check-src.py          # 제일 먼저
        && python3 scripts/check-copy.py         # 화면으로 가는 문구의 반말 0건 (서버 없이 돈다)
        && python3 scripts/check-types.py        # 생성 형이 api 와 같은가 — 낡은 것 0 (api 를 빌드한다, 서버·DB 없이)
        && npx tsc --noEmit && npx next build
        && python3 scripts/check-home.py         # 23/23  (:3400 필요 — 다른 포트는 NEXT_ORIGIN)
        && python3 scripts/check-header.py       # 107/107
        && python3 scripts/check-a11y.py         # 323/323 (문의 모달 다섯 칸)
        && python3 scripts/check-assets.py       # 빠진 것 0
        && NEXT_ORIGIN=http://localhost:3400 python3 scripts/check-pages.py   # 110/110
```

verify.sh 의 판정불가 1건은 「마지막 전체 권한을 내리면 409」다 — 실제 사람을 꺼야 잴 수 있어서
`last-admin.test.mjs` 가 규칙을 본다.

속도 제한 검사는 기본이 꺼짐이다. `RL_CHECK=1 bash api/scripts/verify.sh`
로 켠다. 켜면 창을 태워서 1분 안의 재실행을 막는다.

## 환경변수

루트 `.env` 하나. 정본은 `.env.example`. 운영은 DB 가 컨테이너 밖(관리형)이라 **DB 연결 다섯 개**가 늘었다(2026-09-23).
api 쪽을 읽는 곳은 `api/src/common/config/app-config.ts` 하나다. 나머지는 코드 상수이거나
`docker-compose.yml` 이 컨테이너끼리 잇는 배선이다.

| 이름 | 뜻 | 비우면 |
|---|---|---|
| `DB_HOST` · `DB_PORT` · `DB_NAME` · `DB_USER` · `DB_PASSWORD` | DB 연결. 운영은 iwinv 관리형 PostgreSQL 값. 로컬 개발은 `DB_PASSWORD` 만 — 나머지는 dev compose 가 `db` 컨테이너로 넣는다 | api 가 DB 에 못 붙어 **안 뜬다**(migrate 실패). 로컬 개발은 dev compose 가 `DB_PASSWORD` 없이 **안 띄운다** |
| `DB_SSL` (선택) | `require` 면 TLS 로 붙는다(인증서 검증 안 함) | 평문 |
| `WEB_PORT` (선택) | web 을 여는 호스트 포트(127.0.0.1 에만) | 3400 |
| `COMPOSE_FILE` (로컬만) | `docker-compose.yml:docker-compose.dev.yml` — db 컨테이너 + 개발용 포트 | 운영 모양(web·api 둘, api 포트 없음) |
| `ADMIN_SESSION_SECRET` | 관리 화면 로그인 쿠키(`dv_admin`) 서명 키. SSE 와 무관하다 — 이 값을 아는 사람은 관리자 쿠키를 만들 수 있다 | api 가 **안 뜬다** |
| `ADMIN_IAM_CALLBACK_URL` | IAM 이 로그인 뒤 돌려보낼 주소. IAM 화이트리스트와 같아야 한다. `https` 면 쿠키에 Secure | 로그인 버튼이 로그인 화면으로 돌아와 「로그인 설정이 끝나지 않았습니다.」(`ADMIN_AUTH_NOT_CONFIGURED`) |
| `NCP_ACCESS_KEY` · `NCP_SECRET_KEY` · `NCP_MAIL_SENDER_ADDRESS` · `NCP_MAIL_TO` | 문의 메일(네이버 클라우드) | 메일만 안 간다. 문의는 DB 에 남는다 |
| `NEXT_PUBLIC_GTM_ID` (선택) | 방문 통계 GTM id. web **빌드 인자**(compose 가 넘긴다) — 번들에 굳는다. 운영은 `GTM-NLL3QGRF`. 동의(Consent Mode v2)는 기본 거부, 방문자가 「동의」해야 analytics 만 켜진다. 미리보기(`NOINDEX=1`)는 값이 있어도 안 싣는다 | GTM·동의 창이 **안 실린다**(닫힌 쪽). 전에는 코드에 박혀 있어 미리보기도 운영 GTM 에 기록을 보냈다 |

compose 가 넣는 배선: `UPLOADS_DIR=/data/uploads` · `TRUST_PROXY=1` · `PORT=3500` · web 의
`API_ORIGIN=http://api:3500`(실행 환경 **과** 빌드 인자 — `/api` 프록시는 빌드 때 굳는다). 로컬 개발은
dev compose 가 `DB_HOST=db` · `DB_PORT=5432` · `DB_NAME=drvalue_cms` · `DB_USER=drvalue` 를 넣는다.
컨테이너 밖 기본값은 `localhost:3330` · 저장소 `data/uploads` · `http://localhost:3500`.
`NOINDEX` 는 미리보기 빌드 인자로 compose 에만 있다.

`TRUST_PROXY` 는 홉 수(`1`)다. Nest 가 숫자로 바꿔 넘긴다 — 문자열 `"1"` 은 IP
`0.0.0.1` 하나를 믿는 목록으로 읽힌다.

### 2026-09-22 에 없앤 키

| 없어진 키 | 왜 |
|---|---|
| `IAM_GATEWAY_SECRET` · `IAM_ENFORCE_GATEWAY` | 게이트웨이 서명. 이 api 는 게이트웨이 뒤가 아니다 — 지키는 경로 0 |
| `ADMIN_IAM_GROUP` · `ADMIN_IAM_GROUP_ROLES` | 입장은 토큰 최상위 `role` 로 정한다. IAM 개인 「Default」 그룹은 누구에게나 있어 위험하다 |
| `ADMIN_COOKIE_SECURE` | 콜백 주소가 https 인지로 정한다 |
| `CMS_ADMIN_URL` | 관리 화면은 항상 같은 사이트의 `/admin` |
| `ADMIN_API_TOKEN` | IAM 을 안 거치는 문은 없다. verify.sh 는 같은 서명 키로 세션을 만들어 들어간다 |
| `IAM_INTERNAL_API_BASE_URL` · `INTERNAL_API_KEY` | Doppler 를 안 쓴다. IAM `enabled` 재검은 없다 |
| `ADMIN_IAM_BASE` | 상수 `https://iam.drvalue.co.kr` |
| `ADMIN_MAX_DB_HOST` · `_PORT` · `_NAME` · `_USER` · `_PASSWORD` · `ADMIN_MAX_TENANT_CODE` · `ADMIN_MAX_DB_URL` | nxcms root 표 대조를 없앴다. IAM 이 관리자를 정한다(결정 0015) — 첫 로그인 자동 등록도 없다 |
| `UPLOADS_DIR` · `API_ORIGIN` · `TRUST_PROXY` | compose 가 넣는 배선. (`DB_*` 는 2026-09-23 에 되살렸다 — 운영 DB 가 컨테이너 밖이다) |
| `SITE_ORIGIN` · `DEFAULT_LANGUAGE` · `NCP_MAIL_API_URL` · `MAIL_RL_PER_MINUTE` · `MAIL_RL_PER_HOUR` | 코드 상수 — `drvalue.co.kr` · `ko-KR` · NCP 주소 · 분 5 / 시 30 |
| `NOINDEX` | 미리보기 빌드 인자. compose 에만 |
| `DB_LOGGING` | 쓰지 않는다 |

## 새 서버 배포

깃허브의 이 저장소를 서버가 받아 docker 로 띄운다. 옛 배포(저장소를 PHP 웹 루트로 rsync 하는
GitHub Actions 「Deploy (SSH)」)는 버렸다.

**모양 (iwinv, 2026-09-23 콘솔에서 확인)**

| 무엇 | 값 |
|---|---|
| 서버 | `drvalue-main-page` · Ubuntu 26.04 · 공인 115.68.224.135 · 사설 10.2.2.230 · 로드밸런서·NAT 없음 |
| DB | iwinv 관리형 PostgreSQL 10 `drvalue-main-page` · 도메인 `drvaluehome.sldb.iwinv.net` · 접속 허용 IP 에 서버 공인 IP 가 있다 |
| 컨테이너 | 둘 — web(Next) · api(Nest). DB 는 컨테이너 밖 |
| 앞단 | 서버의 nginx(`deploy/nginx-drvalue.conf`) + certbot. 443 만 연다 |

**처음 한 번 (서버에서)**

```bash
# 1. docker(공식 설치 — compose 의 추가 빌드 문맥에 buildx 가 필요하다) · nginx · certbot
curl -fsSL https://get.docker.com | sudo sh
sudo apt-get install -y nginx certbot python3-certbot-nginx git
docker compose version && docker buildx version

# 2. 저장소와 .env
git clone <저장소> /srv/drvalue && cd /srv/drvalue
cp .env.example .env && chmod 600 .env
#   DB_HOST=drvaluehome.sldb.iwinv.net · DB_PORT · DB_NAME · DB_USER · DB_PASSWORD  (iwinv 콘솔의 값)
#   ADMIN_SESSION_SECRET=$(openssl rand -hex 32)           ← 로컬 값을 쓰지 않는다
#   ADMIN_IAM_CALLBACK_URL=https://drvalue.co.kr/api/admin/auth/callback   ← IAM 화이트리스트에도
#   NCP_ACCESS_KEY · NCP_SECRET_KEY · NCP_MAIL_SENDER_ADDRESS · NCP_MAIL_TO   ← 비면 문의 메일이 안 간다
#   NEXT_PUBLIC_GTM_ID=GTM-NLL3QGRF                        ← 비면 방문 통계가 꺼진다
#   COMPOSE_FILE 은 넣지 않는다(개발용 포트·DB 컨테이너가 얹힌다)

# 3. 업로드 폴더(api 컨테이너 사용자 uid 100 · gid 101 이 쓴다)
mkdir -p data/uploads && sudo chown -R 100:101 data/uploads

# 4. 띄운다 — api 가 뜰 때 빈 DB 에 스키마와 마이그레이션을 깐다(로그의 migrate: 줄)
docker compose up -d --build
docker compose ps                      # api·web healthy, web 은 127.0.0.1:3400 에만
docker logs drvalue_api | grep migrate

# 5. 앞단
sudo cp deploy/nginx-drvalue.conf /etc/nginx/sites-available/drvalue
sudo ln -s /etc/nginx/sites-available/drvalue /etc/nginx/sites-enabled/drvalue
sudo certbot --nginx -d drvalue.co.kr -d www.drvalue.co.kr
sudo nginx -t && sudo systemctl reload nginx
```

**콘텐츠 옮기기 (지금 로컬에 있는 글·페이지·메뉴를 운영으로)** — 4 뒤에 한 번.

```bash
# 원본(로컬 개발 DB) → 대상(관리형 DB). 먼저 보기만, 그다음 --apply.
SRC_HOST=… SRC_PORT=3330 SRC_DB=drvalue_cms SRC_USER=drvalue SRC_PASSWORD=… \
DST_HOST=drvaluehome.sldb.iwinv.net DST_PORT=… DST_DB=… DST_USER=… DST_PASSWORD=… \
bash deploy/copy-content.sh [--apply]
# 파일 본체: 로컬 data/uploads/ → 서버 /srv/drvalue/data/uploads/ (scp·rsync), 그 뒤 chown 100:101
```

옮기는 것은 글·번역·첨부·파일 정보·언어·페이지 글·메인 배너·팝업·메뉴·정적 장 검색 정보다. 관리자 계정·
변경 이력·문의와 옛 Directus 표(비밀번호 해시가 든 `directus_users` 포함)는 옮기지 않는다. 대상 DB 는
관리형이라 접속 허용 IP 에 명령을 돌리는 곳의 공인 IP 가 있어야 한다.

**다음부터 (고친 것을 올릴 때)**

```bash
cd /srv/drvalue && git pull && docker compose up -d --build
```

**지켜야 하는 것**

- **밖에 여는 것은 443(과 80 → 443 넘김)뿐이다.** web 은 127.0.0.1:3400, api 는 포트를 안 낸다. iwinv 방화벽
  (ELCAP)을 서버에 붙여 22(사무실 IP 만) · 80 · 443 만 연다 — 2026-09-23 에 이 서버 이름의 방화벽 규칙이 목록에 없었다.
- **nginx 는 `X-Forwarded-For` 를 접속 IP 로 덮어쓴다**(`$remote_addr`). 덧붙이기(`$proxy_add_x_forwarded_for`)면
  방문자가 보낸 가짜 IP 가 남아 문의 속도 제한이 우회된다. 리허설(nginx 컨테이너 + 운영 compose)에서 가짜 IP 를
  매번 바꿔 6번 보내면 6번째가 429 — 앞단 없이 web 이나 api 에 바로 닿으면 6번 모두 통과했다.
- 업로드는 영상 200MB 까지 — nginx `client_max_body_size 210m`.
- DB 백업: 관리형 DB 의 백업 설정을 켠다(iwinv 콘솔). 업로드 폴더는 서버 백업에 넣는다.

**배포 전에 사람이 할 것**

1. IAM 화이트리스트에 `https://drvalue.co.kr/api/admin/auth/callback`.
2. 도메인 DNS 를 115.68.224.135 로(iwinv DNS 상품은 안 쓰고 있다 — 도메인을 산 곳에서).
3. GrowChat(상담 위젯)은 도메인 잠금이다 — 새 주소면 GrowChat 쪽에 등록.

## 게시판 글 옮기기

옛 게시판의 글을 옮기는 스크립트는 관리 도구와 함께 없어졌다. 전환 당일에
옮길 글이 있으면 `/admin` 에서 넣거나 `POST /api/admin/posts` 를 쓴다.

## 새 주소에 올릴 때 챙길 것

우하단 상담 위젯은 **도메인 잠금**이다. 새 주소를 GrowChat 쪽에 등록하지
않으면 위젯이 **조용히** 안 뜬다. 오류도 안 난다.

관리 화면 콜백 주소도 새 주소로 IAM 화이트리스트에 올려야 한다.
