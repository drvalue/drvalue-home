# 작업 그래프 상태 — Directus 를 자체 관리 화면으로 대체 (2026-09-22)

가지 `heysep/cms-편집`. 완료는 「완료 증거」 칸이 차야 ✅.

| 노드 | 상태 | 산출물 | 완료 증거 | 비고 |
|---|---|---|---|---|
| 1. IAM 로그인 Nest 이식 (`core/admin-auth`) | ✅ | api/src/core/admin-auth | 콜백 302 (사용자 클릭, localhost 콜백 통과) · authorize 테스트 6/6 · 커밋 747ed69 | 세션 30분, IAM 내부 API 로 60초 재검(자격 없으면 건너뜀) |
| 2. 데이터 계층 (TypeORM, 기존 테이블) | ✅ | api/src/common/entity · database | count 40, patent-1 번역·그림·번호 읽힘 · 커밋 d028d4f | synchronize 절대 끔. 업로드 data/uploads 로 복사(12) |
| 3. 관리 CRUD API (posts·files·inquiries) | ✅ | api/src/core/admin-* | 업로드 581×788 · 만들기→고치기→순서→지우기 · 400 · 초안 파일 404 · 401 | 파일 삭제·문의 검색/삭제·txt 업로드 추가(미커밋) |
| 4. 공개 API DB 직결 (content·inquiry) | ✅ | api/src/core/content, inquiry | verify.sh 47/53 (Directus 없이; 6건은 A·픽스처 문제) · asset 200 | DirectusService 삭제 |
| A. verify.sh 픽스처를 관리 API 로 | ✅ | api/scripts/verify.sh | `DIRECTUS_URL= bash scripts/verify.sh` → PASS=55 FAIL=0 (2026-09-22, api 3500 재빌드 뒤). Directus REST 호출 0, ADMIN_API_TOKEN 필수 | 검사 53→55: 「세션 비밀 없이는 안 뜬다」·「관리 API 무인증 401」 추가. boot 에 ADMIN_SESSION_SECRET·DB_*·UPLOADS_DIR 전달 |
| B. web `/admin` 화면 | ✅ | web/app/admin/{layout,page,AdminShell,admin.css,login/page,inquiries/page,posts/[board]/{page,PostForm,new/page,[id]/page}}.tsx · web/lib/admin.ts | tsc 통과 · next build 통과(6 라우트) · :3410 curl — /admin/login IAM 버튼 1, ?signed_out 문구 1, /admin·/posts/patent·/new·/inquiries 200, noindex 2, /api 되넘김 401 · 3410 내림 | 메뉴: 게시판 6 + 문의만. 브라우저 실사용(로그인→편집→저장→사이트)은 사용자 확인 필요. 커밋은 부모가 |
| C. 공개 4장 즉시 반영 + web 검사 | ✅ 완료 | web/lib/cms.ts · app/home/news.ts (`cache: 'no-store'`), 4장 + 홈 `dynamic = 'force-dynamic'`, scripts/check-pages.py `NEXT_ORIGIN` 환경변수 | `next build` 5장이 ƒ(요청마다 렌더) · check-src 0문제 · tsc 통과 · check-pages 98/98(:3410) · check-assets 빠진 것 0 · 실측: patent-1 제목에 ' (검증)' PUT → 즉시 `grep -c` 1, 원복 PUT → 0 | 커밋은 부모가 한다 |
| D. Directus 은퇴 | ✅ | docker-compose.yml(db·api·web), api/Dockerfile, db/schema.sql, .env.example, cms/ 삭제, docs | `docker compose ps`: drvalue_directus_pg · drvalue_api 만 · verify.sh 55/55(Directus 없이) · 컨테이너 api 로 posts·asset·admin me 200 · 코드에 Directus 참조는 주석 3줄(이력) | 문서 17개 + 결정 0014. Directus 참조는 결정 파일과 「시절 이름」 설명뿐 |
| V. 최종 교차검토 | ⬜ | | advisor 지적 0 또는 처리 | |

