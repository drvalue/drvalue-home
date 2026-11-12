-- 0022 everyrag 장을 만든다(2026-11-12 사용자: 「everyrag 페이지도 하나 만들어야」).
-- ① 페이지 글 씨앗(web/scripts/page-seed.mjs service-everyrag 가 찍은 것 — web 의 content.ts 기본 글과 같다)
-- ② AI솔루션 메뉴의 「채팅」 다음 줄에 「everyrag」.
--
-- 사람이 관리 화면에서 고친 것은 건드리지 않는다: 글은 없을 때만 넣고, 메뉴 줄은 그 주소가 아직 없을 때만 넣는다.
-- AI솔루션 탭은 이름이 아니라 「켜지는 주소」(/page/service/)로 찾는다 — 이름은 관리 화면에서 바뀔 수 있다.
-- 그 탭이 없으면(사람이 지웠으면) 메뉴 줄은 넣지 않는다. 여러 번 돌려도 같다.
INSERT INTO page_contents (key, languages_code, content, updated_on, updated_by)
VALUES ('service-everyrag', 'ko-KR', $seed${"shell":{"kicker":"everyrag","kickerSub":"AI솔루션","headLead":"우리 회사의 기록을 ","headStrong":"믿고 쓸 수 있는 답으로, everyrag","desc":"쌓인 문서와 대화를 요약 지식으로 정리하고, 근거가 없으면 없다고 답합니다. 팀마다 자료가 나뉘어 다른 팀 자료가 섞이지 않습니다.","heroLink":"everyrag 바로가기","ctaTitle":"우리 자료로 답하는 AI, everyrag 로 먼저 확인해 보세요","ctaDesc":"studio.everyrag.com 에서 서비스를 바로 살펴볼 수 있습니다. 도입·연동 상담은 아래로."},"lead":{"title":"문서를 올리면 바로 물어볼 수 있습니다","desc":"파일을 올리면 채팅 화면이 생깁니다. 답 문장 끝의 인용 번호에서 원문을 볼 수 있습니다.","heroN":"","heroLabel":"","items":[{"t":"근거가 붙은 답","d":"자료에서 온 답에는 어느 문서인지 인용이 붙습니다. 인용문은 AI 가 지어낸 말이 아니라 원문에서 가져옵니다."},{"t":"없으면 없다고","d":"기록에 없으면 없다고 답합니다. 일반 지식으로 덧붙일 때는 「자료 밖」으로 따로 표시합니다."},{"t":"팀별로 나뉜 자료","d":"조직 · 프로젝트 · 컬렉션으로 자료를 나눕니다. 다른 팀의 자료는 섞이지 않습니다."}]},"heroShots":[{"image":{"id":null,"alt":"everyrag 서비스 첫 화면 — 「우리 팀의 기록을 믿고 쓸 수 있는 답으로」 제목과 무료로 시작 단추, 문서와 표가 조각으로 나뉘어 정리되고 인용이 붙은 답으로 이어지는 그림","src":"/screens/everyrag-home.jpg","width":1600,"height":602},"tag":"everyrag · 사내 문서 AI","url":"studio.everyrag.com"}],"demo":{"kicker":"질문과 답","title":"있으면 인용하고, 없으면 없다고 답합니다","desc":"자료에서 온 답에는 원문 인용이 붙습니다. 자료에 없으면 없다고 답하고, 일반 지식으로 덧붙일 때는 「자료 밖」으로 따로 표시합니다. 아래는 everyrag 가 사이트에 올려 둔 예시 대화를 그대로 따라간 것입니다."},"compareStatement":{"kicker":"","title":"찾는 시간이 아니라 묻는 시간","desc":"문서를 뒤지고 아는 사람을 찾던 일을, 올려 두고 묻는 일로 바꿉니다."},"compare":{"before":{"title":"문서는 쌓여 있는데, 답은 사람을 찾아가야 나옵니다","points":[{"text":"어느 문서에 있는지 아는 사람에게 물어야 합니다"},{"text":"일반 AI 는 우리 자료에 없는 것도 그럴듯하게 답합니다"},{"text":"답이 어디서 나왔는지 확인할 길이 없습니다"}],"bubbles":[{"who":"me","t":"겨울에 배합 바꾼 거, 어디에 적혀 있죠?"},{"who":"them","t":"배합노트 어딘가에 있을 텐데… 담당자한테 물어볼게요"},{"who":"me","t":"일반 AI 에 물어보니 답은 주는데, 맞는 건지 모르겠어요"}]},"after":{"title":"올려 둔 자료에서 찾아, 근거와 함께 답합니다","points":[{"text":"파일을 올리면 바로 채팅으로 물어볼 수 있습니다"},{"text":"답마다 원문 인용이 붙어 어느 문서인지 바로 확인합니다"},{"text":"자료에 없으면 없다고 답하고, 일반 지식은 「자료 밖」으로 표시합니다"}]},"shot":{"id":null,"alt":"everyrag 서비스 사이트의 채팅 예시 화면 — 인용 번호가 붙은 답, 자료에서 못 찾았다는 답, 「자료 밖」 표시가 붙은 답","src":"/screens/everyrag-assistant.jpg","width":1120,"height":904}},"extra":{"kicker":"시작하기","title":"올리고, 정리되고, 물어봅니다","desc":"문서(docx · pdf · txt)와 표(csv), 대화 기록을 올릴 수 있습니다."},"steps":[{"t":"자료 올리기","d":"파일을 끌어다 놓으면 됩니다. 나누고 정리하는 일은 everyrag 가 합니다."},{"t":"자동 요약","d":"쌓일 때마다 주제별로 묶어 요약합니다. 새 기록이 들어오면 해당 주제만 다시 요약합니다."},{"t":"묻고 확인하기","d":"채팅으로 묻고, 답에 붙은 인용에서 원문을 확인합니다."}]}$seed$::jsonb, now(), 'seed')
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
  VALUES (n, 'ko-KR', 'everyrag', '사내 문서에 근거를 붙여 답하는 AI');
END $$;
