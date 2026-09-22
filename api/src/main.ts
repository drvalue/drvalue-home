import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import type { NestExpressApplication } from '@nestjs/platform-express'
import { AppModule } from './app.module'

/**
 * 공개 홈페이지가 부르는 API.
 *
 *   POST /api/inquiry     문의 접수 (네이버 클라우드 키로 서명해 메일을 보낸다)
 *   GET  /api/content/*   게시판 (Directus 를 서비스 토큰으로 읽는다)
 *
 * 둘 다 브라우저로 옮길 수 없다. 키와 자격증명이 그대로 노출되기 때문이다.
 */

/**
 * Express 의 `trust proxy` 는 문자열을 홉 수가 아니라 **신뢰 대역 목록**으로
 * 읽는다. `.env` 에서 온 값은 항상 문자열이라, TRUST_PROXY=1 을 그대로
 * 넘기면 "IP 0.0.0.1 을 믿는다" 가 돼서 결과적으로 아무것도 신뢰하지 않는다.
 * 그러면 req.ip 가 전부 프록시 주소가 되고 IP 별 속도 제한이 한도 하나로
 * 합쳐진다.
 */
function trustProxyValue(raw: string): boolean | number | string {
  if (/^\d+$/.test(raw)) return Number(raw)
  if (raw === 'true') return true
  if (raw === 'false') return false
  return raw
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule)
  // 게이트웨이·리버스 프록시 뒤에 서면 req.ip 가 전부 프록시 주소가 된다.
  // 그대로 두면 IP 별 속도 제한이 전체 한도 하나로 합쳐진다.
  if (process.env.TRUST_PROXY) app.set('trust proxy', trustProxyValue(process.env.TRUST_PROXY))
  app.setGlobalPrefix('api')
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))
  await app.listen(Number(process.env.PORT ?? 3500))
}
void bootstrap()
