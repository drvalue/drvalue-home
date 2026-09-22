import { Injectable, Logger } from '@nestjs/common'
import { NotifyConfig } from './notify.config'

/**
 * 게이트웨이 호출. notice_api.php 의 notify_curl / notify_call 자리다.
 *
 * 업스트림은 전송 코드를 늘 200/201 로 주고 **실제 결과를 본문 `status` 로**
 * 전달한다. 전송 코드만 보면 실패를 성공으로 읽는다.
 */
@Injectable()
export class UpstreamService {
  private readonly log = new Logger(UpstreamService.name)
  /** 공개 조회용 서비스 토큰. PHP 는 임시 파일에 캐시했다. */
  private serviceToken: string | null = null

  constructor(private readonly cfg: NotifyConfig) {}

  async call(
    url: string,
    method: string,
    body: unknown = null,
    token: string | null = null,
    extra: Record<string, string> = {},
  ): Promise<[number, any]> {
    const headers: Record<string, string> = { Accept: 'application/json', ...extra }
    if (token) headers.Authorization = `Bearer ${token}`
    if (body !== null) headers['Content-Type'] = 'application/json'
    try {
      const res = await fetch(url, {
        method,
        headers,
        body: body === null ? undefined : JSON.stringify(body),
        signal: AbortSignal.timeout(15_000),
      })
      const text = await res.text()
      let json: any = null
      try {
        json = text ? JSON.parse(text) : null
      } catch {
        json = null
      }
      return [this.status(res.status, json), json]
    } catch (e) {
      this.log.error(`업스트림 호출 실패: ${method} ${url}`, e as Error)
      return [0, null]
    }
  }

  /** 본문 status 가 있으면 그것이 진짜 결과다. */
  private status(transport: number, json: any): number {
    return typeof json?.status === 'number' ? json.status : transport
  }

  /** root/basic 으로 서비스 토큰을 받는다. */
  private async login(): Promise<string | null> {
    const [st, json] = await this.call(
      `${this.cfg.apiBase}/auth/v1/login/root/basic`,
      'POST',
      { userId: this.cfg.rootId, password: this.cfg.rootPw },
    )
    const token = json?.data?.accessToken ?? null
    if (token && st >= 200 && st < 300) {
      this.serviceToken = token
      return token
    }
    return null
  }

  /**
   * 공개 조회. 토큰이 만료돼 401 이 오면 **한 번만** 다시 로그인한다.
   * 무한히 재시도하면 자격증명이 틀렸을 때 게이트웨이를 두드리게 된다.
   */
  async callAsService(url: string, method: string, body: unknown = null): Promise<[number, any]> {
    let token = this.serviceToken ?? (await this.login())
    if (!token) return [502, null]
    let [st, json] = await this.call(url, method, body, token)
    if (st === 401) {
      token = await this.login()
      if (token) [st, json] = await this.call(url, method, body, token)
    }
    return [st, json]
  }
}
