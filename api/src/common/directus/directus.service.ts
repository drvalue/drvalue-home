import { Injectable, Logger } from '@nestjs/common';
import { CommonError } from '../error/common-error';
import { DirectusError } from './directus.error';

export type DirectusRow = Record<string, unknown>;

/**
 * Directus 를 서비스 토큰으로 읽는다.
 *
 * 토큰은 초안까지 다 본다(Core 는 권한에 조건을 못 건다). 공개로 내보내는
 * 조회는 부르는 쪽이 반드시 `status = published` 를 걸어야 한다.
 */
@Injectable()
export class DirectusService {
  private readonly log = new Logger(DirectusService.name);
  private readonly base = (process.env.DIRECTUS_URL ?? '').replace(/\/$/, '');
  private readonly token = process.env.DIRECTUS_TOKEN ?? '';

  get configured(): boolean {
    return Boolean(this.base && this.token);
  }

  /** 설정이 비어 있으면 503. 부르는 쪽에서 매번 검사하지 않도록 여기서 던진다. */
  assertConfigured(): void {
    if (!this.configured) throw new CommonError(DirectusError.NOT_CONFIGURED);
  }

  async get<T = unknown>(
    path: string,
    query: Record<string, string | number | undefined> = {},
  ): Promise<{ data: T; meta?: Record<string, unknown> }> {
    const url = new URL(`${this.base}${path}`);
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== '') url.searchParams.set(k, String(v));
    }
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${this.token}` },
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      this.log.warn(`Directus ${res.status} ${path}`);
      throw new CommonError(DirectusError.UPSTREAM_ERROR);
    }
    return (await res.json()) as { data: T; meta?: Record<string, unknown> };
  }

  async post<T = unknown>(path: string, body: unknown): Promise<T> {
    const res = await fetch(`${this.base}${path}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      this.log.warn(`Directus ${res.status} ${path}`);
      throw new CommonError(DirectusError.UPSTREAM_ERROR);
    }
    const text = await res.text();
    return (text ? JSON.parse(text) : null) as T;
  }

  /** 파일 원본. 브라우저가 Directus 를 직접 부르지 않도록 여기서 받아 넘긴다. */
  async file(id: string): Promise<Response> {
    return fetch(`${this.base}/assets/${encodeURIComponent(id)}`, {
      headers: { Authorization: `Bearer ${this.token}` },
      signal: AbortSignal.timeout(30_000),
    });
  }

  /** 요청 언어 + 기본 언어. 한 언어만 실으면 번역 없는 글이 제목 없이 나간다. */
  languages(requested: string): string[] {
    const fallback = process.env.DEFAULT_LANGUAGE ?? 'ko-KR';
    return requested === fallback ? [requested] : [requested, fallback];
  }

  language(requested?: string): string {
    const allowed = ['ko-KR', 'en-US'];
    const fallback = process.env.DEFAULT_LANGUAGE ?? 'ko-KR';
    return requested && allowed.includes(requested) ? requested : fallback;
  }
}
