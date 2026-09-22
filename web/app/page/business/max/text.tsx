/**
 * `**...**` 강조 표시를 다루는 두 함수. 서버·클라이언트 어느 쪽에서도 부른다 —
 * 'use client' 파일(FeatureBlocks.tsx)에 두면 서버 컴포넌트가 불렀을 때 「클라이언트
 * 참조」가 되어 렌더가 500 으로 죽는다(2026-09-22 실측). 그래서 표시 없는 파일로 뺐다.
 */

/** 강조 표시를 뗀 민글. aria-label 처럼 글자만 가는 자리에 쓴다. */
export function plain(s: string) {
  return s.replace(/\*\*/g, '')
}

/**
 * `**...**` 로 감싼 곳을 굵게(v4 에선 색으로) 바꾼다. 마크다운 라이브러리를 끌어오지 않는다.
 */
export function mark(s: string) {
  return s.split(/\*\*(.+?)\*\*/g).map((part, i) =>
    i % 2 === 1 ? <em className="mx_hl" key={i}>{part}</em> : part,
  )
}
