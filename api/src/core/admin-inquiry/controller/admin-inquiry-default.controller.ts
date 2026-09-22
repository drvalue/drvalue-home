import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Public, SkipGatewaySignature } from '@drvalue-oss/iam-nestjs';
import { AdminSessionGuard } from '../../admin-auth/guard/admin-session.guard';
import { AdminInquiryDefaultService } from '../service/admin-inquiry-default.service';

/** 문의 목록과 상태. 문의 접수 자체는 공개 API(/api/inquiry)가 한다. */
@SkipGatewaySignature()
@Public()
@UseGuards(AdminSessionGuard)
@Controller('admin/inquiries')
export class AdminInquiryDefaultController {
  constructor(
    private readonly adminInquiryDefaultService: AdminInquiryDefaultService,
  ) {}

  @Get()
  list(@Query('status') status?: string, @Query('page') page?: string) {
    return this.adminInquiryDefaultService.list({
      status,
      page: Number(page) || 1,
    });
  }

  @Patch(':id')
  async setStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: string,
  ) {
    return {
      data: await this.adminInquiryDefaultService.setStatus(
        id,
        String(status ?? ''),
      ),
    };
  }
}
