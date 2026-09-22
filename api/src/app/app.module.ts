import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { IamModule } from '@drvalue-oss/iam-nestjs';
import { ContentModule } from '../core/content/content.module';
import { InquiryModule } from '../core/inquiry/inquiry.module';

@Module({
  imports: [
    // 루트 .env 하나를 쓴다. 컨테이너는 compose 가 넘기므로 파일이 없어도 된다.
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['../.env', '.env'] }),
    IamModule.forRoot({
      gatewaySharedSecret: process.env.IAM_GATEWAY_SECRET,
      // 빠뜨리면 켠 것으로 본다. 빠뜨리는 쪽이 열리는 설정은 언젠가 열린다.
      enforceGatewayOnly: process.env.IAM_ENFORCE_GATEWAY !== 'false',
      // 공개 사이트 API 라 기본은 열어 두고, 보호할 곳에만 @Authenticated() 를 붙인다.
      secureByDefault: false,
    }),
    ContentModule,
    InquiryModule,
  ],
})
export class AppModule {}
