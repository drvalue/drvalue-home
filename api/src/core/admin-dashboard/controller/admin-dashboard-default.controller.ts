import { Controller, Get, Logger, UseGuards } from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { SessionPayload } from '../../../common/session/session-token';
import type { ITransactionContext } from '../../../common/typeorm/transaction-context';
import { TransactionContext } from '../../../common/typeorm/transaction-context.decorator';
import {
  AdminSessionGuard,
  AdminUser,
} from '../../admin-auth/guard/admin-session.guard';
import { ControllerAdminDashboardDefaultResponseDto } from '../dto/controller-admin-dashboard-default-response.dto';
import { AdminDashboardDefaultService } from '../service/admin-dashboard-default.service';

/** 관리 화면 홈 요약. 세션 뒤, 범위마다 보이는 칸이 다르다(서비스가 가린다). 응답은 `{ data }`. */
@ApiTags('Admin Dashboard Default - 관리 화면 홈')
@ApiCookieAuth('dv_admin')
@UseGuards(AdminSessionGuard)
@Controller('admin/dashboard')
export class AdminDashboardDefaultController {
  private readonly logger = new Logger(AdminDashboardDefaultController.name);

  constructor(
    private readonly adminDashboardDefaultService: AdminDashboardDefaultService,
  ) {}

  @Get()
  @ApiOperation({
    operationId: 'adminDashboardDefaultSummary',
    summary: '홈 요약(새 문의·내 담당·초안·예약·최근 변경)',
  })
  @ApiOkResponse({ type: ControllerAdminDashboardDefaultResponseDto })
  async summary(
    @TransactionContext() ctx: ITransactionContext,
    @AdminUser() who: SessionPayload,
  ): Promise<{ data: ControllerAdminDashboardDefaultResponseDto }> {
    this.logger.log(`홈 요약 role=${who.role ?? '-'}`);
    return { data: await this.adminDashboardDefaultService.summary(ctx, who) };
  }
}
