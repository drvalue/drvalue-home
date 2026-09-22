import {
  BadGatewayException,
  BadRequestException,
  Controller,
  ForbiddenException,
  Get,
  GoneException,
  HttpCode,
  NotFoundException,
  Post,
  Query,
  Req,
  Res,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common'
import { Public, SkipGatewaySignature } from '@drvalue-oss/iam-nestjs'
import { randomBytes, timingSafeEqual } from 'node:crypto'
import type { Response } from 'express'
import { ChatStore } from './chat-store.service'
import { NotifyConfig } from './notify.config'
import type { Req as SessionReq } from './session'
import { UpstreamService } from './upstream.service'

const BOARD_TYPE: Record<string, string> = { notice: 'NOTICE', press: 'NEWSROOM' }
const ID_RE = /^[A-Za-z0-9_-]+$/

/**
 * `page/support/notice_api.php` 를 그대로 옮긴 것.
 *
 * **주소를 바꾸지 않는다.** 로그인 콜백 주소가 IAM 화이트리스트에 글자
 * 그대로 등록돼 있어서, 여기서 주소를 바꾸면 IAM 쪽 재등록이 필요하다.
 * 그래서 Nest 인데도 경로가 `.php` 다.
 *
 * 원본과 하나 다르게 옮긴 것이 있다 — 아래 `callback` 의 주석을 볼 것.
 */
/**
 * 이 컨트롤러는 **공개 홈페이지가 직접 부르는 자리**다. 게이트웨이를 거치지
 * 않으므로 서명이 없다. `@Public()` 은 인증만 면제할 뿐 게이트웨이 가드는
 * 그대로 통과 못 하므로, 여기에 `@SkipGatewaySignature()` 를 명시한다.
 *
 * 이렇게 해 두면 enforceGatewayOnly 의 기본값을 켠 쪽으로 둘 수 있다 —
 * 표시하지 않은 새 경로는 자동으로 게이트웨이 뒤에 서게 된다.
 */
@SkipGatewaySignature()
@Controller('page/support')
export class NotifyController {
  constructor(
    private readonly cfg: NotifyConfig,
    private readonly up: UpstreamService,
    private readonly chat: ChatStore,
  ) {}

  private base(): string {
    if (!this.cfg.configured) throw new ServiceUnavailableException({ error: 'service unavailable' })
    return `${this.cfg.apiBase}/baseinfo/v1/default-notify`
  }

  private requireAdmin(req: SessionReq): void {
    if (!req.session.notify_admin) throw new UnauthorizedException({ error: 'unauthorized' })
  }

  /** 길이가 다르면 timingSafeEqual 이 던진다. 길이부터 본다. */
  private sameSecret(a: string, b: string): boolean {
    const x = Buffer.from(a)
    const y = Buffer.from(b)
    return x.length === y.length && timingSafeEqual(x, y)
  }

  private checkCsrf(req: SessionReq): void {
    const given = String(req.headers['x-csrf-token'] ?? '')
    const want = req.session.csrf ?? ''
    if (!want || !this.sameSecret(want, given)) throw new ForbiddenException({ error: 'csrf' })
  }

  /** 바깥 주소로는 못 보낸다. 오픈 리다이렉트를 막는 판정을 그대로 옮겼다. */
  private localPath(p: unknown): string {
    return typeof p === 'string' && p.startsWith('/') && !p.startsWith('//') ? p : '/'
  }

  private callbackUrl(req: SessionReq): string {
    if (this.cfg.callbackUrl) return this.cfg.callbackUrl
    const https = req.protocol === 'https'
    const host = req.headers.host ?? 'localhost'
    return `${https ? 'https' : 'http'}://${host}/page/support/notice_login_callback.php`
  }

  // ── 세션/인증 ───────────────────────────────────────────────────────
  @Public()
  @Get('notice_api.php')
  async read(@Req() req: SessionReq, @Res() res: Response, @Query() q: Record<string, string>) {
    switch (q.action) {
      case 'session': {
        const admin = !!req.session.notify_admin
        return res.json({ admin, csrf: admin ? (req.session.csrf ?? '') : '' })
      }
      case 'login':
        return this.login(req, res, q)
      case 'callback':
        return this.callback(req, res, q)
      case 'chat_resolve':
        return this.chatResolve(req, res, q)
      case 'list':
      case 'search':
      case 'detail':
        return res.json(await this.fetchBoard(req, q))
      default:
        throw new BadRequestException({ error: 'invalid action' })
    }
  }

  /** IAM 콜백 전용 주소. 쿼리가 붙지 않아야 화이트리스트 매칭이 안전하다. */
  @Public()
  @Get('notice_login_callback.php')
  async loginCallback(@Req() req: SessionReq, @Res() res: Response, @Query() q: Record<string, string>) {
    return this.callback(req, res, q)
  }

  private login(req: SessionReq, res: Response, q: Record<string, string>) {
    if (!this.cfg.iamBase) throw new ServiceUnavailableException({ error: 'iam not configured' })
    req.session.notify_login_return = this.localPath(q.return)
    const url = `${this.cfg.iamBase}/auth/login?redirect_url=${encodeURIComponent(this.callbackUrl(req))}`
    return res.redirect(url)
  }

  private async callback(req: SessionReq, res: Response, q: Record<string, string>) {
    const ret = req.session.notify_login_return ?? '/'
    const back = (key?: string, val?: string) => {
      const path = this.localPath(ret)
      if (!key) return res.redirect(path)
      const sep = path.includes('?') ? '&' : '?'
      return res.redirect(`${path}${sep}${encodeURIComponent(key)}=${encodeURIComponent(val ?? '')}`)
    }

    const code = q.code ?? ''
    if (!code) return back('login', 'error')
    if (!this.cfg.iamBase || !this.cfg.rootIamUrl) {
      throw new ServiceUnavailableException({ error: 'iam not configured' })
    }

    // 1) code → IAM 액세스 토큰. IAM 직접 호출이라 봉투가 없다.
    const [c1, j1] = await this.up.call(`${this.cfg.iamBase}/auth/token/exchange`, 'POST', {
      code,
      redirectUri: this.callbackUrl(req),
    })
    const iamToken = j1?.access_token ?? null
    if (!iamToken) return back('login', `error:exchange:${c1}`)

    // 2) IAM 토큰 → 앱 토큰 (root/iam, 서명 게이트웨이. 빈 본문).
    const [st2, j2] = await this.up.call(this.cfg.rootIamUrl, 'POST', {}, iamToken)
    const appToken = j2?.data?.accessToken ?? null
    if (!appToken || st2 < 200 || st2 >= 300) return back('login', `error:rootiam:${st2}`)

    // 3) root 앱 토큰 + x-tenant-code → 테넌트 토큰. root 권한이 있어야
    //    성공하므로 로그인 권한 확인을 겸한다(실패 = 거부).
    // tenant_code 가 비면 헤더를 아예 안 보낸다 — 토큰에서 테넌트가
    // 식별되는 경우가 있어서 빈 값을 보내면 거절당한다.
    const headers: Record<string, string> = this.cfg.tenantCode
      ? { 'X-Tenant-Code': this.cfg.tenantCode }
      : {}
    const [st3, j3] = await this.up.call(this.cfg.tenantLoginUrl, 'POST', {}, appToken, headers)
    const tenantToken = j3?.data?.accessToken ?? null
    if (!tenantToken || st3 < 200 || st3 >= 300) {
      // 원본에는 여기서 `iam_tok`·`app_tok` 을 주소창 쿼리에 실어 보내는
      // [임시 진단] 코드가 있었다. 옮기지 않았다 — 실토큰이 브라우저 기록·
      // 리퍼러·프록시 로그에 전부 남는다. 진단은 서버 로그로 한다.
      return back('login', `denied:${st3}`)
    }

    // 4) 세션 확립. 로그인 순간 세션 id 를 새로 뽑는다(세션 고정 공격 차단).
    await new Promise<void>((ok, no) => req.session.regenerate((e) => (e ? no(e) : ok())))
    req.session.notify_admin = true
    req.session.csrf = randomBytes(32).toString('hex')
    req.session.notify_token = appToken
    req.session.notify_chat_token = tenantToken

    // 5) 채팅 연동이 켜져 있을 때만: 위젯이 읽을 수 있는 쿠키에 불투명한
    //    chatSid 를 준다. 토큰 자체는 절대 쿠키에 넣지 않는다.
    if (this.cfg.chatOn) {
      const chatSid = randomBytes(32).toString('hex')
      this.chat.put(chatSid, tenantToken, this.cfg.chatTokenTtl)
      req.session.notify_chat_sid = chatSid
      res.cookie('PHPSESSID', chatSid, {
        path: '/',
        httpOnly: false, // 위젯이 읽어야 한다. 그래서 토큰이 아니라 sid 만 둔다.
        secure: req.protocol === 'https',
        sameSite: 'lax',
      })
    }

    delete req.session.notify_login_return
    return back()
  }

  private chatResolve(req: SessionReq, res: Response, q: Record<string, string>) {
    const key = this.cfg.chatResolveKey
    const given = String(req.headers['x-chat-resolve-key'] ?? '')
    if (!key || !this.sameSecret(key, given)) throw new UnauthorizedException({ error: 'unauthorized' })
    const sid = String(q.sid ?? '')
    if (!/^[a-f0-9]{64}$/.test(sid)) throw new BadRequestException({ error: 'invalid sid' })
    const token = this.chat.get(sid)
    if (!token) throw new NotFoundException({ error: 'not found' })
    return res.json({ ok: true, accessToken: token })
  }

  // ── 조회(공개) ──────────────────────────────────────────────────────
  private async fetchBoard(req: SessionReq, q: Record<string, string>) {
    const type = BOARD_TYPE[q.board ?? '']
    if (!type) throw new BadRequestException({ error: 'invalid board' })
    const base = this.base()

    let url: string
    if (q.action === 'detail') {
      const id = q.id ?? ''
      if (!ID_RE.test(id)) throw new BadRequestException({ error: 'invalid id' })
      url = `${base}/one/${encodeURIComponent(id)}`
    } else {
      const take = this.cfg.pageSize
      const page = Math.max(1, Number(q.page ?? 1) || 1)
      const params = new URLSearchParams({
        take: String(take),
        skip: String((page - 1) * take),
        type, // 서버가 정한다. 클라이언트 값을 믿지 않는다.
        showYn: 'true', // 공개분만. 서버가 정한다.
      })
      if (q.q) params.set('q', q.q.trim().slice(0, 200))
      for (const k of ['startDate', 'endDate']) {
        if (q[k] && /^\d{4}-\d{2}-\d{2}$/.test(q[k])) params.set(k, q[k])
      }
      url = `${base}${q.action === 'search' ? '/search' : '/many'}?${params}`
    }

    const [st, json] = await this.up.callAsService(url, 'GET')
    if (st >= 200 && st < 300 && json?.data !== undefined) {
      // 상세는 업스트림이 showYn 을 안 걸러 준다. 목록과 같은 정책을 여기서 건다.
      if (q.action === 'detail' && !req.session.notify_admin && json.data?.showYn !== true) {
        throw new NotFoundException({ error: 'not found' })
      }
      return json.data
    }
    if (st === 404) throw new NotFoundException({ error: 'not found' })
    throw new BadGatewayException({ error: 'upstream error' })
  }

  // ── 쓰기(관리자) ────────────────────────────────────────────────────
  @Public()
  @Post('notice_api.php')
  @HttpCode(200)
  async write(@Req() req: SessionReq, @Query() q: Record<string, string>) {
    if (q.action === 'logout') {
      this.requireAdmin(req)
      this.checkCsrf(req)
      if (this.cfg.chatOn) this.chat.del(req.session.notify_chat_sid ?? '')
      await new Promise<void>((ok) => req.session.destroy(() => ok()))
      return { ok: true }
    }
    // ── 쓰기는 CMS 로 옮겼다 ──────────────────────────────────────────
    // 게시판 내용은 이제 Directus 에서 온다. 여기로 쓰면 성공 응답을 받으면서
    // 사이트에는 안 나오는 글이 생긴다 — 화면에서 폼만 감추는 것으로는
    // 북마크·직접 호출·사내 자동화를 못 막는다. 그래서 경로 자체를 닫는다.
    // 410 인 것은 "없어졌다" 를 분명히 하려는 것이다. 404 면 주소를 잘못 쓴
    // 줄 알고 계속 재시도한다.
    if (['create', 'update', 'delete'].includes(q.action ?? '')) {
      throw new GoneException({
        error: '게시판 쓰기는 콘텐츠 관리 화면(CMS)으로 옮겼다',
      })
    }
    throw new BadRequestException({ error: 'invalid action' })
  }

}

