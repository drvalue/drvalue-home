import { Logger, Module, OnModuleInit } from '@nestjs/common';
import { AppConfig } from '../../common/config/app-config';
import { TransactionContextFactory } from '../../common/typeorm/transaction-context.factory';
import { AdminFileModule } from '../admin-file/admin-file.module';
import { AdminPostModule } from '../admin-post/admin-post.module';
import {
  AUTOPOST_CLIENT,
  AutopostClaudeClient,
} from './client/autopost-claude.client';
import { AutopostWebGptClient } from './client/autopost-webgpt.client';
import { AutopostRunDefaultRepository } from './repository/autopost-run-default.repository';
import { AutopostDefaultService } from './service/autopost-default.service';

/**
 * 제조 AI 주간 글(1시간 틱). 바깥 HTTP 입구가 없다 — 컨트롤러를 두지 않는다.
 * ScheduleModule.forRoot() 는 `admin-schedule` 이 건다(앱 전체에 한 번).
 */
@Module({
  imports: [AdminPostModule, AdminFileModule],
  providers: [
    AutopostDefaultService,
    AutopostRunDefaultRepository,
    TransactionContextFactory,
    {
      provide: AUTOPOST_CLIENT,
      // 키가 비어도 만든다 — 부르기 전에 서비스가 설정을 본다(꺼져 있으면 한 번도 안 부른다).
      useFactory: () =>
        AppConfig.autopost.provider === 'webgpt'
          ? new AutopostWebGptClient(AppConfig.autopost.browser)
          : new AutopostClaudeClient(AppConfig.autopost.apiKey),
    },
  ],
  exports: [AutopostDefaultService],
})
export class AutopostModule implements OnModuleInit {
  /** 꺼진 채로 떴으면 한 줄 남긴다 — 몇 주째 글이 없을 때 로그에서 이유를 찾을 수 있게. */
  onModuleInit(): void {
    if (!AppConfig.autopost.ready)
      new Logger(AutopostModule.name).log('자동 글: 꺼져 있습니다');
  }
}
