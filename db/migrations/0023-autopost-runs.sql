-- 0023 제조 AI 주간 글(자동 발행)의 주 단위 기록. 한 주(ISO 주, 한국 시간)에 한 행이다.
--
-- 1) week_key 가 기본 키라 두 프로세스가 같은 주를 동시에 잡지 못한다(INSERT … ON CONFLICT DO NOTHING).
-- 2) status: running(만드는 중) · published(공개함) · drafted(손으로 돌려 초안으로 남김) · skipped(검사에 떨어져
--    건너뜀) · error(API 실패 등 — 그 주에 한 번 더 한다, attempts 2 까지).
-- 3) 검사에 떨어진 글은 posts 에 넣지 않고 여기 article(jsonb)에만 남긴다 — 관리 화면 뉴스 목록에 초안으로
--    놓이면 한 번 눌러 공개된다. reason 은 떨어진 사유(줄바꿈으로 이은 문장들).
-- 4) post_id 에 FK 를 걸지 않는다 — 글을 지워도 기록은 남는다.
--
-- 여러 번 돌려도 같다.

CREATE TABLE IF NOT EXISTS autopost_runs (
  week_key       varchar(8)   PRIMARY KEY,                 -- '2026-W46'
  status         varchar(12)  NOT NULL,
  attempts       smallint     NOT NULL DEFAULT 1,
  reason         text,
  post_id        integer,
  article        jsonb,
  input_tokens   integer,
  output_tokens  integer,
  started_on     timestamptz  NOT NULL DEFAULT now(),
  finished_on    timestamptz
);
