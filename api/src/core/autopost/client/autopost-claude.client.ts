import Anthropic from '@anthropic-ai/sdk';
import { Article, ARTICLE_JSON_SCHEMA } from '../model/article';
import { JudgeAnswer, judgementFrom } from '../service/autopost-judge';
import { Judgement } from '../service/autopost-lint';
import {
  RESEARCH_SCHEMA,
  VERIFY_RECORD,
  VERIFY_SCHEMA,
  VERIFY_SYSTEM,
  researchPrompt,
  researchSystem,
  verifyPrompt,
  writePrompt,
  writeSystem,
} from './autopost-prompts';

export interface Usage {
  input: number;
  output: number;
}

export interface Research {
  topic: string;
  notes: string;
  sourceUrls: string[];
}

export interface ResearchInput {
  /** 한국 날짜 `YYYY-MM-DD`. */
  today: string;
  avoidTitles: string[];
  avoidUrls: string[];
}

export interface WriteInput {
  today: string;
  research: Research;
  /** 다시 쓸 때: 이전 글이 떨어진 사유와 그 글. */
  errors?: string[];
  previous?: Article;
}

/** 글에 넣을 그림 한 장. */
export interface Picture {
  bytes: Buffer;
  mime: 'image/jpeg';
  /** 어디에 넣나 — null 은 표지(본문 맨 위), 숫자는 그 번호(0부터)의 단락 제목 바로 아래. */
  section: number | null;
}

/** 글 한 편을 만드는 세 호출. 순서 짜기(`produce`)는 이 모양만 안다 — 테스트는 가짜를 끼운다. */
export interface AutopostClient {
  research(input: ResearchInput): Promise<{ research: Research; usage: Usage }>;
  write(input: WriteInput): Promise<{ article: Article; usage: Usage }>;
  /** 글을 쓴 호출과 다른 호출이 출처를 다시 읽고 주장·발행일·본문 날짜를 판정한다. */
  verify(article: Article): Promise<{
    judged: Judgement;
    usage: Usage;
    /** 진단용: 실제로 열린 주소와 판정 기록 원문. */
    evidence?: { fetchedUrls: string[]; transcript: string };
  }>;
  /**
   * 통과한 글에 넣을 그림들(표지 한 장 + 단락 그림)을 만든다. 없는 길(Claude API)도 있다 — 그때 글은 그림 없이 나간다.
   * 일부만 만들어졌으면 만들어진 것만 돌려준다. 그림의 내용은 아무 검사도 보지 않는다(결정 0020 덧붙임).
   */
  illustrate?(article: Article): Promise<Picture[]>;
  /**
   * 받은 그림을 다른 모델이 보고 판정한다 — 뺄 그림(글자·로고)과 같은 장면으로 본 쌍(넘긴 순서, 0부터).
   * 그림을 만드는 길에는 이것이 같이 있어야 한다: 판정하지 못하면 그림 없이 간다.
   */
  inspect?(
    pictures: Picture[],
  ): Promise<{ marked: number[]; pairs: [number, number][] }>;
}

export const AUTOPOST_CLIENT = Symbol('AUTOPOST_CLIENT');

const MODEL = 'claude-opus-5-5';
const TIMEOUT_MS = 10 * 60 * 1000;
const MAX_TOKENS = 32000;
/** 서버 도구가 긴 턴을 쉬어 갈 때(pause_turn) 이어 보내는 횟수의 한도. */
const MAX_RESUMES = 8;
const SEARCH_MAX_USES = 10;

type ServerTool =
  Anthropic.WebSearchTool20260209 | Anthropic.WebFetchTool20260209;

const add = (a: Usage, b: Usage): Usage => ({
  input: a.input + b.input,
  output: a.output + b.output,
});

function usageOf(message: Anthropic.Message): Usage {
  return {
    input:
      message.usage.input_tokens +
      (message.usage.cache_creation_input_tokens ?? 0) +
      (message.usage.cache_read_input_tokens ?? 0),
    output: message.usage.output_tokens,
  };
}

function textOf(message: Anthropic.Message): string {
  return message.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('');
}

/** 끝까지 온 응답만 받는다. 거절·잘림은 「공개 안 함」으로 끝나게 던진다. */
function assertDone(message: Anthropic.Message, what: string): void {
  if (message.stop_reason !== 'end_turn')
    throw new Error(
      `${what}: 응답이 끝까지 오지 않았습니다(${message.stop_reason})`,
    );
}

/**
 * Claude API 로 조사·집필·판정을 한다. 웹 검색·웹 fetch 는 Anthropic 쪽에서 돈다 —
 * 이 서버는 모델이 고른 주소를 직접 열지 않는다. 키는 오류 문장에 넣지 않는다.
 */
