-- 메인 화면(/) 관리 — 배너 · 팝업 표와 메인 글(page_contents 'home') 씨앗. 여러 번 돌려도 같다.
--
-- 표 이름이 home_banners · home_popups 인 이유: Directus 를 시험할 때 만든 home_settings · popups ·
-- popups_translations 가 남은 DB 가 있다(칸이 다르고 코드가 안 쓴다). 같은 이름이면 IF NOT EXISTS 가
-- 조용히 건너뛰고 다음 문장이 깨진다(0004·0006 과 같은 까닭).
--
-- 배너 = 메인 머리 그림의 기간 한정 사진(+ 있으면 제목·설명·링크). 슬라이드가 아니다 — 살아 있는 것 중
-- 순서가 앞선 하나만 머리 그림에 나온다. 팝업 = 메인에서만 뜨는 알림 창. 둘 다 기간(starts_at·ends_at)과
-- 보이기(visible)를 가진다. 글자는 언어별 번역 표에 둔다(posts_translations · site_menu 와 같은 모양).

CREATE TABLE IF NOT EXISTS home_banners (
  id          serial PRIMARY KEY,
  sort        integer      NOT NULL DEFAULT 0,
  visible     boolean      NOT NULL DEFAULT true,
  image       uuid         NULL REFERENCES directus_files(id) ON DELETE SET NULL,
  link_href   varchar(500) NULL,
  starts_at   timestamptz  NULL,
  ends_at     timestamptz  NULL,
  created_on  timestamptz  NOT NULL DEFAULT now(),
  updated_on  timestamptz  NOT NULL DEFAULT now(),
  updated_by  varchar(255) NULL
);
CREATE INDEX IF NOT EXISTS home_banners_live_idx ON home_banners (visible, sort);

CREATE TABLE IF NOT EXISTS home_banner_translations (
  banner_id       integer      NOT NULL REFERENCES home_banners(id) ON DELETE CASCADE,
  languages_code  varchar(255) NOT NULL REFERENCES languages(code) ON DELETE CASCADE,
  title           varchar(120) NULL,
  description     varchar(300) NULL,
  alt             varchar(200) NULL,
  link_label      varchar(40)  NULL,
  PRIMARY KEY (banner_id, languages_code)
);

CREATE TABLE IF NOT EXISTS home_popups (
  id            serial PRIMARY KEY,
  sort          integer      NOT NULL DEFAULT 0,
  visible       boolean      NOT NULL DEFAULT true,
  image         uuid         NULL REFERENCES directus_files(id) ON DELETE SET NULL,
  link_href     varchar(500) NULL,
  starts_at     timestamptz  NULL,
  ends_at       timestamptz  NULL,
  width         integer      NOT NULL DEFAULT 480,
  dismiss_days  integer      NOT NULL DEFAULT 1,
  created_on    timestamptz  NOT NULL DEFAULT now(),
  updated_on    timestamptz  NOT NULL DEFAULT now(),
  updated_by    varchar(255) NULL
);
CREATE INDEX IF NOT EXISTS home_popups_live_idx ON home_popups (visible, sort);

CREATE TABLE IF NOT EXISTS home_popup_translations (
  popup_id        integer      NOT NULL REFERENCES home_popups(id) ON DELETE CASCADE,
  languages_code  varchar(255) NOT NULL REFERENCES languages(code) ON DELETE CASCADE,
  title           varchar(120) NULL,
  body            text         NULL,
  alt             varchar(200) NULL,
  link_label      varchar(40)  NULL,
  PRIMARY KEY (popup_id, languages_code)
);

