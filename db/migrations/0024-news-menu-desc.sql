-- 0024 상단 메뉴 「뉴스」의 한 줄 설명을 「디알밸류 소식」에서 「전 세계 공장의 M.AX 소식」으로(2026-11-23 사용자).
-- 뉴스 게시판에는 제조 AI 주간 글이 올라온다 — 회사 소식이 아니다. 게시판 머리글·설명(boards.ts)과 같은 말이다.
-- web/lib/menu.ts 의 예비 값도 같이 바꿨다.
--
-- 사람이 관리 화면에서 고친 줄은 건드리지 않는다: 아직 씨앗(0006) 값일 때만 바꾼다.
-- 줄은 id 가 아니라 주소로 찾는다(0006 은 빈 표에만 씨앗을 넣는다 — id 가 29 라는 보장이 없다).
-- 여러 번 돌려도 같다.
update site_menu_item_translations t
   set description = '전 세계 공장의 M.AX 소식'
  from site_menu_items i
 where t.menu_item_id = i.id
   and i.location = 'top'
   and i.parent_id is not null
   and i.href = '/page/support/news'
   and t.languages_code = 'ko-KR'
   and t.description = '디알밸류 소식';
