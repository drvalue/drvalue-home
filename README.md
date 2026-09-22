# drvalue-main-server

디알밸류 홈페이지. 2026-09-22 개인 작업 저장소에서 PHP 원본을 덜어내고 Next 이관본만 옮겨 왔다
(이력 없이 한 번에 — 옛 이력에 개인정보가 든 그림이 있어 회사 저장소에는 올리지 않는다).

```
web/   Next   홈페이지. 옛 .php 주소는 308 로 새 주소에 넘긴다.
api/   Nest   사내 IAM · 메일 · 콘텐츠 API
cms/   Directus 스키마 · 권한 · 예약 게시 · 다국어 · IAM 다리 · 서비스 계정
```

## 도커로 띄우기

```
cp web/.env.example web/.env && cp api/.env.example api/.env && cp cms/.env.example cms/.env   # 값 채우기
docker compose up -d --build        # web 3400 · api 3500 · directus 3350 · db 3330
docker compose up -d --build web api   # CMS 는 그대로 두고 앞·뒤만
```

`web/Dockerfile`(Next standalone) · `api/Dockerfile`(Nest) · 루트 `docker-compose.yml`(CMS 는 `cms/docker-compose.yml` 을 include).
api 는 `IAM_GATEWAY_SECRET` 이 없으면 일부러 안 뜬다(게이트웨이 검증이 기본 켜짐).
컨테이너 안에서는 web → `http://api:3500`, api → `http://directus:8055` 로 부른다(compose 가 .env 값을 덮는다).

## IAM 이 두 군데 있는 이유

이름이 같아 헷갈리지만 서로 다른 일을 한다. 하나가 다른 하나를 대신하지 못한다.

| | `cms/extensions/directus-extension-iam-bridge` | `api` 의 `@drvalue-oss/iam-nestjs` |
|---|---|---|
| 무엇을 인증하나 | **사람** — 관리자가 Directus 화면에 로그인 | **요청** — API 호출이 사내 게이트웨이를 거쳤는지 |
| 게이트웨이와의 관계 | 게이트웨이를 **부른다** (`/auth/v1/login/root/iam` 4단계) | 게이트웨이 **뒤에 선다** (`enforceGatewayOnly`, 서명 검증) |
| 결과물 | Directus 세션 쿠키 | 요청 통과 / 거절 |

Directus Core 는 SSO 가 라이선스로 막혀 있어서(`sso_enabled` is a restricted
resource) 확장으로 우회한다. Nest 쪽은 그런 제약이 없고 애초에 다른 계층이다.

## 자산과 배포

- `web/public/{css,img,icon}` 은 루트 원본과 **별개인 복사본**이다. 예전엔
  심볼릭 링크였는데 `web` 만 떼어 배포하려고 풀었다(`6f505ba`). 이미
  갈라져 있다 — `style.css`·`header.css` 는 내용이 다르다. 루트만 고치면
  Next 화면은 안 바뀐다.
- `next.config.mjs` 에 `output` 을 주지 않았다. **`next start` 로 띄운다.**
- `header.php` 의 `asset_url()` 은 파일 수정시각을 붙여 캐시를 깼다.
  **Next 쪽에는 그게 없다.** CSS 를 고쳤는데 화면이 그대로면 이것부터 의심한다.

## 화면을 갈아엎지 않는다

한동안 디자이너 저장소(Vite)의 새 IA 를 얹는 방향으로 갔다가 **접었다.**
운영 메인과 메뉴가 완전히 다른 화면이 되어서 같은 사이트로 안 보였다.
그때 만든 것(`web/dv/`, `DvShell`, 안내 화면, `/max`)은 전부 지웠다.

지금 방향은 **운영 사이트 그대로 두고 필요한 것만 더한다** 이다.

```
/                     운영 메인 그대로 + 소식·신뢰의 근거 구역 두 개 추가
/page/business/max    새로 만든 페이지 (비즈니스 메뉴 아래)
그 외                 PHP 에서 옮겨 온 화면 그대로
```

머리·발은 한 벌이다 — 전부 `components/SiteHeader.tsx` / `SiteFooter.tsx`.

### 메인에 더한 것

차례는 **역량 → 신뢰의 근거 → 사업영역 → 소식 → (원본 t_service) → 문의**.

| 구역 | 내용 | 어디서 온 값 |
|---|---|---|
| 신뢰의 근거 | 인증·선정·협력 카드 11장, 연도로 고르기 | `app/home/proofData.ts` |
| 사업영역 | 카드 3장(제조AI · AI 솔루션 · 스마트 팩토리) | 각 페이지의 첫 문단 |
| 소식 | 공지·보도자료 카드 6장, 분류로 고르기 | CMS (`/api/content/posts`) |
| 문의 띠 | 기존 문의 모달을 연다 | — |

**사업영역 카드는 꾸밈이 아니라 구멍 메우기다.** 메인 본문에서 비즈니스
쪽으로 가는 링크가 하나도 없었다 — 새로 만든 제조AI(M.AX) 페이지도 헤더
드롭다운으로만 갈 수 있었다. `check-home.py` 가 그 링크가 있는지 잰다.

역량의 숫자(특허 6 · 저작권 5 · 실적 9 · 솔루션 5)는 화면에 들어올 때
0 에서 세어 올린다. **마크업은 안 건드린다** — 그 숫자는 PHP 원본에서
그대로 옮겨 온 것이라 감싸면 원본과 달라진다. `HomeCountUp` 은 아무것도
그리지 않고 이미 있는 글자만 바꾼다. 두 가지 함정을 겪었다.

