import type { Article } from '../model/article';

/**
 * 글 끝 고정 문구. 코드에 적힌 글자다 — 모델이 쓰지 않는다(회사·제품에 대한 문장을 모델이 지어내지 않게).
 * 제품 성능·고객사·수치를 넣지 않는다.
 */
export const CTA_HTML =
  '<h2>AX(AI 전환) 도입을 고민 중이시라면?</h2><p>우리 공장에는 무엇부터 맞을지, 디알밸류가 현장 이야기를 듣고 함께 정리해 드립니다. <a href="/page/support/notify_form"><strong>문의 남기기</strong></a></p>';

/** 맨 위 「핵심」 묶음의 머리글. 코드에 적힌 글자다. */
export const KEY_POINTS_LABEL = '핵심만 먼저';

/** 글자 칸. 따옴표는 그대로 둔다 — 본문 소독이 글자 칸의 따옴표를 바꾸지 않는다(고정점). */
function escape(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/** 속성 칸. */
function attr(text: string): string {
  return escape(text).replace(/"/g, '&quot;');
}

const p = (text: string) => `<p>${escape(text)}</p>`;
const bold = (text: string) => `<p><strong>${escape(text)}</strong></p>`;

/** 저장한 그림(directus_files 의 행)과 넣을 자리 — null 은 표지, 숫자는 그 번호(0부터)의 단락. */
export interface PictureRef {
  id: string;
  width: number;
  height: number;
  section: number | null;
}

/**
 * 글 → 본문 HTML. 본문 소독(`sanitizeBody`)이 받는 태그만 쓰고, 소독을 지나도 한 글자도 안 바뀌는 모양으로
 * 만든다(한 줄, 새 창 링크의 rel 까지) — 검사가 그것을 본다.
 * 표지 그림이 있으면 맨 위에 둔다 — 뉴스 게시판은 본문의 첫 그림이 대표 이미지다. 단락 그림은 그 단락 제목 바로 아래에 둔다.
 *
 * 강조는 코드가 정한 자리에만 넣는다(모델은 글자만 쓴다): 맨 위 「핵심」 세 줄 묶음과, 단락마다 첫 문단(그 단락의 결론).
 * 숫자나 낱말을 골라 굵게 하지 않는다 — 잘 읽히는 글들이 굵은 글씨를 결론에만 쓴다(2026-11-13 다섯 곳을 봤다).
 */
export function renderArticle(a: Article, pictures: PictureRef[] = []): string {
  const img = (at: number | null, alt: string) => {
    const x = pictures.find((pic) => pic.section === at);
    return x
      ? `<p><img src="/api/content/assets/${x.id}" alt="${attr(alt)}" width="${x.width}" height="${x.height}"></p>`
      : '';
  };
  const sections = a.sections.map(
    (s, i) =>
      `<h2>${i + 1}. ${escape(s.heading)}</h2>${img(i, s.heading)}${s.paragraphs.map((text, n) => (n === 0 && s.paragraphs.length > 1 ? bold(text) : p(text))).join('')}`,
  );
  const sources = a.sources.map(
    (s) =>
      `<li><a href="${attr(s.url)}" target="_blank" rel="noopener noreferrer">${escape(s.title)}</a> — ${escape(s.publisher)}, ${escape(s.published)}</li>`,
  );
  return [
    img(null, a.title),
    a.key_points?.length
      ? `${bold(KEY_POINTS_LABEL)}<ul>${a.key_points.map((k) => `<li>${escape(k)}</li>`).join('')}</ul>`
      : '',
    a.hook.map(p).join(''),
    sections.join(''),
    `<h2>출처</h2><ul>${sources.join('')}</ul>`,
    CTA_HTML,
  ].join('');
}

/**
 * 모델이 쓴 글자를 덩어리(제목·요약·설명·문단·단락 제목)로 나눈 것 — 검사가 덩어리마다 숫자와 주장을 맞춘다.
 * 출처 제목은 바깥 글의 제목이라 빼고, 고정 문구도 뺀다.
 */
export function bodyUnits(a: Article): string[] {
  return [
    a.title,
    a.summary,
    a.seo_description,
    ...(a.key_points ?? []),
    ...a.hook,
    ...a.sections.flatMap((s) => [s.heading, ...s.paragraphs]),
  ];
}

/** 모델이 쓴 글자 전부(검사 대상). */
export function bodyText(a: Article): string {
  return bodyUnits(a).join('\n');
}
