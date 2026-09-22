-- 메뉴 관리(E9). 상단 메뉴(대분류 + 하위)와 하단 링크를 관리 화면에서 고친다.
-- web/lib/menu.ts 는 api 가 안 닿을 때의 예비로 남는다.
--
--   site_menu_items              location top|footer · parent_id(하위면 대분류 id) · sort · href · visible
--                                hidden_in_dropdown  드롭다운에는 안 띄우되 이름은 아는 하위(menu.ts 의 hidden)
--                                match               대분류가 「지금 여기」로 켜지는 주소 앞부분들(menu.ts 의 match)
--   site_menu_item_translations  언어별 이름·한 줄 설명. posts_translations 와 같은 모양(languages FK).
--
-- 이름에 site_ 를 붙인 이유: 로컬 DB 에 Directus 시절 menu_items · menu_items_translations 가 남아 있다
-- (칸이 다르다 — parent · path · is_visible · promo_*, schema.sql 에는 없다). 같은 이름이면 IF NOT EXISTS 가
-- 조용히 건너뛰고 뒤에서 깨진다. 옛 표는 건드리지 않는다 — 아무 코드도 안 읽는다.
--
-- 씨앗은 2026-09-22 의 lib/menu.ts 를 그대로 옮긴 것이다(표가 비어 있을 때만 넣는다).
-- 하단 링크는 지금 사이트에 없다 — 씨앗 없음. 넣으면 바닥글에 링크 줄이 생긴다.
-- 여러 번 돌려도 같다.

