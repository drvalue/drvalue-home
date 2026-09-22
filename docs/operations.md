# 돌리는 법

## 처음 한 번

환경변수는 **루트 `.env` 하나**다. 컨테이너는 `docker-compose.yml` 이 넘기고,
로컬 실행은 각 패키지가 `../.env` 를 읽는다. 스크립트를 돌리기 전에 루트에서
`set -a; . .env; set +a` 로 올린다. 이름과 뜻은 `.env.example` 이 정본이다.

```bash
cp .env.example .env          # ADMIN_SESSION_SECRET 을 openssl rand -hex 32 로, DB_PASSWORD 를 채운다
set -a; . .env; set +a

# 1. DB. 제일 먼저다 — api 가 뜰 때 DB 를 찾는다.
docker compose up -d db       # → localhost:3330

# 2. 처음 까는 곳이면 테이블을 만든다. 이미 데이터가 있는 볼륨이면 건너뛴다.
docker exec -i drvalue_directus_pg psql -U "$DB_USER" -d "$DB_NAME" < db/schema.sql

# 3. 백엔드
cd api
npm ci && npm run build && node dist/main.js     # → http://localhost:3500

# 4. 화면 (공개 + /admin)
cd ../web
npm ci && npm run build && npm start             # → http://localhost:3400
```

도커로 셋 다 띄우면 `docker compose up -d --build`. 업로드 파일은 저장소의
`data/uploads`(gitignore) 를 컨테이너 `/data/uploads` 에 물린다 — 호스트에서
돌리는 로컬 Nest 와 같은 폴더다.

`api` 는 `ADMIN_SESSION_SECRET` 이 비면 **안 뜬다.** 게이트웨이 검증이 켜진 채
`IAM_GATEWAY_SECRET` 이 비어도 안 뜬다. 로컬에서 게이트웨이 없이 띄울 때만
`.env` 에 `IAM_ENFORCE_GATEWAY=false` 를 적는다. **운영에는 절대 넣지 않는다.**

## 관리 화면에 들어가기

`http://localhost:3400/admin` → 버튼 하나 「사내 IAM 으로 로그인」. 콜백
`ADMIN_IAM_CALLBACK_URL` 은 **화면을 여는 그 주소(origin)** 여야 세션 쿠키가
거기 떨어진다. IAM 화이트리스트에 같은 값이 있어야 한다.

거부되면 `api` 로그의 `denied by=… role=… groups=[…]` 한 줄을 본다.
`by=max-root` 는 nxcms root 표에 없는 것, `by=max-unavailable` 은 M.AX DB 가
안 닿는 것, `by=iam-group` 은 `ADMIN_IAM_GROUP` 에 안 맞는 것이다.

## 원본 PHP 를 로컬에 띄우기 (대조 검사용)

원본과 비교하는 검사들은 PHP 가 `:3300` 에 떠 있어야 한다. 도커가 안 뜨면
운영본을 원본 삼아 돌린다 — 읽기만 한다.

```bash
PHP_ORIGIN=https://drvalue.co.kr bash web/scripts/compare-all.sh
```

## 매번 돌리는 검사

```bash
cd api  && npm run typecheck && npm run build
        && node --test src/core/admin-auth/service/authorize.test.mjs   # 11
        && bash scripts/verify.sh                # 55/55  (api:3500 + DB, ADMIN_API_TOKEN 필요)
cd web  && python3 scripts/check-src.py          # 제일 먼저
        && npx tsc --noEmit && npx next build
        && python3 scripts/check-home.py         # 21/21  (:3400 필요)
        && python3 scripts/check-header.py       # 103/103
        && python3 scripts/check-a11y.py         # 266/266
        && python3 scripts/check-assets.py       # 빠진 것 0
        && NEXT_ORIGIN=http://localhost:3400 python3 scripts/check-pages.py   # 98/98
```

속도 제한 검사는 기본이 꺼짐이다. `RL_CHECK=1 bash api/scripts/verify.sh`
로 켠다. 켜면 창을 태워서 1분 안의 재실행을 막는다.

## 환경변수

루트 `.env` 하나에 전부 있다. 아래는 누가 읽는지로 나눈 것이다. 뜻과 기본값은
`.env.example` 을 본다.

### api

| 이름 | 뜻 | 비우면 |
|---|---|---|
| `PORT` | 듣는 포트 | 3500 |
| `DB_HOST` · `DB_PORT` · `DB_NAME` · `DB_USER` · `DB_PASSWORD` | PostgreSQL | **안 뜬다** |
| `UPLOADS_DIR` | 업로드 파일 폴더 | `./data/uploads` |
| `DEFAULT_LANGUAGE` | 공개 화면 기본 언어 | `ko-KR` |
| `IAM_GATEWAY_SECRET` | 게이트웨이 서명 공유 비밀 | 검증이 켜져 있으면 **안 뜬다** |
| `IAM_ENFORCE_GATEWAY` | 서명 검증 | **켠 것으로 본다** |
| `TRUST_PROXY` | 앞단 프록시 대수 또는 신뢰 대역 | 프록시 뒤라면 IP 별 한도가 하나로 합쳐진다 |
| `MAIL_RL_PER_MINUTE` · `MAIL_RL_PER_HOUR` | 문의 속도 제한 | 5 · 30 |
| `NCP_*` | 메일 발송 키 | 메일만 안 간다 |
| `ADMIN_SESSION_SECRET` | 관리자 세션 서명 키 | **안 뜬다** |
| `ADMIN_IAM_BASE` · `ADMIN_IAM_CALLBACK_URL` | 사내 IAM 과 콜백 주소 | 관리 화면 로그인이 503 |
| `ADMIN_MAX_DB_*` · `ADMIN_MAX_TENANT_CODE` | M.AX(nxcms) 마스터 DB — root 표 | IAM 그룹 판정만 남는다 |
| `ADMIN_IAM_GROUP` · `ADMIN_IAM_GROUP_ROLES` | M.AX DB 가 없을 때의 인가 | PLATFORM_ADMIN 만 통과 |
| `IAM_INTERNAL_API_BASE_URL` · `INTERNAL_API_KEY` | 세션 중 사용자 비활성 감지 | 그 검사만 빠진다 |
| `ADMIN_COOKIE_SECURE` | 세션 쿠키 secure | **켠 것으로 본다**. 로컬 http 만 `false` |
| `ADMIN_API_TOKEN` | 검사 스크립트용 관리자 토큰 | verify.sh 가 못 돈다. **운영에는 비운다** |

`TRUST_PROXY` 는 홉 수(`1`)나 대역이다. 숫자로 넘겨야 한다 — 문자열
`"1"` 은 IP `0.0.0.1` 하나를 믿는 목록으로 읽힌다.

### web

| 이름 | 뜻 | 비우면 |
|---|---|---|
| `API_ORIGIN` | Nest 주소 | `http://localhost:3500` |
| `CMS_ADMIN_URL` | 안내 장이 가리키는 관리 화면 주소 | 안내 문구만 나오고 링크가 안 붙는다 |
| `SITE_ORIGIN` | 대표주소·공유카드가 가리킬 곳 | `https://drvalue.co.kr` |

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
