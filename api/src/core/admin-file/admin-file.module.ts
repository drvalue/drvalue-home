import { Module } from '@nestjs/common';
import { RevisionModule } from '../../common/revision/revision.module';
import { AdminAuthModule } from '../admin-auth/admin-auth.module';
import { AdminFileDefaultController } from './controller/admin-file-default.controller';
import { FileDefaultRepository } from './repository/file-default.repository';
import { FileRevisionHandler } from './revision/file-revision.handler';
import { AdminFileDefaultService } from './service/admin-file-default.service';

@Module({
  imports: [AdminAuthModule, RevisionModule],
  controllers: [AdminFileDefaultController],
  providers: [
    FileDefaultRepository,
    AdminFileDefaultService,
    FileRevisionHandler,
  ],
})
export class AdminFileModule {}
