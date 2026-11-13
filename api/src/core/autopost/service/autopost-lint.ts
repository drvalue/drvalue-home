import { sanitizeBody } from '../../../common/html/sanitize-body';
import type { Article } from '../model/article';
import {
  bodyText,
  bodyUnits,
  figureText,
  renderArticle,
} from './autopost-render';

/**
 * 자동 글의 코드 검사. 사람이 검수하지 않으므로 이것과 판정 호출이 공개 전의 전부다.
 * 돌려주는 것은 떨어진 사유(사람이 읽는 문장) — 비면 통과. 애매하면 떨어지는 쪽으로 기운다.
 *
 * 못 막는 것: 출처 자체가 틀린 경우, 수치는 맞는데 해석이 과한 문장, 판정 호출의 오판, 소재의 질.
 */
export interface LintContext {
  /** 한국 날짜 `YYYY-MM-DD`. */
  today: string;
  /** 이미 낸 자동 글의 출처 주소. */
  usedSourceUrls: string[];
  /** 조사가 찾은 출처 주소. 주면 글의 출처가 전부 이 안에 있어야 한다(집필이 주소를 지어내거나 끼워 넣지 못하게). */
  researchUrls?: string[];
}

const SOURCE_MAX_AGE_DAYS = 14;
const DAY_MS = 24 * 3600 * 1000;
const LIMITS = {
  title: [10, 60],
  summary: [20, 200],
  seo_description: [50, 160],
  keyPoints: [3, 3],
  keyPoint: [10, 80],
  figureValue: [1, 10],
  figureLabel: [2, 14],
  hook: [1, 3],
  sections: [3, 4],
  paragraphs: [1, 4],
  /** 단락의 첫 문단(굵게 나가는 결론 한 문장). */
  lead: [1, 90],
  sources: [1, 6],
  sourceTitle: [1, 200],
  publisher: [1, 80],
} as const;

/**
 * 모델이 쓴 칸에 나오면 안 되는 이름 — 회사·제품에 대한 문장을 모델이 지어내지 않게.
 * 띄어쓰기·구두점을 떼고 소문자로 맞춘 글자(`compact`)에서 찾는다. 음차와 흔한 오타도 넣는다.
 */
const BANNED = [
  '디알밸류',
  '디알벨류',
  '디알밸루',
  'drvalue',
  'growxd',
  '그로우엑스디',
  'cosmogmp',
  '코스모gmp',
  '코스모지엠피',
];
/**
 * `M.AX` 와 그 변형. 사이에 구두점·공백이 낀 것(M-AX · M. AX · M AX)은 전부, 붙여 쓴 것은 대문자 `MAX` 가
 * 홀로 나올 때만 잡는다 — 「최대(max)」와 「737 MAX」(앞이 숫자·영문)는 다른 말이다.
 */
const MAX_SPACED_RE = /(?<![A-Za-z])[Mm][\s.\-·]{1,3}[Aa][Xx](?![A-Za-z])/;
const MAX_BARE_RE = /(?<![A-Za-z\d]\s?)MAX(?![A-Za-z])/;
/**
 * 이 글을 싣는 회사를 가리키는 말. 글은 바깥 소식을 풀 뿐 회사 이야기를 하지 않는다.
 * 「자사」는 넣지 않는다 — 기사 주체를 가리키는 말이다(「지멘스는 자사 공장에」). 낱말 안쪽(투자사·담당사)은 안 잡는다.
 */
const SELF_RE = /(?<![가-힣])(?:저희|당사)|우리\s?회사/;
/** 정부의 제조 AX 얼라이언스. 자사 제품과 이름이 같지만 다른 것이라 통과시킨다. */
const ALLIANCE_RE = /m\.ax\s?얼라이언스/gi;
/** 이모지. 상표 기호(™ ® ©)는 제품 이름에 붙는 글자라 뺀다. */
const EMOJI_RE = /(?![™®©])\p{Extended_Pictographic}/u;
/**
 * 한글로 푼 수량. 숫자 검사를 비켜 간다(「47%」가 떨어지면 「절반 가까이」로 바꿔 쓸 수 있다) — 쓰지 못하게 한다.
 * 수사는 단위가 붙을 때만 본다(「두 회사」는 수량 주장이 아니다).
 */
