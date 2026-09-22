import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminSessionGuard } from '../../admin-auth/guard/admin-session.guard';
import { AdminInquiryDefaultService } from '../service/admin-inquiry-default.service';

/** 문의 목록과 상태. 문의 접수 자체는 공개 API(/api/inquiry)가 한다. */
@UseGuards(AdminSessionGuard)
@Controller('admin/inquiries')
export class AdminInquiryDefaultController {
  constructor(
    private readonly adminInquiryDefaultService: AdminInquiryDefaultService,
  ) {}

  @Get()
  list(
    @Query('status') status?: string,
    @Query('q') q?: string,
    @Query('page') page?: string,
  ) {
    return this.adminInquiryDefaultService.list({
      status,
      q,
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

  @Delete(':id')
  @HttpCode(200)
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.adminInquiryDefaultService.remove(id);
    return { ok: true };
  }
}
