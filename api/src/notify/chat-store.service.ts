import { Injectable } from '@nestjs/common'
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

/**
 * chatSid → 테넌트 토큰. notice_api.php 의 notify_chat_store_* 자리다.
 *
 * 관리자 세션에 둘 수 없다. chat_resolve 는 growchat 백엔드가 **관리자 쿠키
 * 없이 서버 대 서버로** 부르기 때문이다. PHP 와 같이 파일에 둔다 —
 * Nest 가 여러 프로세스로 뜨면 메모리에 두는 순간 다른 프로세스가 못 읽는다.
 */
@Injectable()
export class ChatStore {
  private readonly dir = process.env.NOTIFY_STATE_DIR || join(tmpdir(), 'drvalue_notify')

  private path(sid: string): string {
    mkdirSync(this.dir, { recursive: true, mode: 0o700 })
    // 파일 이름에 원본 sid 를 쓰지 않는다. 디렉터리 목록만 봐도 새기 때문이다.
    return join(this.dir, `chat_${createHash('sha256').update(sid).digest('hex')}.json`)
  }

  put(sid: string, token: string, ttlSeconds: number): void {
    const exp = Math.floor(Date.now() / 1000) + Math.max(60, ttlSeconds)
    // 0600 으로 만든다. 만든 뒤에 권한을 조이면 그 사이에 읽힐 수 있다.
    writeFileSync(this.path(sid), JSON.stringify({ token, exp }), { mode: 0o600 })
  }

  get(sid: string): string | null {
    const p = this.path(sid)
    if (!existsSync(p)) return null
    try {
      const j = JSON.parse(readFileSync(p, 'utf8'))
      if ((j.exp ?? 0) < Math.floor(Date.now() / 1000)) {
        rmSync(p, { force: true })
        return null
      }
      return j.token ?? null
    } catch {
      return null
    }
  }

  del(sid: string): void {
    if (sid) rmSync(this.path(sid), { force: true })
  }
}
