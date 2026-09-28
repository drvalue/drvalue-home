-- 0016 0015 를 뒤집는다: 컷온을 CADON 장 안으로 합친다(2026-09-28 사용자 — 「CADON 안에 CUTON 내용을」).
-- 「CADON」 줄을 다시 보이게 하고 「CADON · 컷온」 으로, 「컷온」 줄은 옛 이름으로 돌려 안 보이게 한다.
-- 컷온 주소는 web/lib/dvRoutes.mjs 가 CADON 장의 #cuton 으로 넘긴다.
--
-- 사람이 관리 화면에서 고친 줄은 건드리지 않는다: 씨앗(0006)이나 0015 가 둔 값일 때만 바꾼다.
-- 여러 번 돌려도 같다.
update site_menu_item_translations t
   set label = 'CADON · 컷온',
       description = 'AutoCAD 판금 전개부터 도면 견적까지'
  from site_menu_items m
 where t.menu_item_id = m.id
   and m.location = 'top'
   and m.href = '/page/service/cadon'
   and t.languages_code = 'ko-KR'
   and t.label = 'CADON'
   and t.description = 'AutoCAD 안에서 판금 전개';

update site_menu_items m
   set visible = true
  from site_menu_item_translations t
 where t.menu_item_id = m.id
   and t.languages_code = 'ko-KR'
   and t.label = 'CADON · 컷온'
   and m.location = 'top'
   and m.href = '/page/service/cadon'
   and m.visible = false;

update site_menu_item_translations t
   set label = '컷온',
       description = '도면을 올리면 견적이 초 단위로'
  from site_menu_items m
 where t.menu_item_id = m.id
   and m.location = 'top'
   and m.href = '/page/service/cuton'
   and t.languages_code = 'ko-KR'
   and t.label = '컷온 · CADON'
   and t.description = '도면 견적부터 AutoCAD 판금 전개까지';

update site_menu_items
   set visible = false
 where location = 'top'
   and parent_id is not null
   and href = '/page/service/cuton'
   and visible = true;
