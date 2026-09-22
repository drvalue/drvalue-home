# 디알밸류 홈페이지 CMS — Directus 12

## 실행

```bash
cp ../.env.example ../.env   # 루트 .env 하나. DIRECTUS_SECRET, ADMIN_PASSWORD 채우기
docker compose up -d      # Postgres 10 + Directus 12
python3 scripts/schema.py      # 컬렉션·필드
python3 scripts/relations.py   # 관계
python3 scripts/i18n_content.py # 언어별 콘텐츠 (roles 보다 먼저)
python3 scripts/roles.py       # 역할·권한
python3 scripts/flows.py       # 예약 게시 실행기
python3 scripts/public_api.py  # 공개 사이트가 읽을 엔드포인트 (Nest 가 서면 건너뛴다)
python3 scripts/service_account.py # 백엔드(Nest)가 읽을 계정 — 토큰이 한 번 찍힌다
python3 scripts/i18n_admin.py  # 관리 화면 한국어
python3 scripts/seed.py        # 계정·표본 데이터
bash scripts/smoke.sh          # 검증
```

관리 화면 `http://localhost:3350/admin`

**첫 접속 때 라이선스 대화상자가 뜬다.** 프로젝트 소유자 이메일과
MSCL-1.0-GPL 약관 동의를 요구한다. 이건 법적·사업적 결정이라 담당자가 직접
골라야 한다 — 자동화하지 않았다. 지금은 "나중에 알림" 으로 넘길 수 있고,
API 는 동의 없이도 동작한다(막히는 것은 관리 화면뿐이다).

| 계정 | 역할 |
|---|---|
| admin@drvalue.co.kr | 전체 |
| marketing@drvalue.co.kr | 콘텐츠·메인화면·문의 |
| hr@drvalue.co.kr | 채용공고만 |

스크립트는 전부 여러 번 돌려도 같은 결과가 나온다(이미 있으면 건너뛴다).

## 포트

| | |
|---|---|
| Directus | 3350 |
| PostgreSQL | 3330 |

이 머신의 3306·3315·3320·3401·3402·5432 는 다른 컨테이너가 쓴다.

## DB 버전을 10 으로 맞춘 이유

운영 DB 는 iwinv 클라우드 DBMS 이고 **PostgreSQL 10 만 제공한다**.
로컬을 17 로 개발하면 운영에서만 깨지는 것을 못 잡으므로 10 으로 맞췄다.
PG10 은 2022년 11월 EOL 이라 보안 패치가 없다 — 이건 이 저장소가 못 막는다.

Directus 12 가 PG10 에서 도는 것은 실측으로 확인했다(컬렉션·필드·관계·조인·이력).
`pg_index.indnkeyatts` 때문에 PG10 이 깨진다는 이슈는 Directus 9.1 시절 것이고
12.3.1 에는 해당하지 않는다.

## Core 요금제에서 막힌 것

무료 Core 티어의 실제 제약을 실측했다.

**조건부 권한이 막힌다.**

```
custom_permission_rules_enabled is a restricted resource
```

조건 없는 권한 36건은 통과하고, `{"board": {"_in": [...]}}` 같은 행 단위 조건
8건만 403 으로 거부된다. **필드를 일부만 주는 것도 같은 에러로 막힌다**
(`fields: ["name","email"]` → 403, `fields: ["*"]` → 200). 가격표에는 Core 에
"Advanced RBAC 포함" 이라고 쓰여 있지만 제품은 막는다.

그래서 **채용공고를 `recruits` 로 분리했다.** "인사는 채용공고만" 을 한 컬렉션 안의
행 조건이 아니라 컬렉션 단위 권한으로 표현한다. 결과는 같고 비용은 0이다.

그 밖의 Core 한도:

| | |
|---|---|
| 사용자 seat | 3명 (관리자·마케팅·인사로 정확히 소진) |
| 컬렉션 | 25개 (현재 **23개** — 남은 자리 2개) |
| 플로우 | **5개** (`flows limit exceeded`. 현재 3개) |
| SSO / OIDC | 기본 기능으로는 없다 (아래 우회) |
| 사용자 seat | 3명 (`seats limit exceeded`) |

## 사내 IAM 으로 관리 화면에 로그인하기

Core 는 SSO 를 막는다. `AUTH_PROVIDERS` 로 OIDC 를 정상 설정하고 재기동해도
제공자 목록이 비고 기동 로그에 이렇게 뜬다.

```
WARN: you have SSO providers configured these will be unavailable
      under the current license tier
GET /auth → {"data":[]}
```