# 2차 — 관리 화면 기능 11 + GA (2026-09-22 저녁)

같은 가지. F(바닥)가 먼저, 그 위에 E1~E6 병렬, 검증 뒤 E7~E11 병렬, 마지막 E0 크리틱.

| 노드 | 상태 | 산출물 | 완료 증거 | 비고 |
|---|---|---|---|---|
| F. 바닥: 권한·이력·문의 칸·채용 칸 마이그레이션 + 역할 가드 + 이력 기록기 | 🔄 | db/migrations/0001, api/common/{revision,role} | 마이그레이션 2회 적용 OK · 가드 테스트 · 글 저장이 admin_revisions 에 행을 남김 | admin_users 비면 = 옛 규칙(IAM/nxcms 통과 = admin) |
| E1. 게시판 3종(뉴스·채용·FAQ) 관리 + 공개 화면 3장 | ✅ | api admin-post(dto·service·controller `faq-categories`)·content(present·order), web PostForm·목록, /page/support/{news,recruit(+[slug]),faq}, lib/menu·cms, check-pages 바닥 | verify.d/boards.sh 10/10(만들기→공개 목록·상세 칸→마감순·FAQ 답+분류→지우기) · 렌더 실측(채용 인턴·마감 배지·상세 본문, FAQ 분류 h3+답, 없는 slug 404) · check-pages 110/110 · check-header 107/107 · check-a11y 323/323 · next build ƒ 3장 | recruit 는 posts.board. news 는 press 장 복제(스크립트 목록) · recruit·faq 는 서버 렌더(JS 없이 보임) |
| E2. 문의 담당자 지정·메모·이메일 답장 | ✅ | api admin-inquiry(dto·error·PATCH status/assignee_email/note·GET assignees·필터 assignee=me\|none\|이메일·q 5칸·@AdminRoles(marketing)·이력), web /admin/inquiries(목록+상세 패널·mailto 답장·types.ts·inquiries.css) | verify.d/inquiry-media.sh 12/12(지정·내 담당/미지정 필터·없는 담당자 400·메모·null 비우기·이력 3건·before=new·hr 403 FORBIDDEN) · verify.sh 97/97 · web build · :3410 /admin/inquiries 200 | 표본 문의는 DB 로 넣는다(공개 API 분당 5회 한도) |
| E3. 미디어 관리 화면(목록·검색·삭제·PDF·영상·용량) | ✅ | api admin-file(GET 목록 type·q·used · PATCH title · DELETE 409/force · mp4·webm · 그림·PDF 20MB/영상 200MB · 한글 파일명 복원 · 이력), web /admin/media(격자·형식 탭·검색·여러 개·끌어다 놓기·상세 패널·주소 복사·인라인 삭제 확인)·lib/admin-media.ts·media.css | verify.d/inquiry-media.sh 11/11(zip 400·영상 필터·이름 변경·used 1·409·force 200·글 그림 비움·미리보기 404·이력 create/update/delete) · verify.sh 97/97 · :3410 /admin/media 200 | 본문 HTML 안 그림은 used 에 안 셈 |
| E4. 예약 게시(publish_at/unpublish_at 자동 상태 전환 + 공개 API 필터) | ✅ | api content LIVE 조건(목록·상세·파일 관문), core/admin-schedule(@nestjs/schedule 1분 틱), PostForm 예약·내림 칸, 목록 배지 | verify.d 예약 8/8(1시간 뒤 글 목록·상세·첨부 404 · 지난 예약 보임 · 내림 지난 글 숨김) · 본문 안 그림 관문: 공개 글 본문에만 넣은 그림 200 → 그 글 초안 404 · 틱 실측: draft+지난 publish_at → published, published+지난 unpublish_at → draft, 둘 다 admin_revisions(schedule@system) · verify.sh 126/126(+판정불가 1, 다른 노드) | 소진한 시각은 지운다(재공개 방지). 조건부 UPDATE 라 프로세스 둘이어도 한 번 |
| E5. 변경 이력 화면 + 이전 버전 복구 | ✅ | api core/admin-revision (GET /revisions · /revisions/item/:c/:id · /revisions/:id · POST /revisions/:id/restore), web /admin/history, lib/admin-extra.ts | verify.d/revision-user.sh: 이력 3건(만듦·고침·고침) · 첫 수정 전으로 복구 → 제목 A · 복구 이력 1건 · 만들기 복구 400 · 지운 글 복구 → 같은 slug·같은 번호 · slug 충돌 409 · 파일 복구 400 — 전부 PASS. api typecheck 0 · web tsc·next build 통과 · :3410 /admin/history 200 | 복구는 엔티티 메타데이터로 칸을 맞춘다(새 칸 자동). TypeORM 이 자동 증가 칸의 id 를 버려 insert 뒤 UPDATE 로 번호를 되돌린다. 메뉴 링크는 부모가 AdminShell 에 붙인다 |
| E6. 권한 화면(고칠 수 있는 범위) + API 가드 | ✅ | api core/admin-user (GET /users · PATCH /users/:email {role}), web /admin/users | verify.d: 목록에 사람 · 해제된 사람 enabled=false · hr 공지 PUT 403 · hr 채용 목록 200 · hr users 403 · hr 이력 403 · 범위 변경 + 이력 · 없는 범위 400 · 없는 사람 404 · POST 없음 404 · IAM 해제된 사람 403 — PASS. 「마지막 admin 내리기 409」 는 켜진 admin 이 2명(실사용자 포함)이라 판정불가 → 규칙은 last-admin.test.mjs 5/5 | **결정(사용자)**: 관리자 여부는 IAM(PLATFORM_ADMIN)만 정한다. 로그인 때 admin_users 동기화(생성·재활성·해제). CMS 는 사람 추가·삭제·사용 여부를 못 바꾸고 범위(admin·marketing·hr)만 바꾼다. 마지막 켜진 admin 강등 409 |
| V1. 1차 검증 | ⬜ | | verify.sh · web 검사 5종 · tsc/build 둘 | |
| E7. 페이지 관리(회사소개·비전·오시는 길·사업·서비스 5장 제목·본문·이미지) | ⬜ | pages 표, /admin/pages, 5장 CMS 우선 | 저장 → 화면 즉시 | 코드 예비 유지 |
| E8. 메인 화면 관리(배너·팝업·문구·순서·링크) | ⬜ | home_settings·banners·popups 표, /admin/home | 배너 순서 바꿈 → 홈 반영 | |
| E9. 메뉴 관리(상단/하단·순서·노출) | ⬜ | menu_items 표, /admin/menu, lib/menu.ts 가 api 를 읽음 | 항목 숨김 → 헤더에서 사라짐 · check-header 통과 | 실패 시 코드 메뉴 |
| E10. SEO(페이지·글별 title·description·OG·noindex) | ⬜ | pageMeta 가 CMS 를 읽음, /admin/seo | OG 이미지 바꿈 → og:image 헤더 반영 | |
| E11. GA4 + 동의 | ⬜ | env GA_MEASUREMENT_ID, SiteScripts | ID 있으면 gtag 실림, 없으면 안 실림 | GTM 은 그대로 |
| V2. 2차 검증 + 문서 | ⬜ | docs · contracts · AGENTS | 검사 전부 · grep 잔재 0 | |
| E0. 로그인·관리 화면 UI/UX 크리틱 + 수정 | ⬜ | | 크리틱 지적 처리 목록 | laws-of-ux · tastemaker audit |

