-- 0022 everyrag 장을 만든다(2026-11-12 사용자: 「everyrag 페이지도 하나 만들어야」).
-- ① 페이지 글 씨앗(web/scripts/page-seed.mjs service-everyrag 가 찍은 것 — web 의 content.ts 기본 글과 같다)
-- ② AI솔루션 메뉴의 「채팅」 다음 줄에 「everyrag」.
--
-- 사람이 관리 화면에서 고친 것은 건드리지 않는다: 글은 없을 때만 넣고, 메뉴 줄은 그 주소가 아직 없을 때만 넣는다.
-- AI솔루션 탭은 이름이 아니라 「켜지는 주소」(/page/service/)로 찾는다 — 이름은 관리 화면에서 바뀔 수 있다.
-- 그 탭이 없으면(사람이 지웠으면) 메뉴 줄은 넣지 않는다. 여러 번 돌려도 같다.
INSERT INTO page_contents (key, languages_code, content, updated_on, updated_by)
VALUES ('service-everyrag', 'ko-KR', $seed${"shell":{"kicker":"everyrag","kickerSub":"AI솔루션","headLead":"벡터 DB 없이 ","headStrong":"자료에 근거를 붙여 답하는 RAG, everyrag","desc":"파일 · JSON · 대화 기록을 API 키로 넣으면 조각 나누기 · 임베딩 · 색인 · 요약까지 처리합니다. 올린 즉시 채팅으로 시험하고, 답에는 원문 인용이 붙습니다.","heroLink":"everyrag 바로가기","ctaTitle":"우리 자료로 답하는 AI, everyrag 로 먼저 확인해 보세요","ctaDesc":"studio.everyrag.com 에서 서비스를 바로 살펴볼 수 있습니다. 도입·연동 상담은 아래로."},"lead":{"title":"벡터 DB 를 몰라도 됩니다","desc":"자료를 넣으면 요약하고 색인하고, 근거를 붙여 답합니다.","heroN":"","heroLabel":"","items":[{"t":"근거 인용","d":"답의 인용 번호는 서버가 넘긴 근거 안에서만 인정합니다. 인용문은 모델 출력이 아니라 원문에서 가져옵니다."},{"t":"요약 지식","d":"원문만 뒤지지 않고, 쌓일 때마다 만든 주제 요약도 함께 찾습니다. 기간이나 사람 질문에 강합니다."},{"t":"컬렉션 격리","d":"모든 저장 · 검색 쿼리에 컬렉션 조건이 필수입니다. 다른 컬렉션의 자료는 섞이지 않습니다."}]},"heroShots":[{"image":{"id":null,"alt":"everyrag 서비스 첫 화면 — 「벡터 DB 없이 자료에 근거를 붙여요」 제목과 무료로 시작 단추, 문서·JSON·표가 조각으로 나뉘어 색인되고 인용이 붙은 답으로 이어지는 그림","src":"/screens/everyrag-home.jpg","width":1440,"height":900},"tag":"everyrag · RAG 플랫폼","url":"studio.everyrag.com"}],"demo":{"kicker":"Assistant","title":"있으면 인용하고, 없으면 없다고 답합니다","desc":"자료에서 온 답에는 원문 인용이 붙습니다. 자료에 없으면 없다고 답하고, 일반 지식으로 덧붙일 때는 「자료 밖」으로 따로 표시합니다. 아래는 everyrag 가 사이트에 올려 둔 예시 대화를 그대로 따라간 것입니다."},"compareStatement":{"kicker":"","title":"만드는 시간이 아니라 물어보는 시간","desc":"벡터 DB 와 파이프라인을 세우던 일을, 자료를 넣고 묻는 일로 바꿉니다."},"compare":{"before":{"title":"RAG 를 직접 만들면 답보다 배관에 시간이 갑니다","points":[{"text":"벡터 DB · 조각 나누기 · 임베딩 · 색인을 직접 만들고 운영합니다"},{"text":"답이 어느 문서에서 왔는지 따로 확인해야 합니다"},{"text":"자료에 없는 내용인지 답만 봐서는 알 수 없습니다"}],"bubbles":[{"who":"me","t":"사내 문서로 답하는 챗봇, 언제 볼 수 있어요?"},{"who":"them","t":"벡터 DB 부터 띄우고, 조각 나누기랑 임베딩 파이프라인을 만들어야 해요"},{"who":"me","t":"그런데 이 답은 어느 문서에서 나온 건가요?"}]},"after":{"title":"자료를 넣으면 근거가 붙은 답이 나옵니다","points":[{"text":"API 키로 넣으면 조각 나누기 · 임베딩 · 색인 · 요약까지 처리합니다"},{"text":"답의 인용 번호는 서버가 넘긴 근거 안에서만 인정합니다"},{"text":"자료에 없으면 없다고 답하고, 일반 지식은 「자료 밖」으로 표시합니다"}]},"shot":{"id":null,"alt":"everyrag 서비스 사이트의 채팅 예시 화면 — 인용 번호가 붙은 답, 자료에서 못 찾았다는 답, 「자료 밖」 표시가 붙은 답","src":"/screens/everyrag-assistant.jpg","width":566,"height":456}},"extra":{"kicker":"API","title":"API 키 하나로 시작합니다","desc":"넣기와 묻기는 같은 키로 합니다. 범위는 ingest · query · admin 이고, 키 원문은 발급할 때 한 번만 보여 줍니다."},"steps":[{"t":"넣기","d":"파일을 끌어다 놓거나, JSON · 대화 기록을 API 로 보냅니다. 조각 나누기는 everyrag 가 합니다."},{"t":"요약 · 색인","d":"쌓일 때마다 주제별 요약(지식 뷰)을 만들고, 단어와 의미 두 방식으로 색인합니다."},{"t":"검색 · 답","d":"질문 종류를 가려 찾고, 재순위한 뒤 근거를 판정해서 답합니다. 인용은 서버가 검증합니다."}]}$seed$::jsonb, now(), 'seed')
ON CONFLICT (key, languages_code) DO NOTHING;

DO $$
DECLARE
  p integer;
  s integer;
  n integer;
BEGIN
  IF EXISTS (SELECT 1 FROM site_menu_items WHERE location = 'top' AND href = '/page/service/everyrag') THEN
    RETURN;
  END IF;
  SELECT m.id INTO p
    FROM site_menu_items m
   WHERE m.location = 'top' AND m.parent_id IS NULL AND m.match @> '["/page/service/"]'::jsonb
   ORDER BY m.sort
   LIMIT 1;
  IF p IS NULL THEN
    RETURN;
  END IF;
  SELECT m.sort INTO s FROM site_menu_items m WHERE m.parent_id = p AND m.href = '/page/service/chat' ORDER BY m.sort LIMIT 1;
  IF s IS NULL THEN
    SELECT coalesce(max(m.sort), 0) INTO s FROM site_menu_items m WHERE m.parent_id = p;
  END IF;
  UPDATE site_menu_items SET sort = sort + 1 WHERE parent_id = p AND sort > s;
  INSERT INTO site_menu_items (location, parent_id, sort, href, visible, hidden_in_dropdown, match)
  VALUES ('top', p, s + 1, '/page/service/everyrag', true, false, NULL)
  RETURNING id INTO n;
  INSERT INTO site_menu_item_translations (menu_item_id, languages_code, label, description)
  VALUES (n, 'ko-KR', 'everyrag', '자료에 근거를 붙여 답하는 RAG');
END $$;
