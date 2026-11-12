import { sanitizeBody } from '../../../common/html/sanitize-body';
import type { Article } from '../model/article';
import { bodyText, renderArticle } from './autopost-render';

/**
 * 자동 글의 코드 검사. 사람이 검수하지 않으므로 이것과 판정 호출이 공개 전의 전부다.
 * 돌려주는 것은 떨어진 사유(사람이 읽는 문장) — 비면 통과. 애매하면 떨어지는 쪽으로 기운다.
 *
 * 못 막는 것: 출처 자체가 틀린 경우, 수치는 맞는데 해석이 과한 문장, 소재의 질.
 */
export interface LintContext {
  /** 한국 날짜 `YYYY-MM-DD`. */
  today: string;
  /** 이미 낸 자동 글의 출처 주소. */
  usedSourceUrls: string[];
}

const SOURCE_MAX_AGE_DAYS = 14;
const DAY_MS = 24 * 3600 * 1000;
const LIMITS = {
  title: [10, 60],
  summary: [20, 200],
  seo_description: [50, 160],
  hook: [1, 3],
  sections: [4, 6],
  paragraphs: [1, 5],
  sources: [1, 6],
} as const;

/** 모델이 쓴 칸에 나오면 안 되는 이름 — 회사·제품에 대한 문장을 모델이 지어내지 않게. */
const BANNED = ['디알밸류', 'growxd', 'cosmogmp', 'm.ax'];
/** 정부의 제조 AX 얼라이언스. 자사 제품과 이름이 같지만 다른 것이라 통과시킨다. */
const ALLIANCE_RE = /m\.ax\s?얼라이언스/gi;
const EMOJI_RE = /\p{Extended_Pictographic}/u;

const isText = (v: unknown): v is string => typeof v === 'string';
const isTexts = (v: unknown): v is string[] =>
  Array.isArray(v) && v.every(isText);

function hasShape(a: unknown): a is Article {
  const x = a as Article | null;
  return (
    !!x &&
    isText(x.title) &&
    isText(x.summary) &&
    isText(x.seo_description) &&
    isTexts(x.hook) &&
    Array.isArray(x.sections) &&
    x.sections.every(
      (s) => !!s && isText(s.heading) && isTexts(s.paragraphs),
    ) &&
    Array.isArray(x.sources) &&
    x.sources.every(
      (s) =>
        !!s &&
        isText(s.title) &&
        isText(s.url) &&
        isText(s.publisher) &&
        isText(s.published),
    ) &&
    Array.isArray(x.claims) &&
    x.claims.every(
      (c) =>
        !!c &&
        isText(c.sentence) &&
        isText(c.value) &&
        isText(c.source_url) &&
        isText(c.quote),
    )
  );
}

/** 전각 숫자·기호를 반각으로, 숫자 사이 쉼표를 뗀다. */
function normalizeDigits(text: string): string {
  return text
    .replace(/[０-９％．，]/g, (c) =>
      String.fromCharCode(c.charCodeAt(0) - 0xfee0),
    )
    .replace(/(\d),(?=\d)/g, '$1');
}

/** 글자에서 숫자를 뽑는다. 단위는 붙이지 않는다 — `30%` · `30 %` · `30퍼센트` 가 모두 `30`. */
export function numbersIn(text: string): string[] {
  return normalizeDigits(text).match(/\d+(?:\.\d+)?/g) ?? [];
}

/** 본문의 숫자. 연도·월·일과 한 자리 개수(「3가지」)는 주장이 아니라서 뺀다. */
function bodyNumbers(text: string): string[] {
  return numbersIn(
    normalizeDigits(text)
      .replace(/(?<![\d.])(?:19|20)\d{2}\s?년/g, ' ')
      .replace(/(?<![\d.])\d{1,2}\s?[월일](?!\d)/g, ' ')
      .replace(/(?<![\d.])\d\s?(?:가지|개|번째|단계)/g, ' '),
  );
}

function uncovered(a: Article, values: string[]): string[] {
  const known = new Set(values.flatMap(numbersIn));
  return [...new Set(bodyNumbers(bodyText(a)))].filter((n) => !known.has(n));
}

/** 출처 주소를 비교할 모양으로: 조각(#)·utm 쿼리·끝 빗금을 뗀다. 읽을 수 없으면 null. */
function normalizeUrl(raw: string): string | null {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
  url.hash = '';
  for (const key of [...url.searchParams.keys()])
    if (key.toLowerCase().startsWith('utm_')) url.searchParams.delete(key);
  return url.toString().replace(/\?$/, '').replace(/\/$/, '');
}

/** `YYYY-MM-DD` 이고 실제 있는 날짜면 UTC 자정의 ms, 아니면 null. */
function dayMs(raw: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null;
  const ms = Date.parse(`${raw}T00:00:00Z`);
  if (Number.isNaN(ms)) return null;
  return new Date(ms).toISOString().slice(0, 10) === raw ? ms : null;
}

