-- 0017 AI솔루션 메뉴에서 「한건」을 뺀다(2026-09-28 사용자: 「AI 솔루션에 한건은 빼주면 됨 — CMS 에서 빼는 게 되면 그렇게」).
-- 관리 화면 「사이트 › 메뉴」의 「사이트에 보이기」를 끈 것과 같다 — 드롭다운·현재 위치 줄·바닥글에서 다 빠진다.
-- 장(/page/service/hangeon) 자체는 지우지 않는다. 다시 보이려면 관리 화면에서 켜면 된다.
--
-- 사람이 관리 화면에서 고친 줄은 건드리지 않는다: 아직 보이는 씨앗 줄일 때만 끈다. 여러 번 돌려도 같다.
update site_menu_items
   set visible = false
 where location = 'top'
   and parent_id is not null
   and href = '/page/service/hangeon'
   and visible = true;
