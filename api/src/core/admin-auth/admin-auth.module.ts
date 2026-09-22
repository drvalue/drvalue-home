import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminUserEntity } from '../../common/entity/admin-user.entity';
import { AdminAuthDefaultController } from './controller/admin-auth-default.controller';
import { AdminSessionGuard } from './guard/admin-session.guard';
import { AdminAuthDefaultService } from './service/admin-auth-default.service';
import { MaxRootService } from './service/max-root.service';
import { AdminUserService } from './service/admin-user.service';

@Module({
  imports: [TypeOrmModule.forFeature([AdminUserEntity])],
  controllers: [AdminAuthDefaultController],
  providers: [
    AdminAuthDefaultService,
    AdminSessionGuard,
    MaxRootService,
    AdminUserService,
  ],
  exports: [AdminSessionGuard, MaxRootService, AdminUserService],
})
export class AdminAuthModule {}
