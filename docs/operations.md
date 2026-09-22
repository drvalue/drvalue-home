# 돌리는 법

## 처음 한 번

환경변수는 **루트 `.env` 하나**다. 컨테이너는 `docker-compose.yml` 이 넘기고,
로컬 실행은 각 패키지가 `../.env` 를 읽는다. 스크립트를 돌리기 전에 루트에서
`set -a; . .env; set +a` 로 올린다. 이름과 뜻은 `.env.example` 이 정본이다.

```bash
cp .env.example .env          # DB_PASSWORD · ADMIN_SESSION_SECRET(openssl rand -hex 32) 를 채운다
set -a; . .env; set +a

# 1. DB. 제일 먼저다 — api 가 뜰 때 DB 를 찾는다.
docker compose up -d db       # → localhost:3330

# 2. 처음 까는 곳이면 테이블을 만든다. 이미 데이터가 있는 볼륨이면 schema.sql 은 건너뛴다.
#    마이그레이션은 여러 번 돌려도 같다 — 기존 볼륨에도 돌린다.
docker exec -i drvalue_directus_pg psql -U drvalue -d drvalue_cms < db/schema.sql
docker exec -i drvalue_directus_pg psql -U drvalue -d drvalue_cms -v ON_ERROR_STOP=1 < db/migrations/0001-admin-foundation.sql
docker exec -i drvalue_directus_pg psql -U drvalue -d drvalue_cms -v ON_ERROR_STOP=1 < db/migrations/0002-admin-users-iam-sync.sql
docker exec -i drvalue_directus_pg psql -U drvalue -d drvalue_cms -v ON_ERROR_STOP=1 < db/migrations/0003-posts-files-fk.sql
docker exec -i drvalue_directus_pg psql -U drvalue -d drvalue_cms -v ON_ERROR_STOP=1 < db/migrations/0004-page-contents.sql
docker exec -i drvalue_directus_pg psql -U drvalue -d drvalue_cms -v ON_ERROR_STOP=1 < db/migrations/0005-home.sql
docker exec -i drvalue_directus_pg psql -U drvalue -d drvalue_cms -v ON_ERROR_STOP=1 < db/migrations/0006-menu.sql
docker exec -i drvalue_directus_pg psql -U drvalue -d drvalue_cms -v ON_ERROR_STOP=1 < db/migrations/0007-seo.sql
docker exec -i drvalue_directus_pg psql -U drvalue -d drvalue_cms -v ON_ERROR_STOP=1 < db/migrations/0008-intro-pages-seed.sql
# 0009 는 web 이 메뉴 자리표시를 채우게 된 뒤에 돈다 — 옛 web 에 먼저 돌리면 머리글에 {case} 가 그대로 보인다.
docker exec -i drvalue_directus_pg psql -U drvalue -d drvalue_cms -v ON_ERROR_STOP=1 < db/migrations/0009-menu-count-tokens.sql

# 3. 백엔드
cd api
npm ci && npm run build && node dist/main.js     # → http://localhost:3500

# 4. 화면 (공개 + /admin)
cd ../web
npm ci && npm run build && npm start             # → http://localhost:3400
```

도커로 셋 다(db · api · web) 띄우면 `docker compose up -d --build`. 업로드 파일은 저장소의
`data/uploads`(gitignore) 를 컨테이너 `/data/uploads` 에 물린다 — 호스트에서
돌리는 로컬 Nest 와 같은 폴더다.

- **web 호스트 포트는 `WEB_PORT`** 로 바꾼다(기본 3400). 3400 을 다른 체크아웃이 쓰고 있으면
  `WEB_PORT=3410 docker compose up -d --build`. 그때는 `.env` 의 `ADMIN_IAM_CALLBACK_URL` 도
  `http://localhost:3410/api/admin/auth/callback` 으로 둔다 — 쿠키는 화면을 연 origin 에 떨어진다.
- **web 의 `/api` 프록시 주소는 빌드 때 굳는다.** `next.config.mjs` 의 rewrites 가 빌드 시점의
  `API_ORIGIN` 을 쓴다. compose 가 빌드 인자로 `http://api:3500` 을 넘긴다(`web/Dockerfile` 의
  `ARG API_ORIGIN`). 실행 환경에서 `API_ORIGIN` 만 바꾸면 프록시는 안 바뀐다 — 다시 빌드한다.
  빌드 인자 없이 만든 이미지는 컨테이너 안 `localhost:3500` 으로 보내 관리 화면이 전부 500 이다.
  (서버 컴포넌트의 `lib/cms.ts` · `app/home/news.ts` 는 실행 때 읽는다.)

`api` 는 `ADMIN_SESSION_SECRET` 이 비면 **안 뜬다.** compose 는 `DB_PASSWORD` 가 비면
**안 띄운다.**

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
        && node --test src/common/typeorm/transactional.test.mjs src/core/admin-auth/service/authorize.test.mjs src/core/admin-user/service/last-admin.test.mjs src/core/page/service/page-content.test.mjs   # 36 (6 + 9 + 5 + 16)
        && bash scripts/verify.sh                # 282 통과 · 판정불가 1  (api:3500 + DB, .env 의 ADMIN_SESSION_SECRET 으로 세션을 만든다)