# 3차 — 명세 전부 + UI/UX 크리틱 반영 + SEO/GEO + bmes 패턴 (2026-09-22 밤)

근거: 명세 점검(E7~E11 ⬜) · 관리 화면 감사(주요 9 · 작은 것 9, `.playwright-mcp/ux-*.png`) ·
SEO/GEO 감사(막는 것 2 · 주요 6 · 작은 것 7). 병렬 이유: 노드마다 파일 소유가 갈린다(병렬 분산 후 합치기).
노드는 git worktree 에서 돌고 부모가 합친다. 검사는 노드마다 자기 포트·자기 VERIFY_EMAIL.

```mermaid
graph TD
  A1[A1 api bmes 바닥 + 기준 모듈 admin-post + swagger]
  A2[A2 공지·보도·뉴스 서버 렌더 + 글 주소 + h1 + 한국어 404]
  A3[A3 관리 화면 UX 1차: 드로어·대시보드·문의 배지·액션바·토스트·이탈 경고·모바일 목록·검색]
  A1 --> A4[A4 페이지 편집 엔진 + 오시는 길 시범]
  A1 --> E9[E9 메뉴 관리]
  A1 --> E10[E10 SEO·GEO·GA]
  A2 --> E10
  A3 --> E10
  A4 --> R1[R1 나머지 모듈 bmes 패턴 + swagger · 새 표 되돌리기]
  E9 --> R1
  E10 --> R1
  A4 --> E7[E7 회사·사업·서비스 페이지 편집]
  A4 --> E8[E8 메인 배너·팝업·문구·순서]
  E9 --> C2[C2 관리 화면 크리틱 2차 + 관리 전용 레이아웃]
  E7 --> C2
  E8 --> C2
  E10 --> C2
  R1 --> C1[C1 swagger 로 web 타입 생성]
  C1 --> V3{V3 전체 검증 · docker 새로 · 브라우저 4종 · 교차검토}
  C2 --> V3
```

