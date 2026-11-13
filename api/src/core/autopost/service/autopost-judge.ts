import type { Article } from '../model/article';
import { Judgement, judgedUnits, normalizeUrl } from './autopost-lint';

/** 판정 호출의 답(구조화 출력). 번호는 1부터 — 주장·출처·덩어리의 차례다. */
export interface JudgeAnswer {
  claims: { n: number; found: boolean }[];
  sources: { n: number; date_confirmed: boolean }[];
  /** `sources` 는 그 문단의 근거로 쓴 출처 번호. */
  paragraphs: { n: number; supported: boolean; sources?: number[] }[];
  dates_ok: boolean;
}

/** 그 번호의 답이 있고 전부 참일 때만 참. 답에 없거나 같은 번호가 엇갈리면 거짓. */
function pick<T extends { n: number }>(
  rows: unknown,
  n: number,
  ok: (row: T) => boolean,
): boolean {
  if (!Array.isArray(rows)) return false;
  const mine = (rows as T[]).filter((r) => !!r && r.n === n);
  return mine.length > 0 && mine.every(ok);
}

/**
 * 「같은 글인가」를 볼 열쇠 — 호스트(www. 뗌)와 경로만. 열린 주소는 리다이렉트로 scheme·www·쿼리가
 * 출처에 적힌 것과 달라질 수 있다.
 */
function pageKey(raw: string): string | null {
  const normal = normalizeUrl(raw);
  if (!normal) return null;
  const url = new URL(normal);
  return `${url.hostname.replace(/^www\./, '')}${url.pathname.replace(/\/$/, '')}`.toLowerCase();
}

/**
 * 판정 호출의 답을 판정 결과로 묶는다. 닫힌 쪽으로 기운다:
 *
 *   답에 없는 번호 · 형이 깨진 답                → 확인 안 됨
 *   실제로 열리지 않은 출처(`fetchedUrls` 에 없음) → 그 출처도, 거기 기댄 주장도 확인 안 됨
 *
 * 「출처가 안 열리면 없다」를 모델의 말이 아니라 도구 결과로 정한다 — 유료벽·차단으로 못 읽고도
 * 글쓴이의 인용만 보고 「있음」이라 답하는 것을 막는다.
 */
export function judgementFrom(
  article: Article,
  answer: Partial<JudgeAnswer> | null | undefined,
  fetchedUrls: string[],
): Judgement {
  const fetched = new Set(
    fetchedUrls.map(pageKey).filter((u): u is string => !!u),
  );
  const opened = (url: string) => {
    const u = pageKey(url);
    return !!u && fetched.has(u);
  };
  const units = judgedUnits(article);
  const rows = Array.isArray(answer?.paragraphs)
    ? (answer.paragraphs as JudgeAnswer['paragraphs']).filter((r) => !!r)
    : [];
  // 「예」인 문단이 근거로 댄 출처 번호 → 주소. 없는 번호·깨진 값·안 열린 출처는 버린다.
  const usedSources = [
    ...new Set(
      rows
        .filter((r) => r.supported === true && Array.isArray(r.sources))
        .flatMap((r) => r.sources as unknown[])
        .filter((n): n is number => Number.isInteger(n))
        .map((n) => article.sources[n - 1]?.url)
        .filter((u): u is string => !!u && opened(u)),
    ),
  ];
  return {
    claims: Object.fromEntries(
      article.claims.map((c, i) => [
        c.sentence,
        opened(c.source_url) &&
          pick<JudgeAnswer['claims'][number]>(
            answer?.claims,
            i + 1,
            (r) => r.found === true,
          ),
      ]),
    ),
    sources: Object.fromEntries(
      article.sources.map((s, i) => [
        s.url,
        opened(s.url) &&
          pick<JudgeAnswer['sources'][number]>(
            answer?.sources,
            i + 1,
            (r) => r.date_confirmed === true,
          ),
      ]),
    ),
    units: Object.fromEntries(
      units.map((u, i) => [
        u,
        pick<JudgeAnswer['paragraphs'][number]>(
          answer?.paragraphs,
          i + 1,
          (r) => r.supported === true,
        ),
      ]),
    ),
    usedSources,
    unanswered: units.filter((_, i) => !rows.some((r) => r.n === i + 1)),
    unopened: article.sources.map((s) => s.url).filter((u) => !opened(u)),
    datesOk: answer?.dates_ok === true,
  };
}
