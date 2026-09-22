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
import type { SessionPayload } from '../../../common/session/session-token';
import {
  AdminSessionGuard,
  AdminUser,
} from '../../admin-auth/guard/admin-session.guard';
import { AdminRoles } from '../../admin-auth/guard/roles.decorator';
import { ControllerAdminInquiryDefaultUpdateDto } from '../dto/controller-admin-inquiry-default.dto';
import { AdminInquiryDefaultService } from '../service/admin-inquiry-default.service';

/**
 * 문의 목록 · 담당자 · 메모 · 상태. 접수 자체는 공개 API(/api/inquiry)가 한다.
 * 인사(hr)는 문의를 볼 일이 없다 — 마케팅·관리자만.
 */
@UseGuards(AdminSessionGuard)
@AdminRoles('marketing')
@Controller('admin/inquiries')
export class AdminInquiryDefaultController {
  constructor(
    private readonly adminInquiryDefaultService: AdminInquiryDefaultService,
  ) {}

  @Get()
  list(
    @AdminUser() who: SessionPayload,
    @Query('status') status?: string,
    @Query('q') q?: string,
    @Query('assignee') assignee?: string,
    @Query('page') page?: string,
  ) {
    return this.adminInquiryDefaultService.list(
      { status, q, assignee, page: Number(page) || 1 },
      who,
    );
  }

  @Get('assignees')
  async assignees() {
    return { data: await this.adminInquiryDefaultService.assignees() };
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ControllerAdminInquiryDefaultUpdateDto,
    @AdminUser() who: SessionPayload,
  ) {
    return { data: await this.adminInquiryDefaultService.update(id, dto, who) };
  }

  @Delete(':id')
  @HttpCode(200)
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @AdminUser() who: SessionPayload,
  ) {
    await this.adminInquiryDefaultService.remove(id, who);
    return { ok: true };
  }
}
