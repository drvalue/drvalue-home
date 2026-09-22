import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import type { NestExpressApplication } from '@nestjs/platform-express'
// 이 저장소의 tsconfig 는 esModuleInterop 이 꺼져 있다. 두 패키지 모두
// `export =` 라서 default import 로 받으면 런타임에 undefined 가 된다
// (빌드는 통과하고 부팅할 때 죽는다).
import session = require('express-session')
import FileStoreFactory = require('session-file-store')
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { AppModule } from './app.module'

/**
 * PHP 가 서버로 하던 일을 넘겨받는 API.
 *
 *   mail_send.php  → POST /api/inquiry   (네이버 클라우드 키로 서명)
 *   notice_api.php → GET  /api/content/* (Directus 를 서비스 토큰으로 읽는다)
 *
 * 둘 다 브라우저로 옮길 수 없다. 키와 자격증명이 그대로 노출되기 때문이다.
 */
/**
 * 세션 서명 비밀에는 안전한 기본값이 없다. 기본값을 두면 그 값으로 서명된
 * 세션을 누구나 만들 수 있다 — 관리자 화면이 통째로 열린다. 그래서 뜨기
 * 전에 막는다. 뜬 뒤에 막으면 "일단 떠 있으니 됐다" 로 넘어간다.
 */
function requireEnv(): void {
  if (!process.env.SESSION_SECRET) {
    console.error('SESSION_SECRET 이 비어 있다. 관리자 세션을 서명할 수 없다.')
    process.exit(1)
  }
  // secure 쿠키는 req.secure 가 true 일 때만 나간다. nginx 가 TLS 를 끊으면
  // 이 프로세스가 받는 요청은 평문이라 req.secure 는 false — 쿠키가 오류도
  // 없이 그냥 안 나가고, 로그인 콜백은 성공한 뒤 다음 요청에서 세션이
  // 사라진다. trust proxy 가 켜져 있어야 X-Forwarded-Proto 를 보고 판단한다.
  // (PHP 는 nginx 가 fastcgi_param 으로 HTTPS 를 넣어 줘서 이 문제가 없었다.)
  // TLS 를 이 프로세스가 직접 받는 배치도 있으므로 죽이지는 않는다.
  if (process.env.SESSION_SECURE !== 'false' && !process.env.TRUST_PROXY) {
    console.warn(
      'SESSION_SECURE 가 켜져 있는데 TRUST_PROXY 가 비어 있다. ' +
        '리버스 프록시 뒤라면 관리자 로그인이 조용히 안 된다 — TRUST_PROXY=1 을 넣어라.',
    )
  }
}

/**
 * Express 의 `trust proxy` 는 문자열을 홉 수가 아니라 **신뢰 대역 목록**으로
 * 읽는다. `.env` 에서 온 값은 항상 문자열이라, TRUST_PROXY=1 을 그대로
 * 넘기면 "IP 0.0.0.1 을 믿는다" 가 돼서 결과적으로 아무것도 신뢰하지 않는다.
 * X-Forwarded-Proto 가 무시되고 req.secure 는 계속 false 다 — 위 경고가
 * 말하는 증상이 설정을 넣고도 그대로 재현된다.
 */
function trustProxyValue(raw: string): boolean | number | string {
  if (/^\d+$/.test(raw)) return Number(raw)
  if (raw === 'true') return true
  if (raw === 'false') return false
  return raw
}

async function bootstrap() {
  requireEnv()
  const app = await NestFactory.create<NestExpressApplication>(AppModule)
  // 게이트웨이·리버스 프록시 뒤에 서면 req.ip 가 전부 프록시 주소가 된다.
  // 그대로 두면 IP 별 속도 제한이 전체 한도 하나로 합쳐진다.
  if (process.env.TRUST_PROXY) app.set('trust proxy', trustProxyValue(process.env.TRUST_PROXY))
  // 관리자 세션. PHP 는 파일 세션을 썼다 — 메모리에 두면 배포할 때마다
  // 로그인이 풀리고, 프로세스를 여러 개 띄우면 서로 못 읽는다.
  const FileStore = FileStoreFactory(session)
  const stateDir = process.env.NOTIFY_STATE_DIR || join(tmpdir(), 'drvalue_notify')
  app.use(
    session({
      name: process.env.NOTIFY_SESSION_NAME || 'DVADMINSID',
      secret: process.env.SESSION_SECRET as string,
      resave: false,
      saveUninitialized: false,
      store: new FileStore({ path: join(stateDir, 'sessions'), retries: 1, logFn: () => {} }),
      cookie: {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        // 없으면 켠 것으로 본다. 빠뜨린 배포에서 쿠키가 평문으로 나가는
        // 것보다, 로컬에서 false 를 명시하는 쪽이 낫다.
        secure: process.env.SESSION_SECURE !== 'false',
      },
    }),
  )

  // 게시판 API 와 로그인 콜백만 /api 접두사를 붙이지 않는다.
  // 콜백 주소가 IAM 화이트리스트에 글자 그대로 등록돼 있어서, 주소를 바꾸면
  // IAM 쪽 재등록이 필요하다.
  app.setGlobalPrefix('api', {
    exclude: ['page/support/notice_api.php', 'page/support/notice_login_callback.php'],
  })
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))
  await app.listen(Number(process.env.PORT ?? 3500))
}
void bootstrap()
