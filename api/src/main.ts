import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app/app.module';

/**
 * `.env` 값은 항상 문자열이다. Express 는 문자열 `'1'` 을 홉 수가 아니라
 * 신뢰 대역(IP 0.0.0.1)으로 읽어 결과적으로 아무것도 믿지 않는다.
 */
function trustProxyValue(raw: string): boolean | number | string {
  if (/^\d+$/.test(raw)) return Number(raw);
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  return raw;
}

async function bootstrap() {
  // 관리자 세션 서명 비밀에 안전한 기본값은 없다. 없으면 뜨지 않는다.
  if (!process.env.ADMIN_SESSION_SECRET) {
    console.error(
      'ADMIN_SESSION_SECRET 이 비어 있다. 관리자 세션을 서명할 수 없다.',
    );
    process.exit(1);
  }
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  // 프록시 뒤에서 req.ip 가 프록시 주소로 합쳐지면 IP 별 속도 제한이 한도 하나가 된다.
  if (process.env.TRUST_PROXY)
    app.set('trust proxy', trustProxyValue(process.env.TRUST_PROXY));
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  await app.listen(Number(process.env.PORT ?? 3500));
}
void bootstrap();