function between(
  label: string,
  n: number,
  [min, max]: readonly [number, number],
  unit: string,
): string[] {
  return n < min || n > max
    ? [`${label}: ${min}~${max}${unit}여야 하는데 ${n}${unit}입니다`]
    : [];
}

/** 판정 호출 전에 도는 검사(돈이 안 든다). 여기서 떨어지면 판정 호출을 하지 않는다. */
export function lintStructure(a: Article, ctx: LintContext): string[] {
  if (!hasShape(a)) return ['글의 형이 맞지 않습니다'];
  const out: string[] = [
    ...between('제목', a.title.trim().length, LIMITS.title, '자'),
    ...between('요약', a.summary.trim().length, LIMITS.summary, '자'),
    ...between(
      '검색용 설명',
      a.seo_description.trim().length,
      LIMITS.seo_description,
      '자',
    ),
    ...between('훅 문단', a.hook.length, LIMITS.hook, '개'),
    ...between('번호 단락', a.sections.length, LIMITS.sections, '개'),
    ...between('출처', a.sources.length, LIMITS.sources, '개'),
  ];
  a.sections.forEach((s, i) => {
    out.push(
      ...between(
        `${i + 1}번 단락의 문단`,
        s.paragraphs.length,
        LIMITS.paragraphs,
        '개',
      ),
    );
    if (!s.heading.trim()) out.push(`${i + 1}번 단락의 제목이 비었습니다`);
  });
  if (
    [...a.hook, ...a.sections.flatMap((s) => s.paragraphs)].some(
      (p) => !p.trim(),
    )
  )
    out.push('빈 문단이 있습니다');
  if (!a.claims.length) out.push('주장 목록이 비었습니다');

  const today = dayMs(ctx.today);
  const used = new Set(
    ctx.usedSourceUrls.map(normalizeUrl).filter((u): u is string => !!u),
  );
  const sourceUrls = new Set<string>();
  for (const s of a.sources) {
    const url = normalizeUrl(s.url);
    if (!url) {
      out.push(`출처 주소가 http(s) 주소가 아닙니다: ${s.url.slice(0, 80)}`);
      continue;
    }
    sourceUrls.add(url);
    if (used.has(url)) out.push(`이미 낸 글의 출처입니다: ${url}`);
    if (!s.title.trim() || !s.publisher.trim())
      out.push(`출처의 제목·발행처가 비었습니다: ${url}`);
    const published = dayMs(s.published);
    const age =
      published === null || today === null
        ? null
        : Math.round((today - published) / DAY_MS);
    if (age === null)
      out.push(`출처 발행일을 읽을 수 없습니다: ${s.published.slice(0, 40)}`);
    else if (age < 0) out.push(`출처 발행일이 미래입니다: ${s.published}`);
    else if (age > SOURCE_MAX_AGE_DAYS)
      out.push(
        `출처가 ${SOURCE_MAX_AGE_DAYS}일보다 오래됐습니다: ${s.published}`,
      );
  }
  for (const c of a.claims) {
    const url = normalizeUrl(c.source_url);
    if (!url || !sourceUrls.has(url))
      out.push(
        `주장의 출처가 출처 목록에 없습니다: ${c.sentence.slice(0, 60)}`,
      );
    if (!c.value.trim()) out.push('값이 빈 주장이 있습니다');
  }

  const text = bodyText(a);
  const lowered = text.toLowerCase().replace(ALLIANCE_RE, ' ');
  for (const word of BANNED)
    if (lowered.includes(word))
      out.push(`쓰면 안 되는 이름이 있습니다: ${word}`);
  if (EMOJI_RE.test(text)) out.push('이모지가 있습니다');

  for (const n of uncovered(
    a,
    a.claims.map((c) => c.value),
  ))
    out.push(`주장 목록에 없는 숫자: ${n}`);

  const html = renderArticle(a);
  if (sanitizeBody(html) !== html)
    out.push('만든 본문이 소독을 지나며 바뀝니다');
  return out;
}

/**
 * 판정 뒤에 도는 검사. `verified` 는 주장의 `value` → 「출처 원문에 그 뜻으로 있다」.
 * 판정에 없는 주장은 확인 안 된 것으로 본다.
 */
export function lintClaims(
  a: Article,
  verified: Record<string, boolean>,
): string[] {
  if (!hasShape(a)) return ['글의 형이 맞지 않습니다'];
  const ok = a.claims.filter((c) => verified[c.value] === true);
  return [
    ...a.claims
      .filter((c) => verified[c.value] !== true)
      .map((c) => `출처에서 확인되지 않은 주장: ${c.sentence.slice(0, 80)}`),
    ...uncovered(
      a,
      ok.map((c) => c.value),
    ).map((n) => `확인된 주장에 없는 숫자: ${n}`),
  ];
}
