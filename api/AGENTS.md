# api — 백엔드

## 맡는 것

공개 화면이 부르는 HTTP 전부(게시판 읽기, 문의 접수 = 메일 + DB 저장, IP 별
속도 제한)와 **관리 화면의 API** (`/api/admin/*`: 글·파일·문의 CRUD, 사내 IAM
로그인과 인가). DB 는 여기만 부른다.

## 맡지 않는 것

- 화면을 그리지 않는다. 관리 화면도 `web/app/admin` 이 그린다.
- 사람을 인증하지 않는다. 「누구냐」와 「관리자냐」는 사내 IAM 이 답한다(토큰 최상위
  `role`). `admin_users` 는 그 판정을 받아 적는 거울이고, CMS 안에서 만질 범위만 정한다.

## 코드 모양 — drvalue-bmes-backend 를 따른다

```
src/
├── main.ts
├── app/app.module.ts
├── common/                      # bmes 의 glb-commons 자리. 공용 인프라
│   ├── config/app-config.ts     # 환경변수를 읽는 유일한 곳
│   ├── error/                   # ICommonErrorCode · CommonError(createByErrorCode) · COMMON_* 코드
│   │                            #   · 전역 CommonExceptionFilter · ValidationPipe 실패 변환
│   │                            #   · @ServiceException(서비스 예외 → 에러 코드)
│   ├── response/                # IApiCommonResponse (응답 본문 모양)
│   ├── typeorm/                 # ITransactionContext · @TransactionContext() · @Transactional() · BaseRepository
│   ├── dto/                     # 검증 + Swagger 를 한 번에: IsString({ propertyName, … }) 등
│   ├── entity/                  # TypeORM 엔티티 (posts · posts_translations · posts_files · directus_files · inquiries · admin_users · admin_revisions · site_menu_items · site_menu_item_translations)
│   ├── database/                # TypeOrmModule.forRootAsync — synchronize 절대 끔 · 문맥 미들웨어
│   ├── session/                 # HMAC 세션 토큰 · 쿠키 파서 · 세션 쿠키 옵션(session-cookie.ts)
│   ├── revision/                # 변경 이력 기록기 (admin_revisions)
│   ├── image/                   # PNG·JPEG·WebP·GIF 치수 읽기
│   └── ncp-mail/                # 네이버 클라우드 메일
└── core/<기능>/
    ├── <기능>.module.ts
    ├── controller/<기능>-default.controller.ts
    ├── service/<기능>-default.service.ts
    ├── repository/<엔티티>-default.repository.ts   # 엔티티 하나당 하나
    ├── dto/controller-<기능>-default.dto.ts          # 요청(검증 + Swagger)
    ├── dto/controller-<기능>-default-response.dto.ts # 응답(Swagger + 엔티티 → 응답 변환 `from`)
    ├── error/<기능>.error.ts
    └── filter/                  # 그 기능에만 거는 예외 필터 (admin-auth 의 로그인 되돌리기)
```

기능: `content` · `inquiry`(공개) · `admin-auth` · `admin-post` · `admin-file` ·
`admin-inquiry` · `admin-schedule`(예약 게시 1분 cron) · `admin-revision` · `admin-user` ·
`admin-dashboard`(홈 요약 한 번에 — 범위가 못 보는 칸은 비운다)(관리) ·
`menu`(공개 `GET /api/content/menu` + 관리 `GET·PUT /api/admin/menu` — 한 모듈에 컨트롤러 둘) ·
`page`(페이지 글 — 관리 `admin/pages` + 공개 `content/pages`, 한 서비스).
**기준 모듈은 `core/admin-post`** 다. 새 모듈과 R1(나머지 모듈 전환)은 이 파일들을 그대로 따라 한다.
2026-09-22 에 bmes 를 재어 맞췄다(`apps/`, 아래 표). 아직 안 옮긴 모듈은 옛 모양이다.

