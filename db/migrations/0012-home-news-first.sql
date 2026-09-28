-- 0012 메인: 「CREDENTIALS · 말보다 먼저 쌓아 온 것들」 구역을 숨기고 소식을 맨 위로 올린다.
-- 소식 머리는 「최근 소식」 한 줄(영문 머리 NEWS 없음), 사업 구역 제목은 「사업 분야」.
-- (2026-09-28 사용자 요청 — web/app/home/content.ts 의 HOME_DEFAULT 와 같다.)
--
-- 사람이 관리 화면에서 고친 글은 건드리지 않는다: 칸마다 아직 옛 씨앗(0005) 값일 때만 바꾼다.
-- 여러 번 돌려도 같다.
update page_contents
   set content = jsonb_set(content, '{sections}',
         '[{"section":"news","visible":true},{"section":"biz","visible":true},{"section":"proof","visible":false},{"section":"cta","visible":true}]'::jsonb),
       updated_on = now()
 where key = 'home'
   and content->'sections' = '[{"section":"proof","visible":true},{"section":"biz","visible":true},{"section":"news","visible":true},{"section":"cta","visible":true}]'::jsonb;

update page_contents
   set content = jsonb_set(jsonb_set(content, '{news,kicker}', '""'::jsonb), '{news,title}', '"최근 소식"'::jsonb),
       updated_on = now()
 where key = 'home'
   and content->'news'->>'kicker' = 'NEWS'
   and content->'news'->>'title' = '디알밸류의 최근 소식';

update page_contents
   set content = jsonb_set(content, '{biz,title}', '"사업 분야"'::jsonb),
       updated_on = now()
 where key = 'home'
   and content->'biz'->>'title' = '무엇을 만드는가';