const UNIT_END = '(?=이|을|를|의|은|는|에|가|과|와|도|만|으로|\\s|[.,)]|$)';
const WORD_QUANTITY_RE = new RegExp(
  [
    '절반|갑절|곱절',
    // 「두 배로」「세 배 빨라」— 「두 배터리」는 아니다
    '(?:두|세|네|다섯|여섯|일곱|여덟|아홉|열|수|몇)\\s?배(?=로|가|를|의|에|나|도|쯤|씩|까지|이상|가량|\\s|[.,)]|$)',
    // 「수백억 원」「수십 곳」— 단위가 따라올 때만. 「개수만」「횟수조차」「냉각 수조」는 아니다
    '(?<![가-힣])수(?:십|백|천|만|억|조)+\\s?(?:여\\s?)?(?:원|달러|명|대|건|곳|개|종|가지|%|퍼센트|년|시간|차례|번)',
    '(?<![가-힣])[일이삼사오육칠팔구십백천]+\\s?(?:퍼센트|%)',
    // 「삼천 명이」「백만 원을」— 숫자 뒤의 단위(「1,200억 원」)와 「구조 대비」「구조 원리」「조건」은 아니다
    '(?<![가-힣\\d]|\\d\\s)(?:[일이삼사오육칠팔구][십백천만억조]+|[십백천][만억조]+)\\s?(?:원|달러|명|대|건|곳)' +
      UNIT_END,
  ].join('|'),
);

/** 전각·호환 글자를 풀고(NFKC) 폭 없는 문자를 뗀다. */
const plain = (text: string) =>
  text.normalize('NFKC').replace(/[\u200b-\u200f\u2060\ufeff\u00ad]/g, '');
/** 이름 비교용: 띄어쓰기·구두점까지 떼고 소문자로. */
const compact = (text: string) =>
  plain(text)
    .toLowerCase()
    .replace(/[\s.\-·_]/g, '');

/** 쓰면 안 되는 이름이 있으면 그 사유들. */
function bannedIn(text: string): string[] {
  const out: string[] = [];
  const flat = compact(text);
  for (const word of BANNED)
    if (flat.includes(word)) out.push(`쓰면 안 되는 이름이 있습니다: ${word}`);
  const loose = plain(text);
  const noAlliance = loose.replace(ALLIANCE_RE, ' ');
  if (MAX_SPACED_RE.test(noAlliance) || MAX_BARE_RE.test(noAlliance))
    out.push('쓰면 안 되는 이름이 있습니다: M.AX');
  if (SELF_RE.test(loose))
    out.push('쓰면 안 되는 말이 있습니다: 회사를 가리키는 말(저희·당사)');
  return out;
}

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
    isTexts(x.key_points) &&
    Array.isArray(x.figures) &&
    x.figures.every((f) => !!f && isText(f.value) && isText(f.label)) &&
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

/** 전각 숫자·기호를 반각으로(NFKC), 숫자 사이 쉼표를 뗀다. */
function normalizeDigits(text: string): string {
  return plain(text).replace(/(\d),(?=\d)/g, '$1');
}

/** 글자에서 숫자를 뽑는다. 단위는 붙이지 않는다 — `30%` · `30 %` · `30퍼센트` 가 모두 `30`. */
export function numbersIn(text: string): string[] {
  return normalizeDigits(text).match(/\d+(?:\.\d+)?/g) ?? [];
}

/**
 * 판정 호출이 돌려준 것. 판정에 없는 것은 확인 안 된 것으로 본다.
 * 주장은 문장으로 찾는다(값으로 찾으면 같은 숫자의 다른 주장이 섞인다).
 */
export interface Judgement {
  /** 주장의 `sentence` → 출처 원문에 그 값이 그 뜻으로 있다. */
  claims: Record<string, boolean>;
  /** 출처의 `url` → 적힌 발행일이 원문에서 확인된다. */
  sources: Record<string, boolean>;
  /** 덩어리(`judgedUnits`)의 글자 → 그 덩어리가 말하는 사실(수치·인용·발표)이 전부 출처로 뒷받침된다. */
  units: Record<string, boolean>;
  /** 판정이 「예」라고 답한 문단의 근거로 쓴 출처의 `url`(열린 것만). 숫자 없는 문단이 기댄 출처를 남기려고 둔다. */
  usedSources?: string[];
  /** 판정의 답에 아예 없는 덩어리. 「아니오」와 사유를 가르려고 따로 둔다. */
  unanswered?: string[];
  /** 판정이 실제로 열지 못한 출처의 `url`. 사유를 「발행일 미확인」과 가르려고 따로 둔다. */
  unopened?: string[];
  /** 본문에 쓴 날짜(발표일 등)가 출처와 맞다. */
  datesOk: boolean;
}

