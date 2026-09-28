-- 0014 AI 솔루션 개발(/page/business/ai_sol) 장을 숨긴다(2026-09-28 사용자).
-- 하위 「AI 솔루션 개발」 줄은 안 보이게 하고, 대분류 「AI솔루션」 은 오토폼 장으로 보낸다.
-- 주소 자체는 web/lib/dvRoutes.mjs 가 오토폼으로 넘긴다.
--
-- 사람이 관리 화면에서 고친 줄은 건드리지 않는다: 아직 옛 씨앗(0006) 값일 때만 바꾼다.
-- 여러 번 돌려도 같다.
update site_menu_items
   set visible = false
 where location = 'top'
   and parent_id is not null
   and href = '/page/business/ai_sol'
   and visible = true;

update site_menu_items
   set href = '/page/service/autoform'
 where location = 'top'
   and parent_id is null
   and href = '/page/business/ai_sol';
