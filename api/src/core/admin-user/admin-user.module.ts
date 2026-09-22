import { Module } from '@nestjs/common';
import { RevisionModule } from '../../common/revision/revision.module';
import { AdminAuthModule } from '../admin-auth/admin-auth.module';
import { AdminUserDefaultController } from './controller/admin-user-default.controller';
import { AdminUserDefaultRepository } from './repository/admin-user-default.repository';
import { AdminUserRevisionHandler } from './revision/admin-user-revision.handler';
import { AdminUserDefaultService } from './service/admin-user-default.service';

@Module({
  imports: [AdminAuthModule, RevisionModule],
  controllers: [AdminUserDefaultController],
  providers: [
    AdminUserDefaultService,
    AdminUserDefaultRepository,
    AdminUserRevisionHandler,
  ],
})
export class AdminUserModule {}
