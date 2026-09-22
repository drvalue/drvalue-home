import { Injectable, Logger } from '@nestjs/common'
import { createHmac } from 'node:crypto'

/**
 * mail_send.php 를 옮긴 것. 네이버 클라우드 Outbound Mailer 로 보낸다.
 *
 * 브라우저로 옮길 수 없다. NCP_SECRET_KEY 로 요청에 서명해야 하는데, 그 키가
 * 프런트로 나가는 순간 누구나 이 회사 이름으로 메일을 보낼 수 있다.
 *
 * 서명 규칙은 PHP 와 한 글자도 다르면 안 된다. 서명이 틀리면 NCP 가 401 만
 * 돌려주고 어디가 틀렸는지는 알려 주지 않는다.
 */
@Injectable()
export class MailService {
  private readonly log = new Logger(MailService.name)

  private get cfg() {
    return {
      accessKey: process.env.NCP_ACCESS_KEY ?? '',
      secretKey: process.env.NCP_SECRET_KEY ?? '',
      apiBase: (process.env.NCP_MAIL_API_URL ?? 'https://mail.apigw.ntruss.com/api/v1').replace(/\/$/, ''),
      sender: process.env.NCP_MAIL_SENDER_ADDRESS ?? '',
      to: (process.env.NCP_MAIL_TO ?? '').split(',').map((s) => s.trim()).filter(Boolean),
    }
  }

  get configured(): boolean {
    const c = this.cfg
    return Boolean(c.accessKey && c.secretKey && c.sender && c.to.length)
  }

  /** `POST {uriPath}\n{timestamp}\n{accessKey}` 를 HMAC-SHA256 하고 base64. */
  signature(method: string, uriPath: string, timestampMs: string): string {
    const { accessKey, secretKey } = this.cfg
    const message = `${method} ${uriPath}\n${timestampMs}\n${accessKey}`
    return createHmac('sha256', secretKey).update(message).digest('base64')
  }

  /** PHP 의 htmlspecialchars(ENT_QUOTES) 와 같은 범위를 막는다. */
  private escape(v: string): string {
    return v
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
  }

  buildBody(input: { user_name: string; user_tel: string; user_type: string; user_msg: string }) {
    const e = (v: string) => this.escape(v)
    return (
      `<p><strong>회사명 / 성함</strong><br>${e(input.user_name)}</p>` +
      `<p><strong>연락처</strong><br>${e(input.user_tel)}</p>` +
      `<p><strong>문의 유형</strong><br>${e(input.user_type)}</p>` +
      `<p><strong>문의 내용</strong></p>` +
      `<pre style="white-space:pre-wrap;font-family:inherit">${e(input.user_msg)}</pre>`
    )
  }

  async send(input: { user_name: string; user_tel: string; user_type: string; user_msg: string }) {
    const c = this.cfg
    const uriPath = new URL(`${c.apiBase}/mails`).pathname || '/api/v1/mails'
    const timestamp = String(Date.now())
    const payload = {
      senderAddress: c.sender,
      senderName: '디알밸류 홈페이지',
      title: `[웹사이트 문의/${input.user_type}] ${input.user_name}`,
      body: this.buildBody(input),
      recipients: c.to.map((address) => ({ address, name: null, type: 'R' })),
      individual: true,
      advertising: false,
    }
    const res = await fetch(`${c.apiBase}/mails`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-ncp-apigw-timestamp': timestamp,
        'x-ncp-iam-access-key': c.accessKey,
        'x-ncp-apigw-signature-v2': this.signature('POST', uriPath, timestamp),
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(15_000),
    })
    if (!res.ok) {
      this.log.warn(`NCP ${res.status}`)
      throw new Error(`ncp ${res.status}`)
    }
    return true
  }
}
