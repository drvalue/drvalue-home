# 시스템 구성

## 한 저장소에 두 세대가 있다

이 저장소에는 **지금 운영 중인 PHP 사이트**와 **그것을 대체할 Next 작업본**이
나란히 들어 있다. 둘은 같은 자산 파일을 본다.

```
index.php · page/ · css/ · img/ · icon/   운영 중인 PHP
web/    Next 16  · React 19              공개 화면 + 관리 화면(/admin). 포트 3400
api/    Nest 11  · TypeORM               공개 API · 관리 API · 사내 IAM 로그인 · 메일. 포트 3500
db/     PostgreSQL 10                    글·번역·첨부·파일·문의. 포트 3330. 처음 까는 곳은 db/schema.sql
data/uploads                             업로드 파일 (bind mount, 저장소에 안 넣는다)
```

`web/public/css`, `web/public/img`, `web/public/icon` 은 **루트 원본과 별개인
복사본**이다. 예전에는 심볼릭 링크였는데 `web` 만 떼어 배포하려고 링크를
풀었다(커밋 `6f505ba`).

**그래서 루트 쪽만 고치면 Next 화면은 안 바뀐다.** 둘은 이미 갈라져 있다 —
`style.css` 23,621B 대 27,770B, `header.css` 7,795B 대 17,795B(`footer.css`
만 같다). PHP 화면도 같이 바뀌어야 하는 것이면 **양쪽을 다 고친다.** Next
에만 필요한 것이면 `web/public/` 쪽만 고치고 루트는 건드리지 않는다.

## 무엇이 무엇을 부르나

```
브라우저
  │  /page/...                     Next(web) 가 화면을 그린다
  │  /admin/...                    Next(web) 의 관리 화면. 로그인 버튼 하나 → 사내 IAM
  │  /api/...                      next.config.mjs 의 rewrite → Nest(api)
  └─ 우하단 채팅 위젯               GrowChat 외부 스크립트(도메인 잠금). /admin 에는 안 실린다

Nest(api)
  │  /api/content/*                → DB (published 만). 파일은 data/uploads 에서 관문 뒤로
  │  /api/inquiry                  → 메일 발송 + DB(inquiries)
  │  /api/admin/auth/*             → 사내 IAM (code 교환) → M.AX(nxcms) DB 의 root 표 → 세션 쿠키
  └─ /api/admin/{posts,files,inquiries}  → DB. 세션 쿠키 또는 검사용 토큰 뒤
```

브라우저는 Nest 가 어디 있는지 모른다. `/api` 만 알고, 실제 주소는 Next 의
`API_ORIGIN` 이 정한다. DB 는 api 만 부른다.

## 대표 흐름 하나 — 공지 목록이 화면에 뜨기까지

```
1. 브라우저가 /page/support/notice 를 연다
2. 화면의 스크립트가 /api/content/posts?board=notice 를 부른다
3. next.config.mjs 의 rewrite 가 API_ORIGIN 의 Nest 로 넘긴다
4. Nest 의 content 서비스가 TypeORM 으로 posts · posts_translations 를 읽는다
   - 언어는 DEFAULT_LANGUAGE, 공개 상태(status=published)만
   - 칸 이름을 그대로 내보낸다(is_pinned · published_date). 변환 코드 없음
5. JSON 이 화면으로 간다
```

특허·저작권·수행실적·연혁 4장과 홈 소식은 서버 컴포넌트가 요청마다
`/api/content/posts` 를 읽는다(`cache: 'no-store'`). 관리 화면에서 저장하면
다음 요청에 바로 보인다 — 그것이 곧 동기화다.

## 관리 화면 로그인과 권한

| 단계 | 누가 답하나 |
|---|---|
| 누구냐 | 사내 IAM. api 의 `core/admin-auth` 가 IAM 으로 보내고 code 를 토큰으로 바꿔 claim(`sub` · `email` · `role`)을 읽는다. IAM 패키지 없이 공개 엔드포인트를 직접 부른다 |
| 들어와도 되냐 · 무엇을 만지냐 | 우리 DB 의 `admin_users`(email · role · enabled). 표에 없는 IAM 사용자는 `403` |
| 첫 관리자 | 표가 비어 있을 때만 — IAM `PLATFORM_ADMIN`, 또는(`ADMIN_MAX_DB_URL` 설정 시) nxcms drvalue 테넌트 root |

세션은 HMAC 쿠키 `dv_admin`, 30분. 60초마다 `admin_users` 와(설정 시) nxcms root 표를
다시 본다. nxcms 가 설정됐는데 안 닿으면 로그인을 **거부**한다(열리는 쪽으로 안 떨어진다).
역할은 admin 전부 · marketing 채용 빼고 · hr 채용만. 변경 이력은 `admin_revisions`.
결정 `0014`(덧붙임).

게이트웨이 서명 검증(`@drvalue-oss/iam-nestjs`)은 없앴다 — 이 api 는 브라우저가 직접
부르는 자리라 게이트웨이 뒤가 아니고, 지키던 경로가 0개였다.

## 바깥에 기대는 것

| 대상 | 무엇에 쓰나 | 없으면 |
|---|---|---|
| 사내 IAM (`iam.drvalue.co.kr`) | 관리자 사람 로그인 | 관리 화면에 못 들어간다. 공개 화면은 멀쩡하다 |
| M.AX(nxcms) 마스터 DB (선택) | 첫 관리자 판정 · 60초 root 재검 | 설정돼 있는데 안 닿으면 로그인 거부. 비어 있으면 `PLATFORM_ADMIN` 만 첫 관리자가 된다 |
| PostgreSQL | 글·문의·파일 행 | api 가 안 뜬다 |
| GrowChat 위젯 | 우하단 상담 | 위젯이 **조용히** 안 뜬다(도메인 잠금) |
| 메일 발송 | 문의 전달 | 문의가 저장은 되고 메일만 안 간다 |

## 모듈 경계

| 모듈 | 소유 | 의존 방향 |
|---|---|---|
| `web` | 공개 화면, 관리 화면, 주소 체계, 검사 스크립트 | → `api` (HTTP `/api` 만) |
| `api` | 공개 API, 관리 API, IAM 로그인, `admin_users` 인가·역할, 변경 이력, 속도 제한, 파일 | → DB, → 네이버 클라우드 메일, → 사내 IAM, → M.AX DB(읽기, 선택) |
| `db` | 테이블. 이름은 옛 관리 도구(Directus) 시절 것 그대로 — `directus_files` 포함 | 아무것도 안 부른다 |
| 루트 PHP | 현재 운영 화면 | 저장소 안에서 아무것도 안 부른다 |

`web` 은 DB 를 직접 부르지 않는다. 테이블 이름을 바꾸는 것은 별도 마이그레이션이다.
