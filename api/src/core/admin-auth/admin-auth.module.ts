import { Module } from '@nestjs/common';
import { AdminAuthDefaultController } from './controller/admin-auth-default.controller';
import { AdminSessionGuard } from './guard/admin-session.guard';
import { AdminUserDefaultRepository } from './repository/admin-user-default.repository';
import { AdminAuthDefaultService } from './service/admin-auth-default.service';
import { AdminUserService } from './service/admin-user.service';

@Module({
  controllers: [AdminAuthDefaultController],
  providers: [
    AdminAuthDefaultService,
    AdminSessionGuard,
    AdminUserService,
    AdminUserDefaultRepository,
  ],
  exports: [AdminSessionGuard, AdminUserService],
})
export class AdminAuthModule {}
