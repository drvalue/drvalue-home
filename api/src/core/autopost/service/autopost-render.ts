import type { Article } from '../model/article';

/**
 * 글 끝 고정 문구. 코드에 적힌 글자다 — 모델이 쓰지 않는다(회사·제품에 대한 문장을 모델이 지어내지 않게).
 * 제품 성능·고객사·수치를 넣지 않는다.
 */
export const CTA_HTML =
  '<p>제조 현장에 AI 를 어떻게 들일지 고민하고 계신다면 <a href="/page/support/notify_form">문의</a>를 남겨 주세요.</p>';

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

/**
 * 글 → 본문 HTML. 본문 소독(`sanitizeBody`)이 받는 태그만 쓰고, 소독을 지나도 한 글자도 안 바뀌는 모양으로
 * 만든다(한 줄, 새 창 링크의 rel 까지) — 검사가 그것을 본다.
 */
export function renderArticle(a: Article): string {
  const sections = a.sections.map(
    (s, i) =>
      `<h2>${i + 1}. ${escape(s.heading)}</h2>${s.paragraphs.map(p).join('')}`,
  );
  const sources = a.sources.map(
    (s) =>
      `<li><a href="${attr(s.url)}" target="_blank" rel="noopener noreferrer">${escape(s.title)}</a> — ${escape(s.publisher)}, ${escape(s.published)}</li>`,
  );
  return [
    a.hook.map(p).join(''),
    sections.join(''),
    `<h2>출처</h2><ul>${sources.join('')}</ul>`,
    CTA_HTML,
  ].join('');
}

/** 모델이 쓴 글자만(검사 대상). 출처 제목은 바깥 글의 제목이라 빼고, 고정 문구도 뺀다. */
export function bodyText(a: Article): string {
  return [
    a.title,
    a.summary,
    a.seo_description,
    ...a.hook,
    ...a.sections.flatMap((s) => [s.heading, ...s.paragraphs]),
  ].join('\n');
}