- effect 는 두 번 이상 돈다(StrictMode·Fast Refresh). 목표값을 글자에서
  바로 읽으면 두 번째 실행이 **이미 0 이 된 글자를 목표로 읽어서** 0 에서
  0 까지 센다. 원본 값을 `data-dv-count` 에 한 번만 박아 두고 거기서 읽는다.
- 브라우저는 **안 보이는 탭의 requestAnimationFrame 을 멈춘다**(실측: 600ms
  동안 0프레임). 그대로 두면 새 탭으로 열어 둔 사람에게 0 으로 굳는다.
  탭이 뒤에 있으면 세지 않고 최종값을 바로 쓴다.

소식은 **서버에서 읽어 넘긴다.** 브라우저에서 부르면 메인이 한 번 비었다가
채워진다. CMS 가 죽으면 예외를 던지지 않고 빈 배열이 와서 그 구역만 빠진다 —
메인이 같이 죽지 않는다. 5분마다 다시 읽는다.

신뢰의 근거 문구는 **운영 연혁(`/page/company/history`)에 화면으로 보이는
항목만** 옮겼다. 인증·선정은 틀리면 안 되는 종류의 문장이라 새로 짓지
않았다. 고칠 일이 생기면 연혁이 먼저다.

**연혁 HTML 에는 `<!-- -->` 로 감춰 둔 항목이 섞여 있다.** 화면에 안 나오는
것은 회사가 지금은 안 내보내기로 한 것이다. 태그만 떼고 글자를 긁으면 그게
그대로 딸려 들어온다 — 실제로 한 번 그렇게 올렸다가 사용자가 잡아냈다
(엠슈머 파트너사 1,000개 돌파, DR-Vision 고도화, 벤처기업 확인서,
스마트팩토리 특허 등록, 기업부설연구소 설립 승인). **연혁을 다시 긁을 일이
있으면 주석부터 지우고 긁어라.**

고른 해가 아닌 카드도 DOM 에 남긴다(`hidden`). 걸러서 지우면 검색엔진이
다른 해의 인증을 아예 못 본다 — 이 구역의 값어치가 거기 있다.

### 새로 만든 페이지

원본 PHP 가 없는 **새 페이지**가 8장이다 — M.AX 4장(`max` · `pcb-mes` ·
`cosmetics-mes` · `mes-ai`)과 서비스 4장(`autoform` · `cadon` · `chat` ·
`hangeon`). 이들은 `compare-all.sh`
대상이 아니고 주소에 `.php` 도 없다. 시안(`max-page-draft_v2.html`)의
내용과 "A. 딥 네이비" 색을 따르되, 글자색·강조 빨강·서체는 운영 값으로
맞췄다 — 시안 그대로 두면 같은 사이트 안에서 이 페이지만 색이 다르다.

클래스 이름에 전부 `mx_` 를 붙이고 `#dvmax` 로 감쌌다. 시안은 `.hero`
`.panel` `.chip` 처럼 흔한 이름을 쓰는데 운영 `css/style.css` 에 같은
이름이 이미 있다. 접두사 없이 들이면 이 페이지가 다른 페이지를 덮어쓴다.

탭은 React 상태로 돌린다. 다른 페이지는 원본 PHP 와 마크업을 글자 단위로
맞춰야 해서 동작을 인라인 스크립트로 넣었지만, 이 페이지는 맞출 원본이 없다.

MES 흐름은 처음에 6칸의 글이 한꺼번에 다 보였다. 34줄이 한 화면에 깔리니
어디부터 볼지 모른다. 그래서 둘을 준다 — **단계를 고르면 그 칸만 또렷해지고
나머지는 흐려진다**(고르기 전에는 전부 또렷한 원래 모습이다), 그리고
**AI 항목만 켜고 끄는 단추**(13개). 이 페이지의 주장이 "AI 가 무엇을 자동으로
하는가" 라서 그것만 남겨 보는 것이 제일 빠른 설명이다.

### 옛 주소가 죽지 않게

접은 방향에서 쓰던 주소와 `.php` 주소가 남아 있다. `lib/dvRoutes.mjs` 와
`lib/phpRoutes.mjs` 가 넘긴다. **오타 주소는 그대로 404 로 둔다** — 아무거나
받아 주면 링크가 틀린 것을 아무도 모른다.

| 옛 주소 | 가는 곳 | |
|---|---|---|
| `/page/**/*.php` (16장) | 확장자 뺀 같은 주소 | 308 |
| `/index.php` | `/` | 308 |
| `/max` | `/page/business/max` | 308 |
| `/company/introduction` · `/company/location` · `/company/ip` | `intro` · `location` · `patent` | 307 |
| `/platform/cuton` · `/customer/notice` · `/customer/press` · `/cases` | 대응 페이지 | 307 |
| 그 밖(역량·FAQ·자료실·AiutoForm…) | 404 | |

307 로 둔 것은 접은 IA 의 잔재라 대응이 확정이 아니어서다. 영구로 주면
검색엔진이 옛 주소를 지워 버려서 되돌릴 수가 없다.

확장자가 `.ts` 가 아닌 것은 `next.config.mjs` 가 두 파일을 직접 import 하기
때문이다. Node 22 이하는 타입이 붙은 파일을 못 읽어서 `next build` 가
시작도 못 하고 죽는다.

## 이관이 정확한지 재는 법

"똑같아 보인다" 는 증거가 아니다. 어긋나는 것은 대개 마크업 한 글자고,
그게 반응형에만 쓰이는 class 면 데스크톱 스크린샷으로는 안 보인다.
그래서 PHP 원본을 대조군으로 띄우고 기계로 잰다.

```
docker run -d --name drvalue_php -p 3300:80 -v "$PWD":/var/www/html php:8.3-apache
cd web && bash scripts/compare-all.sh          # 전부
cd web && python3 scripts/compare.py /index.php # 한 장만
```

