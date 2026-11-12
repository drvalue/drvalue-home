import type {
  AutopostClient,
  ResearchInput,
  Usage,
} from '../client/autopost-claude.client';
import type { Article } from '../model/article';
import { lintClaims, lintStructure } from './autopost-lint';

export interface Produced {
  /** 검사를 전부 통과했나. false 면 `reasons` 가 떨어진 사유다. */
  ok: boolean;
  article: Article;
  reasons: string[];
  usage: Usage;
}

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
): Promise<Produced> {
  const found = await client.research(input);
  let usage = found.usage;
  let errors: string[] | undefined;
  let previous: Article | undefined;
  for (;;) {
    const written = await client.write({
      today: input.today,
      research: found.research,
      errors,
      previous,
    });
    usage = add(usage, written.usage);
    const article = written.article;
    let reasons = lintStructure(article, {
      today: input.today,
      usedSourceUrls: input.avoidUrls,
    });
    if (!reasons.length) {
      const judged = await client.verify(article);
      usage = add(usage, judged.usage);
      reasons = lintClaims(article, judged.judged);
    }
    if (!reasons.length || errors)
      return { ok: !reasons.length, article, reasons, usage };
    errors = reasons;
    previous = article;
  }
}