/**
 * 이름에 숫자가 든 낱말 — 수치가 아니라서 숫자 검사에서 뺀다. **코드에 적힌 목록만**이다.
 * 모델이 쓰는 칸(발행처 등)에서 가져오지 않는다 — 그러면 그 칸에 숫자를 적어 검사를 열 수 있다.
 */
const NAMED_NUMBER_RE =
  /뉴스1|news1|(?<![A-Za-z\d])(?:[23]D|[456]G|CO2|B2B|B2C)(?![A-Za-z\d])|4차\s?산업혁명/gi;

const squash = (text: string) => text.replace(/\s+/g, ' ').trim();

/**
 * 본문의 숫자. 연도, 「N월」·「N월 N일」 날짜, 한 자리 개수(「3가지」·「3개」)는 주장이 아니라서 뺀다.
 * 「3개월」·「8개국」은 개수가 아니다 — 「개」 뒤에 월·국·년·소·점이 붙으면 예외로 보지 않는다.
 * 날짜는 판정 호출이 따로 본다(`datesOk`). 홀로 쓴 「N일」은 기간일 수 있어 빼지 않는다(「90일에서 30일로」).
 */
function bodyNumbers(text: string): string[] {
  return numbersIn(
    normalizeDigits(text)
      .replace(NAMED_NUMBER_RE, ' ')
      .replace(/(?<![\d.])(?:19|20)\d{2}\s?년/g, ' ')
      .replace(/(?<![\d.])\d{1,2}\s?월(?:\s?\d{1,2}\s?일)?(?!\d)/g, ' ')
      .replace(/(?<![\d.])\d\s?(?:가지|번째|단계|개(?!월|국|년|소|점))/g, ' '),
  );
}

/**
 * 판정 호출이 하나씩 답하는 덩어리 — 모델이 쓴 글자 전부(제목·요약·설명·문단·단락 제목, 겹치는 것은 한 번).
 * 숫자가 없는 덩어리도 넣는다: 인용·발표·계약 같은 주장은 숫자 검사에 안 잡힌다.
 * 짧은 구절의 주장 하나(「30% 줄었습니다.」)가 여러 문단에 들어 있어도 문단마다 확인을 받는다.
 */
export function judgedUnits(a: Article): string[] {
  return [...new Set(bodyUnits(a))].filter((u) => u.trim() !== '');
}

/**
 * 주장으로 덮이지 않은 본문 숫자. 덩어리(문단)마다 본다 — 그 덩어리 안에 문장이 그대로 있는 주장의 값만
 * 그 덩어리의 숫자를 덮는다. 다른 문단의 주장이 같은 숫자를 가졌다고 덮이지 않는다.
 */
function uncovered(a: Article, claims: Article['claims']): string[] {
  const out = new Map<string, string>(); // 숫자 → 처음 나온 덩어리(다시 쓰는 호출이 자리를 찾게)
  for (const unit of bodyUnits(a).map(squash)) {
    const known = new Set(
      claims
        .filter((c) => squash(c.sentence) && unit.includes(squash(c.sentence)))
        .flatMap((c) => numbersIn(c.value)),
    );
    for (const n of bodyNumbers(unit))
      if (!known.has(n) && !out.has(n)) out.set(n, unit);
  }
  return [...out].map(([n, unit]) => `${n} — 「${unit.slice(0, 50)}」`);
}

