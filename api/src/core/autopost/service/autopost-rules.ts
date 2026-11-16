import { SCOPE, STYLE, TOPIC } from '../client/autopost-prompts';
import { ARTICLE_JSON_SCHEMA } from '../model/article';

/** 끝에 붙는 말 — 글 규칙(STYLE)은 조사 노트를 받아 쓰는 호출에 맞춰 적혀 있어, 바깥에서 쓰는 쪽이 헷갈린 곳을 풀어 둔다(2026-11-13 시험 실행에서 나온 물음들). */
const OUTSIDE_NOTES = `바깥에서 쓰는 쪽이 알아 둘 것:
- 「아래 출처 주소」 목록은 따로 없다. 직접 열어 읽은 글의 주소를, 주소창에 뜨는 그대로 쓴다. 바깥 https 주소만.
- 「14일 안」은 소식만이 아니라 sources 에 적는 **모든 출처**에 걸린다. 더 오래된 글은 보조 출처로도 넣지 못한다 — 그 글에만 있는 내용은 쓰지 않는다.
- 숫자 예외는 「2026년」처럼 「년」이 붙은 연도, 「11월 10일」 같은 날짜, 「3가지」 같은 한 자리 개수뿐이다. 「6개월」 같은 기간이나 「년」 없이 쓴 2026 은 주장이 있어야 한다. 이름에 든 숫자는 이름을 풀어 써서 피한다.
- 출처 글에 적히지 않은 사실은 상식이어도 쓰지 않는다(공장이 있는 나라, 회사의 업종 등). 판정은 출처 원문만 본다.
- 협찬 글·행사 정리 글처럼 당사자가 직접 낸 글이 아니면, 누가 그렇게 말했는지를 그 글에 적힌 대로 밝힌다(「○○에 따르면」).
- 검사는 문단 수를 조금 넓게 받지만(단락마다 1~4 · 훅 1~3), 위 「글의 틀」의 수를 따른다.
- 떨어지면 사유의 숫자와 「」 안 구절로 자리를 찾아, 그 문장을 빼거나 출처에 있는 대로 고친다. 판정과 다투지 않는다.`;

/**
 * 글을 바깥에서 쓰는 쪽(사람·에이전트)이 읽는 것 — 주제 기준 · 이미 다룬 글 · 글 규칙 · 구조. 코드가 쓰는 것과 같은 글자다.
 * 명령(`--rules`)과 받는 입구(`GET /api/autopost/rules`)가 같은 글자를 낸다.
 */
export function rulesText(
  past: { avoidTitles: string[]; avoidUrls: string[] },
  today: string,
): string {
  const list = (items: string[]) =>
    items.map((x) => `- ${x}`).join('\n') || '(없음)';
  return `${SCOPE}\n\n소식을 고르는 기준(한 건만 고른다):\n${TOPIC}\n- 아래 「이미 다룬 것」과 겹치지 않는다.\n\n이미 다룬 글의 제목:\n${list(past.avoidTitles)}\n\n이미 쓴 출처 주소:\n${list(past.avoidUrls)}\n\n${STYLE}\n\n${OUTSIDE_NOTES}\n\n오늘: ${today} (한국 시간)\n\n글의 구조(JSON Schema):\n${JSON.stringify(ARTICLE_JSON_SCHEMA)}`;
}
