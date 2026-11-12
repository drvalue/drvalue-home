/**
 * everyrag 장의 자료. 운영 중인 서비스 사이트 studio.everyrag.com(2026-11-12 확인)에 올라 있는 것 그대로다 —
 * 대화는 Assistant 장의 「예시 화면」, 코드는 첫 장의 「API 키 하나로 시작해요」 curl 탭. 여기서 새로 짓지 않는다.
 * 대화의 답은 제품이 내는 말투(해요체) 그대로 둔다. 코드 주석 두 줄만 이 사이트의 합니다체로 옮겼다.
 *
 * 우리가 쓴 문장은 전/후의 「전」 쪽(제목 · 말풍선 · ✕ 셋)과 큰 문장들이다 — 사용자 확인 대상.
 */

/** 시연 대화 — 자료에 있는 것 / 자료에 없는 것 / 자료 밖 일반 지식. */
export const ER_CHAT = [
  { q: '겨울에 바꾼 배합이 뭐예요?', a: '글리세린을 5%에서 3%로 줄였어요', kind: 'cite', cite: { no: 1, source: '배합노트.md', text: '겨울에는 글리세린을 5%에서 3%로…' } },
  { q: 'C사 납기는 몇 주예요?', a: '등록한 자료에서 답을 찾지 못했어요. 다른 말로 물어봐 주세요.', kind: 'none' },
  { q: '판테놀은 피부에 어떤 역할을 해요?', a: '자료에는 없어요. 일반적으로는 보습과 진정에 쓰는 성분이에요.', kind: 'outside' },
] as const

/** 전/후 */
export const ER_BEFORE = {
  title: 'RAG 를 직접 만들면 답보다 배관에 시간이 갑니다',
  bubbles: [
    { who: 'me', t: '사내 문서로 답하는 챗봇, 언제 볼 수 있어요?' },
    { who: 'them', t: '벡터 DB 부터 띄우고, 조각 나누기랑 임베딩 파이프라인을 만들어야 해요' },
    { who: 'me', t: '그런데 이 답은 어느 문서에서 나온 건가요?' },
  ],
  points: [
    '벡터 DB · 조각 나누기 · 임베딩 · 색인을 직접 만들고 운영합니다',
    '답이 어느 문서에서 왔는지 따로 확인해야 합니다',
    '자료에 없는 내용인지 답만 봐서는 알 수 없습니다',
  ],
}
export const ER_AFTER = {
  title: '자료를 넣으면 근거가 붙은 답이 나옵니다',
  points: [
    'API 키로 넣으면 조각 나누기 · 임베딩 · 색인 · 요약까지 처리합니다',
    '답의 인용 번호는 서버가 넘긴 근거 안에서만 인정합니다',
    '자료에 없으면 없다고 답하고, 일반 지식은 「자료 밖」으로 표시합니다',
  ],
}

/** 시작 코드 — 줄 머리가 # 이면 주석. YOUR_HOST 는 자리표시자(실제 주소는 콘솔 컬렉션 화면의 Host 값). */
export const ER_CODE = [
  '# 1) 자료 넣기 — 조각 · 임베딩 · 요약은 everyrag 가 합니다',
  'curl -X POST https://YOUR_HOST/v1/collections/recipes/records \\',
  '  -H "Authorization: Bearer $LAG_KEY" -H "Content-Type: application/json" \\',
  '  -d \'{"records":[{"id":"r1","text":"겨울에는 글리세린을 5%에서 3%로 줄였어요","source":"배합노트.md"}]}\'',
  '',
  '# 2) 물어보기 — 답에는 원문 인용이 붙습니다',
  'curl -X POST https://YOUR_HOST/v1/collections/recipes/query \\',
  '  -H "Authorization: Bearer $LAG_KEY" -H "Content-Type: application/json" \\',
  '  -d \'{"q":"겨울에 바꾼 배합이 뭐예요?","answer":true}\'',
] as const