cd web  && python3 scripts/check-src.py          # 제일 먼저
        && python3 scripts/check-copy.py         # 화면으로 가는 문구의 반말 0건 (서버 없이 돈다)
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

루트 `.env` 하나. 정본은 `.env.example` — **필수 일곱 개 + 선택 하나**(`NEXT_PUBLIC_GTM_ID`)다.
api 쪽을 읽는 곳은 `api/src/common/config/app-config.ts` 하나다. 나머지는 코드 상수이거나
`docker-compose.yml` 이 컨테이너끼리 잇는 배선이다.

| 이름 | 뜻 | 비우면 |
|---|---|---|
| `DB_PASSWORD` | postgres 비밀번호. compose 가 이 값으로 DB 를 만들고 api 가 이 값으로 붙는다 | compose 가 **안 띄운다** |
| `ADMIN_SESSION_SECRET` | 관리 화면 로그인 쿠키(`dv_admin`) 서명 키. SSE 와 무관하다 — 이 값을 아는 사람은 관리자 쿠키를 만들 수 있다 | api 가 **안 뜬다** |
| `ADMIN_IAM_CALLBACK_URL` | IAM 이 로그인 뒤 돌려보낼 주소. IAM 화이트리스트와 같아야 한다. `https` 면 쿠키에 Secure | 로그인 버튼이 로그인 화면으로 돌아와 「로그인 설정이 끝나지 않았습니다.」(`ADMIN_AUTH_NOT_CONFIGURED`) |
| `NCP_ACCESS_KEY` · `NCP_SECRET_KEY` · `NCP_MAIL_SENDER_ADDRESS` · `NCP_MAIL_TO` | 문의 메일(네이버 클라우드) | 메일만 안 간다. 문의는 DB 에 남는다 |
| `NEXT_PUBLIC_GTM_ID` (선택) | 방문 통계 GTM id. web **빌드 인자**(compose 가 넘긴다) — 번들에 굳는다. 운영은 `GTM-NLL3QGRF`. 동의(Consent Mode v2)는 기본 거부, 방문자가 「동의」해야 analytics 만 켜진다. 미리보기(`NOINDEX=1`)는 값이 있어도 안 싣는다 | GTM·동의 창이 **안 실린다**(닫힌 쪽). 전에는 코드에 박혀 있어 미리보기도 운영 GTM 에 기록을 보냈다 |

compose 가 넣는 배선: `DB_HOST=db` · `DB_PORT=5432` · `UPLOADS_DIR=/data/uploads` ·
`TRUST_PROXY=1` · `PORT=3500` · web 의 `API_ORIGIN=http://api:3500`(실행 환경 **과** 빌드 인자 —
`/api` 프록시는 빌드 때 굳는다). 로컬 기본값은 `localhost:3330` · 저장소 `data/uploads` ·
`http://localhost:3500`. `NOINDEX` 는 미리보기 빌드 인자로 compose 에만 있다. `WEB_PORT` 는
compose 를 부르는 셸 값(web 호스트 포트, 기본 3400)이라 `.env.example` 에 없다.

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
| `DB_HOST` · `DB_PORT` · `DB_NAME` · `DB_USER` · `UPLOADS_DIR` · `API_ORIGIN` · `TRUST_PROXY` | compose 가 컨테이너끼리 잇는 배선. 로컬 기본값은 `localhost:3330` · 저장소 `data/uploads` · `localhost:3500` |
| `SITE_ORIGIN` · `DEFAULT_LANGUAGE` · `NCP_MAIL_API_URL` · `MAIL_RL_PER_MINUTE` · `MAIL_RL_PER_HOUR` | 코드 상수 — `drvalue.co.kr` · `ko-KR` · NCP 주소 · 분 5 / 시 30 |
| `NOINDEX` | 미리보기 빌드 인자. compose 에만 |
| `DB_LOGGING` | 쓰지 않는다 |

## 운영 배포

GitHub Actions 의 **Deploy (SSH)** 를 사람이 수동 실행한다. 저장소 전체를
웹 루트로 `rsync` 한다(`.git`·`.github` 제외).

필요한 저장소 비밀값: `SSH_PRIVATE_KEY` · `SSH_HOST` · `SSH_USER` ·
`SSH_DEPLOY_PATH` · (조건부) `SSH_KEY_PASSPHRASE` · (선택) `SSH_KNOWN_HOSTS`.

배포 워크플로는 이 저장소에 없다. 있는 곳에서 `NOTIFY_*` 비밀값과
`notice_config.php` 를 만드는 단계를 뺀다.

**`rsync` 에 `--delete` 가 없다.** 저장소에서 지운 파일은 서버에 그대로
남는다. 서버 파일을 없애려면 서버에서 직접 지운다.

## 게시판 글 옮기기

옛 게시판의 글을 옮기는 스크립트는 관리 도구와 함께 없어졌다. 전환 당일에
옮길 글이 있으면 `/admin` 에서 넣거나 `POST /api/admin/posts` 를 쓴다.

## 새 주소에 올릴 때 챙길 것

우하단 상담 위젯은 **도메인 잠금**이다. 새 주소를 GrowChat 쪽에 등록하지
않으면 위젯이 **조용히** 안 뜬다. 오류도 안 난다.

관리 화면 콜백 주소도 새 주소로 IAM 화이트리스트에 올려야 한다.
