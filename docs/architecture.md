# 시스템 구성

## 한 저장소에 두 세대가 있다

이 저장소에는 **지금 운영 중인 PHP 사이트**와 **그것을 대체할 Next 작업본**이
나란히 들어 있다. 둘은 같은 자산 파일을 본다.

```
index.php · page/ · css/ · img/ · icon/   운영 중인 PHP
web/    Next 16  · React 19              공개 화면 작업본. 포트 3400
api/    Nest 11                          공개 API · 사내 IAM · 메일. 포트 3500
cms/    Directus 12 + PostgreSQL         게시판 내용 · 권한 · 예약 게시. 포트 3350
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
  │  /api/...                      next.config.mjs 의 rewrite → Nest(api)
  └─ 우하단 채팅 위젯               GrowChat 외부 스크립트(도메인 잠금)

Nest(api)
  │  /api/content/*                → Directus(cms) REST, 서비스 토큰으로
  │  /api/inquiry                  → 메일 발송
  └─ /page/support/notice_api.php  → 사내 게이트웨이 api.growchat.co.kr/api/serv
                                      (읽기·로그인만. 쓰기는 410 으로 닫힘)

Directus(cms)
  └─ 관리자 로그인                  → 확장(iam-bridge) → 사내 IAM
```

브라우저는 Nest 가 어디 있는지 모른다. `/api` 만 알고, 실제 주소는 Next 의
`API_ORIGIN` 이 정한다.

## 대표 흐름 하나 — 공지 목록이 화면에 뜨기까지

```
1. 브라우저가 /page/support/notice 를 연다
2. Next 서버 컴포넌트가 /api/content/posts?board=notice 를 부른다
3. next.config.mjs 의 rewrite 가 API_ORIGIN 의 Nest 로 넘긴다
4. Nest 의 content 컨트롤러가 Directus 를 서비스 토큰으로 읽는다
   - 언어는 DEFAULT_LANGUAGE, 공개 상태(status=published)만
   - Directus 이름을 그대로 내보낸다. 옛 게이트웨이는 isPinned·createdAt
     을 썼지만 지금 API 도 화면도 is_pinned·published_date 로 주고받는다
5. Next 가 HTML 을 만들어 돌려준다
```

이 경로 어디에도 브라우저가 Directus 를 직접 부르는 자리가 없다. **서비스
토큰은 서버에만 있다.**

## IAM 이 두 군데 있는 이유

이름이 같지만 서로 다른 일을 한다. 하나가 다른 하나를 대신하지 못한다.

| | `cms` 의 iam-bridge 확장 | `api` 의 `@drvalue-oss/iam-nestjs` |
|---|---|---|
| 무엇을 인증하나 | **사람** — 관리자가 Directus 화면에 로그인 | **요청** — 호출이 사내 게이트웨이를 거쳤는지 |
| 게이트웨이와의 관계 | 게이트웨이를 **부른다** (`/auth/v1/login/root/iam` 4단계) | 게이트웨이 **뒤에 선다** (서명 검증) |
| 결과물 | Directus 세션 쿠키 | 요청 통과 / 거절 |

Directus Core 는 SSO 가 라이선스로 막혀 있어(`sso_enabled` is a restricted
resource) 확장으로 우회한다. Nest 쪽은 그런 제약이 없고 애초에 다른 계층이다.

## 바깥에 기대는 것

| 대상 | 무엇에 쓰나 | 없으면 |
|---|---|---|
| 사내 IAM (`iam.drvalue.co.kr`) | 관리자 사람 로그인 | 관리 화면에 못 들어간다. 공개 화면은 멀쩡하다 |
| 사내 게이트웨이 (`api.growchat.co.kr/api/serv`) | 옛 게시판 읽기·로그인 | 해당 경로만 죽는다 |
| Directus | 게시판 글·페이지·메뉴 | 공지·보도자료 목록이 빈다 |
| GrowChat 위젯 | 우하단 상담 | 위젯이 **조용히** 안 뜬다(도메인 잠금) |
| 메일 발송 | 문의 전달 | 문의가 저장은 되고 메일만 안 간다 |
| Doppler | 게이트웨이 공유 비밀 보관 | 로컬에서 게이트웨이 검사를 못 돌린다 |

## 모듈 경계

| 모듈 | 소유 | 의존 방향 |
|---|---|---|
| `web` | 공개 화면, 주소 체계, 검사 스크립트 | → `api` (HTTP `/api` 만) |
| `api` | 공개 API, 세션, 속도 제한, 게이트웨이 연동 | → `cms`(Directus REST), → 사내 게이트웨이 |
| `cms` | 컬렉션 스키마, 권한, 예약 게시, 다국어, IAM 다리 | 바깥을 안 부른다(IAM 확장 제외) |
| 루트 PHP | 현재 운영 화면 | 저장소 안에서 아무것도 안 부른다 |

`web` 은 Directus 를 직접 부르지 않는다. `cms` 는 `web`·`api` 를 모른다.