세 가지를 따로 잰다. 합치면 어디가 틀렸는지 알 수 없다.

| | `/page/company/intro` 실측 |
|---|---|
| 뼈대(태그 순서열) | 485개, 내용 같음. `<head>` 안 `<script>` 위치만 다름 |
| class | 106개 **완전 일치** |
| 속성(src·href·alt·id…) | 119개, 내용 같음. `<head>` 안 link 순서만 다름 |

남는 차이 2건은 둘 다 `<head>` 안 순서다. `next/script` 가 실행 시점을
정하느라 움직인다 — 화면에도 동작에도 영향이 없다.

자는 인라인 스크립트 **본문**도 대 본다. 여기서 한 글자만 달라져도 화면은
멀쩡하고 기능만 죽는다 — 실제로 스크립트를 템플릿 문자열(`` ` ``)에 담았다가
백슬래시가 전부 먹혀서 `/https?:\/\//` 가 `/https?:////` 가 되었고, 게시판
스크립트가 통째로 문법 오류로 죽었다. 화면은 평소와 똑같았다.

일부러 다르게 옮긴 스크립트는 `compare.py` 의 `DELIBERATE` 에 이유와 함께
적는다. 거기 없는 차이는 전부 사고다. 다만 `DELIBERATE` 는 **부분 문자열로
면제**하므로, 면제된 스크립트가 나중에 깨지면 자가 못 잡는다. 그 자리를
받쳐 주는 것이 아래 `onclick` 11개 브라우저 확인이다.

### 이 자가 못 재는 것

**인라인 `<style>` 안의 내용은 안 잰다.** `compare.py` 는 `<script>` 본문만
모으고 `<style>` 은 태그만 세므로, `compare-all` 은 `PAGE_CSS` 가
통째로 달라져도 그대로 나온다 — `url(/opt/...)` 이 `url(/img/...)` 로
되돌아가 15MB 짜리 그림이 살아나도 통과한다. 그 자리를 막는 것이 `port.py`
가 쓰기 직전에 거는 `/img/` → `/opt/` 치환이다.

**`onclick` 은 PHP 에서 HTML 에 남고 React 에서는 안 남는다.** 그래서
양쪽 HTML 이 같아도 동작이 안 붙어 있을 수 있다. 실제로 그렇게 빠진 게
있었다 — 모바일 서브메뉴의 `toggleSubMenu(this)`.

`compare.py` 는 PHP 쪽 `onclick` 을 목록으로 뽑아 준다. 그 목록은
브라우저에서 하나씩 눌러 확인해야 한다. intro.php 기준 11개, 전부 확인:

```
btn_header_cta   → 모달 열림                    block
m_menu_btn       → 모바일 메뉴 active           true
a.m_main_a ×5    → aria-expanded false → true   5/5
m_btn_contact    → 메뉴 닫히고 모달 열림        layer=false overlay=block
dv_btn_close     → 모달 닫힘                    none
dv_authbtn ×2    → React 핸들러 붙음
```

### React 가 PHP 를 그대로 못 받는 자리

| PHP | React | 어떻게 옮겼나 |
|---|---|---|
| `href="javascript:void(0);"` | **막는다.** href 를 `javascript:throw new Error(...)` 로 바꿔 버려서, 아무 일도 없던 것이 예외를 던진다 | `#` + `preventDefault()` (`SubMenuToggle.tsx`) |
| `onclick="fn()"` 문자열 | JSX 속성으로 못 넘긴다 | 클라이언트 컴포넌트가 `window[name]` 을 찾아 부른다 |
| `onerror="this.src=..."` | 같은 이유 | `FallbackImage.tsx` |
| `asset_url()` 의 `?v=mtime` | 없다 | CSS 3개뿐. 고치고 화면이 그대로면 이것부터 의심 |

## 문의 모달

`header.php` 의 모달을 그대로 옮겼다. 여는/닫는 동작과 전송은
`web/components/headerAssets.ts` 의 jQuery 가 맡는다 — PHP 와 같은 코드다.
바뀐 것은 전송 대상뿐이다.

```
PHP   POST /mail_send.php   form-urlencoded
Next  POST /api/inquiry     JSON   ← next.config.mjs 의 rewrite 가 Nest 로
```

칸 이름(`user_name`·`user_tel`·`user_type`·`user_msg`)과 길이 한도
(200/50/5000), IP 별 속도 제한(분 5·시 30, `MAIL_RL_*`)은 `mail_send.php`
와 같게 맞췄다. 좁히면 PHP 로는 들어가던 문의가 이관 뒤에 거절된다.

브라우저는 `/api` 만 안다. Nest 가 어디 있는지는 `API_ORIGIN` 이 정한다.
게이트웨이나 프록시 뒤에 둘 때는 `TRUST_PROXY` 를 채워야 속도 제한이
IP 별로 동작한다 — 안 그러면 전부 프록시 IP 하나로 합쳐진다.

## 안전한 기본값

환경변수를 빠뜨린 배포에서 **열리는 쪽으로 기울면 언젠가 열린다.** 그래서
빠뜨리면 닫히거나 아예 안 뜨도록 뒀다.

| 값 | 없으면 |
|---|---|
| `IAM_ENFORCE_GATEWAY` | 검증을 **켠 것으로** 본다 (`!== 'false'`) |
| `IAM_GATEWAY_SECRET` | 검증이 켜져 있으면 **안 뜬다** |

`@Public()` 은 인증만 면제할 뿐 게이트웨이 가드는 통과하지 못한다. 그래서
공개 홈페이지가 직접 부르는 컨트롤러 둘(content·inquiry)에만
`@SkipGatewaySignature()` 를 붙였다. **표시하지 않은 새 경로는 자동으로
게이트웨이 뒤에 선다** — 표시를 떼면 403 이 되는 것을 확인했다.

바꿔 말하면 **지금 있는 컨트롤러는 전부 표시가 붙어 있어서, 게이트웨이
검증이 실제로 지키는 경로는 0개다.** `IAM_GATEWAY_SECRET` 이 부팅에
필요한 것은 모듈이 만들어지기 위해서지, 어딘가에서 그 값으로 서명을
맞춰 보기 때문이 아니다. 관리자 전용 경로가 생기는 날부터 의미가 생긴다.

`TRUST_PROXY` 는 홉 수(`1`)나 신뢰할 대역이다. **문자열 그대로 넘기면 안 된다** —
Express 는 `"1"` 을 홉 수가 아니라 IP `0.0.0.1` 하나를 믿는 목록으로 읽어서
결과적으로 아무것도 신뢰하지 않는다. `.env` 값은 항상 문자열이라 Nest 쪽에서
숫자로 바꿔 넘긴다(`trustProxyValue`). 바꾸지 않으면 IP 별 한도가 하나로
합쳐지는 것으로 검사에 잡힌다(돌연변이로 확인함).

속도 제한 저장소는 **프로세스 메모리**다. PHP 는 파일로 php-fpm 워커끼리
공유했다. **컨테이너를 한 개만 띄우기로 했으므로 이대로 둔다.** 여러 개로
늘리는 순간 IP 당 한도가 프로세스당 한도가 되므로, 그때 Redis 저장소로
바꿔야 한다.

## 알림은 페이지를 멈추지 않는다

원본은 문의 접수·로그인 실패를 브라우저 기본 대화상자로 알렸다. 그것은
**확인을 누를 때까지 페이지를 멈춘다.** 문의 모달이 닫히는 것도 뒤로 밀리고,
자동 확인 도구는 그 자리에서 통째로 멎는다(시연하다 실제로 막혔다 — 그래서
문의 성공 화면을 못 찍었다).

문구는 그대로 두고 화면 알림으로 바꿨다. 화면 **아래** 가운데에 띄운다 —
위쪽은 고정 헤더가 있어서 겹친다(처음에 겹쳤다). `role="status"` 를 달아
스크린리더도 읽게 했다. 기본 대화상자는 저절로 읽혔지만 이건 아니다.

## 게시판을 CMS 가 대체한다

공지·보도자료 화면이 읽는 곳을 사내 게이트웨이에서 CMS 로 옮겼다.

| | 전 | 후 |
|---|---|---|
| 목록·상세 | `notice_api.php` → 게이트웨이 | `/api/content/posts` → Directus |
| 글 주소 | 업스트림 번호(`?id=123`) | CMS 주소(`?id=<slug>`) |
| 쓰기·수정·삭제 | 사이트의 글쓰기 폼 | **관리 화면(Directus)** |
| 관리자 판별 | 사이트 IAM 로그인 | 없음 (공개 화면은 읽기만) |

### 이름이 이렇게 대응된다

| 화면이 쓰던 이름 | CMS |
|---|---|
| `isPinned` | `is_pinned` |
| `createdAt` | `published_date` (표시 날짜) |
| `startDate` · `endDate` | `published_date` 로 거른다 (`publish_at` 이 아니다) |
| `content` | `body` |
| `thumbnailImage` | `thumbnail` |
| `attachmentFiles` | `attachments` |

응답은 **번역을 펴서** 준다. Directus 는 `translations: [{...}]` 로 주는데,
화면마다 `[0]` 을 꺼내고 없을 때를 처리하면 같은 실수가 화면 수만큼 생긴다.
번역 행의 `id` 는 버린다 — 그대로 펴면 글 번호를 덮어쓴다.

요청 언어 번역이 없으면 **기본 언어로 떨어뜨린다.** 안 그러면 제목도 본문도
빈 글이 정상 응답으로 나가고 화면에는 빈 줄만 남는다.

한 쪽 크기는 서버가 정하고 `pageSize` 로 알려 준다. 화면이 숫자를 박아 두면
서버가 바꿀 때 마지막 쪽이 조용히 사라진다.

### 표시 날짜는 필수다

비워 두면 목록이 뒤집힌다. 정렬이 `-published_date` 인데 Postgres 는 내림
차순에서 NULL 을 맨 앞에 놓는다 — **날짜 없는 글이 최신 글을 제친다**(실측,
브라우저에서 확인). 그래서 not null 로 잠갔다. 기존 행은 `schema.py` 의
`backfill_date()` 가 먼저 채운다.

### 첨부

`posts` 에 첨부가 없었다. 중간 테이블(`posts_files`)과 관계 두 개를 만들어
붙였다 — 파일 여러 개는 uuid 컬럼 하나로 안 되고, 필드만 만들면 관리 화면에
빈 칸만 나온다. **권한을 세 군데에 줘야 한다**: 마케팅 역할(`roles.py`),
백엔드 서비스 계정(`service_account.py`), 그리고 컬렉션 자체. 서비스 계정을
빠뜨리면 첨부가 **오류 없이 빈 배열**로 온다 — 글은 보이는데 첨부만 사라진다
(실제로 당했다).

관계에 `one_deselect_action: delete` 를 건다. 기본값으로 두면 첨부를 떼기만
했을 때 `posts_id` 가 NULL 인 고아 행이 쌓인다.

파일은 `/api/content/assets/<uuid>` 로 나간다. 브라우저를 Directus 로 직접
보내지 않는다 — 운영에서 Directus 가 바깥에 열려 있으리라는 보장이 없고,
열어 두면 파일 목록 전체가 노출된다.

**uuid 모양만 보고 흘려보내면 안 된다.** 서비스 토큰은 `directus_files`
전체를 읽을 수 있어서, 주소만 알면 초안 글의 첨부도 게시판과 무관한 파일도
다 나간다. 그래서 "게시된 글이 실제로 가리키는 파일"만 통과시킨다
(`fileIsPublic()`). 새 화면이 다른 컬렉션의 이미지를 쓰기 시작하면 **거기에
추가해야 한다** — 안 하면 404 가 된다. 조용히 새는 것보다 눈에 띄게 깨지는
쪽이 낫다.

가져오기에 실패하면 밖으로는 404 로 답하고 **진짜 코드는 로그에 남긴다.**
권한 사고가 "없는 파일"로 보이면 원인을 못 찾는다. 서버가 죽은 것(5xx)만
502 로 구분한다.

### 글쓰기 폼을 막았다

`notify_form.php` 는 옛 게시판 백엔드로 저장한다. 게시판이 CMS 로 옮겨간
뒤에도 그대로 두면 **글을 써도 사이트에 안 나오고 어디로 갔는지도 안 보인다.**
조용한 유실이라 저장 경로를 끊고 관리 화면으로 안내한다. 주소는 살려 둔다
(북마크·이력). 관리 화면 주소는 `web/.env.local` 의 `CMS_ADMIN_URL` 이다.

### 이 작업이 못 막는 것

- **옛 글 주소가 안 살아난다.** 예전 `?id=<업스트림 번호>` 링크는 CMS 번호와
  맞지 않는다. 내용 자체가 옮겨 오는 것이라 매핑표 없이는 복원할 수 없다.
- **`public_api.py` 의 공개 플로우와 Public 정책은 은퇴시키지 않았다.**
  Nest 는 서비스 토큰으로 직접 읽으므로 플로우를 쓰지 않는다. 지우는 것은
  되돌리기 어려운 작업이고 스모크 109건이 그 위에 서 있다 — 별도 단계다.
- 옛 게시판에 쌓인 실제 글을 CMS 로 옮기는 **데이터 이관은 포함되지 않았다.**
  구조만 바꿨다.
- 잘못된 `startDate`/`endDate` 는 **오류 없이 무시한다.** 원본 PHP 가
  `preg_match` 로 거르고 넘어가던 것을 그대로 뒀다 — 동작을 바꾸면 이관
  대조가 깨진다.

## 주소에서 `.php` 를 뺐다

폴더 이름이 곧 주소다. `app/page/company/intro/page.tsx` →
`/page/company/intro`. 옛 주소 `…intro.php` 는 308(영구)로 여기 넘어온다.

**옛 주소를 버리지 않는 이유**는 검색에 쌓여 있어서다. **영구(308)로 주는
이유**는 되돌릴 계획이 없어서다 — 임시로 두면 검색엔진이 `.php` 를 계속
색인한다.

목록은 `lib/phpRoutes.mjs` 한 곳에 있다. `next.config.mjs` 의 리다이렉트도,
`scripts/compare-all.sh` 의 검사 대상도 여기서 읽는다. 두 군데 적으면 새
페이지를 넣을 때 한쪽만 고쳐 놓게 된다.

**홈은 폴더로 두지 않는다.** `/index.php` 는 `/` 로 넘기는 308 인데,
`app/index.php/page.tsx` 가 생기면 파일이 리다이렉트를 이겨서 홈이 조용히
두 개가 된다.

### 하위 메뉴 판정이 "정확히 같은 주소" 로 바뀌었다

PHP 는 `strpos($current_uri, $sub['l'])` 로 현재 위치를 봤다. `.php` 가
붙어 있을 때는 그것이 곧 정확한 일치와 같았다. 확장자를 떼면
`/page/tech/patent` 가 `/page/tech/patent_old` 의 앞부분이 되어 버려서,
부분 일치로 두면 `patent_old` 에서 없던 표시가 생긴다. 그래서
`lib/menu.ts` 의 `isSubActive` 는 정확한 일치다. 대분류(`isActive`)는
`company`·`tech` 같은 조각이라 그대로 부분 일치다.

## 채팅 위젯은 도메인 락에 걸린다

`footer.php` 와 `web/app/layout.tsx` 가 같이 싣는 `workspace.growchat.co.kr/widget.js`
는 **현재 도메인이 허용 목록에 있어야만 화면에 뜬다.**

```js
BYPASS_HOST = /(^|\.)drvalue\.co\.kr$/        // 이 도메인만 무조건 통과
// 아니면 물어본다
GET api.growchat.co.kr/api/serv/auth/v1/tenant/default/domain-lock/request-allowed
    x-tenant-code: drvalue
```

실측:

| 도메인 | 응답 | 결과 |
|---|---|---|
| `localhost:3400` | `data:false` | 안 뜬다 (로컬에서 위젯이 안 보이는 이유) |
| `drvalue.co.kr` | `data:true` | 뜬다 |

**배포 때 걸린다.** 새 서버를 다른 도메인에 올리면 스크립트는 실행되는데
(`window.__MY_CHATBOT_WIDGET__` 는 생긴다) 단추가 안 그려진다. 콘솔에
`[widget] 허용되지 않은 도메인 — 위젯 미표시` 만 남고 오류는 없다.
**growchat 쪽에 그 도메인을 등록해야 한다.** 코드로 못 고친다.

## 그림은 줄인 것을 쓴다

운영 `/img/` 의 히어로 사진들이 **8000px, 한 장에 9~15MB** 다. 320px 높이
띠의 배경으로 쓰는 그림이다. 운영 파일을 고치면 PHP 쪽도 같이 바뀌므로
건드리지 않고, `web/public/opt/` 에 1920px 로 줄인 것을 두고 Next 만 그쪽을
본다. **대조는 `scripts/compare.py` 의 `SAME_IMAGE` 가 두 주소를 같은 것으로
본다** — 보이는 그림이 같은 것만 거기 넣는다.

| | 원본 | 줄인 것 |
|---|---|---|
| `main_bg_03.jpg` | 15.0 MB | 0.27 MB |
| `main_bg_02.jpg` | 9.3 MB | 0.29 MB |
| `main_bg_04.jpg` | 5.8 MB | 0.28 MB |
| `logo.png` (4544×1400, 높이 30px 로 그린다) | 2.2 MB | 0.02 MB |

한 화면이 받는 그림의 합:

| | 전 | 후 |
|---|---|---|
| `/` | 2.2 MB | **0.02 MB** |
| `/page/business/max` | 11.4 MB | **1.85 MB** (제품 화면 11장을 새로 넣고도) |
| `/page/company/intro` | 3.7 MB | **0.42 MB** |
| `/page/support/notice` | 9.3 MB | **0.31 MB** |

줄였더니 오히려 커진 것(`deshboard_mobile`, `popup_visual`)은 원본이 이미
작아서다 — 그런 것은 안 만든다.

## 제품 화면은 실제 캡처를 쓴다

`web/public/screens/` 에 실제 M.AX 화면 캡처가 있다. 시안의 점선 상자
("화면 캡처") 자리에 **내용이 맞는 것만** 넣었다 — 가짜 상자는 "미완성" 으로
읽힌다.

출처는 둘이다.

- `cos-*` · `form-*` · `pcb-spec` · `pcb-array` · `pcb-process` · `knowledge-ai` ·
  `growchat` — 접은 방향에서 받아 둔 것인데 아무도 안 쓰고 있었다.
- `pcb-dash` · `pcb-spec-form` · `pcb-spec-status` · `pcb-lamination` ·
  `pcb-workorder` · `pcb-defect` · `pcb-reinput` · `pcb-inspect` · `pcb-ship` ·
  `pcb-collect` · `pcb-stock` · `pcb-kpi*` — **제품을 직접 띄워서 찍었다.**

직접 찍는 방법은 이렇다. 제품 저장소(`smart-front`)에 시연용 가짜 백엔드
(`demo/mock-server`)가 들어 있다. 목서버를 띄우고, 앱을 그 주소로 물린 뒤,
playwright 로 화면을 돈다. 쿠키 네 개(`smart-jwt-token=demo-token`,
`growxd_visited`, `GROWXD_MES_VERSION=pcb`, `thema=light`)를 넣어야 로그인을
건너뛰고, 주소는 `/{basePath}/_tdemo/...` 다 — 테넌트 세그먼트가 빠지면
`tenant-not-found` 로 튕긴다.

**목서버 데이터는 전부 합성이다** — 테넌트는 `데모전자(주)`, 사용자는
`demo.admin`, 메일은 `@example.co.kr`. 실제 거래처나 실제 단가가 아니다.
운영 테넌트에서 찍으면 안 된다.

두 가지를 실제로 밟았으니 적어 둔다.

- ant 의 체크박스는 `opacity: 0` 이라 playwright 가 "안 보인다" 며 안 누른다.
  좌표로 눌러야 한다.
- 「계산」·「사양 등록」 같은 버튼은 화면 오른쪽 끝에 있어 창이 좁으면
  프레임 밖이다. 폭을 2080px 로 잡아야 눌린다.

같은 저장소의 `demo/out/verify/` 에 화면처럼 보이는 파일 54장이 있는데
**쓰면 안 된다.** 홍보 영상에서 뽑은 스틸이라 아래 20%를 자막 바가 덮고
있고, 가장자리에 노트북 목업 비네팅과 마우스 커서가 박혀 있다.

이 화면들은 표가 빽빽한 업무 화면(1600px)이라 글 옆에 줄여 넣으면 무엇이
적혀 있는지 못 읽는다. 그래서 **눌러서 원래 크기로 보는 창**을 붙였다.
Esc 로 닫고, 여러 장이면 좌우 화살표로 넘긴다.

본문의 핵심어에는 밑줄이 그어진다. 문구 안에 `**...**` 로 표시해 두면
`MaxTabs.tsx` 의 `mark()` 가 `<em class="mx_hl">` 로 바꾸고, 그 덩어리가
화면에 들어올 때 왼쪽부터 그어진다. 마크다운 라이브러리는 안 쓴다 — 이 표시
하나만 본다. `prefers-reduced-motion` 이면 처음부터 그어진 상태로 둔다.
AI 단계 목록은 남색 판 위라 흰 띠로 따로 뒤집는다(붉은 띠는 안 읽힌다).

그 창은 **`document.body` 로 옮겨 그린다(portal).** 페이지 안에 두면
transform 이 걸린 조상(패널 등장 애니메이션)이 `position: fixed` 의 기준이
되어 창이 그 안에 갇힌다 — 실제로 패널 크기만큼만 덮였다. 같은 이유로
`@keyframes mxfade` 의 끝 상태에는 `transform` 을 적지 않는다.

## 검색엔진이 읽을 것을 새로 넣었다

옮기기 전 사이트는 **17장이 전부 같은 제목**(`디알밸류 - AI 제조 솔루션`)을
썼고 설명문·공유카드·대표주소가 하나도 없었다. sitemap 도 robots.txt 도
구조화 데이터도 없었다. 운영본을 직접 받아 확인한 값이라 **이관하며 잃은 게
아니라 원래 없던 것**이다.

- 페이지마다 제목·설명문을 손으로 썼다(`lib/seo.ts` 의 `pageMeta`).
  설명문은 **그 페이지에 실제로 적혀 있는 내용**을 줄여 쓴다. 없는 말을
  넣으면 검색 결과와 화면이 어긋나 되레 손해다.
- `app/sitemap.ts` 는 주소를 손으로 안 적는다. `lib/phpRoutes.mjs` 가 이미
  단 하나의 목록이라 거기서 읽는다.
- `app/robots.ts` 는 `NOINDEX=1` 이면 통째로 막는다. 미리보기 사본이
  색인되면 진짜 사이트와 경쟁한다.
- 회사 정보(`components/OrgJsonLd.tsx`)는 **푸터에 이미 있는 값만** 쓴다.

**그래서 원본과 글자 단위로 같지 않다.** `compare.py` 가 이것을 고의로 바꾼
것으로 알고 지나간다(`SEO_META_NAME`·`SEO_LINK_REL`). 검사를 끈 게 아니라
무엇을 왜 넣었는지 적어 둔 것이다.

## 등장 효과가 본문을 감추고 있었다

AOS 는 요소를 `opacity: 0` 으로 감춰 두고 화면에 들어올 때 걷어낸다.
스크립트가 늦거나 실패하면 **영영 안 걷힌다.** JS 를 끄고 재 보니
회사소개가 백지였다 — 글자 592자는 DOM 에 멀쩡히 있었다. 운영 중인 PHP
사이트도 9개 중 9개가 똑같이 안 보였다.

`public/css/style.css` 에서 **감추지 않고 조금 내려 두기만** 하게 뒤집었다.
JS 가 죽어도 화면은 멀쩡하고, 돌면 제자리로 올라온다. 옮겨지는 거리도
100px → 16px 로 줄였다. 움직임 줄이기 설정도 여기서 한 번에 지킨다
(예전에는 17곳 중 3곳만 지켰다).

실측: JS 끈 회사소개가 **안 보임 9개 → 0개.**

## 증서 정보를 그림 밖으로 뺐다

특허·저작권 증서의 번호·날짜는 그림 안 글자라 검색엔진이 못 읽었다.
증서 원본을 읽어서 글자로 뺐다. 지어낸 값은 없다.

두 가지를 바로잡았다.

- **특허 6건 중 등록은 1건, 나머지 5건은 출원이다.** 예전에는 `PATENT
  01~06` 으로만 매겨서 여섯 건 다 등록된 것처럼 읽혔다.
- **저작권 날짜가 등록일이 아니었다.** 1·5번은 증명서 발급일, 2·3·4번은
  창작일이 적혀 있었다. 등록증의 등록연월일로 고치고 창작일은 따로 적는다.

**특허 2·3번은 증서 그림을 안 건다.** 출원사실증명원이라 특허청 양식에
발명자 주민번호 앞자리·자택 주소·개인 휴대전화가 표로 들어가 있다.
공개 사이트에 올릴 수 없다. **운영 서버에는 아직 올라가 있다** —
`drvalue.co.kr/img/patent2.png`, `patent3.png` 를 내려야 한다.

같은 번호가 「찾아오시는 길」 의 대표전화로도 적혀 있었다. 푸터와 같은
`031-400-3880` 으로 맞췄다.

## 로그인을 뺐다

관리자 로그인은 CMS 관리 화면으로 간다. 옛 게시판 API(`notice_api.php`)와
IAM 로그인 콜백은 Nest 에서도 지웠다 — 부르는 화면이 없다.
`compare.py` 의 `PHP_ONLY_CLASS` 가 원본 쪽에서 그 단추를 떼어낸다.

## 브랜드 필름을 누를 때 불러온다

회사소개만 JS 가 다른 페이지의 3.6배였다(1,345KB vs 370KB). 유튜브
플레이어가 페이지를 열자마자 통째로 실렸다. 표지 그림만 먼저 놓고 누를 때
불러온다(`components/VideoFacade.tsx`). 실측 **1,345KB → 370KB.**

## 사진은 저장소 안에 둔다

바깥 주소(unsplash)에서 끌어오던 사진 4장을 저장소 안으로 들였다.
`web/public/photo/` 다. 바깥에서 끌어오면 그쪽이 바뀌거나 막힐 때 빈칸이
되고, 우리 쪽 최적화도 못 건다.

| 자리 | 그림 | 왜 |
|---|---|---|
| 비전 | `cnc-machine.jpg` | 로봇 사진이었다. 제조 장비가 맞다 |
| AI 솔루션 | `dev-work.jpg` | 보라색 AI 덩어리였다. 실제 개발 장면이 맞다 |
| 스마트팩토리 | `factory-line.jpg` | 서버실이었다. 제조 라인이 맞다 |
| 회사소개 예비 | `dev-work.jpg` | 제품 화면이 안 뜰 때만 쓰는 자리 |

출처는 Pexels 이고 무료 라이선스다. **여전히 남의 사진이다** — 고객사
공장 사진이나 사내 사진이 생기면 그것으로 바꾼다. 특히 스마트팩토리
자리의 실제 고객사 공장 내부가 값어치가 크다.

`.detail_img img` 류에 `height: auto` 가 빠진 자리가 네 곳 있었다.
없으면 `img` 의 `height` 속성이 그대로 먹어 그림이 늘어난다(실측:
1400×933 짜리가 580×933 으로 찌그러졌다). 전부 채웠다.

## 전환에 관한 결정

정본은 `docs/tracking/decisions/` 다. 여기는 요약이다.

| 물음 | 답 |
|---|---|
| 절대 깨지면 안 되는 것 | **게시판 글, 문의 접수.** 나머지는 깨져도 고치면 된다 |
| 전환 방식 | **날짜를 정해 한 번에** 바꾼다. PHP 와 Next 를 나란히 돌리지 않는다 |
| 배포 위치 | **다른 서버에 따로** 올린다 |
| 서비스 토큰의 노출 범위 | 토큰을 쥔 쪽이 Directus 파일 목록 전체를 볼 수 있다는 것을 **알고 그대로 간다** |

한 번에 바꾸기로 했으므로 PHP 쪽 `header.php` 에는 새 메뉴 항목(제조AI)을
넣지 않는다. 그래서 옮긴 페이지의 헤더는 원본과 그 한 줄이 영구히 다르다 —
헤더 전체를 `compare.py` 의 `REDESIGNED` 가 떼어 내고 `check-header.py`
가 대신 본다.

주소로는 구분이 안 되는 항목(부모와 같은 주소를 쓰는 하위 메뉴)은
마크업에 `data-next-only` 를 달아 두고 그 표시로 떼어낸다. 상자까지
새것이면 상자에도 단다 — 안의 항목만 떼면 빈 상자가 남아 그게 다시
차이가 된다.

## 검사

| | 무엇을 본다 | 현재 |
|---|---|---|
| `cms/scripts/smoke.sh` | Directus 권한 · 예약 게시 · 다국어 · 공개 엔드포인트 | 109/109 |
| `cms/scripts/verify-iam-bridge.sh` | IAM 다리 전체 흐름 (가짜 IAM 필요) | 11/11 |
| `api/scripts/verify.sh` | Nest 가 CMS 를 읽고 쓰는 것 + 게시판 + 기본값이 닫힌 쪽인가 | 46/46 (기대값 — 이번에는 CMS 없이 못 돌렸다) |

`verify.sh` 의 문의 구간은 POST 를 3번 쓰고 한도는 분당 5회다. **1분 안에
두 번 돌리면 그 구간이 `판정불가` 로 빠진다** — 통과도 실패도 아니다.
예전에는 429 본문을 읽고 "내부 상태가 샌다" 로 엉뚱하게 실패했다.
| `web/scripts/compare-all.sh` | 옮긴 페이지가 PHP 원본과 같은가 | **통과 기준에서 뺐다** (3/14 — 헤더·모달·홈을 일부러 바꿨다. `docs/tracking/decisions/` 참고) |
| `web/scripts/check-a11y.py` | 문의 모달의 라벨·입력칸 묶임 (19장) | 266/266 |
| `web/scripts/check-assets.py` | 화면이 부르는 파일이 실재하나 | 51개, 빠진 것 0 |
| `web/scripts/check-home.py` | 홈에서 원본이 안 없어졌나 + 새 구역이 그려지나 + 시연용 글이 안 남았나 | 21/21 |
| `web/scripts/check-header.py` | 위쪽 탭 막대 + 현재 위치 줄 — 대조가 둘을 떼므로(REDESIGNED) 그 자리를 대신 본다 | 103/103 |
| `web/scripts/check-src.py` | PAGE_CSS 안에 백틱이 섞였나 | 7개 확인, 0건 |
| `cms/scripts/import_board.py` | 운영 게시판 글을 CMS 로 옮긴다 | 로컬 Directus 에 5건 (새 서버 쪽은 0건 — 전환 당일 다시 돌릴 것) |
| `npx next build` · `npx tsc --noEmit` | 운영 빌드가 되는가 | 통과 |

`check-src.py` 는 `compare-all.sh` 가 먼저 돌린다. `PAGE_CSS` 는 템플릿
문자열이라 주석에 백틱을 하나 넣으면 문자열이 거기서 끊겨 페이지가 통째로
문법 오류가 된다 — 그러면 모든 페이지가 500 이 되어 "전부 다름" 으로 나오고
진짜 원인이 안 보인다(두 번 겪었다).

`compare-all.sh` 는 `.php` 가 붙은 **옛 주소**로 부른다. PHP(:3300)는 그
주소로만 답하고 Next(:3400)는 308 로 새 주소에 넘긴다 — `compare.py` 가
308 을 따라가므로 한 주소로 양쪽을 다 잰다. 파이썬 3.9 의 `urllib` 은 308 을
안 따라가서 `redirect_request` 를 덧씌워 놨다.

꾸밈 도구(Tailwind)를 들인 것이 옮긴 페이지를 안 망가뜨렸다는 근거는
**도구를 넣은 뒤에도 대조가 그대로였다는 것**이다(당시 17/17). 그 전에 한 번 "넣고도 17/17" 이라고 적은
적이 있는데 그건 틀렸다 — 그때 :3400 을 잡고 있던 것은 죽지 않은 옛 서버라
새 꾸밈이 실린 적이 없었다.

속도 제한 검사는 창을 태워서 1분 안의 재실행을 막는다. 기본은 꺼져 있고
`RL_CHECK=1 bash scripts/verify.sh` 로 켠다(그때 20/20).

`api/scripts/verify.sh` 는 "응답이 200 이다" 로 끝내지 않는다. 문의 저장은
컨트롤러가 없는 필드에 쓰는 바람에 조용히 깨져 있었고, `Promise.allSettled`
가 그 실패를 삼켜서 화면에는 `ok` 가 떴다. 그래서 **CMS 에 행이 실제로
생겼는지, 값이 원문 그대로인지**까지 본다.

Directus 는 **모르는 필드를 조용히 버린다.** 기본값이 있는 필드면 오류도
안 난다 — 그래서 "저장됐다" 가 아니라 "값이 맞다" 로 검사해야 한다.

## 로컬

```
cms  docker compose up -d      → http://localhost:3350
api  npm run build && node dist/main.js → http://localhost:3500
web  npm run build && npm start        → http://localhost:3400
```

`.env` 는 저장소에 넣지 않는다. `api/.env.example` 을 복사해서 채운다.
`IAM_ENFORCE_GATEWAY` 의 기본값은 `true` 다 — 게이트웨이 없이 로컬에서
띄울 때만 각자 `.env` 에서 `false` 로 덮는다.
