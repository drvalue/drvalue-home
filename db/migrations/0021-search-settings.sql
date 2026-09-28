-- 0021 검색엔진 설정(관리 화면 「운영 › SEO › 검색엔진 설정」). 사이트에 하나뿐인 설정이라 한 행 표다(id 는 늘 1).
--
-- 1) 검색엔진 소유 확인 코드 셋(네이버 서치어드바이저 · 구글 서치 콘솔 · 빙 웹마스터). 비면(null) web 이 실행 환경값
--    (NAVER/GOOGLE/BING_SITE_VERIFICATION)을 예비로 쓴다. 공개 값이라 비밀이 아니다.
-- 2) AI 답변 봇(ChatGPT·Claude·Perplexity 검색)과 AI 학습 수집을 robots.txt 에서 열지 막을지. 기본은 둘 다 연다 —
--    이 파일 전의 robots.txt 와 같다. 네이버·다음·빙·애플 같은 검색엔진은 이 스위치와 무관하게 늘 연다(web/app/robots.ts).
--
-- 여러 번 돌려도 같다. 기본 행은 없을 때만 넣는다 — 관리 화면에서 바꾼 값을 되돌리지 않는다.

CREATE TABLE IF NOT EXISTS site_search_settings (
  id                        smallint     PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  naver_site_verification   varchar(120),
  google_site_verification  varchar(120),
  bing_site_verification    varchar(120),
  ai_search_allowed         boolean      NOT NULL DEFAULT true,
  ai_training_allowed       boolean      NOT NULL DEFAULT true,
  updated_on                timestamptz  NOT NULL DEFAULT now(),
  updated_by                varchar(255)                          -- 고친 사람(IAM 이메일). 씨앗 행은 null
);

INSERT INTO site_search_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;