/** 출처 주소를 비교할 모양으로: 조각(#)·utm 쿼리·끝 빗금을 뗀다. 읽을 수 없거나 http(s) 가 아니거나 계정이 든 주소면 null. */
export function normalizeUrl(raw: string): string | null {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
  if (url.username || url.password) return null; // `https://믿을만한곳@다른곳/` 꼴
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
  const keyPoints = a.key_points;
  const out: string[] = [
    ...between('제목', a.title.trim().length, LIMITS.title, '자'),
    ...between('요약', a.summary.trim().length, LIMITS.summary, '자'),
    ...between(
      '검색용 설명',
      a.seo_description.trim().length,
      LIMITS.seo_description,
      '자',
    ),
    ...between('핵심 줄', keyPoints.length, LIMITS.keyPoints, '개'),
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
    // 문단이 둘 이상이면 첫 문단이 굵게 나간다 — 결론 한 문장이어야 한다.
    if (s.paragraphs.length > 1)
      out.push(
        ...between(
          `${i + 1}번 단락의 첫 문단(결론 한 문장)`,
          s.paragraphs[0].trim().length,
          LIMITS.lead,
          '자',
        ),
      );
  });
  // 글머리 숫자 줄: 없거나 2~3개. 값에는 숫자가 있어야 한다(숫자 검사와 판정은 「이름 값」 덩어리로 받는다).
  if (a.figures.length === 1 || a.figures.length > 3)
    out.push(`핵심 숫자가 ${a.figures.length}개입니다 — 없거나 2~3개`);
  a.figures.forEach((f, i) => {
    out.push(
      ...between(
        `핵심 숫자 ${i + 1}번의 값`,
        f.value.trim().length,
        LIMITS.figureValue,
        '자',
      ),
      ...between(
        `핵심 숫자 ${i + 1}번의 이름`,
        f.label.trim().length,
        LIMITS.figureLabel,
        '자',
      ),
    );
    if (!/\d/.test(f.value))
      out.push(`핵심 숫자 ${i + 1}번의 값에 숫자가 없습니다`);
    // 크게 나가는 숫자는 예외(한 자리 개수·날짜)가 없다 — 「이름 값」 글자에 걸린 주장이 그 숫자를 값으로 가져야 한다.
    const unit = squash(figureText(f));
    const digits = f.value.match(/\d[\d.,]*/g) ?? [];
    const held = a.claims.filter(
      (c) => squash(c.sentence) && unit.includes(squash(c.sentence)),
    );
    if (digits.some((d) => !held.some((c) => c.value.includes(d))))
      out.push(`핵심 숫자 ${i + 1}번이 주장 목록에 없습니다: ${figureText(f)}`);
  });
  keyPoints.forEach((k, i) =>
    out.push(
      ...between(`핵심 ${i + 1}번 줄`, k.trim().length, LIMITS.keyPoint, '자'),
    ),
  );
  if (
    [
      ...a.key_points,
      ...a.hook,
      ...a.sections.flatMap((s) => s.paragraphs),
    ].some((p) => !p.trim())
  )
    out.push('빈 문단이 있습니다');
  if (!a.claims.length) out.push('주장 목록이 비었습니다');

  const today = dayMs(ctx.today);
  const used = new Set(
    ctx.usedSourceUrls.map(normalizeUrl).filter((u): u is string => !!u),
  );
  const research = ctx.researchUrls
    ? new Set(
        ctx.researchUrls.map(normalizeUrl).filter((u): u is string => !!u),
      )
    : null;
  const sourceUrls = new Set<string>();
  for (const s of a.sources) {
    const url = normalizeUrl(s.url);
    if (!url) {
      out.push(`출처 주소가 http(s) 주소가 아닙니다: ${s.url.slice(0, 80)}`);
      continue;
    }
    if (sourceUrls.has(url)) out.push(`같은 출처를 두 번 적었습니다: ${url}`);
    sourceUrls.add(url);
    if (used.has(url)) out.push(`이미 낸 글의 출처입니다: ${url}`);
    if (research && !research.has(url))
      out.push(`조사에 없는 출처입니다: ${url}`);
    out.push(
      ...between('출처 제목', s.title.trim().length, LIMITS.sourceTitle, '자'),
      ...between('발행처', s.publisher.trim().length, LIMITS.publisher, '자'),
    );
    // 발행처는 모델이 쓰는 칸이다(출처 제목은 바깥 글의 제목이라 이름 검사만 뺀다).
    out.push(...bannedIn(s.publisher));
    // 출처 제목은 바깥 글의 제목을 그대로 옮기는 칸이다 — 길이만 본다.
    if (EMOJI_RE.test(s.publisher))
      out.push(`발행처 칸에 이모지가 있습니다: ${url}`);
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
  const units = bodyUnits(a).map(squash);
  const sentences = new Set<string>();
  for (const c of a.claims) {
    const url = normalizeUrl(c.source_url);
    if (!url || !sourceUrls.has(url))
      out.push(
        `주장의 출처가 출처 목록에 없습니다: ${c.sentence.slice(0, 60)}`,
      );
    // 값이 빈 주장도 받는다 — 숫자 없는 사실(발표·계획·인용)을 그 출처에 묶는 주장이다. 판정은 똑같이 받는다.
    const sentence = squash(c.sentence);
    if (!sentence || !units.some((u) => u.includes(sentence)))
      out.push(`본문에 없는 주장입니다: ${c.sentence.slice(0, 60)}`);
    // 값의 숫자가 그 문장 안에 있어야 한다 — 문장과 상관없는 값으로 다른 숫자를 덮지 못하게.
    const inSentence = new Set(numbersIn(sentence));
    if (numbersIn(c.value).some((n) => !inSentence.has(n)))
      out.push(`주장의 값이 그 문장에 없습니다: ${c.value.slice(0, 40)}`);
    if (sentences.has(sentence))
      out.push(`같은 문장의 주장이 둘입니다: ${c.sentence.slice(0, 60)}`);
    sentences.add(sentence);
  }

  const text = bodyText(a);
  out.push(...bannedIn(text));
  if (EMOJI_RE.test(text)) out.push('이모지가 있습니다');
  const worded = WORD_QUANTITY_RE.exec(plain(text));
  if (worded)
    out.push(`한글로 쓴 수량이 있습니다(출처의 숫자로 쓴다): ${worded[0]}`);

  for (const n of uncovered(a, a.claims))
    out.push(`주장 목록에 없는 숫자: ${n}`);

  const html = renderArticle(a);
  if (sanitizeBody(html) !== html)
    out.push('만든 본문이 소독을 지나며 바뀝니다');
  return out;
}

