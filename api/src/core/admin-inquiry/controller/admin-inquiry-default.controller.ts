import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Logger,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  ApiDataListResponse,
  ApiDataResponse,
  ApiOkFlagResponse,
  ApiPageResponse,
} from '../../../common/response/api-response.decorator';
import type { SessionPayload } from '../../../common/session/session-token';
import type { ITransactionContext } from '../../../common/typeorm/transaction-context';
import { TransactionContext } from '../../../common/typeorm/transaction-context.decorator';
import {
  AdminSessionGuard,
  AdminUser,
} from '../../admin-auth/guard/admin-session.guard';
import { AdminRoles } from '../../admin-auth/guard/roles.decorator';
import {
  ControllerAdminInquiryAssigneeResponseDto,
  ControllerAdminInquiryDefaultResponseDto,
} from '../dto/controller-admin-inquiry-default-response.dto';
import {
  ControllerAdminInquiryDefaultListQueryDto,
  ControllerAdminInquiryDefaultUpdateDto,
} from '../dto/controller-admin-inquiry-default.dto';
import { AdminInquiryDefaultService } from '../service/admin-inquiry-default.service';

/**
 * 문의 목록 · 담당자 · 메모 · 상태. 접수 자체는 공개 API(/api/inquiry)가 한다.
 * 인사(hr)는 문의를 볼 일이 없다 — 마케팅·관리자만.
 */
@ApiTags('Admin Inquiry Default - 관리 화면 문의')
@ApiCookieAuth('dv_admin')
@UseGuards(AdminSessionGuard)
@AdminRoles('marketing')
@Controller('admin/inquiries')
export class AdminInquiryDefaultController {
  private readonly logger = new Logger(AdminInquiryDefaultController.name);

  constructor(
    private readonly adminInquiryDefaultService: AdminInquiryDefaultService,
  ) {}

  @Get()
  @ApiOperation({
    operationId: 'adminInquiryDefaultList',
    summary: '문의 목록(최신순, 한 쪽 30개)',
  })
  @ApiPageResponse(ControllerAdminInquiryDefaultResponseDto)
  async list(
    @TransactionContext() ctx: ITransactionContext,
    @Query() query: ControllerAdminInquiryDefaultListQueryDto,
    @AdminUser() who: SessionPayload,
  ) {
    return this.adminInquiryDefaultService.list(ctx, query, who);
  }

  @Get('assignees')
  @ApiOperation({
    operationId: 'adminInquiryDefaultAssignees',
    summary: '담당자로 고를 수 있는 사람',
  })
  @ApiDataListResponse(ControllerAdminInquiryAssigneeResponseDto)
  async assignees(
    @TransactionContext() ctx: ITransactionContext,
  ): Promise<{ data: ControllerAdminInquiryAssigneeResponseDto[] }> {
    return { data: await this.adminInquiryDefaultService.assignees(ctx) };
  }

  @Get(':id')
  @ApiOperation({ operationId: 'adminInquiryDefaultGet', summary: '문의 하나' })
  @ApiDataResponse(ControllerAdminInquiryDefaultResponseDto)
  async get(
    @TransactionContext() ctx: ITransactionContext,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ data: ControllerAdminInquiryDefaultResponseDto }> {
    return { data: await this.adminInquiryDefaultService.get(ctx, id) };
  }

  @Patch(':id')
  @ApiOperation({
    operationId: 'adminInquiryDefaultUpdate',
    summary: '상태·담당자·메모 고치기(보낸 칸만)',
  })
  @ApiDataResponse(ControllerAdminInquiryDefaultResponseDto)
  async update(
    @TransactionContext() ctx: ITransactionContext,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ControllerAdminInquiryDefaultUpdateDto,
    @AdminUser() who: SessionPayload,
  ): Promise<{ data: ControllerAdminInquiryDefaultResponseDto }> {
    const data = await this.adminInquiryDefaultService.update(
      ctx,
      id,
      dto,
      who,
    );
    this.logger.log(`문의 고침 id=${id} status=${data.status}`);
    return { data };
  }

  @Delete(':id')
  @HttpCode(200)
  @ApiOperation({
    operationId: 'adminInquiryDefaultRemove',
    summary: '문의 지우기',
  })
  @ApiOkFlagResponse()
  async remove(
    @TransactionContext() ctx: ITransactionContext,
    @Param('id', ParseIntPipe) id: number,
    @AdminUser() who: SessionPayload,
  ): Promise<{ ok: true }> {
    await this.adminInquiryDefaultService.remove(ctx, id, who);
    this.logger.log(`문의 지움 id=${id}`);
    return { ok: true };
  }
}