A3 합친 뒤 할 것: 관리 목록 검색·상태 필터·쪽 넘김을 브라우저로 — A1 뒤로 잘못된 값은 400(A3 는 대부분 옛 api 로 만들었다). A2 화면(공지 목록·글 한 편·404·머리글) 390/1280 눈 확인 뒤 2차.
출발 조건: 1차 A1·A2·A3 동시. 합치는 순서 A1 → api 컨테이너 다시 → A2·A3 → web 다시 → verify·web 검사 7종·브라우저 390/1280.
2차(A4·E9·E10·A3b)는 1차 셋을 다 합친 뒤. 3차(E7·E8·R1)는 A4·E9·E10 뒤. 4차(C1·C2) → V3.
1차가 도는 동안 부모 트리에서 verify 를 돌리지 않는다(A1 의 verify 가 공유 DB 에 잠깐 글을 게시한다).
api 컨테이너는 합칠 때마다 다시 올린다(E10 합친 뒤: 공개 끝점 4개 200 · 관리 끝점 4개 무세션 401 · 오류 로그 0). **E7·E8 이 부모 :3410 과 HTML 을 비교하는 동안 부모에서 verify 를 돌리지 않고 web 을 다시 빌드하지 않는다** — menu.sh 가 「뉴스」를 잠깐 숨기고 pages.sh 가 오시는 길을 고친다. E10 이 오면 합치고 api 만 다시, web 은 E7·E8 이 다 보고한 뒤 한 번.
합칠 때 고칠 것: post-file.entity.ts 의 파일 쪽 onDelete 가 'SET NULL' 인데 DB 는 CASCADE(0003).