export class AutopostClaudeClient implements AutopostClient {
  private readonly client: Anthropic;

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey, timeout: TIMEOUT_MS, maxRetries: 1 });
  }

  /** 서버 도구를 쓰는 호출. 쉬어 가면(pause_turn) 받은 것을 그대로 붙여 이어 보낸다. */
  private async withTools(
    what: string,
    system: string,
    prompt: string,
    tools: ServerTool[],
  ): Promise<{ text: string; usage: Usage; fetchedUrls: string[] }> {
    const messages: Anthropic.MessageParam[] = [
      { role: 'user', content: prompt },
    ];
    let usage: Usage = { input: 0, output: 0 };
    let text = ''; // 쉬어 간 앞 구간의 글자도 모은다
    const fetchedUrls: string[] = []; // web_fetch 가 실제로 열어 본문을 받은 주소
    for (let i = 0; i <= MAX_RESUMES; i++) {
      const message = await this.client.messages
        .stream({
          model: MODEL,
          max_tokens: MAX_TOKENS,
          output_config: { effort: 'high' },
          system,
          tools,
          messages,
        })
        .finalMessage();
      usage = add(usage, usageOf(message));
      text += textOf(message);
      for (const block of message.content)
        if (
          block.type === 'web_fetch_tool_result' &&
          block.content.type === 'web_fetch_result'
        )
          fetchedUrls.push(block.content.url);
      if (message.stop_reason === 'pause_turn') {
        messages.push({ role: 'assistant', content: message.content });
        continue;
      }
      assertDone(message, what);
      return { text, usage, fetchedUrls };
    }
    throw new Error(`${what}: 도구 호출이 끝나지 않았습니다`);
  }

  /** 도구 없이 정해진 구조(JSON Schema)로 받는 호출. */
  private async structured<T>(
    what: string,
    system: string,
    prompt: string,
    schema: Record<string, unknown>,
  ): Promise<{ value: T; usage: Usage }> {
    const message = await this.client.messages
      .stream({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        output_config: {
          effort: 'high',
          format: { type: 'json_schema', schema },
        },
        system,
        messages: [{ role: 'user', content: prompt }],
      })
      .finalMessage();
    assertDone(message, what);
    let value: T;
    try {
      value = JSON.parse(textOf(message)) as T;
    } catch {
      throw new Error(`${what}: 구조화 출력을 읽지 못했습니다`);
    }
    return { value, usage: usageOf(message) };
  }

  async research(
    input: ResearchInput,
  ): Promise<{ research: Research; usage: Usage }> {
    const found = await this.withTools(
      '조사',
      researchSystem(input),
      researchPrompt(input),
      [
        {
          type: 'web_search_20260209',
          name: 'web_search',
          max_uses: SEARCH_MAX_USES,
        },
      ],
    );
    const shaped = await this.structured<Research>(
      '조사 정리',
      '조사 노트를 정해진 구조로 옮깁니다. 노트에 없는 내용을 더하지 않습니다.',
      `아래 조사 노트를 구조로 옮기세요. topic 은 고른 소식 한 줄, notes 는 노트 전체(수치·원문 구절·출처별 제목·발행처·발행일을 빠짐없이), sourceUrls 는 노트에 나온 출처 주소입니다.\n\n<조사_노트>\n${found.text}\n</조사_노트>`,
      RESEARCH_SCHEMA,
    );
    return { research: shaped.value, usage: add(found.usage, shaped.usage) };
  }

  async write(input: WriteInput): Promise<{ article: Article; usage: Usage }> {
    const result = await this.structured<Article>(
      '집필',
      writeSystem(input),
      writePrompt(input),
      ARTICLE_JSON_SCHEMA as Record<string, unknown>,
    );
    return { article: result.value, usage: result.usage };
  }

  async verify(article: Article): Promise<{
    judged: Judgement;
    usage: Usage;
    evidence: { fetchedUrls: string[]; transcript: string };
  }> {
    const asked = verifyPrompt(
      article,
      '아래 출처 주소를 web_fetch 로 하나씩 열어 읽고',
    );
    const read = await this.withTools(
      '판정',
      VERIFY_SYSTEM,
      `${asked.prompt}\n\n${VERIFY_RECORD}`,
      [
        {
          type: 'web_fetch_20260209',
          name: 'web_fetch',
          max_uses: asked.sources + 2,
        },
      ],
    );
    const shaped = await this.structured<JudgeAnswer>(
      '판정 정리',
      '판정 기록을 정해진 구조로 옮깁니다. 기록에 「있음」·「확인」·「예」라고 분명히 적힌 것만 true 입니다. 기록에 없는 번호는 false 입니다.',
      `아래 판정 기록을 구조로 옮기세요. 주장은 1~${asked.claims}번, 출처는 1~${asked.sources}번, 문단은 1~${asked.paragraphs}번입니다. 문단의 sources 는 그 문단의 근거로 적힌 출처 번호들입니다(「아니오」이거나 적힌 것이 없으면 빈 배열).\n\n<판정_기록>\n${read.text}\n</판정_기록>`,
      VERIFY_SCHEMA,
    );
    // 답에 없는 것, 실제로 열리지 않은 출처에 기댄 것은 확인 안 된 것으로 묶는다.
    const judged: Judgement = judgementFrom(
      article,
      shaped.value,
      read.fetchedUrls,
    );
    return {
      judged,
      usage: add(read.usage, shaped.usage),
      evidence: { fetchedUrls: read.fetchedUrls, transcript: read.text },
    };
  }
}