라이선스가 막는 것은 다섯 개뿐이다 — `ai_translations` · `custom_llms` ·
`custom_permission_rules` · `production` · `sso`. **확장은 그 목록에 없고**
`AuthenticationService` 를 그대로 받는다. 그래서 IAM 확인을 확장이 직접 하고,
통과한 사람에게 Directus 세션을 발급한다.

`extensions/directus-extension-iam-bridge/` 가 그것이다. 운영 중인 PHP 사이트가
쓰는 것과 같은 4단계다.

```
GET  /iam-bridge/login      → IAM 으로 보낸다 (state 를 서명해 쿠키에 둔다)
GET  /iam-bridge/callback   → 아래 4단계를 확인하고 세션 쿠키를 심는다
GET  /iam-bridge/status     → 켜짐 여부와 설정 유무만 (값은 안 내보낸다)

1) {IAM}/auth/token/exchange {code, redirectUri}  → IAM 토큰
2) {ROUTE}/auth/v1/login/root/iam                 → 앱 토큰    (Bearer=IAM 토큰)
3) {ROUTE}/auth/v1/login/tenant/by-root           → 테넌트 토큰 (X-Tenant-Code)
   실패 = 권한 없음. 이 단계가 인가 판정을 겸한다.
4) IAM 이메일 → 미리 만들어 둔 Directus 계정으로 매핑 → 세션 발급
```

설정은 `.env` 의 `IAM_BRIDGE_*` 다. 비워 두면 꺼진 채로 돌고 기존 로컬
로그인만 동작한다.

**켠 뒤에 반드시 `python3 scripts/iam_bridge_sync.py` 를 한 번 돌려야 한다.**
다리를 켜는 것만으로는 아무것도 잠기지 않는다 — Core 는 로컬 로그인 창을 끌 수
없어서, IAM 은 **문을 하나 더 만든 것이지 기존 문을 잠근 것이 아니다.** 아는
비밀번호로 `/admin/login` 에 그냥 들어올 수 있다(실측). 사람이 모르는 값으로
바꾸는 것이 유일한 방법이다. 이 스크립트가 두 가지를 한다.

1. 대상 계정 비밀번호를 `HMAC-SHA256(SECRET, "iam-bridge:<이메일>")` 로 바꾼다.
   다리는 로그인할 때 같은 값을 다시 계산한다. **어디에도 적혀 있지 않다** —
   설정에도 환경변수에도 비밀번호가 없다.
2. 로그인 화면에 IAM 진입점을 만든다. Directus 는 라이선스가 있는 제공자만 SSO
   버튼을 그려 주므로 그냥 두면 `/iam-bridge/login` 으로 가는 길이 화면에 없다.
   `public_note` 가 마크다운 링크를 실제 `<a>` 로 렌더하는 것을 확인했다.

돌리고 나면 이 저장소의 다른 스크립트(스모크·프로비저닝)가 쓰는
`ADMIN_PASSWORD` 로는 로그인되지 않는다. 운영에 올릴 때 마지막으로 돌린다.

검증: `bash scripts/verify-iam-bridge.sh` — 가짜 IAM 을 띄워 4단계를 실제로
통과시킨다(운영 자격증명 없이). 정상 로그인·테넌트 거부·매핑 없음·state 위조·
주소에 토큰 누출까지 8항.

**이 방식의 값**

- `SECRET` 을 아는 사람은 누구로든 로그인할 수 있다. 다만 `SECRET` 은 이미 모든
  세션 토큰을 서명하므로 권한이 늘어나지는 않는다.
- **IAM 계정이 여럿이어도 Directus 계정은 셋이다.** 여러 사람이 같은 계정에
  매핑되면 변경 이력(9번)에 사람이 아니라 계정만 남는다. 누가 눌렀는지는
  다리의 서버 로그(`iam-bridge: 로그인 성공`)에만 남는다.
- 파생값이 계정에 안 들어가 있으면 로그인 시도 제한에 걸려 **계정이
  suspended 로 잠긴다.** 다리가 이 경우를 따로 잡아 "계정 비밀번호가
  파생값과 다르다" 로 남기니, 공격이 아니라 설정 오류로 읽으면 된다.
- **운영 IAM 토큰에 어떤 claim 이 있는지는 붙여 보기 전에는 모른다.**
  다리는 `email → preferred_username → sub` 순으로 찾고, 실패하면 토큰에 있던
  claim 이름을 로그에 남긴다. 그 목록을 보고 `IAM_BRIDGE_ACCOUNTS` 의 왼쪽
  키를 맞추면 된다.

