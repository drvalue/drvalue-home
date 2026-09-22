# 돌리는 법

## 처음 한 번

```bash
# 1. 관리 도구(Directus + PostgreSQL) 를 띄운다. 제일 먼저다 —
#    Nest 가 이걸 못 찾으면 안 뜬다.
cd cms
cp .env.example .env          # DIRECTUS_SECRET 을 openssl rand -hex 32 로 채운다
docker compose up -d          # → http://localhost:3350

# 2. 스키마와 계정을 만든다. 순서를 바꾸면 안 된다 —
#    schema 가 없으면 뒤의 것들이 쓸 곳이 없고,
#    언어별 콘텐츠는 권한(roles)보다 먼저 만들어야 한다.
python3 scripts/schema.py       # 컬렉션·필드
python3 scripts/relations.py    # 관계
python3 scripts/i18n_content.py # 언어별 콘텐츠 — roles 보다 먼저
python3 scripts/roles.py        # 역할·권한
python3 scripts/flows.py        # 예약 게시 실행기
# public_api.py 는 Nest 없이 화면이 Directus 를 직접 읽을 때만 돌린다.
# 우리는 Nest 를 앞에 두므로 건너뛴다.

# 3. Nest 가 쓸 서비스 토큰을 발급한다. 화면에 한 번만 찍힌다.
python3 scripts/service_account.py

python3 scripts/i18n_admin.py   # 관리 화면 한국어
python3 scripts/seed.py         # 계정 3명 + 표본(표본 글은 초안이라 공개에 안 나온다)

# 4. 백엔드
cd ../api
cp .env.example .env          # DIRECTUS_TOKEN 에 3번 값을 채운다
npm ci && npm run build && node dist/main.js     # → http://localhost:3500

# 5. 공개 화면
cd ../web
cp .env.example .env.local
npm ci && npm run build && npm start             # → http://localhost:3400
```

`api` 는 게이트웨이 검증이 켜진 채 `IAM_GATEWAY_SECRET` 이 비면 **안 뜬다.**

로컬에서 게이트웨이 없이 띄울 때만 `api/.env` 에
`IAM_ENFORCE_GATEWAY=false` 를 적는다. **운영에는 절대 넣지 않는다.**

## 원본 PHP 를 로컬에 띄우기 (대조 검사용)

원본과 비교하는 검사들은 PHP 가 `:3300` 에 떠 있어야 한다. 도커가 안 뜨면
운영본을 원본 삼아 돌린다 — 읽기만 한다.

```bash
PHP_ORIGIN=https://drvalue.co.kr bash web/scripts/compare-all.sh
```

## 매번 돌리는 검사

```bash
cd cms  && bash scripts/smoke.sh                 # 109/109
cd api  && bash scripts/verify.sh                # 46/46
cd web  && python3 scripts/check-src.py          # 제일 먼저
        && python3 scripts/check-home.py         # 21/21  (:3400 필요)
        && python3 scripts/check-header.py       # 103/103
        && python3 scripts/check-a11y.py         # 266/266
        && python3 scripts/check-assets.py
        && npx tsc --noEmit && npx next build
```

속도 제한 검사는 기본이 꺼짐이다. `RL_CHECK=1 bash api/scripts/verify.sh`
로 켠다(그때 20/20). 켜면 창을 태워서 1분 안의 재실행을 막는다.

## 환경변수

### api

| 이름 | 뜻 | 비우면 |
|---|---|---|
| `PORT` | 듣는 포트 | 3500 |
| `DIRECTUS_URL` · `DIRECTUS_TOKEN` | CMS 주소와 서비스 토큰 | 게시판이 빈다 |
| `DEFAULT_LANGUAGE` | 공개 화면 기본 언어 | — |
| `IAM_GATEWAY_SECRET` | 게이트웨이 서명 공유 비밀 | 검증이 켜져 있으면 **안 뜬다** |
| `IAM_ENFORCE_GATEWAY` | 서명 검증 | **켠 것으로 본다** |
| `TRUST_PROXY` | 앞단 프록시 대수 또는 신뢰 대역 | 프록시 뒤라면 IP 별 한도가 하나로 합쳐진다 |
| `MAIL_RL_PER_MINUTE` · `MAIL_RL_PER_HOUR` | 문의 속도 제한 | 5 · 30 |
| `NCP_*` | 메일 발송 키 | 메일만 안 간다 |

`TRUST_PROXY` 는 홉 수(`1`)나 대역이다. 숫자로 넘겨야 한다 — 문자열
`"1"` 은 IP `0.0.0.1` 하나를 믿는 목록으로 읽힌다.

### web

| 이름 | 뜻 | 비우면 |
|---|---|---|
| `API_ORIGIN` | Nest 주소 | `http://localhost:3500` |
| `CMS_ADMIN_URL` | 관리 화면 주소 | 안내 문구만 나오고 링크가 안 붙는다 |
| `SITE_ORIGIN` | 대표주소·공유카드가 가리킬 곳 | `https://drvalue.co.kr` |

### cms

| 이름 | 뜻 | 비우면 |
|---|---|---|
| `DIRECTUS_SECRET` | 서명 키 | 안 뜬다 |
| `ADMIN_EMAIL` · `ADMIN_PASSWORD` | 최초 관리자. 부팅 때 한 번만 쓴다 | 계정이 안 생긴다 |
| `PUBLIC_URL` · `CORS_ORIGIN` | 자기 주소와 허용할 출처 | 관리 화면이 깨진다 |
| `IAM_BRIDGE_*` | 사내 IAM 로그인 | 기능이 꺼진 채 로컬 로그인만 동작 |

`IAM_BRIDGE_ENABLED=true` 로 켠 뒤에는 **반드시**
`python3 scripts/iam_bridge_sync.py` 를 한 번 돌린다. Directus Core 는
로컬 로그인 창을 못 끄므로, 계정 비밀번호를 사람이 모르는 파생값으로
바꿔야 IAM 이 유일한 입구가 된다. 계정 자리(seat)가 3명이라 등록할 수
있는 사람도 최대 3명이다.

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

전환 당일에 다시 돌린다 — 그 사이에 올라온 글이 있다.

```bash
cd cms && python3 scripts/import_board.py
```

## 새 주소에 올릴 때 챙길 것

우하단 상담 위젯은 **도메인 잠금**이다. 새 주소를 GrowChat 쪽에 등록하지
않으면 위젯이 **조용히** 안 뜬다. 오류도 안 난다.
