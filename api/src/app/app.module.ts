import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ContentModule } from '../core/content/content.module';
import { InquiryModule } from '../core/inquiry/inquiry.module';
import { AdminAuthModule } from '../core/admin-auth/admin-auth.module';
import { DatabaseModule } from '../common/database/database.module';
import { AdminPostModule } from '../core/admin-post/admin-post.module';
import { AdminFileModule } from '../core/admin-file/admin-file.module';
import { AdminInquiryModule } from '../core/admin-inquiry/admin-inquiry.module';
import { AdminScheduleModule } from '../core/admin-schedule/admin-schedule.module';
import { AdminRevisionModule } from '../core/admin-revision/admin-revision.module';
import { AdminUserModule } from '../core/admin-user/admin-user.module';
import { AdminDashboardModule } from '../core/admin-dashboard/admin-dashboard.module';
import { MenuModule } from '../core/menu/menu.module';
import { PageModule } from '../core/page/page.module';
import { HomeModule } from '../core/home/home.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['../.env', '.env'] }),
    DatabaseModule,
    ContentModule,
    InquiryModule,
    AdminAuthModule,
    AdminPostModule,
    AdminFileModule,
    AdminInquiryModule,
    AdminScheduleModule,
    AdminRevisionModule,
    AdminUserModule,
    AdminDashboardModule,
    MenuModule,
    PageModule,
    HomeModule,
  ],
})
export class AppModule {}
