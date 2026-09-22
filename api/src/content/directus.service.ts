import { Injectable, Logger } from '@nestjs/common'

/**
 * Directus 를 서비스 토큰으로 읽는다.
 *
 * 이 토큰은 seat 을 먹지 않는 계정의 것이다(역할 없음 + app_access:false 정책).
 * 관리 화면에는 못 들어가고 API 만 읽는다.
 *
 * **초안까지 다 보인다.** Directus Core 는 권한에 조건을 못 걸어서
 * (custom_permission_rules_enabled is a restricted resource) 걸러 내는 일은
 * 여기서 한다. 그래서 공개로 내보내는 조회는 반드시 `status = published` 를 건다.
 */
@Injectable()
export class DirectusService {
  private readonly log = new Logger(DirectusService.name)
  private readonly base = (process.env.DIRECTUS_URL ?? '').replace(/\/$/, '')
  private readonly token = process.env.DIRECTUS_TOKEN ?? ''

  get configured(): boolean {
    return Boolean(this.base && this.token)
  }

  async get<T = unknown>(
    path: string,
    query: Record<string, string | number | undefined> = {},
  ): Promise<{ data: T; meta?: Record<string, unknown> }> {
    const url = new URL(`${this.base}${path}`)
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== '') url.searchParams.set(k, String(v))
    }
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${this.token}` },
      // Directus 가 멈추면 이쪽 요청도 같이 멈춘다.
      signal: AbortSignal.timeout(10_000),
    })
    if (!res.ok) {
      this.log.warn(`Directus ${res.status} ${path}`)
      throw new Error(`directus ${res.status}`)
    }
    return (await res.json()) as { data: T; meta?: Record<string, unknown> }
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
    })
    if (!res.ok) {
      this.log.warn(`Directus ${res.status} ${path}`)
      throw new Error(`directus ${res.status}`)
    }
    const text = await res.text()
    return (text ? JSON.parse(text) : null) as T
  }

  /**
   * 파일 원본. 게시판 첨부와 대표 이미지가 이 길로 나간다.
   *
   * 브라우저를 Directus 로 직접 보내지 않는다. 운영에서 Directus 가 바깥에
   * 열려 있으리라는 보장이 없고, 열어 두면 파일 목록 전체가 노출된다.
   * 여기서 받아 넘기면 주소도 우리 것이고 토큰도 서버에 남는다.
   */
  async file(id: string): Promise<Response> {
    return fetch(`${this.base}/assets/${encodeURIComponent(id)}`, {
      headers: { Authorization: `Bearer ${this.token}` },
      // 첨부는 본문보다 크다. 10초로는 큰 파일이 끊긴다.
      signal: AbortSignal.timeout(30_000),
    })
  }


  /**
   * 조회에 실을 언어들. 요청 언어가 먼저고 기본 언어가 예비다.
   * 한 언어만 실으면 그 언어 번역이 없는 글이 제목 없이 나간다.
   */
  languages(requested: string): string[] {
    const fallback = process.env.DEFAULT_LANGUAGE ?? 'ko-KR'
    return requested === fallback ? [requested] : [requested, fallback]
  }

  /** 요청 언어. 목록에 없는 값은 기본 언어로 떨어뜨린다. */
  language(requested?: string): string {
    const allowed = ['ko-KR', 'en-US']
    const fallback = process.env.DEFAULT_LANGUAGE ?? 'ko-KR'
    return requested && allowed.includes(requested) ? requested : fallback
  }
}
