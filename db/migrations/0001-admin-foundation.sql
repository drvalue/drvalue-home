-- 관리 화면 2차 — 공통 바닥. 한 번만 돌린다(idempotent).
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f db/migrations/0001-admin-foundation.sql
--
-- 1) admin_users      권한. IAM 이메일 → 역할. 로그인은 IAM, 무엇을 만질 수 있나는 여기.
-- 2) admin_revisions  변경 이력. 누가 · 언제 · 어느 표의 어느 행을 · 이전 값 → 지금 값.
-- 3) inquiries        담당자·메모.
-- 4) posts            employment_type · is_open_ended (채용). 나머지 칸은 이미 있다.

-- 1) 권한 -------------------------------------------------------------
-- role: admin(전부) · marketing(게시판·페이지·메인·미디어·메뉴·SEO·문의) · hr(채용공고만)
CREATE TABLE IF NOT EXISTS admin_users (
  email       varchar(255) PRIMARY KEY,
  role        varchar(32)  NOT NULL DEFAULT 'marketing',
  name        varchar(100),
  enabled     boolean      NOT NULL DEFAULT true,
  created_on  timestamptz  NOT NULL DEFAULT now(),
  updated_on  timestamptz  NOT NULL DEFAULT now(),
  CONSTRAINT admin_users_role_check CHECK (role IN ('admin', 'marketing', 'hr'))
);

-- 2) 변경 이력 ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS admin_revisions (
  id          bigserial    PRIMARY KEY,
  actor       varchar(255) NOT NULL,           -- IAM 이메일
  action      varchar(16)  NOT NULL,           -- create | update | delete | restore
  collection  varchar(64)  NOT NULL,           -- posts | inquiries | files | pages | ...
  item_id     varchar(64)  NOT NULL,
  before      jsonb,                           -- 바꾸기 전 전체 (create 면 NULL)
  after       jsonb,                           -- 바꾼 뒤 전체 (delete 면 NULL)
  created_on  timestamptz  NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS admin_revisions_item_idx ON admin_revisions (collection, item_id, id DESC);
CREATE INDEX IF NOT EXISTS admin_revisions_created_idx ON admin_revisions (created_on DESC);

-- 3) 문의 담당자·메모 ---------------------------------------------------
ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS assignee_email varchar(255);
ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS note text;
ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS created_on timestamptz NOT NULL DEFAULT now();
ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS updated_on timestamptz NOT NULL DEFAULT now();

-- 4) 채용공고 칸 (posts 에 board='recruit' 로 둔다 — 별도 표 recruits 는 안 쓴다) -----
ALTER TABLE posts ADD COLUMN IF NOT EXISTS employment_type varchar(32);
ALTER TABLE posts ADD COLUMN IF NOT EXISTS is_open_ended boolean NOT NULL DEFAULT false;

-- 5) 예약 게시가 순서 정렬에 쓰는 인덱스 ------------------------------------
CREATE INDEX IF NOT EXISTS posts_schedule_idx ON posts (status, publish_at, unpublish_at);