| 노드 | 상태 | 산출물 | 완료 증거 | 비고 |
|---|---|---|---|---|
| P0. 검사 격리 · 규칙 한 곳 · 첨부 FK | ✅ | verify.sh VERIFY_EMAIL·check_rl, /me boards, migrations/0003, robots 파일 경로 | 7586c0b · 109d223 · e779ce3 · verify 146/0/1 | web 의 canEditBoard 사본 삭제. 첨부 고아 행 52 정리 |
| A1. api bmes 바닥 | ✅ | common/typeorm(ctx·@Transactional·BaseRepository)·@ServiceException·검증+swagger DTO 데코레이터·/api/docs(운영 끔), admin-post 전환, 예약 목록 필터 | 합침 b8e0c0c · 부모 docker api 에서 verify 161/0/1 · node --test 20/20 · admin-post 서비스 8/8 @ServiceException+JSDoc · 컨트롤러 8/8 @ApiOperation · 서비스의 QueryBuilder/DataSource 0 · 저장소 3/3 BaseRepository · web 게시판·페이지·홈 검사 통과 | 권한 구멍 수정: 순서 바꾸기가 게시판 범위를 안 봤다(인사가 공지 순서를 바꿈). DB 비밀번호를 import 때 읽던 것(forRootAsync). 목록 질의가 이제 잘못된 값에 400 |
| A2. 게시판 서버 렌더 | ✅ | notice·press·news 목록+상세 서버 렌더, 옛 ?id= 308, h1, not-found | 합침 f1da062 · 부모 docker web 에서 check-boards 35/35 · src 0 · copy 0 · assets 0 · home 23/23 · header 107/107 · a11y 323/323 · pages 110/110 · 옛 ?id= 308 → /notice/legacy-… · 없는 글 404 | 규칙 4 수리. 브라우저 눈 확인은 A3 가 브라우저를 놓은 뒤 |
| A3. 관리 UX 1차 | ✅ | 서랍 메뉴·대시보드·문의 배지·저장 막대·알림·이탈 확인·모바일 카드·검색 주소·입력칸·삭제 확인·연혁 묶음·이력 말·게시판별 칸·건너뛰기 | 합침 · web 검사 8종 통과(copy 451곳 0) · 브라우저: 목록 검색·상태 필터 요청 4건 전부 200(A1 의 400 규칙과 맞음) · A3 측정표(390 미디어 375/375, 본문 시작 52px, 로그아웃 대비 16.27:1) | 일부: 이탈 보호(브라우저 뒤로 가기 못 막음) · 삭제 되돌리기 없음 · 연혁 끌어 옮기기 없음. api 요청: GET /inquiries/:id · 대시보드 요약 한 번에 |
| A3b. 예약 글 표시·필터 | ✅ | 목록 배지·「예약」「내림 예정」 필터 · GET /admin/dashboard(한 번에) · GET /admin/inquiries/:id | 합침 · 부모 docker verify 176/0/1 · web 8종 통과 · copy 465곳 0 | 화면은 브라우저로 아직 안 봄(C2) |
| A4. 페이지 편집 엔진 | ✅ | page_contents(0004 — 옛 Directus pages 표와 이름을 피함) · 스키마는 api(text·textarea·richtext(sanitize-html)·image·link·list·group) · /admin/pages 자동 폼 · 공개 GET /api/content/pages/:key · 오시는 길 시범 · page-seed.mjs | 합침 · 부모 docker verify 214/0/1 · node --test 30/30 · web 8종 통과 · 오시는 길 CMS 로 렌더(주소 3곳) · A4 실측: 저장→공개 즉시, api 꺼도 기본 글, 390 넘침 없음 | 페이지 이력은 날 JSON·되돌리기 불가(R1·C2). 웹 LocationContent 타입은 손으로 맞춤(C1) |
| E7. 회사·사업·서비스 페이지 | ✅ | 15 장 스키마(intro-pages.schema.ts·parts.ts) · 0008 씨앗 · 이미지 칸 사이트 경로 기본값 | 부모 docker(모두 합친 뒤) verify 282/0/1 · node --test 36/36 · web 8종 통과 · E7 측정: 부모와 HTML 차이 15장 0줄 | 코드에 남긴 것: 데모·쇼케이스·흐름도. 페이지 이력 되돌리기(R1). 웹 타입 손 맞춤(C1) |
| E8. 메인 화면 | ✅ | home 페이지 글(문구·구역 차례·카드) · home_banners·home_popups(0005) · /admin/home · 팝업 한 번에 하나 | 부모 docker verify 282/0/1 · check-home 23/23 · E8 측정: 홈 HTML 차이 0줄, 브라우저 1280·390(팝업 초점·Escape·오늘 안 보기·만료) | 영웅 숫자는 자료에서 센다(손 편집 불가). 이력 되돌리기(R1). 옛 Directus popups·home_settings 표는 안 건드림(X3) |
| E9. 메뉴 관리 | ✅ | site_menu_items(0006, 옛 Directus menu_items 와 이름을 피함) · 공개 GET /api/content/menu · 관리 GET·PUT /api/admin/menu · /admin/menu · 헤더·경로 줄·왼쪽 차례·하단이 getMenu() · 60초 캐시 + 저장 뒤 비우기 | 합침 · 부모 docker verify 194/0/1 · web 8종 통과 · 공개 메뉴 200 · E9 실측: 「뉴스」 숨김→헤더에서 사라짐→복구, api 꺼도 lib/menu.ts | 할 것: sitemap.ts 를 getMenu() 로(E10 뒤) · 메뉴 이력 되돌리기(R1) · 화면 눈 확인(C2) |
| E10. SEO·GEO·GA | ✅ | 글 「검색 노출」 · page_meta(0007)+/admin/seo · 기본 공유 그림 · sitemap 글+lastmod · robots AI 5종 · llms.txt · JSON-LD · GTM 은 NEXT_PUBLIC_GTM_ID + 동의 모드 | 부모 docker: verify 282/0/1 · og:image·h1 1 개(5 장 표본) · Article/BreadcrumbList/WebSite/Organization · sitemap 24(글 5) · llms.txt 200 · robots AI 5 · env 없으면 GTM 0 | **운영 .env 에 NEXT_PUBLIC_GTM_ID=GTM-NLL3QGRF 를 넣고 web 을 다시 빌드해야 분석이 켜진다** |
| R1. 나머지 모듈 bmes | ✅ | api 14 모듈 admin-post 모양 · 되돌리기 등록부(<module>/revision/*.handler.ts) · 새 표(pages·menu·page_meta·배너·팝업) 되돌리기 · 되돌리기 본문 소독 · restore_note · scripts/check-pattern.py | 합침 f53f0b1 · 부모 docker: verify 331/0/1 · node --test 43/43 · check-pattern 문제 0(139 → 0) · swagger 49 경로 중 응답 스키마 47(나머지 2 는 302) · web 8종 통과(copy 806곳 0) | 남은 것: 변경 이력 화면 브라우저 확인(V3) · 메뉴·페이지·메인 이력 비교는 JSON 글자 · 대시보드 DTO 사본 |
| C1. web 타입 생성 | ✅ | api/scripts/openapi.js(서버·DB 없이) → openapi.json·page-schemas.json → web/scripts/gen-types.mjs → web/lib/api-types.gen.ts·page-types.gen.ts · web/scripts/check-types.py(낡으면 실패) | 합침 · 손으로 옮긴 api 모양 형 73 → 2 · check-types 4 개 중 낡은 것 0 · DTO 칸 하나 더하면 FAIL(되돌리면 0) · C1 측정: 13 장 HTML 부모와 같음 | openapi-typescript 대신 자체 생성기(web 은 TypeScript 7, 그 도구는 TS 5 API). api 문서의 enum·nullable 오류 몇 개를 고침 |
| C2. 크리틱 2차 | ✅ | 레퍼런스(Directus·Strapi·Payload·WordPress) 크리틱 표 · 페이지 편집 접기(PCB MES 25,438px → 1,581px) · 저장 뒤 폼에 남기 · 삭제 되돌리기 알림(전체 권한) · 편집기 한국어 · 관리 전용 루트 레이아웃(app/(site) 로 git mv, 주소 그대로) · 공개 제목 keep-all · 메뉴 숫자 자료에서(0009) | 합침 6d0e192 · 부모 docker: verify 288/0/1 · web 8종 통과(copy 783곳 0) · /admin/login 공개 파일 0 · 0009 두 번 UPDATE 3 → 0 · 메뉴 「등록 1건 · 출원 5건」「9건의 과제」 토큰 날것 0 · C2 측정: 공개 HTML 10장 차이는 제목 CSS 한 줄뿐 | 일부: 연혁·메뉴 끌어 옮기기 없음(버튼·키보드) · 브라우저 뒤로 가기 이탈 경고 없음 · 실제 터치 기기 44px 는 CSS 로만 |
| V3. 전체 검증 | ✅ | | 마지막 상태(C1 까지) docker 새로 빌드: verify 331/0/1 · node --test 43/43 · check-pattern 0 · check-types 낡은 것 0 · web 8종(copy 806곳 0 · boards 35 · pages 110 · home 23 · header 107 · a11y 323 · assets 0 · src 0) · npm audit(prod) api 0 · web 1 low(quill 2.0.3 getSemanticHTML XSS — 안 쓰고 서버가 소독, 고침은 2.0.2 로 내리는 것뿐이라 둔다). 브라우저: R1 상태에서 관리 32 · 공개 40 · 되돌리기 왕복 · TTFB, **C1 합친 마지막 상태에서 관리 32 · 공개 40 다시 — 나쁜 것 0** | 남은 것은 X1·X2·X3(사용자 결정)와 운영 적용. worktree 12 개 지움(9GB) — R1 것 하나는 에이전트 도구가 잠가 둠 · 결정 0017 |
| P1. 지워진 첨부로 저장하면 500 | ✅ | ADMIN_POST_FILE_GONE·THUMB_GONE 409, 폼이 코드로 칸을 짚음 | verify.d/dashboard.sh 포함 176/0/1 · 409 에 오류 로그 0 | 트랜잭션 검사는 이 실행 전용 트리거(그 파일 id 에만)로 |
| P2. 404 장의 작은 것 | ✅ | 404 제목 · jQuery 없으면 싣기 · 공개 제목 keep-all(C2) | 부모 docker: 404 제목 · C2: 390 에서 5 장 제목 낱말 안 끊김, 가로 넘침 0 | |
| S1. 본문 HTML 소독 | ✅ | api/src/common/html/sanitize-body.ts(편집기 태그만 · script/style/iframe/on*/javascript:/data: 제거 · 새 창 링크 rel) — 글 저장·공개 출력·페이지 richtext·팝업 본문 · scripts/sanitize-bodies.js | 합침 d5433e7 · 부모 docker verify 288/0/1 · node --test 43/43 · 기존 본문 6 중 5 가 <br /> → <br> 만 달라짐(글 손실 0), --apply 두 번 5 → 0 | 남은 것: 변경 이력 되돌리기가 소독을 안 거친다(공개 출력은 소독) — R1 합칠 때 막는다 |
| S2. multer DoS 권고 4건(high) | ✅ | package.json overrides multer 2.4.0 (@nestjs/platform-express 11.2.5 유지) | npm audit --omit=dev 0 · docker api 에서 verify 214/0/1(업로드·형식 400·영상 필터 포함) | Nest 12(multer 2.4.0 기본)로 올리면 override 를 뺀다 |
| X3. 옛 Directus 표 정리 | ⛔ | pages·page_blocks·pages_translations·menu_items·menu_items_translations·popups·popups_translations·home_settings(로컬 DB, 코드가 안 씀) | | 지우는 것은 되돌릴 수 없다 — 사용자 결정. 운영 DB 에도 있는지 먼저 본다 |
| P3. 메뉴의 손으로 적은 숫자 | ✅ | 메뉴 설명의 토큰을 getMenu() 가 게시판 수로 채움(0009) · api 꺼지면 숫자 조각을 뺀다 | 부모 docker: 「등록 1건 · 출원 5건」「9건의 과제」 · 날 토큰 0 | |
| X1. 공개 영어 사이트(/en) | ⛔ | | | 영어 원고 1건뿐 · 주소 방식(/en 접두 vs 도메인) 결정 필요. CMS 는 ko/en 칸을 다 받는다 |
| X2. 실제 IAM 로그인 한 번 | ✅ | | 사용자 확인(2026-09-23 「아이엠 로그인은 잘되고」) | |