## 언어별 콘텐츠(11번)가 저장되는 방식

`en_ready` 플래그만으로는 다국어가 아니다. "번역이 끝났다" 는 표시일 뿐
영어 원고를 넣을 칸이 없다.

글로 된 값은 전부 **번역 전용 컬렉션**으로 옮겼다. 원본에는 언어와 무관한 것만
남는다.

```
pages                 id, path, status, publish_at, sort, og_image, no_index …
pages_translations    id, pages(→pages), languages_code(→languages),
                      title, parent_label, lead, seo_title, seo_description
```

관리 화면에서 원본을 열면 **언어 탭**이 생긴다. 공개 API 는 `?lang=en-US` 로
고른다. 목록에 없는 코드는 한국어로 떨어진다 — 그대로 필터에 넣으면 빈 배열이
조용히 돌아가기 때문이다.

옮긴 컬렉션 10개: `pages` `page_blocks` `posts` `recruits` `hero_slides`
`popups` `menu_items` `site_settings` `home_settings` `seo_defaults`.

**주소와 slug 는 번역하지 않는다.** 언어별로 다른 주소를 쓰려면 라우팅까지
바뀌어야 하는데 공개 사이트가 아직 그걸 못 받는다. 지금은 한 주소에 언어만 갈린다.

항목 이름(`display_template`)이 제목이 아니라 `slug` · `path` 인 것도 이 때문이다.
`{{translations.title}}` 로 두면 빈 칸이 되는 게 아니라 **모든 언어를 이어붙인다**
(실측: 편집 화면 머리글이 `게시판: 홈페이지 관리자 도입 안내, Introducing the
site admin`, 브라우저 탭 제목은 JSON 배열 그대로).

대신 **목록 열**은 번역을 따라간다. `translations.title` 을 열로 넣으면 제목이
제대로 나온다. `i18n_admin.py` 가 컬렉션마다 기본 열을 지정해 둔다 —
안 하면 담당자가 목록에서 `slug` 만 본다.

만들 때 주의: 기본키를 `id` 가 아닌 것으로 하려면 **컬렉션을 만들 때 같이
선언해야 한다.** 만든 뒤에 `is_primary_key` 필드를 추가하면
`multiple primary keys for table are not allowed` 로 500 이 난다
(`languages.code` 에서 겪었다).

## 백엔드(Nest)를 앞에 두는 경우

`scripts/service_account.py` 가 만든다. **역할을 주지 않고 `app_access: false`
정책을 사용자에게 직접 붙인다.** 그러면 관리 화면에는 못 들어가고 API 만
쓸 수 있으며, 무엇보다 **seat 를 먹지 않는다** — 사람 3명이 꽉 찬 상태에서도
서비스 계정 생성이 통과하는 것을 확인했다.

토큰은 발급할 때 한 번만 찍힌다. Nest 의 환경변수로 옮기고 저장소에 넣지 않는다.
잃어버리면 `--rotate` — 다만 **옛 토큰이 그 자리에서 죽는다**(실측: 200 → 401).
Nest 가 돌고 있으면 그동안 모든 요청이 실패하므로 발급 → 환경변수 교체 →
재시작 순서로, 중단 시간을 감수하고 해야 한다.

**Nest 가 예약 게시를 다시 구현하면 안 된다.** 크론이 1분마다 `status` 를
바꾼다. Nest 는 `status == 'published'` 만 보면 된다. `publish_at <= 지금` 까지
직접 따지면 관리 화면보다 최대 1분 먼저 공개돼 둘이 어긋난다. 판단 기준은
한 곳(크론)에만 둔다.

Nest 가 이 토큰으로 읽으면 Core 제약 몇 개가 의미를 잃는다.

| Core 제약 | Nest 가 앞에 서면 |
|---|---|
| 권한에 조건을 못 건다 | 전부 읽어서 코드에서 거른다 |
| 필드를 못 좁힌다 | 내보낼 필드만 골라 내려준다 |
| 목록에 전체 건수가 없다 | Directus 에 직접 물어 `meta` 를 받는다 |
| 공개 엔드포인트 주소가 uuid | `/api/posts` 같은 주소로 감싼다 |
| 파일 목록이 통째로 열린다 | 익명에게는 닫힌다. **다만 토큰을 가진 쪽에는 그대로 열려 있다** — 없어지는 게 아니라 옮겨지는 것이다 |
| 문의 폼에 스팸 방지가 없다 | Nest 에서 rate limit·캡차를 건다 |

