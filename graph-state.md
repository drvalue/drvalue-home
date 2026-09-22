# 작업 그래프 상태 — Directus 를 자체 관리 화면으로 대체 (2026-09-22)

가지 `heysep/cms-편집`. 완료는 「완료 증거」 칸이 차야 ✅.

| 노드 | 상태 | 산출물 | 완료 증거 | 비고 |
|---|---|---|---|---|
| 1. IAM 로그인 Nest 이식 (`core/admin-auth`) | ✅ | api/src/core/admin-auth | 콜백 302 (사용자 클릭, localhost 콜백 통과) · authorize 테스트 6/6 · 커밋 747ed69 | 세션 30분, IAM 내부 API 로 60초 재검(자격 없으면 건너뜀) |
| 2. 데이터 계층 (TypeORM, 기존 테이블) | ✅ | api/src/common/entity · database | count 40, patent-1 번역·그림·번호 읽힘 · 커밋 d028d4f | synchronize 절대 끔. 업로드 data/uploads 로 복사(12) |
| 3. 관리 CRUD API (posts·files·inquiries) | ✅ | api/src/core/admin-* | 업로드 581×788 · 만들기→고치기→순서→지우기 · 400 · 초안 파일 404 · 401 | 파일 삭제·문의 검색/삭제·txt 업로드 추가(미커밋) |
| 4. 공개 API DB 직결 (content·inquiry) | ✅ | api/src/core/content, inquiry | verify.sh 47/53 (Directus 없이; 6건은 A·픽스처 문제) · asset 200 | DirectusService 삭제 |
| A. verify.sh 픽스처를 관리 API 로 | 🔄 | api/scripts/verify.sh | verify.sh 전부 PASS, `DIRECTUS_URL` 없이 | boot 검사에 ADMIN_SESSION_SECRET·DB_* |
| B. web `/admin` 화면 | 🔄 | web/app/admin/*, web/lib/admin.ts | tsc·next build 통과 · 로그인 버튼→IAM→목록→편집→저장→사이트 반영(사용자 확인) | 메뉴: 게시판 6 + 문의만 |
| C. 공개 4장 즉시 반영 + web 검사 | ✅ 완료 | web/lib/cms.ts · app/home/news.ts (`cache: 'no-store'`), 4장 + 홈 `dynamic = 'force-dynamic'`, scripts/check-pages.py `NEXT_ORIGIN` 환경변수 | `next build` 5장이 ƒ(요청마다 렌더) · check-src 0문제 · tsc 통과 · check-pages 98/98(:3410) · check-assets 빠진 것 0 · 실측: patent-1 제목에 ' (검증)' PUT → 즉시 `grep -c` 1, 원복 PUT → 0 | 커밋은 부모가 한다 |
| D. Directus 은퇴 | ⛔ | docker-compose.yml, cms/, .env.example, docs | `docker compose ps` 에 directus 없음 · verify.sh 재통과 · DIRECTUS 참조 0 | A·B·C 검증 뒤 |
| V. 최종 교차검토 | ⬜ | | advisor 지적 0 또는 처리 | |