| 층 | 규칙 | bmes 실측(apps) |
|---|---|---|
| 컨트롤러 | 서비스만 주입 · 로직 없음 · `@ApiTags` 1 + 핸들러마다 `@ApiOperation({ operationId, summary })` · `@TransactionContext() ctx` 를 서비스 첫 인자로 · `this.logger.log` 한 줄(개인정보·토큰 없이) | 304개 중 `@ApiTags` 303 · `@ApiOperation` 303 · 문맥 데코레이터 285 · `process.env` 1 · `res.cookie` 0 |
| 서비스 | `ctx: ITransactionContext` 가 첫 인자 · 공개 메서드마다 `@ServiceException({ errorCode })` + JSDoc · 쓰기는 `@Transactional()` · 질의를 조립하지 않는다(저장소의 이름 붙은 메서드나 `repository(ctx).find…`) | 429개 중 `@ServiceException` 204 · `@Transactional` 117 · `ctx` 272 · `.repository(ctx` 195 · `createQueryBuilder` 25 |
| 저장소 | `extends BaseRepository<E>` + `override repository(ctx) { return super.repository(ctx, E) }` · 여러 조건 질의는 이름 붙은 메서드(`findAdminPage` · `findMaxSort`) | 304개 중 상속 304 · `override repository(` 303 |
| DTO | 요청은 `common/dto` 의 `IsString({ propertyName, description, example, optional, max })` 류로 검증과 Swagger 를 한 번에 · 응답은 `*-response.dto.ts` 클래스 + `static from(entity)` | 172개 중 `IsString({` 154 |

- `@ServiceException` 을 위에, `@Transactional()` 을 아래에 붙인다. 안에서 던지면 롤백된 뒤 에러 코드가 된다.
  예상 못 한 실패용 코드는 `<기능>Error.<동작>_UNKNOWN`(5xx, 합니다체 문구)을 둔다.
- 트랜잭션은 bmes 의 typeorm-transactional(CLS) 대신 `dataSource.transaction()` 이다. 한 DB 라 테넌트가
  없고, 트랜잭션 manager 를 문맥(`ctx.manager`)에 실어 넘긴다 — 저장소의 `repository(ctx)` 가 그 manager 를 쓴다.
  변경 이력도 `revisionService.record(entry, ctx)` 로 같은 트랜잭션에 쓴다.
- 요청 밖(cron)에서는 `createTransactionContext(dataSource)` 로 문맥을 만든다(`admin-schedule`).
- Swagger: `/api/docs`(JSON `/api/docs-json`). `NODE_ENV=production`(api 이미지)에서는 안 뜬다.
- **컨트롤러는 서비스만 주입한다.** 규칙은 서비스에, 질의는 저장소에, 응답 모양은 응답 DTO 의 `from` 에.
- **에러는 `error/*.error.ts` 의 코드 객체를 `CommonError.createByErrorCode()` 로 던진다.**
  Nest 내장 예외를 직접 던지지 않는다. 코드 한 건은 `{ code, message, detail, status }`:
  - `message` 는 **화면에 그대로 뜨는 말**이다. 합니다체, 마침표로 끝낸다(「글을 찾을 수 없습니다.」).
    환경변수·칸 이름·플래그·테이블 이름은 여기 쓰지 않는다.
  - `detail` 은 개발자용 원인이다. 응답에 안 실리고 5xx 로그에만 남는다.
  - 기능 코드가 없는 실패(없는 주소·검증·429·500)는 `common/error/common.error.ts` 의 `COMMON_*`.
- **응답 본문은 `{ data: null, status, resultCode, message, path, timestamp }`**(전역
  `CommonExceptionFilter`). `resultCode` 는 코드 객체의 `code`. 로그에는 쿼리 없는 `path` 만.
- **DTO 검증 문구도 화면에 뜬다.** 사용자가 틀릴 수 있는 칸은 decorator 에 한국어 `message`
  를 적는다. 적지 않은 칸은 「입력한 내용을 다시 확인해 주세요.」로 나간다(class-validator
  기본 영어 문구는 안 나간다). 빈 칸은 길이 규칙보다 「입력해 주세요」가 먼저다.
- **환경변수는 `common/config/app-config.ts` 에서만 읽는다.** 다른 파일에 `process.env` 를 쓰지 않는다.
- 테이블은 옛 관리 도구(Directus) 시절 이름 그대로다(`directus_files` 포함).
  `synchronize` 를 켜면 엔티티에 없는 칸을 지운다 — 스키마 변경은 `db/schema.sql`
  과 `db/migrations/*.sql`(여러 번 돌려도 같게) 로.
- 사내 IAM 패키지(`@drvalue-oss/iam-nestjs`)를 쓰지 않는다. 게이트웨이 뒤가 아니라서
  서명 검증이 지킬 경로가 없다. IAM 로그인은 공개 엔드포인트(`/auth/login` ·
  `/auth/token/exchange`)를 직접 부른다.
