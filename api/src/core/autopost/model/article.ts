/** 자동 글 한 편. 모델은 이 구조만 내고(구조화 출력) HTML 은 `autopost-render` 가 만든다. */
export interface ArticleSource {
  title: string;
  url: string;
  publisher: string;
  /** 발행일 `YYYY-MM-DD`. */
  published: string;
}

/** 본문에 쓴 수치·인용 하나. `value` 가 본문 숫자와 판정의 열쇠다. */
export interface ArticleClaim {
  sentence: string;
  value: string;
  source_url: string;
  /** 출처 원문의 해당 구절. */
  quote: string;
}

export interface ArticleSection {
  heading: string;
  paragraphs: string[];
}

/** 글머리에 크게 나가는 숫자 하나. */
export interface ArticleFigure {
  /** 숫자와 단위 — 「245곳」「30.1%」. */
  value: string;
  /** 그 숫자가 무엇인지 — 「생산성 향상」. */
  label: string;
}

export interface Article {
  title: string;
  summary: string;
  seo_description: string;
  /** 이 글이 전하려는 것 세 줄. 본문 맨 위에 묶음으로 나간다. */
  key_points: string[];
  /** 핵심 숫자 2~3개. 내세울 숫자가 없으면 빈 배열. */
  figures: ArticleFigure[];
  hook: string[];
  sections: ArticleSection[];
  sources: ArticleSource[];
  claims: ArticleClaim[];
}

const text = { type: 'string' } as const;
const texts = { type: 'array', items: text } as const;
const object = (properties: Record<string, object>) => ({
  type: 'object',
  properties,
  required: Object.keys(properties),
  additionalProperties: false,
});

/** 위 형과 같은 JSON Schema. 길이·개수는 여기 적지 않는다 — `autopost-lint` 가 본다. */
export const ARTICLE_JSON_SCHEMA = object({
  title: text,
  summary: text,
  seo_description: text,
  key_points: texts,
  figures: { type: 'array', items: object({ value: text, label: text }) },
  hook: texts,
  sections: {
    type: 'array',
    items: object({ heading: text, paragraphs: texts }),
  },
  sources: {
    type: 'array',
    items: object({ title: text, url: text, publisher: text, published: text }),
  },
  claims: {
    type: 'array',
    items: object({
      sentence: text,
      value: text,
      source_url: text,
      quote: text,
    }),
  },
});
