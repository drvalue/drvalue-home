import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FileEntity } from '../../common/entity/file.entity';
import { AdminAuthModule } from '../admin-auth/admin-auth.module';
import { AdminFileDefaultController } from './controller/admin-file-default.controller';
import { FileDefaultRepository } from './repository/file-default.repository';
import { AdminFileDefaultService } from './service/admin-file-default.service';

@Module({
  imports: [TypeOrmModule.forFeature([FileEntity]), AdminAuthModule],
  controllers: [AdminFileDefaultController],
  providers: [FileDefaultRepository, AdminFileDefaultService],
  exports: [FileDefaultRepository, AdminFileDefaultService],
})
export class AdminFileModule {}
