-- 0018 M.AX 허브 「제품군」 설명에서 넘기기 안내를 뺀다(2026-09-28 사용자: 넘기는 판 → 고정 판 셋).
-- 탭·화살표가 없어져 「탭을 누르거나 화살표로 넘겨 보세요」가 틀린 말이 됐다.
-- 사람이 관리 화면에서 고친 글은 건드리지 않는다: 씨앗(0008) 문장 그대로일 때만 바꾼다. 여러 번 돌려도 같다.
update page_contents
   set content = jsonb_set(content, '{statement,desc}', to_jsonb('업종 특화 MES 둘과 그 위에서 도는 제조 AI 를 차례로 봅니다.'::text)),
       updated_on = now()
 where key = 'business-max'
   and content->'statement'->>'desc' = '업종 특화 MES 둘과 그 위에서 도는 제조 AI. 탭을 누르거나 화살표로 넘겨 보세요.';