-- 메인 글 씨앗 — web/app/home/content.ts 의 HOME_DEFAULT(node web/scripts/page-seed.mjs 로 만든 것).
-- ON CONFLICT DO NOTHING 이라 이미 고친 글을 덮지 않는다.
INSERT INTO page_contents (key, languages_code, content, updated_on, updated_by)
VALUES ('home', 'ko-KR', $seed${"hero":{"kicker":"MANUFACTURING AI · DX","titleLead":"AI로 실현하는","titleStrong":"지능형 제조의 미래","desc":"MES/ERP 구축, 제조 AI 자동화, LLM·RAG 기반 AI Chat, 상담 솔루션. 실제 현장에서 사용하는 시스템을 만듭니다.","primary":{"label":"M.AX 살펴보기","href":"/page/business/max"},"secondaryLabel":"문의하기","background":null},"sections":[{"section":"proof","visible":true},{"section":"biz","visible":true},{"section":"news","visible":true},{"section":"cta","visible":true}],"proof":{"kicker":"CREDENTIALS","title":"말보다 먼저 쌓아 온 것들","more":{"label":"연혁 전체 보기","href":"/page/company/history"},"cards":[{"year":"2026","kind":"선정","title":"소상공인 AI 활용지원 사업 전문 AI 멘토 기업 선정","detail":"AI 도입을 돕는 전문 멘토 기업으로 선정됐습니다.","icon":"fa-users"},{"year":"2026","kind":"선정","title":"AI 바우처 · 클라우드 바우처 선정, S 바우처 재선정","detail":"AI·클라우드 바우처에 선정되고 S 바우처는 다시 선정됐습니다.","icon":"fa-ticket"},{"year":"2025","kind":"선정","title":"제조 AI 솔루션 100선 선정","detail":"제조 AI 솔루션 100선에 선정됐습니다.","icon":"fa-trophy"},{"year":"2025","kind":"인증","title":"ISO 9001 / ISO 14001 인증","detail":"품질경영(9001)과 환경경영(14001) 국제 표준 인증입니다.","icon":"fa-certificate"},{"year":"2025","kind":"인증","title":"클라우드 서비스 적격 평가 인증","detail":"클라우드 서비스 적격 평가 인증을 받았습니다.","icon":"fa-cloud"},{"year":"2025","kind":"인증","title":"AI V&V AI 성능 시험","detail":"AI 성능 시험(V&V)을 받았습니다.","icon":"fa-check-square-o"},{"year":"2025","kind":"협력","title":"한양대학교 ERICA 스마트융합공학부 MOU 체결","detail":"한양대학교 ERICA 스마트융합공학부와 업무협약을 맺었습니다.","icon":"fa-handshake-o"},{"year":"2025","kind":"협력","title":"중소기업벤처부 통합 기술보호지원 자문 진행","detail":"중소기업벤처부 통합 기술보호지원 자문을 진행했습니다.","icon":"fa-shield"},{"year":"2025","kind":"선정","title":"S 바우처 선정","detail":"S 바우처에 선정됐습니다.","icon":"fa-ticket"},{"year":"2024","kind":"협력","title":"기업부설연구소 설립","detail":"자체 연구 조직을 두고 있습니다.","icon":"fa-flask"},{"year":"2024","kind":"협력","title":"디알밸류 법인 설립","detail":"(주)디알밸류를 설립했습니다.","icon":"fa-building-o"}]},"biz":{"kicker":"BUSINESS","title":"무엇을 만드는가","cards":[{"href":"/page/business/max","kicker":"MANUFACTURING AI","title":"제조AI(M.AX)","lead":"견적부터 출고까지 하나의 흐름으로 연결된 업종 특화 MES 와 제조 AI.","points":[{"text":"PCB · 화장품 업종 특화"},{"text":"MES 공통 프로세스 6단계"},{"text":"제조 특화 AI 5대 기능"}],"icon":"fa-cogs"},{"href":"/page/business/ai_sol","kicker":"AI SOLUTION DEVELOPMENT","title":"AI 솔루션 개발","lead":"최신 LLM 부터 보안이 강조된 온프레미스 로컬 AI 까지 맞춤형으로 제안합니다.","points":[{"text":"Global LLM 최적화"},{"text":"보안 특화 로컬 LLM"},{"text":"RAG 기반 지식 서비스"}],"icon":"fa-comments-o"},{"href":"/page/business/smart_fac","kicker":"NEXT-GEN MANUFACTURING","title":"스마트 팩토리 사업","lead":"현장의 모든 설비와 공정을 디지털로 연결해 실시간 최적화를 실현합니다.","points":[{"text":"AI 자동 견적 (Costing)"},{"text":"IoT 통합 모니터링"},{"text":"MES/ERP 실시간 연계"}],"icon":"fa-industry"}]},"news":{"kicker":"NEWS","title":"디알밸류의 최근 소식","more":{"label":"전체 보기","href":"/page/support/notice"}},"cta":{"title":"우리 공장에, 우리 업무에 맞는 구성이 궁금하신가요?","desc":"현장 상황을 알려주시면 맞는 방식을 제안해 드립니다.","buttonLabel":"문의하기"}}$seed$::jsonb, now(), 'seed')
ON CONFLICT (key, languages_code) DO NOTHING;