- 포맷은 `.prettierrc`(singleQuote, 세미콜론). bmes 와 같다.
- 주석은 계약과 함정만. 주석·문서는 한다체, 사용자에게 보이는 문구는 합니다체다.
- bmes 에 있지만 여기 없는 것: `x/default` + version 라우트(주소는 그대로 — 웹과 문서가 이 주소를 쓴다).
- bmes 와 다르게 하는 것(웹이 이 모양을 읽는다 — 바꾸면 화면이 깨진다):
  - 에러도 **실제 HTTP 상태**로 낸다(bmes 는 200 에 본문만 바꾼다). 관리 화면의 401 → 로그인 이동,
    공개 문의 폼의 429 분기, 속도 제한 약속이 상태 코드에 기댄다.
  - 성공 응답을 `successResponse({ data, status, resultCode, message })` 로 감싸지 않는다.
    `{ data }` · 목록 `{ data, total, page, pageSize }` · 지우기 `{ ok: true }` 그대로.
  - 칸 이름은 snake_case(DB 칸 그대로).
  - `@ServiceException` 이 원래 에러의 message 를 응답에 싣지 않는다(bmes 는 싣는다 — SQL 문구가 화면에 샌다).

## 관리 화면 인가

1. `/api/admin/auth/login` → IAM. `state` 는 `nonce.exp.sig` 로 서명해 쿠키와
   쿼리 양쪽에 싣는다(IAM 은 되돌려주기도 안 주기도 한다 — 실측).
2. 콜백에서 code 를 토큰으로 바꾸고 claim(`sub` · `email` · `role` · `groups`)을 읽는다.
3. **입장은 IAM 이 정한다**(결정 0015). 토큰 **최상위** `role` 이 `ADMIN`·`PLATFORM_ADMIN`
   인 사람만 들어온다(`service/authorize.ts` 의 `isIamAdmin`). 그룹 안의 role(OWNER·ADMIN)은
   보지 않는다 — 누구나 자기 워크스페이스에서는 OWNER 다.
   - 관리자면 `syncAdmin` 이 `admin_users` 를 받아 적는다: 행이 없으면 만들고(범위 `admin`),
     `enabled=true` · `iam_sub` · `last_login_on` 을 갱신한다. 범위는 처음에만 정하고 그 뒤로는
     「권한」 화면에서 바꾼 값을 지킨다.
   - 관리자가 아니면 `markNotAdmin` 이 행을 끄고(있으면) `403 ADMIN_AUTH_NOT_ALLOWED`.
     로그는 `denied: IAM 관리자가 아니다 role=… groups=[…]` 한 줄.
   - login·callback 은 브라우저가 이동해 오는 주소라, 실패하면 JSON 대신
     `/admin/login?error=<resultCode>` 로 돌려보낸다(`filter/admin-login-redirect.filter.ts`).
     문구는 로그인 화면이 코드로 고른다 — 주소에 실린 글을 띄우지 않는다.
4. 세션은 HMAC 쿠키 `dv_admin`, 30분(옵션은 `common/session/session-cookie.ts`).
   `AdminSessionGuard` 가 60초마다 `admin_users` 를 다시 본다 — 빠짐·꺼짐은 거부,
   범위 변경은 따라온다. IAM 에서 관리자를 내리면 그 사람의 다음 로그인 시도에 행이 꺼지고,
   살아 있는 세션은 30분 안에 끝난다.
5. 범위: admin 전부 · marketing 채용(`recruit`) 빼고 · hr 채용만(`service/board-access.ts`).
   `@AdminRoles()` 가 붙은 핸들러는 그 역할만. **역할 없는 세션은 거부한다** — 조용히
   admin 으로 올리지 않는다.
6. 변경 이력: 글 만들기·고치기·지우기가 `admin_revisions` 에 actor · before · after 를 남긴다.

**IAM 을 안 거치는 문은 없다.** 토큰 우회 경로를 두지 않는다. 검사(verify.sh)는
`ADMIN_SESSION_SECRET` 으로 같은 모양의 세션을 만들어 들어간다 — 그 키를 가진 사람은
이미 서버 관리자다.

## 늘 지켜야 하는 것

- **빠뜨리면 닫힌다.** `ADMIN_SESSION_SECRET` 이 없으면 안 뜬다. 쿠키 Secure 는
  콜백이 https 면 켠다. 이 방향을 뒤집지 않는다.
- **새 관리 컨트롤러는 `@UseGuards(AdminSessionGuard)` 뒤에 둔다.** 공개 컨트롤러
  (content · inquiry)는 무인증이다 — 새 공개 경로는 정말 익명이어야 하는지 먼저 판단한다.
