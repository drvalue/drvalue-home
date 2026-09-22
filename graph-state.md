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
| E1. 게시판 3종(뉴스·채용·FAQ) 관리 + 공개 화면 3장 | ⬜ | api BOARDS, web /admin, web /page/support/{news,recruit,faq} | verify.sh 에 3종 검사 · check-pages 바닥 | recruit 는 posts.board — recruits 표 안 씀 |
| E2. 문의 담당자 지정·메모·이메일 답장 | ⬜ | api admin-inquiry, web /admin/inquiries | PATCH assignee/note → 목록 반영 | 담당자 = admin_users 목록 |
| E3. 미디어 관리 화면(목록·검색·삭제·PDF·영상·용량) | ⬜ | api admin-file list, web /admin/media | 업로드 mp4 → 목록 → 삭제 | 영상 200MB 상한 |
| E4. 예약 게시(publish_at/unpublish_at 자동 상태 전환 + 공개 API 필터) | ⬜ | api schedule cron | verify.sh: 미래 publish_at 글이 목록에 없다 · 1분 뒤 있다 | @nestjs/schedule |
| E5. 변경 이력 화면 + 이전 버전 복구 | ⬜ | web /admin/history, api revisions | 저장 2회 → 이력 2건 → 복구 → 값 되돌아옴 | posts·inquiries·files |
| E6. 권한 화면(admin/marketing/hr) + 메뉴·API 가드 | ⬜ | web /admin/users, api RoleGuard | hr 로 공지 PUT → 403 · 채용 PUT → 200 | 첫 admin 은 IAM 통과자 중 admin_users 비어 있을 때 자동 |
| V1. 1차 검증 | ⬜ | | verify.sh · web 검사 5종 · tsc/build 둘 | |
| E7. 페이지 관리(회사소개·비전·오시는 길·사업·서비스 5장 제목·본문·이미지) | ⬜ | pages 표, /admin/pages, 5장 CMS 우선 | 저장 → 화면 즉시 | 코드 예비 유지 |
| E8. 메인 화면 관리(배너·팝업·문구·순서·링크) | ⬜ | home_settings·banners·popups 표, /admin/home | 배너 순서 바꿈 → 홈 반영 | |
| E9. 메뉴 관리(상단/하단·순서·노출) | ⬜ | menu_items 표, /admin/menu, lib/menu.ts 가 api 를 읽음 | 항목 숨김 → 헤더에서 사라짐 · check-header 통과 | 실패 시 코드 메뉴 |
| E10. SEO(페이지·글별 title·description·OG·noindex) | ⬜ | pageMeta 가 CMS 를 읽음, /admin/seo | OG 이미지 바꿈 → og:image 헤더 반영 | |
| E11. GA4 + 동의 | ⬜ | env GA_MEASUREMENT_ID, SiteScripts | ID 있으면 gtag 실림, 없으면 안 실림 | GTM 은 그대로 |
| V2. 2차 검증 + 문서 | ⬜ | docs · contracts · AGENTS | 검사 전부 · grep 잔재 0 | |
| E0. 로그인·관리 화면 UI/UX 크리틱 + 수정 | ⬜ | | 크리틱 지적 처리 목록 | laws-of-ux · tastemaker audit |
