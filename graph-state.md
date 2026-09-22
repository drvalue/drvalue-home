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
