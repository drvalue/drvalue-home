import { Module } from '@nestjs/common';
import { RevisionModule } from '../../common/revision/revision.module';
import { AdminAuthModule } from '../admin-auth/admin-auth.module';
import { AdminInquiryDefaultController } from './controller/admin-inquiry-default.controller';
import { InquiryDefaultRepository } from './repository/inquiry-default.repository';
import { InquiryRevisionHandler } from './revision/inquiry-revision.handler';
import { AdminInquiryDefaultService } from './service/admin-inquiry-default.service';

@Module({
  imports: [AdminAuthModule, RevisionModule],
  controllers: [AdminInquiryDefaultController],
  providers: [
    InquiryDefaultRepository,
    AdminInquiryDefaultService,
    InquiryRevisionHandler,
  ],
})
export class AdminInquiryModule {}
