# api — 백엔드

## 맡는 것

공개 화면이 부르는 HTTP 전부. 게시판 읽기, 문의 접수(메일 + CMS 저장),
IP 별 속도 제한.

## 맡지 않는 것

- 화면을 그리지 않는다.
- 게시판 글의 내용 모델은 `cms` 것이다.
- 사람을 인증하지 않는다. 여기서 보는 것은 **요청**이 게이트웨이를 거쳤는지다.

## 코드 모양 — drvalue-bmes-backend 를 따른다

```
src/
├── main.ts
├── app/app.module.ts
├── common/                      # bmes 의 glb-commons 자리. 공용 인프라
│   ├── error/common-error.ts    # ICommonErrorCode · CommonError
│   ├── directus/                # CMS 클라이언트
│   └── ncp-mail/                # 네이버 클라우드 메일
└── core/<기능>/
    ├── <기능>.module.ts
    ├── controller/<기능>-default.controller.ts
    ├── service/<기능>-default.service.ts
    ├── dto/controller-<기능>-default.dto.ts
    └── error/<기능>.error.ts
```

- **컨트롤러는 서비스만 주입한다.** Directus 질의 조립·응답 정리는 서비스에.
- **에러는 `error/*.error.ts` 의 코드 객체를 `CommonError` 로 던진다.**
  응답 본문 `{ statusCode, code, message }`. Nest 내장 예외를 직접 던지지 않는다.
- 공용 인프라(외부 HTTP 클라이언트)는 `common/<이름>/` 에 모듈 + 서비스로.
- 포맷은 `.prettierrc`(singleQuote, 세미콜론). bmes 와 같다.
- 주석은 계약과 함정만. 코드가 이미 말하는 것과 이관 내력은 적지 않는다.
- bmes 에 있지만 여기 없는 것: Swagger(`@ApiTags`), `x/default` + version 라우트
  (web 이 `/api/content/posts`·`/api/inquiry` 를 박아 부른다), TypeORM.

## 늘 지켜야 하는 것

- **빠뜨리면 닫힌다.** 검증이 켜진 채 `IAM_GATEWAY_SECRET` 이 없으면 안 뜬다.
  `IAM_ENFORCE_GATEWAY` 는 값이 없으면 켠 것으로 본다. 이 방향을 뒤집지 않는다.
- **새 컨트롤러는 기본이 게이트웨이 뒤다.** `@SkipGatewaySignature()` 는
  공개 화면이 직접 부르는 둘(content · inquiry)에만 붙어 있다.
- **문의 칸 이름과 길이 한도를 좁히지 않는다.** 이름 200 · 연락처 50 · 내용 5000.
- **저장 성공을 「200 이 왔다」로 판정하지 않는다.** Directus 는 모르는 필드를
  조용히 버린다. 행이 생겼고 값이 원문 그대로인지까지 본다.
- **`TRUST_PROXY` 는 숫자로 넘긴다.** 문자열 `"1"` 은 아무것도 안 믿는 목록이 된다.
- **토큰을 로그에 찍지 않는다.**

## 방식

- 속도 제한 저장소는 프로세스 메모리다. 컨테이너를 늘리면 IP 당 한도가
  프로세스당 한도가 된다 — 그때 공유 저장소로 바꾼다.
- Directus 이름을 그대로 내보낸다(`is_pinned` · `published_date`). 변환 코드 없음.
  예외 하나: `thumbnail` 은 우리 주소 문자열로 바꾸고 치수는 `thumbnail_size` 에.
- 목록 순서는 서비스의 `sortOf(board)` 가 정한다. 증서·연혁은 날짜가 아니라 `sort`.

## 검사

```bash
npm run typecheck && npm run build
bash scripts/verify.sh          # 53/53 (api 와 cms 가 떠 있어야 한다)
```

문의 구간은 1분 안에 두 번 돌리면 속도 제한에 걸려 판정 불가로 빠진다.
속도 제한 자체를 재려면 `RL_CHECK=1`.