/**
 * 판정 뒤에 글에 남는 출처 — 확인된 주장이 걸렸거나, 판정이 「예」라고 한 문단의 근거로 쓴 출처.
 * 나머지(모델이 끼워 넣기만 한 링크)는 떨어뜨리지 않고 뗀다. 판정은 떼기 전의 목록으로 돈다 —
 * 먼저 떼면 숫자 없는 문단이 기댄 출처가 사라져 그 문단들이 전부 떨어진다(실제 실행에서 그랬다).
 */
function keptSources(a: Article, judged: Judgement): Article['sources'] {
  const used = new Set(
    [
      ...a.claims
        .filter((c) => judged.claims?.[c.sentence] === true)
        .map((c) => c.source_url),
      ...(judged.usedSources ?? []),
    ]
      .map(normalizeUrl)
      .filter((u): u is string => !!u),
  );
  return a.sources.filter((s) => {
    const url = normalizeUrl(s.url);
    return !!url && used.has(url);
  });
}

/** 쓰이지 않은 출처를 뗀 글. 뗄 것이 없으면 그대로 돌려준다. `lintClaims` 를 통과한 뒤에 부른다. */
export function keepUsedSources(a: Article, judged: Judgement): Article {
  const sources = keptSources(a, judged);
  return sources.length === a.sources.length ? a : { ...a, sources };
}

/**
 * 판정 뒤에 도는 검사. 확인된 주장만으로 본문 숫자가 전부 덮여야 하고, 덩어리마다 판정이 「예」여야 하며,
 * 글에 남는 출처는 실제로 열렸고 발행일이 확인돼야 한다. 본문 날짜도 확인돼야 한다.
 */
export function lintClaims(a: Article, judged: Judgement): string[] {
  if (!hasShape(a)) return ['글의 형이 맞지 않습니다'];
  const confirmed = (c: Article['claims'][number]) =>
    judged.claims?.[c.sentence] === true;
  const kept = keptSources(a, judged);
  return [
    ...a.claims
      .filter((c) => !confirmed(c))
      .map((c) => `출처에서 확인되지 않은 주장: ${c.sentence.slice(0, 80)}`),
    ...uncovered(a, a.claims.filter(confirmed)).map(
      (n) => `확인된 주장에 없는 숫자: ${n}`,
    ),
    ...(kept.length ? [] : ['글에 남는 출처가 없습니다']),
    ...kept
      .filter((s) => judged.sources?.[s.url] !== true)
      .map((s) =>
        judged.unopened?.includes(s.url)
          ? `출처를 열지 못했습니다: ${s.url.slice(0, 80)}`
          : `출처의 발행일이 원문에서 확인되지 않습니다: ${s.url.slice(0, 80)}`,
      ),
    ...judgedUnits(a)
      .filter((u) => judged.units?.[u] !== true)
      .map((u) =>
        judged.unanswered?.includes(u)
          ? `판정이 답하지 않은 문단: ${u.slice(0, 80)}`
          : `출처로 뒷받침되지 않는 문단: ${u.slice(0, 80)}`,
      ),
    ...(judged.datesOk === true
      ? []
      : ['본문의 날짜가 출처와 맞는지 확인되지 않습니다']),
  ];
}
