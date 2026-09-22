import { Body, Controller, Get, Logger, Put, UseGuards } from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiDataResponse } from '../../../common/response/api-response.decorator';
import type { SessionPayload } from '../../../common/session/session-token';
import type { ITransactionContext } from '../../../common/typeorm/transaction-context';
import { TransactionContext } from '../../../common/typeorm/transaction-context.decorator';
import {
  AdminSessionGuard,
  AdminUser,
} from '../../admin-auth/guard/admin-session.guard';
import { AdminRoles } from '../../admin-auth/guard/roles.decorator';
import { ControllerMenuDefaultAdminTreeResponseDto } from '../dto/controller-menu-default-response.dto';
import { ControllerMenuDefaultSaveDto } from '../dto/controller-menu-default.dto';
import { MenuDefaultService } from '../service/menu-default.service';

/**
 * 관리 화면의 메뉴. 세션 뒤 · 전체 권한과 마케팅만(인사는 403).
 * 저장은 메뉴 전체를 한 번에 바꾼다. 응답 `{ data: { top, footer, updated_on } }`.
 */
@ApiTags('Admin Menu Default - 관리 화면 메뉴')
@ApiCookieAuth('dv_admin')
@UseGuards(AdminSessionGuard)
@AdminRoles('marketing')
@Controller('admin/menu')
export class AdminMenuDefaultController {
  private readonly logger = new Logger(AdminMenuDefaultController.name);

  constructor(private readonly menuDefaultService: MenuDefaultService) {}

  @Get()
  @ApiOperation({
    operationId: 'adminMenuDefaultFind',
    summary: '메뉴 전체(꺼진 칸 포함)',
  })
  @ApiDataResponse(ControllerMenuDefaultAdminTreeResponseDto)
  async find(
    @TransactionContext() ctx: ITransactionContext,
  ): Promise<{ data: ControllerMenuDefaultAdminTreeResponseDto }> {
    this.logger.log('관리 메뉴 읽기');
    return { data: await this.menuDefaultService.findAdmin(ctx) };
  }

  @Put()
  @ApiOperation({
    operationId: 'adminMenuDefaultSave',
    summary: '메뉴 전체 저장',
  })
  @ApiDataResponse(ControllerMenuDefaultAdminTreeResponseDto)
  async save(
    @TransactionContext() ctx: ITransactionContext,
    @Body() dto: ControllerMenuDefaultSaveDto,
    @AdminUser() who: SessionPayload,
  ): Promise<{ data: ControllerMenuDefaultAdminTreeResponseDto }> {
    this.logger.log(
      `메뉴 저장 top=${dto.top.length} footer=${dto.footer.length}`,
    );
    return { data: await this.menuDefaultService.save(ctx, dto, who) };
  }
}
