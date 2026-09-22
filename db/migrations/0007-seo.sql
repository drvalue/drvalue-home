-- SEO (E10). 여러 번 돌려도 같다.
--
-- 1) posts.updated_on — 사이트맵 lastmod. 없던 칸이라 지금까지의 글은 게시 날짜로 채운다
--    (요청 시각을 lastmod 로 내면 검색엔진이 믿지 않는다). 이후는 저장할 때마다 api 가 갱신한다.
-- 2) posts.og_image 에 FK — 지운 파일을 가리키면 공유 카드가 깨진다. 없는 파일을 가리키던 값은 비운다.
--    (posts.no_index · og_image 칸은 Directus 시절부터 있었다. 관리 화면에 칸이 없었을 뿐이다.)
-- 3) page_meta · page_meta_translations — 코드로 쓴 정적 장(회사소개·사업·서비스…)의 검색 제목·설명·
--    공유 그림·색인 제외를 관리 화면에서 덮어쓴다. 행이 없으면 코드에 적힌 값이 그대로 나간다.

ALTER TABLE posts ADD COLUMN IF NOT EXISTS updated_on timestamptz;
UPDATE posts SET updated_on = published_date::timestamptz WHERE updated_on IS NULL;
ALTER TABLE posts ALTER COLUMN updated_on SET DEFAULT now();
ALTER TABLE posts ALTER COLUMN updated_on SET NOT NULL;

UPDATE posts p SET og_image = NULL
 WHERE og_image IS NOT NULL AND NOT EXISTS (SELECT 1 FROM directus_files f WHERE f.id = p.og_image);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'posts_og_image_foreign') THEN
    ALTER TABLE posts
      ADD CONSTRAINT posts_og_image_foreign
      FOREIGN KEY (og_image) REFERENCES directus_files(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS page_meta (
  path        varchar(64)  PRIMARY KEY,               -- '/page/company/intro' · 홈은 '/'
  og_image    uuid         REFERENCES directus_files(id) ON DELETE SET NULL,
  no_index    boolean      NOT NULL DEFAULT false,
  updated_on  timestamptz  NOT NULL DEFAULT now(),
  updated_by  varchar(255)                            -- 고친 사람(IAM 이메일)
);

CREATE TABLE IF NOT EXISTS page_meta_translations (
  path            varchar(64)  NOT NULL REFERENCES page_meta(path) ON DELETE CASCADE,
  languages_code  varchar(255) NOT NULL REFERENCES languages(code) ON DELETE CASCADE,
  title           varchar(255),                        -- 비우면 코드의 제목
  description     text,                                -- 비우면 코드의 설명
  PRIMARY KEY (path, languages_code)
);