## 운영에 올릴 때 (사람이 한다 — main 은 이 가지를 합친 뒤)

1. 운영 `.env` 에 `NEXT_PUBLIC_GTM_ID=GTM-NLL3QGRF` — 없으면 분석이 꺼진다(web 빌드 인자).
2. 마이그레이션 0003 → 0008 을 차례로(`docs/operations.md`). 전부 두 번 돌려도 같다.
   **0003 은 지우는 마이그레이션이다** — 부모 없는 첨부 행(posts_files)을 지운다. 돌리기 전에 개수를 본다:
   `select count(*) from posts_files pf where not exists (select 1 from posts p where p.id = pf.posts_id)
    or not exists (select 1 from directus_files f where f.id = pf.directus_files_id);` (로컬은 52 전부 고아였다)
3. api·web 이미지를 다시 빌드해 올리고, 머리글 메뉴가 뜨는지 본다.
4. **그 다음에** 0009(메뉴 설명의 숫자를 토큰으로). 옛 web 에 먼저 돌리면 머리글에 `{case}` 가 날것으로 나온다.
   돌린 뒤 관리 화면에서 메뉴를 한 번 저장하거나 1분 기다린다(메뉴 캐시).
5. `node api/scripts/sanitize-bodies.js` 로 먼저 보고, `--apply` 로 기존 본문 정리(두 번째는 0).
6. 실제 IAM 로그인 한 번(X2).

