import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminUserEntity } from '../../common/entity/admin-user.entity';
import { RevisionModule } from '../../common/revision/revision.module';
import { AdminAuthModule } from '../admin-auth/admin-auth.module';
import { AdminUserDefaultController } from './controller/admin-user-default.controller';
import { AdminUserDefaultService } from './service/admin-user-default.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([AdminUserEntity]),
    AdminAuthModule,
    RevisionModule,
  ],
  controllers: [AdminUserDefaultController],
  providers: [AdminUserDefaultService],
})
export class AdminUserModule {}