그 경우 아래 "공개 사이트는 어떻게 읽나" 의 플로우 엔드포인트는 필요 없어진다.
Public 정책도 전부 닫으면 된다. **seat 3명은 그대로 남는다** — 그건 CMS 를
직접 편집하는 사람 수 제한이라 앞단에 무엇을 두든 바뀌지 않는다.

서비스 계정이 실수로 사람 자리를 먹는 일은 Directus 가 먼저 막는다. seat 가 찬
상태에서 그 정책에 `app_access: true` 를 주면 `HTTP 403 seats limit exceeded`
가 난다(실측).

## 공개 사이트는 어떻게 읽나

조건부 권한이 막히는 것이 여기서 정면으로 걸린다. 공개 읽기를 권한으로 열면
쓸 수 있는 형태가 `fields:["*"]` + 조건 없음뿐이라, **익명이 초안까지 본다.**
실측으로 확인했다 — `status=draft` 인 `/leak-test` 가 익명 조회에 그대로 나왔다.

그래서 공개 읽기를 **웹훅 플로우**로 돌린다. 플로우 안의 조회는 `$full` 권한으로
돌아가므로 조건과 필드를 마음대로 쓸 수 있고, 밖에서는 결과 JSON 만 보인다.

```
GET  /flows/trigger/<읽기 uuid>?resource=posts&board=notice
GET  /flows/trigger/<읽기 uuid>?resource=post&slug=xxx&lang=en-US
POST /flows/trigger/<문의 uuid>
```

주소는 `public-endpoints.json` 에 적힌다. uuid 는 키에서 uuid5 로 만들기 때문에
다시 프로비저닝해도 **바뀌지 않는다.**

**엔드포인트가 컬렉션마다 하나가 아닌 이유**는 플로우 한도 5개다. 예약 게시 크론이
하나를 쓰므로, 읽기는 라우터 하나로 합치고(`?resource=`) 쓰기는 문의 등록 하나만
둔다. 읽을 수 있는 목록과 각 질의는 `scripts/public_router.js` 에 있다 —
거기 없는 이름은 예외를 던져 플로우가 멈춘다(응답은 빈 객체).

익명 쓰기는 문의 등록 하나뿐이다. 권한으로 열면 Core 가 필드를 못 좁혀서 익명이
`status` 와 `assignee` 까지 넣을 수 있다. 라우터가 받을 필드를 정한다.

Public 정책에 직접 걸린 권한은 넷뿐이다: `site_settings` · `home_settings` ·
`seo_defaults` (초안 개념도 개인정보도 없다) 와 `directus_files`
(썸네일·OG 이미지를 못 받으면 전부 깨진 이미지가 된다).

**버린 방법: PostgreSQL 뷰.** `CREATE VIEW public_pages AS SELECT * FROM pages
WHERE status='published'` 로 SQL 에서 걸러내면 권한 조건이 필요 없다. 등록은
HTTP 200 이 떨어지는데 **Directus 12 는 뷰의 컬럼을 하나도 못 읽는다** — 관리자
조회조차 403("or it does not exist") 이다. 재시작해도 같다.

## 예약 게시(10번)가 도는 방식

`publish_at` / `unpublish_at` 필드만 두면 **아무 일도 일어나지 않는다.**
그 시각에 `status` 를 바꿔 주는 것이 있어야 실제로 뜨고 내려간다.

Directus Flows 의 schedule 트리거(1분 크론)를 쓴다. Core 에서 동작하는 것을 확인했다.

| 조건 | 바뀌는 값 |
|---|---|
| `status=scheduled` 이고 `publish_at <= 지금` | `published` |
| `status=published` 이고 `unpublish_at <= 지금` | `archived` |

`status` 에 **예약**(`scheduled`)을 따로 뒀다. `draft` 를 그대로 쓰면
"아직 안 쓴 글" 과 "시각을 기다리는 글" 이 구분되지 않는다.

플로우의 `accountability` 는 **`null`** 이다. `"all"` 로 두면 바꿀 것이 하나도
없어도 1분마다 `directus_activity` 와 `directus_revisions` 에 `action=run` 이
한 줄씩 쌓인다 — 하루 1,440행이고, 마케팅이 보는 변경 이력에도 섞인다.
`null` 로 둬도 **실제 상태 변경은 `posts` 의 `update` 로 남는다**(실측:
자동 게시된 글에 `action=update, user=null` 행이 생겼다).

실측:

