import {
  Body,
  Controller,
  Get,
  Logger,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  ApiDataListResponse,
  ApiDataResponse,
} from '../../../common/response/api-response.decorator';
import type { SessionPayload } from '../../../common/session/session-token';
import type { ITransactionContext } from '../../../common/typeorm/transaction-context';
import { TransactionContext } from '../../../common/typeorm/transaction-context.decorator';
import {
  AdminSessionGuard,
  AdminUser,
} from '../../admin-auth/guard/admin-session.guard';
import { AdminRoles } from '../../admin-auth/guard/roles.decorator';
import { ControllerAdminUserDefaultResponseDto } from '../dto/controller-admin-user-default-response.dto';
import { ControllerAdminUserDefaultUpdateDto } from '../dto/controller-admin-user-default.dto';
import { AdminUserDefaultService } from '../service/admin-user-default.service';

/** 권한 — 누가 무엇을 고칠 수 있나. 「전체 권한」 범위만 본다. 사람 추가·삭제는 없다(IAM 이 정한다). */
@ApiTags('Admin User Default - 관리 화면 권한')
@ApiCookieAuth('dv_admin')
@UseGuards(AdminSessionGuard)
@AdminRoles('admin')
@Controller('admin/users')
export class AdminUserDefaultController {
  private readonly logger = new Logger(AdminUserDefaultController.name);

  constructor(
    private readonly adminUserDefaultService: AdminUserDefaultService,
  ) {}

  @Get()
  @ApiOperation({ operationId: 'adminUserDefaultList', summary: '권한 목록' })
  @ApiDataListResponse(ControllerAdminUserDefaultResponseDto)
  async list(
    @TransactionContext() ctx: ITransactionContext,
  ): Promise<{ data: ControllerAdminUserDefaultResponseDto[] }> {
    return { data: await this.adminUserDefaultService.list(ctx) };
  }

  @Patch(':email')
  @ApiOperation({
    operationId: 'adminUserDefaultSetRole',
    summary: '고칠 수 있는 범위 바꾸기',
  })
  @ApiDataResponse(ControllerAdminUserDefaultResponseDto)
  async setRole(
    @TransactionContext() ctx: ITransactionContext,
    @Param('email') email: string,
    @Body() dto: ControllerAdminUserDefaultUpdateDto,
    @AdminUser() who: SessionPayload,
  ): Promise<{ data: ControllerAdminUserDefaultResponseDto }> {
    const data = await this.adminUserDefaultService.setRole(
      ctx,
      email,
      dto.role,
      who,
    );
    this.logger.log(`권한 범위 바꿈 role=${data.role}`);
    return { data };
  }
}
