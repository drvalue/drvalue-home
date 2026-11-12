import type {
  AutopostClient,
  ResearchInput,
  Usage,
} from '../client/autopost-claude.client';
import type { Article } from '../model/article';
import { lintClaims, lintStructure, pruneSources } from './autopost-lint';

export interface Produced {
  /** 검사를 전부 통과했나. false 면 `reasons` 가 떨어진 사유다. */
  ok: boolean;
  article: Article;
  reasons: string[];
  /** 시도마다의 사유(첫 번째 · 다시 쓴 것). 다시 쓰기가 고쳤는지 새로 깨뜨렸는지 보려고 남긴다. */
  attempts: string[][];
  usage: Usage;
}

/** 한 편을 만드는 전체 시간의 상한. SDK 의 시간 제한은 응답이 시작될 때까지만 재고, 도구 호출은 여러 번 이어 간다. */
const DEADLINE_MS = 45 * 60 * 1000;

const add = (a: Usage, b: Usage): Usage => ({
  input: a.input + b.input,
  output: a.output + b.output,
});

/**
 * 글 한 편을 만든다 — 조사 → 집필 → 구조 검사 → 판정 → 주장 검사. DB 를 모른다.
 *
 * 떨어지면 사유를 붙여 **한 번만** 다시 쓴다(조사는 다시 하지 않는다). 구조 검사에 떨어진 글은 판정 호출을
 * 하지 않는다 — 돈이 드는 호출이다. 호출이 던지면 그대로 던진다(부른 쪽이 「오류」로 닫는다).
 */
export async function produce(
  client: AutopostClient,
  input: ResearchInput,
  opts: { deadlineMs?: number } = {},
): Promise<Produced> {
  let timer: NodeJS.Timeout | undefined;
  const deadline = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () => reject(new Error('만드는 데 정해진 시간을 넘겼습니다')),
      opts.deadlineMs ?? DEADLINE_MS,
    );
  });
  try {
    return await Promise.race([steps(client, input), deadline]);
  } finally {
    clearTimeout(timer);
  }
}

async function steps(
  client: AutopostClient,
  input: ResearchInput,
): Promise<Produced> {
  const found = await client.research(input);
  let usage = found.usage;
  let errors: string[] | undefined;
  let previous: Article | undefined;
  const attempts: string[][] = [];
  for (;;) {
    const written = await client.write({
      today: input.today,
      research: found.research,
      errors,
      previous,
    });
    usage = add(usage, written.usage);
    const article = pruneSources(written.article);
    let reasons = lintStructure(article, {
      today: input.today,
      usedSourceUrls: input.avoidUrls,
      researchUrls: found.research.sourceUrls,
    });
    if (!reasons.length) {
      const judged = await client.verify(article);
      usage = add(usage, judged.usage);
      reasons = lintClaims(article, judged.judged);
    }
    attempts.push(reasons);
    if (!reasons.length || errors)
      return { ok: !reasons.length, article, reasons, attempts, usage };
    errors = reasons;
    previous = article;
  }
}