- **역할이 있는 자원은 서비스에서도 막는다.** 게시판은 `assertBoard` 로 — 목록·낱개
  읽기까지. 가드만 믿으면 새 핸들러에서 빠진다.
- **공개 파일은 관문을 거친다.** `/api/content/assets/:id` 는 게시된 글이 가리키는
  파일만 낸다. 업로드 폴더에는 초안 첨부도 있다.
- **문의 칸 이름과 길이 한도를 좁히지 않는다.** 이름 200 · 연락처 50 · 내용 5000.
- **`TRUST_PROXY` 는 숫자로 넘긴다.** 문자열 `"1"` 은 아무것도 안 믿는 목록이 된다
  (compose 가 `1` 을 준다).
- **문의 이메일은 필수다**(`user_email`, 255자). 관리 목록에서 mailto 로 답장한다.
- **토큰·code 를 로그에 찍지 않는다.** 거부 로그는 그룹 id·역할까지만. 요청 주소는
  `request.url` 이 아니라 `request.path` 로 남긴다(콜백 쿼리에 code 가 있다).

## 방식

- **페이지 글(`core/page`)** — 게시판이 아닌 장의 글. 한 장 · 한 언어가 `page_contents` 한 행(jsonb).
  칸 구조(스키마)는 `core/page/schema/<key>.schema.ts` 한 곳에만 있고, 관리 화면은 그 구조를 받아
  폼을 그린다. 저장은 `service/page-content.ts` 가 검사한다: 모르는 칸 거부 · 길이·필수·pattern ·
  richtext 허용 태그(`richtext.ts`, sanitize-html) · link 는 `/`·`https://`·`mailto:`·`tel:` 만 ·
  image 는 `{ id, alt }` 이고 미디어에 있는 파일만, 치수는 저장할 때 api 가 적는다.
  칸 종류: text · textarea · richtext · image · link · list(min·max·item) · group.
  - image 는 기본 글(씨앗)에 한해 사이트에 이미 있는 그림도 가리킨다: `{ id: null, src: '/screens/…', width, height }`.
    폴더는 screens·photo·brand·img·icon·images 만, `..` 금지, 개인정보 증서 원본(patent2·patent3)은 거부. 치수는
    보낸 값 그대로(api 가 web/public 을 못 읽는다). 관리 화면에서 새로 올리면 `{ id }` 로 바뀐다.
  - **소개 장 15장**(E7 — 회사 안내·비전, M.AX 소개·PCB·화장품·MES AI·스마트 팩토리, AI 솔루션 개발·오토폼·
    컷온·CADON·채팅·한건·GrowTalk·GrowXD)은 `schema/intro-pages.schema.ts` 한 파일이다. 칸 묶음은
    `schema/parts.ts`(머리말·요약·화면 판·큰 문장·카드·기능 줄·게이지 탭·전/후)를 조립한다 — web 의
    `app/page/pageContentParts.ts` 가 같은 모양의 형·변환을 갖는다. 씨앗은 `db/migrations/0008`.
    허브 둘(M.AX 소개·AI 솔루션 개발)의 제품 카드·구역 제목은 하위 장의 머리말·요약을 읽는다(두 곳에 안 적는다).
    움직이는 시연·실제 응답 기록(한건 「모르면 모른다」 등)·흐름도(FlowBand)는 코드다.
  - 표 이름이 `pages` 가 아닌 이유: Directus 를 시험할 때 만든 `pages`·`page_blocks` 가 남은 DB 가 있다.
  - 새 장을 편집하게 만들기(E7·E8): ① `schema/<key>.schema.ts` 를 쓰고 `schema/index.ts` 에 더한다
    ② web 의 그 장 폴더에 `content.ts`(같은 모양의 기본 글 — 씨앗이자 api 가 죽었을 때의 예비) ③
    `web/scripts/page-seed.mjs` 의 PAGES 에 한 줄 → 돌려 나온 SQL 로 마이그레이션 ④ 장 화면이
    `cmsPageContent(key) ?? 기본 글` 로 그린다(`export const dynamic = 'force-dynamic'`) ⑤ verify 로
    「씨앗 글이 스키마를 통과한다」(GET 한 글을 그대로 PUT → 200)를 본다.
  - 페이지 그림은 공개 관문(`fileIsPublic`)과 미디어 「쓰이는 곳」에 잡히고, 강제 삭제는 그 칸의 id 를 null 로 바꾼다.
- 속도 제한 저장소는 프로세스 메모리다. 컨테이너를 늘리면 IP 당 한도가
  프로세스당 한도가 된다 — 그때 공유 저장소로 바꾼다.
