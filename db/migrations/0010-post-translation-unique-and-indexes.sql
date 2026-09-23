-- 번역은 글마다 언어당 한 줄이다. Directus 가 만든 표라 이 제약이 없었다(다른 번역 표에는 있다).
-- 목록 질의(게시판·상태·날짜)와 글 상세(번역 찾기)에 쓰는 인덱스도 같이 만든다.
-- 그리고 로컬에만 남아 있던 옛 외래키를 뗀다 — 빈 DB 에서 만든 스키마에는 없어 구조가 갈렸다.
-- 여러 번 돌려도 같다.
-- 주의: 이미 같은 글·같은 언어 번역이 두 줄인 DB 에서는 1번이 실패하고 api 가 안 뜬다(닫히는 쪽).
--       그때는 먼저 중복을 지운다: select posts, languages_code, count(*) from posts_translations group by 1,2 having count(*)>1;

-- 1. 한 글 + 한 언어 = 한 줄. (posts, languages_code) 로 찾는 질의도 이 인덱스를 쓴다.
CREATE UNIQUE INDEX IF NOT EXISTS posts_translations_post_lang_uniq
  ON public.posts_translations (posts, languages_code);

-- 2. 공개·관리 목록은 게시판 안에서 상태와 날짜로 고른다.
CREATE INDEX IF NOT EXISTS posts_board_status_date_idx
  ON public.posts (board, status, published_date DESC);

-- 3. 관리 화면 문의 목록은 상태와 접수 시각으로 본다.
CREATE INDEX IF NOT EXISTS inquiries_status_created_idx
  ON public.inquiries (status, created_on DESC);

-- 4. 옛 Directus 사용자 표로 가던 외래키(담당자는 assignee_email 로 쓴다). 그 표가 없는 곳에는 애초에 없다.
ALTER TABLE public.inquiries DROP CONSTRAINT IF EXISTS inquiries_assignee_foreign;
