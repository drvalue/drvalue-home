import { Module } from '@nestjs/common';
import { AdminAuthDefaultController } from './controller/admin-auth-default.controller';
import { AdminSessionGuard } from './guard/admin-session.guard';
import { AdminAuthDefaultService } from './service/admin-auth-default.service';
import { MaxRootService } from './service/max-root.service';

@Module({
  controllers: [AdminAuthDefaultController],
  providers: [AdminAuthDefaultService, AdminSessionGuard, MaxRootService],
  exports: [AdminSessionGuard, MaxRootService],
})
export class AdminAuthModule {}