# 4차 — 새 서버 배포 (2026-09-23)

사용자: 옛 배포(rsync → PHP 웹 루트)는 버린다. 깃허브에 올리고 서버에서 docker 로 띄운다. 컨테이너는 「2개」.

| 노드 | 상태 | 산출물 | 완료 증거 | 비고 |
|---|---|---|---|---|
| D0. 옛 배포 걷어 내기 | ✅ | operations 「새 서버 배포」 · standards 배포 절 · CLAUDE/AGENTS 의 웹 루트 전제 | grep rsync·Deploy (SSH) → 「버렸다」 문장만 | |
| D1. api 헬스체크 | ✅ | compose api healthcheck(/api/content/menu) | docker compose ps 에 api healthy | |
| D2. 서버 모양 확인 | ✅ | iwinv 콘솔(사용자 로그인 뒤 읽기만) | 서버 `drvalue-main-page` Ubuntu 26.04 · 115.68.224.135 · LB·NAT 없음 · 관리형 PostgreSQL 10 `drvaluehome.sldb.iwinv.net` · 접속 허용 IP 3(서버 공인 IP 포함) · 이 서버 이름의 ELCAP 방화벽 규칙 없음 · iwinv DNS 안 씀 | VNC 는 탭 밖으로 떠 못 봤다(로그인도 자격이 필요하다) — nginx·docker 설치 여부는 서버에서 확인 |
| D3. 운영 compose·env·프록시 | ✅ | compose = web·api 둘(api 포트 없음, web 127.0.0.1) · docker-compose.dev.yml(로컬 db·포트) · DB_* env · api 가 뜰 때 migrate · deploy/nginx-drvalue.conf · deploy/copy-content.sh · operations 「새 서버 배포」 | **리허설**(운영 compose + 관리형 흉내 postgres(다른 계정·DB 이름) + nginx 컨테이너): 빈 DB 에 schema.sql + 0001~0009 · api·web healthy · nginx 경유 6 경로 200 · api 3500·web 외부 주소 닫힘 · **가짜 X-Forwarded-For 6번 → 6번째 429** · 콘텐츠 옮기기(글 40·번역 41·파일 11·페이지 17·메뉴 31, 시퀀스 앞섬) · check-boards 35·pages 110·home 23·header 107·a11y 323 · 특허 그림 관문 200 · 로그인 쿠키 Secure, IAM 콜백 https 운영 주소. 로컬 개발 모양: verify 331/0/1 · web 8종 | 리허설에서 찾은 버그: db/schema.sql 이 빈 DB 에서 실패(없는 directus_users 로 가는 FK 하나가 남아 있었다) → 뺐다 |
| D4. 서버에서 할 것(사람) | ⛔ | | | DNS → 115.68.224.135 · IAM 화이트리스트에 https://drvalue.co.kr/api/admin/auth/callback · ELCAP 방화벽 22(사무실)·80·443 · 서버 .env(관리형 DB 값·새 세션 키·NCP·GTM) · 콘텐츠 옮기기(할지 결정) · GrowChat 도메인 |
