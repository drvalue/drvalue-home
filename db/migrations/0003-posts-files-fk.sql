-- 첨부(posts_files)에 FK 가 없었다. Directus 가 만든 표라 엔티티의 onDelete CASCADE 가 DB 에 없다 —
-- 글이나 파일을 지워도 첨부 행이 남았다(2026-09-22 로컬: 없는 글을 가리키는 행 52 · 없는 파일 49).
-- 부모가 없는 행을 지우고 양쪽 FK 를 ON DELETE CASCADE 로 건다. 여러 번 돌려도 같다.
DELETE FROM posts_files pf
 WHERE (pf.posts_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM posts p WHERE p.id = pf.posts_id))
    OR (pf.directus_files_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM directus_files f WHERE f.id = pf.directus_files_id));

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'posts_files_posts_id_foreign') THEN
    ALTER TABLE posts_files
      ADD CONSTRAINT posts_files_posts_id_foreign
      FOREIGN KEY (posts_id) REFERENCES posts(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'posts_files_directus_files_id_foreign') THEN
    ALTER TABLE posts_files
      ADD CONSTRAINT posts_files_directus_files_id_foreign
      FOREIGN KEY (directus_files_id) REFERENCES directus_files(id) ON DELETE CASCADE;
  END IF;
END $$;
