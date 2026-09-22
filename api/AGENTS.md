# api — 백엔드

## 맡는 것

공개 화면이 부르는 HTTP 전부(게시판 읽기, 문의 접수 = 메일 + DB 저장, IP 별
속도 제한)와 **관리 화면의 API** (`/api/admin/*`: 글·파일·문의 CRUD, 사내 IAM
로그인과 인가). DB 는 여기만 부른다.

## 맡지 않는 것

- 화면을 그리지 않는다. 관리 화면도 `web/app/admin` 이 그린다.
- 사용자를 저장하지 않는다. 관리자 목록의 원본은 M.AX(nxcms) DB 다.

## 코드 모양 — drvalue-bmes-backend 를 따른다

```
src/
├── main.ts
├── app/app.module.ts
├── common/                      # bmes 의 glb-commons 자리. 공용 인프라
│   ├── error/common-error.ts    # ICommonErrorCode · CommonError
│   ├── entity/                  # TypeORM 엔티티 (posts · posts_translations · posts_files · directus_files · inquiries)
│   ├── database/                # TypeOrmModule.forRoot — synchronize 절대 끔
│   ├── session/                 # HMAC 세션 토큰 · 쿠키 파서
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
  과 마이그레이션으로.
- 포맷은 `.prettierrc`(singleQuote, 세미콜론). bmes 와 같다.
- 주석은 계약과 함정만.
- bmes 에 있지만 여기 없는 것: Swagger(`@ApiTags`), `x/default` + version 라우트.

## 관리 화면 인가

1. `/api/admin/auth/login` → IAM. `state` 는 `nonce.exp.sig` 로 서명해 쿠키와
   쿼리 양쪽에 싣는다(IAM 은 되돌려주기도 안 주기도 한다 — 실측).
2. 콜백에서 code 를 토큰으로 바꾸고 claim(`sub` · `email` · `role` · `groups`)을 읽는다.
3. 판정(`service/authorize.ts` 의 `decide`, 테스트 11건):
   - `PLATFORM_ADMIN` → 통과.
   - `ADMIN_MAX_DB_*` 가 있으면 M.AX DB 의 `rn_default_root_user`(iamUserId = sub,
     status ACTIVE) + `rn_tenant`(code) 로 본다. **안 닿으면 거부** — 장애가 권한
     완화가 되면 안 된다.
   - 없으면 IAM 그룹(`ADMIN_IAM_GROUP` uuid 의 OWNER/ADMIN). 이름으로 맞추지 않는다.
4. 세션은 HMAC 쿠키 `dv_admin`, 30분. `AdminSessionGuard` 가 60초마다 M.AX 표와
   (IAM 내부 API 가 있으면) `enabled` 를 다시 본다. 이때 M.AX 가 안 닿으면
   세션을 끊지 않고 다음 요청에 다시 본다.
5. `ADMIN_API_TOKEN` 이 있고 `Authorization: Bearer` 로 오면 통과 — 검사용.
   **운영에는 비운다.**

권한 단계는 하나다. 통과 = 전부 편집.

## 늘 지켜야 하는 것

- **빠뜨리면 닫힌다.** `ADMIN_SESSION_SECRET` 이 없으면 안 뜬다. 검증이 켜진 채
  `IAM_GATEWAY_SECRET` 이 없어도 안 뜬다. `IAM_ENFORCE_GATEWAY` · `ADMIN_COOKIE_SECURE`
  는 값이 없으면 켠 것으로 본다. 이 방향을 뒤집지 않는다.
- **새 컨트롤러는 기본이 게이트웨이 뒤다.** `@SkipGatewaySignature()` 는 브라우저가
  직접 부르는 것(content · inquiry · admin-*)에만 붙어 있다. admin-* 은 대신
  `AdminSessionGuard` 뒤다.
- **공개 파일은 관문을 거친다.** `/api/content/assets/:id` 는 게시된 글이 가리키는
  파일만 낸다. 업로드 폴더에는 초안 첨부도 있다.
- **문의 칸 이름과 길이 한도를 좁히지 않는다.** 이름 200 · 연락처 50 · 내용 5000.
- **`TRUST_PROXY` 는 숫자로 넘긴다.** 문자열 `"1"` 은 아무것도 안 믿는 목록이 된다.
- **토큰·code 를 로그에 찍지 않는다.** 거부 로그는 그룹 id·역할까지만.

## 방식

- 속도 제한 저장소는 프로세스 메모리다. 컨테이너를 늘리면 IP 당 한도가
  프로세스당 한도가 된다 — 그때 공유 저장소로 바꾼다.
- 칸 이름을 그대로 내보낸다(`is_pinned` · `published_date`). 예외 하나: `thumbnail`
  은 우리 주소 문자열로 바꾸고 치수는 `thumbnail_size` 에.
- 목록 순서는 서비스가 게시판별로 정한다. 증서·수행실적은 `sort`, 연혁은
  연도 내림차순 안에서 `sort`, 공지·보도는 고정 글 → 날짜.
- 업로드는 `UPLOADS_DIR/<uuid>.<ext>` + `directus_files` 행. 치수는 헤더에서 직접 읽는다.

## 검사

```bash
npm run typecheck && npm run build
node --test src/core/admin-auth/service/authorize.test.mjs   # 11
bash scripts/verify.sh          # 55/55 (api:3500 + DB, .env 의 ADMIN_API_TOKEN 필요)
```

verify.sh 는 픽스처를 관리 API 로 만들고 지운다. 문의 구간은 1분 안에 두 번
돌리면 속도 제한에 걸려 판정 불가로 빠진다. 속도 제한 자체를 재려면 `RL_CHECK=1`.