- 칸 이름을 그대로 내보낸다(`is_pinned` · `published_date`). 예외 하나: `thumbnail`
  은 우리 주소 문자열로 바꾸고 치수는 `thumbnail_size` 에.
- 목록 순서는 서비스가 게시판별로 정한다. 증서·수행실적은 `sort`, 연혁은
  연도 내림차순 안에서 `sort`, 공지·보도는 고정 글 → 날짜.
- 공지·보도·뉴스의 대표 이미지(`thumbnail`)는 저장할 때 **본문의 첫 그림**으로 정한다
  (`/api/content/assets/<uuid>`, 한국어 본문 먼저). 보낸 `thumbnail` 은 보지 않는다. 본문에 그림이
  없으면 비운다. 증서(특허·저작권)만 `thumbnail` 을 직접 받는다.
- 글 저장은 첨부·증서 그림 파일이 아직 있는지 먼저 본다. 미디어에서 지운 파일을 폼이 들고 있다가
  저장하면 `409 ADMIN_POST_FILE_GONE`·`ADMIN_POST_THUMB_GONE`(예전에는 FK 에 걸려 500). 관리 화면은
  `resultCode` 로 그 칸을 짚는다(`AdminError.code`).
- 파일이 「쓰이는 곳」은 대표·공유 이미지 · 첨부 · 본문 그림을 글 단위로 센다. `force` 삭제는
  본문의 `<img>` 까지 걷어 낸다 — 남기면 글에 깨진 그림이 보인다.
- 업로드는 `AppConfig.uploadsDir` 폴더에 `<uuid>.<ext>` + `directus_files` 행(compose 는
  `/data/uploads`, 로컬은 저장소 `data/uploads`). 치수는 헤더에서 직접 읽는다. cwd 기준으로
  잡지 않는다(api/ 에서 띄우면 빈 폴더를 본다).
- 메뉴(`core/menu`)는 저장할 때 **전체를 한 번에** 바꾼다(지우고 받은 순서로 다시 넣는다 — 순서는 배열
  순서). 깊이 2 는 DTO 모양으로 막는다(하위 DTO 에 `children` 이 비어 있어야 한다 — 조용히 버리지 않고 400).
  링크는 모양만 본다(`/` 로 시작 · `//` 아님 · http(s)) — 사이트에 그 장이 있는지는 web 만 알아서 관리 화면이
  저장 전에 HEAD 로 확인한다. 표 이름이 `site_menu_*` 인 이유는 migrations/0006 머리말(옛 Directus 표와 겹친다).
  변경 이력은 collection `menu` · item `site` 한 줄(되돌리기는 아직 없다 — R1).
- 상수: IAM 주소 `https://iam.drvalue.co.kr` · 기본 언어 `ko-KR` · NCP 메일 주소 ·
  문의 한도 분 5 / 시 30. 환경변수로 빼지 않는다.

## 검사

```bash
npm run typecheck && npm run build
node --test src/common/typeorm/transactional.test.mjs src/core/admin-auth/service/authorize.test.mjs src/core/admin-user/service/last-admin.test.mjs src/core/page/service/page-content.test.mjs   # 32 (6 + 9 + 5 + 12)
bash scripts/verify.sh          # 238 통과 · 판정불가 1 (api:3500 + DB, .env 의 ADMIN_SESSION_SECRET 으로 세션을 만든다)
python3 ../web/scripts/check-copy.py   # 화면으로 가는 문구의 반말 0건
```

다른 api 를 재려면 `API_URL=http://localhost:3510`, 여럿이 동시에 돌리면 `VERIFY_EMAIL` 을 서로 다르게 준다.
api 를 docker 밖에서 띄울 때는 `PORT=… UPLOADS_DIR=<저장소>/data/uploads node dist/main.js`(cwd 는 api/).

verify.sh 는 픽스처를 관리 API 로 만들고 지운다. 검사 계정 `verify@drvalue.local` 을
`admin_users` 에 넣어 IAM 동기화를 흉내 내고, 같은 서명 키로 세션을 만든다. 끝나면 지운다.
판정불가 1건은 「마지막 전체 권한을 내리면 409」 — 실제 사람을 꺼야 잴 수 있어서
`last-admin.test.mjs` 가 규칙을 본다. 문의 구간은 1분 안에 두 번 돌리면 속도 제한에 걸려
판정 불가로 빠진다. 속도 제한 자체를 재려면 `RL_CHECK=1`.
