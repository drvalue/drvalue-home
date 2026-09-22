import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { IamModule } from '@drvalue-oss/iam-nestjs';
import { ContentModule } from '../core/content/content.module';
import { InquiryModule } from '../core/inquiry/inquiry.module';
import { AdminAuthModule } from '../core/admin-auth/admin-auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['../.env', '.env'] }),
    IamModule.forRoot({
      gatewaySharedSecret: process.env.IAM_GATEWAY_SECRET,
      enforceGatewayOnly: process.env.IAM_ENFORCE_GATEWAY !== 'false',
      secureByDefault: false,
      // 관리 화면 세션이 IAM 사용자 상태(enabled)를 60초마다 다시 본다. 없으면 그 검사만 빠진다.
      internalApiBaseUrl: process.env.IAM_INTERNAL_API_BASE_URL,
      internalApiKey: process.env.INTERNAL_API_KEY,
    }),
    ContentModule,
    InquiryModule,
    AdminAuthModule,
  ],
})
export class AppModule {}