CREATE TABLE IF NOT EXISTS site_menu_items (
  id                  serial PRIMARY KEY,
  location            varchar(16)  NOT NULL CHECK (location IN ('top', 'footer')),
  parent_id           integer      NULL REFERENCES site_menu_items(id) ON DELETE CASCADE,
  sort                integer      NOT NULL DEFAULT 0,
  href                varchar(500) NOT NULL,
  visible             boolean      NOT NULL DEFAULT true,
  hidden_in_dropdown  boolean      NOT NULL DEFAULT false,
  match               jsonb        NULL,
  created_on          timestamptz  NOT NULL DEFAULT now(),
  updated_on          timestamptz  NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS site_menu_items_tree_idx ON site_menu_items (location, parent_id, sort);

CREATE TABLE IF NOT EXISTS site_menu_item_translations (
  id              serial PRIMARY KEY,
  menu_item_id    integer      NOT NULL REFERENCES site_menu_items(id) ON DELETE CASCADE,
  languages_code  varchar(255) NOT NULL REFERENCES languages(code) ON DELETE CASCADE,
  label           varchar(40)  NOT NULL,
  description     varchar(80)  NULL,
  UNIQUE (menu_item_id, languages_code)
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM site_menu_items) THEN
    INSERT INTO site_menu_items (id, location, parent_id, sort, href, visible, hidden_in_dropdown, match) VALUES
      (1, 'top', NULL, 1, '/page/company/intro', true, false, '["/page/company/"]'::jsonb),
      (2, 'top', 1, 1, '/page/company/intro', true, false, NULL),
      (3, 'top', 1, 2, '/page/company/vision', true, false, NULL),
      (4, 'top', 1, 3, '/page/company/history', true, false, NULL),
      (5, 'top', 1, 4, '/page/company/location', true, false, NULL),
      (6, 'top', NULL, 2, '/page/business/max', true, false, '["/page/business/max","/page/business/smart_fac"]'::jsonb),
      (7, 'top', 6, 1, '/page/business/max', true, false, NULL),
      (8, 'top', 6, 2, '/page/business/max/pcb-mes', true, false, NULL),
      (9, 'top', 6, 3, '/page/business/max/cosmetics-mes', true, false, NULL),
      (10, 'top', 6, 4, '/page/business/max/mes-ai', true, false, NULL),
      (11, 'top', 6, 5, '/page/business/smart_fac', true, true, NULL),
      (12, 'top', NULL, 3, '/page/business/ai_sol', true, false, '["/page/business/ai_sol","/page/service/"]'::jsonb),
      (13, 'top', 12, 1, '/page/business/ai_sol', true, false, NULL),
      (14, 'top', 12, 2, '/page/service/autoform', true, false, NULL),
      (15, 'top', 12, 3, '/page/service/cuton', true, false, NULL),
      (16, 'top', 12, 4, '/page/service/cadon', true, false, NULL),
      (17, 'top', 12, 5, '/page/service/chat', true, false, NULL),
      (18, 'top', 12, 6, '/page/service/hangeon', true, false, NULL),
      (19, 'top', 12, 7, '/page/service/growtok', true, true, NULL),
      (20, 'top', 12, 8, '/page/service/growxd', true, true, NULL),
      (21, 'top', NULL, 4, '/page/portfolio/portfolio', true, false, '["/page/portfolio/"]'::jsonb),
      (22, 'top', 21, 1, '/page/portfolio/portfolio', true, false, NULL),
      (23, 'top', NULL, 5, '/page/tech/patent', true, false, '["/page/tech/"]'::jsonb),
      (24, 'top', 23, 1, '/page/tech/patent', true, false, NULL),
      (25, 'top', 23, 2, '/page/tech/copyright', true, false, NULL),
      (26, 'top', NULL, 6, '/page/support/notice', true, false, '["/page/support/"]'::jsonb),
      (27, 'top', 26, 1, '/page/support/notice', true, false, NULL),
      (28, 'top', 26, 2, '/page/support/press', true, false, NULL),
      (29, 'top', 26, 3, '/page/support/news', true, false, NULL),
      (30, 'top', 26, 4, '/page/support/recruit', true, false, NULL),
      (31, 'top', 26, 5, '/page/support/faq', true, false, NULL);
    INSERT INTO site_menu_item_translations (menu_item_id, languages_code, label, description) VALUES
      (1, 'ko-KR', '회사소개', NULL),
      (2, 'ko-KR', '안내', '제조 현장의 언어를 데이터로 통일'),
      (3, 'ko-KR', '비전', '지능형 제조가 가는 방향과 전략'),
      (4, 'ko-KR', '연혁', '2024년 설립부터 인증·선정 기록'),
      (5, 'ko-KR', '찾아오시는 길', '한양대 ERICA 창업보육센터'),
      (6, 'ko-KR', 'M.AX', NULL),
      (7, 'ko-KR', 'M.AX 소개', '견적부터 출고까지 한 흐름으로'),
      (8, 'ko-KR', 'PCB MES', '소량 다품종 샘플 PCB 전 공정'),
      (9, 'ko-KR', '화장품 MES', '배합과 LOT 이력 통합 관리'),
      (10, 'ko-KR', 'MES AI', 'OCR 자동 입고 · 규제 자동검증'),
      (11, 'ko-KR', '스마트 팩토리 사업', '설비·공정을 잇는 실시간 최적화'),
      (12, 'ko-KR', 'AI솔루션', NULL),
      (13, 'ko-KR', 'AI 솔루션 개발', '사내 데이터로 답하는 RAG 구축'),
      (14, 'ko-KR', '오토폼', '쓰던 한글 양식 그대로 채운다'),
      (15, 'ko-KR', '컷온', '도면을 올리면 견적이 초 단위로'),
      (16, 'ko-KR', 'CADON', 'AutoCAD 안에서 판금 전개'),
      (17, 'ko-KR', '채팅', '고객과 상담원을 곧바로 잇는다'),
      (18, 'ko-KR', '한건', 'LLM·RAG 기반 건설 AI Chat'),
      (19, 'ko-KR', 'GrowTalk', '현장 상황을 나누는 협업 플랫폼'),
      (20, 'ko-KR', 'GrowXD', 'AI 분석·예측을 더한 차세대 MES'),
      (21, 'ko-KR', '수행실적', NULL),
      (22, 'ko-KR', '주요 수행실적', '9건의 과제와 기간·발주 유형'),
      (23, 'ko-KR', '기술력', NULL),
      (24, 'ko-KR', '특허', '등록 1건 · 출원 5건'),
      (25, 'ko-KR', '저작권', '프로그램 저작권 5건'),
      (26, 'ko-KR', '고객센터', NULL),
      (27, 'ko-KR', '공지사항', '서비스 오픈과 점검 안내'),
      (28, 'ko-KR', '보도자료', '언론에 소개된 소식'),
      (29, 'ko-KR', '뉴스', '디알밸류 소식'),
      (30, 'ko-KR', '채용', '함께 일할 사람'),
      (31, 'ko-KR', 'FAQ', '자주 묻는 질문');
    PERFORM setval('site_menu_items_id_seq', 31);
  END IF;
END $$;