```
sched-past   (5분 전 예약)  →  published    자동 게시됨
sched-future (내일 예약)    →  scheduled    그대로
sched-down   (5분 전 내림)  →  archived     자동으로 내려감
```

검사가 진짜인지 돌연변이로 확인했다. 플로우를 `inactive` 로 끄고 스모크를 돌리면
`PASS=20 FAIL=2` 가 된다 — 실행기가 없으면 검사가 잡아낸다.

## 스키마를 만들 때 주의할 점

컬렉션 meta 에 `sort_field` 를 선언하면 **반드시 그 컬럼도 만들어야 한다.**
선언만 하고 컬럼이 없으면 관리자는 통과하지만 일반 역할은 목록 조회에서 403 이 난다
— Directus 가 없는 필드를 정렬 기준으로 읽으려 하기 때문이다.

실제로 `inquiries` / `inquiry_notes` 가 이 상태였고, 마케팅 계정이 문의 목록을
전혀 못 열었다. 권한은 정상적으로 부여돼 있었는데도 그랬다.

  GET /items/inquiries  →  "You don't have permission to access field \"sort\""

그래서 스모크에 **각 역할이 닿아야 할 컬렉션을 전부 훑는 검사**를 넣었다.
권한 레코드가 있는지가 아니라 실제로 읽히는지를 본다.

## 이 구성이 못 막는 것

- **IAM 을 쓰더라도 사람은 3명까지다.** 4번째 사용자를 만들면 거부된다
  (실측: `LIMIT_EXCEEDED` / `seats limit exceeded`). IAM 에 사람이 몇이든
  Directus 계정은 셋이라, 다리는 없는 사람을 자동으로 만들지 않고 거부한다.
- **다리는 계정 비밀번호를 들고 있다.** Directus 의 표준 SSO 가 아니라
  로컬 로그인을 대신 눌러 주는 구조라서 그렇다.
- **PostgreSQL 10 의 EOL.** 보안 패치가 없다.
- **예약 게시는 Directus 프로세스가 떠 있어야 돈다.** 플로우의 1분 크론이
  상태를 바꾼다. 컨테이너가 내려가 있는 동안 지난 예약은 다시 뜰 때 처리된다
  (시각 비교라 놓치지는 않지만, 그 사이에는 안 뜬다). 최대 1분 오차가 있다.
- **언어별 주소가 없다.** `path` · `slug` 는 공유라 `/about` 하나에 한국어·영어가
  갈린다. `/en/about` 같은 주소를 쓰려면 공개 사이트의 라우팅부터 바뀌어야 한다.
- **번역이 비면 빈 값이 나간다.** 영어 원고를 안 넣은 항목을 `?lang=en-US` 로
  부르면 한국어로 대체되지 않고 `translations` 가 빈 배열로 온다. 어느 언어를
  보여줄지는 화면이 정한다.
- SEO 는 값을 저장할 뿐이다. 공개 사이트가 Vite CSR 이라 크롤러에 안 먹는다.
- **업로드한 파일은 전부 공개고, 목록까지 긁힌다.** `directus_files` 를 열어야
  썸네일이 나오는데 Core 는 조건을 못 걸어 전부 아니면 전무다. uuid 를 몰라도
  `GET /files?limit=-1` 이 익명에게 200 을 주고, 각 행의 `id` ·
  `filename_download` · `title` · `uploaded_by`(관리자 계정 uuid) 까지 보인다.
  즉 **CMS 에 올린 파일은 전부 열람 가능하다고 가정해야 한다.** 홍보 사이트라
  감수했지만, 내부 자료를 올리면 안 된다.
- **문의 폼에 스팸 방지가 없다.** 익명 POST 를 받는 엔드포인트라 봇이 긁으면
  그대로 쌓인다. 캡차나 rate limit 은 안 붙였다.
- **공개 엔드포인트 주소가 uuid 다.** 플로우 한도 때문에 생긴 모양이고, 사람이
  읽기 좋은 `/api/posts` 같은 주소를 주려면 앞단에 리버스 프록시나 Next 의
  route handler 가 필요하다.
- **공개 목록에 전체 건수가 없다.** 플로우의 `item-read` 는 결과 배열만 주고
  Directus 의 `meta.filter_count` 를 안 준다. 그래서 게시판 UI 에 "1 2 3 … 12"
  식 페이지 번호를 못 그린다. 다음 페이지가 비면 끝인 방식(더 보기/이전·다음)만
  가능하다. 번호가 필요하면 건수 전용 엔드포인트를 하나 더 만들어야 한다
  (플로우 한도 5개 중 2개가 남아 있다).
