import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app/app.module';
import { buildSwaggerConfig } from './common/swagger/swagger-config';
import { AppConfig } from './common/config/app-config';
import { CommonExceptionFilter } from './common/error/common-exception.filter';
import { validationExceptionFactory } from './common/error/validation-exception.factory';

async function bootstrap() {
  // 관리자 세션 서명 비밀에 안전한 기본값은 없다. 없으면 뜨지 않는다.
  if (!AppConfig.sessionSecret) {
    console.error(
      'ADMIN_SESSION_SECRET 이 비어 있다. 관리자 세션을 서명할 수 없다.',
    );
    process.exit(1);
  }
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  // 프록시 뒤에서 req.ip 가 프록시 주소로 합쳐지면 IP 별 속도 제한이 한도 하나가 된다.
  if (AppConfig.trustProxy !== undefined)
    app.set('trust proxy', AppConfig.trustProxy);
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      exceptionFactory: validationExceptionFactory,
    }),
  );
  app.useGlobalFilters(new CommonExceptionFilter());
  if (AppConfig.swaggerEnabled) {
    SwaggerModule.setup(
      'api/docs',
      app,
      SwaggerModule.createDocument(app, buildSwaggerConfig()),
      {
        jsonDocumentUrl: 'api/docs-json',
      },
    );
  }
  await app.listen(AppConfig.port);
}
void bootstrap();
