import { Module } from '@nestjs/common';
import { AdminAuthDefaultController } from './controller/admin-auth-default.controller';
import { AdminSessionGuard } from './guard/admin-session.guard';
import { AdminAuthDefaultService } from './service/admin-auth-default.service';

@Module({
  controllers: [AdminAuthDefaultController],
  providers: [AdminAuthDefaultService, AdminSessionGuard],
  exports: [AdminSessionGuard],
})
export class AdminAuthModule {}
