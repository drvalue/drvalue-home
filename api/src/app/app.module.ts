import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { IamModule } from '@drvalue-oss/iam-nestjs';
import { ContentModule } from '../core/content/content.module';
import { InquiryModule } from '../core/inquiry/inquiry.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['../.env', '.env'] }),
    IamModule.forRoot({
      gatewaySharedSecret: process.env.IAM_GATEWAY_SECRET,
      enforceGatewayOnly: process.env.IAM_ENFORCE_GATEWAY !== 'false',
      secureByDefault: false,
    }),
    ContentModule,
    InquiryModule,
  ],
})
export class AppModule {}
