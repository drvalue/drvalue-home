-- 메뉴 설명의 손으로 적은 글 수를 자리표시로 — web 의 getMenu() 가 공개 게시판의 글 수로 채운다
-- (web 규칙 「화면에 적는 숫자는 자료에서 센다」). 씨앗(0006)이 lib/menu.ts 의 옛 글을 그대로 옮겼다.
-- 옛 글과 **똑같을 때만** 바꾼다 — 편집자가 고친 설명은 건드리지 않는다. 여러 번 돌려도 같다.
UPDATE site_menu_item_translations
   SET description = '{case}건의 과제와 기간·발주 유형'
 WHERE languages_code = 'ko-KR' AND description = '9건의 과제와 기간·발주 유형';

UPDATE site_menu_item_translations
   SET description = '등록 {patent.registered}건 · 출원 {patent.applied}건'
 WHERE languages_code = 'ko-KR' AND description = '등록 1건 · 출원 5건';

UPDATE site_menu_item_translations
   SET description = '프로그램 저작권 {copyright}건'
 WHERE languages_code = 'ko-KR' AND description = '프로그램 저작권 5건';
