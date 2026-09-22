import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InquiryEntity } from '../../common/entity/inquiry.entity';
import { RevisionModule } from '../../common/revision/revision.module';
import { AdminAuthModule } from '../admin-auth/admin-auth.module';
import { AdminInquiryDefaultController } from './controller/admin-inquiry-default.controller';
import { InquiryDefaultRepository } from './repository/inquiry-default.repository';
import { AdminInquiryDefaultService } from './service/admin-inquiry-default.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([InquiryEntity]),
    AdminAuthModule,
    RevisionModule,
  ],
  controllers: [AdminInquiryDefaultController],
  providers: [InquiryDefaultRepository, AdminInquiryDefaultService],
  exports: [InquiryDefaultRepository],
})
export class AdminInquiryModule {}
