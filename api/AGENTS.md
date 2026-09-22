# api — 백엔드

## 맡는 것

공개 화면이 부르는 HTTP 전부(게시판 읽기, 문의 접수 = 메일 + DB 저장, IP 별
속도 제한)와 **관리 화면의 API** (`/api/admin/*`: 글·파일·문의 CRUD, 사내 IAM
로그인과 인가). DB 는 여기만 부른다.

## 맡지 않는 것

- 화면을 그리지 않는다. 관리 화면도 `web/app/admin` 이 그린다.
- 사람을 인증하지 않는다. 「누구냐」는 사내 IAM 이 답하고, 「들어와도 되냐·무엇을
  만지냐」는 `admin_users` 표가 답한다.

## 코드 모양 — drvalue-bmes-backend 를 따른다

```
src/
├── main.ts
├── app/app.module.ts
├── common/                      # bmes 의 glb-commons 자리. 공용 인프라
│   ├── error/common-error.ts    # ICommonErrorCode · CommonError
│   ├── entity/                  # TypeORM 엔티티 (posts · posts_translations · posts_files · directus_files · inquiries · admin_users · admin_revisions)
│   ├── database/                # TypeOrmModule.forRoot — synchronize 절대 끔
│   ├── session/                 # HMAC 세션 토큰 · 쿠키 파서
│   ├── revision/                # 변경 이력 기록기 (admin_revisions)
│   ├── uploads.ts               # 업로드 폴더 (compose 는 /data/uploads, 로컬은 저장소 data/uploads)
│   ├── image/                   # PNG·JPEG·WebP·GIF 치수 읽기
│   └── ncp-mail/                # 네이버 클라우드 메일
└── core/<기능>/
    ├── <기능>.module.ts
    ├── controller/<기능>-default.controller.ts
    ├── service/<기능>-default.service.ts
    ├── repository/<기능>-default.repository.ts
    ├── dto/controller-<기능>-default.dto.ts
    └── error/<기능>.error.ts
```

기능: `content` · `inquiry`(공개) · `admin-auth` · `admin-post` · `admin-file` ·
`admin-inquiry`(관리).

- **컨트롤러는 서비스만 주입한다.** 질의 조립·응답 정리는 서비스에.
- **에러는 `error/*.error.ts` 의 코드 객체를 `CommonError` 로 던진다.**
  응답 본문 `{ statusCode, code, message }`. Nest 내장 예외를 직접 던지지 않는다.
- 테이블은 옛 관리 도구(Directus) 시절 이름 그대로다(`directus_files` 포함).
  `synchronize` 를 켜면 엔티티에 없는 칸을 지운다 — 스키마 변경은 `db/schema.sql`
  과 `db/migrations/*.sql`(여러 번 돌려도 같게) 로.
- 사내 IAM 패키지(`@drvalue-oss/iam-nestjs`)를 쓰지 않는다. 게이트웨이 뒤가 아니라서
  서명 검증이 지킬 경로가 없다. IAM 로그인은 공개 엔드포인트(`/auth/login` ·
  `/auth/token/exchange`)를 직접 부른다.
- 포맷은 `.prettierrc`(singleQuote, 세미콜론). bmes 와 같다.
- 주석은 계약과 함정만.
- bmes 에 있지만 여기 없는 것: Swagger(`@ApiTags`), `x/default` + version 라우트.

## 관리 화면 인가

1. `/api/admin/auth/login` → IAM. `state` 는 `nonce.exp.sig` 로 서명해 쿠키와
   쿼리 양쪽에 싣는다(IAM 은 되돌려주기도 안 주기도 한다 — 실측).
2. 콜백에서 code 를 토큰으로 바꾸고 claim(`sub` · `email` · `role` · `groups`)을 읽는다.
3. **입장은 `admin_users`**(email · role `admin`|`marketing`|`hr` · enabled).
   - 등록 + enabled → 그 역할로 세션. 없거나 꺼져 있으면 `403`. IAM 일반 사용자는
     여기서 막힌다 — IAM 은 「누구냐」만 답한다.
   - 표가 **비어 있을 때만**(첫 설치) 첫 로그인자를 admin 으로 등록한다. 조건은
     `service/authorize.ts` 의 `decide`(테스트 15건 — board-access 포함):
     `PLATFORM_ADMIN`, 또는 `ADMIN_MAX_DB_URL` 이 있으면 nxcms 의
     `rn_default_root_user`(iamUserId = sub, ACTIVE) + `rn_tenant`(code = drvalue).
     nxcms 가 설정됐는데 **안 닿으면 거부** — 장애가 권한 완화가 되면 안 된다.
4. 세션은 HMAC 쿠키 `dv_admin`, 30분. `AdminSessionGuard` 가 60초마다 `admin_users`
   (빠짐·꺼짐·역할 변경)와, 설정돼 있으면 nxcms root 표를 다시 본다.
5. 역할: admin 전부 · marketing 채용(`recruit`) 빼고 · hr 채용만(`service/board-access.ts`).
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
- **토큰·code 를 로그에 찍지 않는다.** 거부 로그는 그룹 id·역할까지만.

## 방식

- 속도 제한 저장소는 프로세스 메모리다. 컨테이너를 늘리면 IP 당 한도가
  프로세스당 한도가 된다 — 그때 공유 저장소로 바꾼다.
- 칸 이름을 그대로 내보낸다(`is_pinned` · `published_date`). 예외 하나: `thumbnail`
  은 우리 주소 문자열로 바꾸고 치수는 `thumbnail_size` 에.
- 목록 순서는 서비스가 게시판별로 정한다. 증서·수행실적은 `sort`, 연혁은
  연도 내림차순 안에서 `sort`, 공지·보도는 고정 글 → 날짜.
- 업로드는 `common/uploads.ts` 의 폴더에 `<uuid>.<ext>` + `directus_files` 행. 치수는
  헤더에서 직접 읽는다. cwd 기준으로 잡지 않는다(api/ 에서 띄우면 빈 폴더를 본다).
- 상수: IAM 주소 `https://iam.drvalue.co.kr` · 기본 언어 `ko-KR` · NCP 메일 주소 ·
  문의 한도 분 5 / 시 30 · nxcms 테넌트 `drvalue`. 환경변수로 빼지 않는다.

## 검사

```bash
npm run typecheck && npm run build
node --test src/core/admin-auth/service/authorize.test.mjs   # 15
bash scripts/verify.sh          # 55/55 (api:3500 + DB, .env 의 ADMIN_SESSION_SECRET 으로 세션을 만든다)
```

verify.sh 는 픽스처를 관리 API 로 만들고 지운다. `admin_users` 가 비어 있으면 세션만으로,
사람이 있으면 `verify@drvalue.local` 을 잠시 넣었다가 끝날 때 지운다(빈 표에는 안 넣는다 —
넣으면 첫 관리자 자동 등록이 막힌다). 문의 구간은 1분 안에 두 번
돌리면 속도 제한에 걸려 판정 불가로 빠진다. 속도 제한 자체를 재려면 `RL_CHECK=1`.
