import { Injectable } from '@nestjs/common'

/**
 * notice_config.php 를 그대로 옮긴 설정.
 *
 * PHP 는 저장소에 안 올라가는 `notice_config.php` 파일을 읽었다. 여기서는
 * 환경변수로 받는다 — 값의 의미와 기본값은 sample 파일과 같게 뒀다.
 */
@Injectable()
export class NotifyConfig {
  /** 앱/게시판 백엔드(게이트웨이) 베이스 URL */
  readonly apiBase = (process.env.NOTIFY_API_BASE ?? '').replace(/\/+$/, '')
  /** 공개 조회용 서비스 계정(root/basic). 사람 로그인과 무관하다. */
  readonly rootId = process.env.NOTIFY_ROOT_ID ?? ''
  readonly rootPw = process.env.NOTIFY_ROOT_PW ?? ''
  readonly pageSize = Number(process.env.NOTIFY_PAGE_SIZE ?? 10)

  readonly iamBase = (process.env.NOTIFY_IAM_BASE_URL ?? '').replace(/\/+$/, '')
  /** 생략하면 {apiBase}/auth/v1/login/root/iam */
  readonly rootIamUrl =
    process.env.NOTIFY_ROOT_IAM_URL || `${this.apiBase}/auth/v1/login/root/iam`
  /**
   * IAM 에 화이트리스트로 등록된 콜백 주소. 로그인 리다이렉트와 토큰 교환에서
   * **글자 하나까지 같아야 한다** — IAM 이 정확 일치로 검증한다.
   * 그래서 Next 로 옮긴 뒤에도 주소가 `.php` 그대로다.
   */
  readonly callbackUrl = process.env.NOTIFY_CALLBACK_URL ?? ''
  readonly tenantCode = process.env.NOTIFY_TENANT_CODE ?? ''
  readonly tenantLoginUrl =
    process.env.NOTIFY_TENANT_LOGIN_URL || `${this.apiBase}/auth/v1/login/tenant/by-root`

  /** 채팅 연동은 이 값을 채워야 켜진다(opt-in). 비우면 로그인 동작이 기존과 같다. */
  readonly chatResolveKey = process.env.NOTIFY_CHAT_RESOLVE_KEY ?? ''
  readonly chatTokenTtl = Number(process.env.NOTIFY_CHAT_TOKEN_TTL ?? 3600)

  get configured(): boolean {
    return this.apiBase !== ''
  }
  get chatOn(): boolean {
    return this.chatResolveKey !== ''
  }
}
