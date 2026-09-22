import { Module } from '@nestjs/common';
import { AdminAuthModule } from '../admin-auth/admin-auth.module';
import { AdminRevisionModule } from '../admin-revision/admin-revision.module';
import { AdminDashboardDefaultController } from './controller/admin-dashboard-default.controller';
import { InquiryDefaultRepository } from './repository/inquiry-default.repository';
import { PostDefaultRepository } from './repository/post-default.repository';
import { AdminDashboardDefaultService } from './service/admin-dashboard-default.service';

@Module({
  imports: [AdminAuthModule, AdminRevisionModule],
  controllers: [AdminDashboardDefaultController],
  providers: [
    PostDefaultRepository,
    InquiryDefaultRepository,
    AdminDashboardDefaultService,
  ],
})
export class AdminDashboardModule {}
