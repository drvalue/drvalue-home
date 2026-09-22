-- 페이지 글(회사소개·오시는 길 …). 칸 구조는 api 의 core/page/schema 가 정하고 저장할 때 그 구조로 검사한다.
-- 한 장 · 한 언어가 한 행이다. 저장한 것이 곧 공개다(초안 없음). 여러 번 돌려도 같다.
-- 표 이름이 pages 가 아닌 이유: Directus 를 시험할 때 만든 pages·page_blocks 가 남아 있는 DB 가 있다(칸이 다르다).
CREATE TABLE IF NOT EXISTS page_contents (
  key             varchar(64)  NOT NULL,
  languages_code  varchar(255) NOT NULL REFERENCES languages(code),
  content         jsonb        NOT NULL,
  updated_on      timestamptz  NOT NULL DEFAULT now(),
  updated_by      varchar(255),
  PRIMARY KEY (key, languages_code)
);

-- 씨앗: 지금 화면에 있는 글. web/scripts/page-seed.mjs 가 web 의 content.ts 에서 만든다.
-- 이미 고친 글은 덮지 않는다(ON CONFLICT DO NOTHING).
INSERT INTO page_contents (key, languages_code, content, updated_on, updated_by)
VALUES ('company-location', 'ko-KR', $seed${"shell":{"kicker":"찾아오시는 길","kickerSub":"회사소개","headLead":"디알밸류로 찾아오시는 길을 ","headStrong":"상세히 안내해 드립니다.","desc":"디알밸류는 한양대학교 ERICA 창업보육센터에 위치하고 있습니다.","leadTitle":"오시는 길","ctaTitle":"방문 전에 미리 연락 주세요.","ctaDesc":"방문 전 일정을 협의하시면 보다 원활한 상담이 가능합니다."},"place":{"company":"주식회사 디알밸류","address":[{"line":"경기도 안산시 상록구 한양대학로 55"},{"line":"한양대학교 ERICA 창업보육센터 318호"}],"tel":"031-400-3880","email":"hi@drvalue.co.kr","mapQuery":"한양대학교 ERICA 창업보육센터"},"guide":{"title":"방문 안내","desc":"방문 전 일정 협의 후 내방하시면 보다 원활한 상담이 가능합니다. 교내 주차가 가능하며, 창업보육센터 방문객임을 확인해 주세요.","photo":null}}$seed$::jsonb, now(), 'seed')
ON CONFLICT (key, languages_code) DO NOTHING;
