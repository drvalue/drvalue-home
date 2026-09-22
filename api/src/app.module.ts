import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { IamModule } from '@drvalue-oss/iam-nestjs'
import { ContentModule } from './content/content.module'
import { InquiryModule } from './inquiry/inquiry.module'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['.env'] }),
    IamModule.forRoot({
      // 게이트웨이 서명 검증. **없으면 켠 것으로 본다.**
      // `=== 'true'` 로 두면 이 변수를 빠뜨린 배포가 서명 없는 요청을 전부
      // 받아들인다 — 빠뜨리는 쪽이 열리는 설정은 언젠가 열린다.
      gatewaySharedSecret: process.env.IAM_GATEWAY_SECRET,
      enforceGatewayOnly: process.env.IAM_ENFORCE_GATEWAY !== 'false',
      // 공개 사이트가 읽는 API 라 기본은 열어 두고, 보호할 곳에만
      // @Authenticated() / @Roles() 를 붙인다.
      secureByDefault: false,
    }),
    ContentModule,
    InquiryModule,
  ],
})
export class AppModule {}
