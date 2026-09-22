# 0014 · Directus 를 버리고 관리 화면을 직접 만든다

## 왜 정해야 했나

Directus Core 의 제약에 우회를 쌓고 있었다. SSO 라이선스 차단 → 확장 2개 +
로그인 폼 숨기기 4겹(서버 리다이렉트 · POST 차단 · 심은 스크립트 · bfcache ·
304 캐시). 컬렉션 25개 한도 → 특허·저작권·연혁을 게시판 종류로 욱여넣음.
조건부 권한 차단 → 채용공고 별도 컬렉션. seat 3명 → 여러 사람이 admin 한 계정
공유. 그 위에 스키마·권한·번역·플로우·시드·스모크 스크립트 3,600줄. 사이트가
실제로 쓰는 것은 게시판 6종 + 문의 목록 + 파일뿐이었다.

## 무엇을 골랐나

- 관리 화면은 **web 의 `/admin`**(Next), API 는 **api 의 `/api/admin/*`**(Nest,
  TypeORM). DB 는 그대로(postgres, 테이블 이름도 Directus 시절 것 — `directus_files`
  포함). 이관 없음. 처음 까는 곳은 `db/schema.sql`.
- 로그인은 **사내 IAM 만** — 버튼 하나. 비밀번호 폼 없음.
- 인가의 원본은 **M.AX(nxcms) 마스터 DB 의 root 표**(`rn_default_root_user`
  `iamUserId` · `status`, `rn_tenant` `code` · `rootUserId`). 읽기 전용으로 직접 본다.
  PHP 가 게이트웨이 `root/iam` 으로 묻던 것이 결국 이 표였다. 우리 DB 에
  사용자 사본을 두지 않는다 — 두면 그것이 어긋나는 사본이 된다.
- 세션은 HMAC 쿠키 30분. 60초마다 root 표(과 IAM 내부 API 가 있으면 `enabled`)를
  다시 본다. nxcms 에서 빼면 60초 안에 막힌다.
- 공개 4장(특허·저작권·수행실적·연혁)과 홈 소식은 요청마다 읽는다. 저장 즉시 반영.
- 메뉴는 되는 것만: 게시판 6 + 문의.

## 안 고른 것

- **Directus 위에 계속 쌓는다** — 우회가 우회를 부른다. 하루가 그 증거였다.
- **다른 CMS(Strapi · Payload 등)** — 같은 종류의 제약을 다시 배우는 일이다.
  필요한 화면은 목록·폼·업로드·순서뿐이다.
- **IAM 사용자를 우리 DB 에 동기화(미러)한다** — 동기화 코드가 곧 어긋남의 원인이다.
  원본을 매번 읽는 것이 싸다.
- **M.AX DB 가 안 닿으면 IAM 그룹으로 떨어뜨린다** — 장애가 권한 완화가 된다. 거부한다.

## 그래서 생긴 제약

- `PLATFORM_ADMIN` 은 nxcms root 표를 안 본다. IAM 쪽 플랫폼 관리자는 전부 들어온다.
- 세션 30분 · 재검 60초. 그 사이에 뺀 사람은 최대 60초 더 들어와 있다.
- M.AX DB 가 설정된 채 안 닿으면 **아무도 새로 못 들어온다**(이미 들어온 세션은
  30분까지 산다). 설정을 비우면 IAM 그룹 판정으로 돈다 — 운영 결정.
- 권한 단계가 하나다. 통과 = 전부 편집. 역할 분리가 필요해지면 그때 만든다.
- 본문 편집기가 없다. HTML 을 textarea 에 그대로 쓴다.
- seat 개념이 없다. 관리자 수는 nxcms root 표가 정한다.
- 수정 이력이 없다. 예약 게시(publish_at)는 칸만 있고 실행기는 아직 없다.
- `ADMIN_API_TOKEN` 은 IAM 도 nxcms 도 안 거치는 관리자 자격이다. 검사용이고
  운영에는 비운다.
- 테이블 이름을 바꾸는 것은 별도 마이그레이션이다.

0012 · 0013 은 이 결정으로 대체됐다.

## 덧붙임 (같은 날 저녁) — 입장은 admin_users, 환경변수 8개

위 「사용자 사본을 두지 않는다」와 「권한 단계가 하나」를 뒤집었다. 권한 관리(admin ·
marketing · hr)가 요구사항이 되면서 역할을 둘 곳이 필요했고, IAM 에는 일반 사용자도
있어 「IAM 통과 = 관리자」가 성립하지 않는다.

- **입장·역할은 `admin_users`**(email · role · enabled). IAM 은 「누구냐」만 답한다.
  표가 비어 있을 때만 첫 로그인자를 admin 으로 등록한다 — IAM `PLATFORM_ADMIN`, 또는
  nxcms drvalue 테넌트 root(`ADMIN_MAX_DB_URL` 설정 시). IAM 그룹 판정은 뺐다 — 개인
  「Default」 그룹이 누구에게나 있다.
- 60초마다 `admin_users`(빠짐·꺼짐·역할 변경)와 nxcms root 를 다시 본다. IAM 내부 API
  (`enabled`) 재검은 뺐다 — Doppler 를 안 쓴다.
- 역할 없는 세션은 거부한다. 역할: admin 전부 · marketing 채용 빼고 · hr 채용만.
- 변경 이력 `admin_revisions` — 「수정 이력이 없다」 제약은 해소.
- **IAM 을 안 거치는 문은 없다.** `ADMIN_API_TOKEN` 을 지웠다. 검사는 같은 서명 키로
  세션을 만든다.
- `@drvalue-oss/iam-nestjs` · `iam-core` 의존성 제거. 게이트웨이 뒤가 아니라 지킬 경로가
  없었다(`IAM_GATEWAY_SECRET` · `IAM_ENFORCE_GATEWAY` 도 같이).
- 환경변수 36 → 8. 필수 7(`DB_PASSWORD` · `ADMIN_SESSION_SECRET` ·
  `ADMIN_IAM_CALLBACK_URL` · `NCP_*` 넷) + 선택 1(`ADMIN_MAX_DB_URL`). 나머지는 코드
  상수이거나 compose 배선이다. 없앤 키와 이유는 `docs/operations.md`.
- 본문 편집기(Quill)를 붙였다 — 「본문 편집기가 없다」 제약은 해소.

새로 생긴 제약: `admin_users` 가 비어 있는 동안은 조건(IAM `PLATFORM_ADMIN` · nxcms
root)을 넘는 **첫 로그인자**가 admin 이 된다. 표를 비우면(전원 삭제) 다시 그 상태가
된다. 일반 IAM 사용자는 표가 비어 있어도 못 들어온다.
