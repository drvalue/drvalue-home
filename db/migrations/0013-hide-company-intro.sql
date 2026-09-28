-- 0013 회사소개 · 안내(/page/company/intro) 장을 숨긴다(2026-09-28 사용자).
-- 하위 「안내」 줄은 안 보이게 하고, 대분류 「회사소개」 는 비전 장으로 보낸다.
-- 주소 자체는 web/lib/dvRoutes.mjs 가 비전으로 넘긴다.
--
-- 사람이 관리 화면에서 고친 줄은 건드리지 않는다: 아직 옛 씨앗(0006) 값일 때만 바꾼다.
-- 여러 번 돌려도 같다.
update site_menu_items
   set visible = false
 where location = 'top'
   and parent_id is not null
   and href = '/page/company/intro'
   and visible = true;

update site_menu_items
   set href = '/page/company/vision'
 where location = 'top'
   and parent_id is null
   and href = '/page/company/intro';
