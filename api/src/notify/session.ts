import type { Request } from 'express'

/**
 * PHP 의 $_SESSION 에 있던 항목들. 이름을 그대로 둔다 — 원본과 대조할 때
 * 이름이 다르면 무엇이 무엇인지 매번 다시 찾아야 한다.
 */
export interface NotifySession {
  notify_admin?: boolean
  csrf?: string
  /** 게시판 CRUD 에 쓰는 앱 토큰(root/iam) */
  notify_token?: string
  /** 채팅용 테넌트 토큰(by-root) */
  notify_chat_token?: string
  notify_chat_sid?: string
  notify_login_return?: string
}

export type Req = Request & { session: NotifySession & { destroy(cb: (e?: unknown) => void): void; regenerate(cb: (e?: unknown) => void): void } }
