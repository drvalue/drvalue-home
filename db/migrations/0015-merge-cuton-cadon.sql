-- 0015 컷온과 CADON 을 한 장으로 합친다(2026-09-28 사용자).
-- 메뉴의 「컷온」 줄을 「컷온 · CADON」 으로 바꾸고, 「CADON」 줄은 안 보이게 한다.
-- CADON 주소는 web/lib/dvRoutes.mjs 가 컷온 장의 #cadon 으로 넘긴다.
--
-- 사람이 관리 화면에서 고친 줄은 건드리지 않는다: 아직 옛 씨앗(0006) 값일 때만 바꾼다.
-- 여러 번 돌려도 같다.
update site_menu_item_translations t
   set label = '컷온 · CADON',
       description = '도면 견적부터 AutoCAD 판금 전개까지'
  from site_menu_items m
 where t.menu_item_id = m.id
   and m.location = 'top'
   and m.href = '/page/service/cuton'
   and t.languages_code = 'ko-KR'
   and t.label = '컷온'
   and t.description = '도면을 올리면 견적이 초 단위로';

update site_menu_items
   set visible = false
 where location = 'top'
   and parent_id is not null
   and href = '/page/service/cadon'
   and visible = true;
