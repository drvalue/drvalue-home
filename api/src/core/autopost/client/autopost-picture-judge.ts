import { spawn } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { BrowserOptions } from './autopost-webgpt.client';

/** 그림 한 장의 판정. `n` 은 넘긴 순서(1부터). */
export interface PictureVerdict {
  /** 글자·로고가 있어 빼야 하는 그림의 순번(0부터). */
  marked: number[];
  /** 같은 장면으로 본 쌍(0부터). */
  pairs: [number, number][];
}

const TIMEOUT_MS = 5 * 60 * 1000;

const SCHEMA = {
  type: 'object',
  properties: {
    pictures: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          n: { type: 'integer' },
          has_text: { type: 'boolean' },
          has_logo: { type: 'boolean' },
          scene: { type: 'string' },
        },
        required: ['n', 'has_text', 'has_logo', 'scene'],
        additionalProperties: false,
      },
    },
    same_scene_pairs: {
      type: 'array',
      items: { type: 'array', items: { type: 'integer' } },
    },
  },
  required: ['pictures', 'same_scene_pairs'],
  additionalProperties: false,
};

const PROMPT = `붙인 그림들을 순서대로 1번, 2번, 3번이라고 부릅니다. 도구를 쓰거나 파일을 읽지 말고 그림만 보고 답하세요.
그림마다: has_text = 그림 안에 읽을 수 있는 글자·숫자·퍼센트 기호가 하나라도 있는가(화면·간판·서류 안 포함. 글자 없는 막대·선 그래프 모양은 글자가 아니다). has_logo = 실제 회사의 로고·상표로 보이는 표시가 있는가. scene = 무엇을 그린 장면인지 한국어 한 문장.
same_scene_pairs = 한 글에 같이 실으면 「같은 그림을 두 번 넣었다」고 느낄 만큼 주인공·행동·구도가 같은 그림의 쌍(번호 두 개). 화풍이나 배경(공장)이 같은 것만으로는 같은 장면이 아니다. 없으면 빈 배열.`;

/** 판정의 답 → 뺄 그림과 겹친 쌍. 그림마다 답이 없거나 번호가 어긋나면 던진다(답이 없는 것은 통과가 아니다). */
export function verdictFrom(answer: unknown, count: number): PictureVerdict {
  const a = answer as {
    pictures?: { n?: unknown; has_text?: unknown; has_logo?: unknown }[];
    same_scene_pairs?: unknown[];
  } | null;
  if (!a || !Array.isArray(a.pictures) || !Array.isArray(a.same_scene_pairs))
    throw new Error('그림 판정: 답의 모양이 맞지 않습니다');
  const marked: number[] = [];
  for (let i = 0; i < count; i++) {
    const row = a.pictures.find((x) => x?.n === i + 1);
    if (
      !row ||
      typeof row.has_text !== 'boolean' ||
      typeof row.has_logo !== 'boolean'
    )
      throw new Error(`그림 판정: ${i + 1}번 그림의 답이 없습니다`);
    if (row.has_text || row.has_logo) marked.push(i);
  }
  const pairs: [number, number][] = [];
  for (const pair of a.same_scene_pairs) {
    if (
      !Array.isArray(pair) ||
      pair.length !== 2 ||
      !pair.every((n) => Number.isInteger(n) && n >= 1 && n <= count) ||
      pair[0] === pair[1]
    )
      throw new Error('그림 판정: 겹친 쌍의 번호가 맞지 않습니다');
    const [x, y] = (pair as number[]).map((n) => n - 1).sort((p, q) => p - q);
    pairs.push([x, y]);
  }
  return { marked, pairs };
}

/**
 * 받은 그림을 **그린 모델과 다른 모델**(Codex CLI)이 직접 보고 판정한다 — 글자·로고가 들어갔나, 같은 장면이 겹치나.
 * 그림의 내용을 보는 유일한 검사다. 화소를 견주는 값으로는 같은 장면을 못 잡는다(2026-11-13 실측: 겹친 두 장의 차이 해시 38/64).
 * 같은 날 세 묶음으로 갈라내는지 봤다: 겹친 묶음 → 그 쌍, 안 겹친 묶음 → 없음, 글자가 든 그림 → 글자 있음.
 * 실행하지 못했거나 답이 모자라면 던진다 — 부른 쪽이 그림 없이 간다(판정 불가는 통과가 아니다).
 */
export function judgePictures(
  pictures: { bytes: Buffer }[],
  options: BrowserOptions,
): Promise<PictureVerdict> {
  const dir = mkdtempSync(join(tmpdir(), 'autopost-judge-'));
  const files = pictures.map((pic, i) => {
    const path = join(dir, `${i + 1}.jpg`);
    writeFileSync(path, pic.bytes);
    return path;
  });
  const schema = join(dir, 'schema.json');
  const out = join(dir, 'out.json');
  writeFileSync(schema, JSON.stringify(SCHEMA));
  return new Promise<PictureVerdict>((resolve, reject) => {
    const child = spawn(
      options.bin,
      [
        'exec',
        '--skip-git-repo-check',
        '-s',
        'read-only',
        '--output-schema',
        schema,
        '-o',
        out,
        PROMPT,
        ...files.flatMap((f) => ['-i', f]),
      ],
      // 입력을 닫아 둔다 — 열려 있으면 입력을 기다리며 멈춘다.
      { env: options.env, cwd: dir, stdio: ['ignore', 'ignore', 'ignore'] },
    );
    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      reject(new Error('그림 판정: 시간 안에 끝나지 않았습니다'));
    }, TIMEOUT_MS);
    child.on('error', () => {
      clearTimeout(timer);
      reject(new Error('그림 판정: 판정 도구를 실행하지 못했습니다'));
    });
    child.on('close', (code) => {
      clearTimeout(timer);
      try {
        if (code !== 0) throw new Error(`그림 판정: 실패했습니다(${code})`);
        resolve(
          verdictFrom(JSON.parse(readFileSync(out, 'utf8')), files.length),
        );
      } catch (e) {
        reject(
          e instanceof Error && e.message.startsWith('그림 판정')
            ? e
            : new Error('그림 판정: 답을 읽지 못했습니다'),
        );
      }
    });
  }).finally(() => rmSync(dir, { recursive: true, force: true }));
}
