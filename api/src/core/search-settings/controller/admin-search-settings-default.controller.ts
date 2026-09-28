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
import { ControllerSearchSettingsDefaultResponseDto } from '../dto/controller-search-settings-default-response.dto';
import { ControllerSearchSettingsDefaultSaveDto } from '../dto/controller-search-settings-default.dto';
import { SearchSettingsDefaultService } from '../service/search-settings-default.service';

/**
 * 관리 화면 「SEO › 검색엔진 설정」 — 소유 확인 코드 · AI 스위치 · IndexNow 상태. SEO 와 같은 범위다:
 * 전체 권한과 마케팅만(인사 403).
 */
@ApiTags('Admin Search Settings Default - 관리 화면 검색엔진 설정')
@ApiCookieAuth('dv_admin')
@UseGuards(AdminSessionGuard)
@AdminRoles('marketing')
@Controller('admin/search-settings')
export class AdminSearchSettingsDefaultController {
  private readonly logger = new Logger(
    AdminSearchSettingsDefaultController.name,
  );

  constructor(
    private readonly searchSettingsDefaultService: SearchSettingsDefaultService,
  ) {}

  @Get()
  @ApiOperation({
    operationId: 'adminSearchSettingsDefaultGet',
    summary: '검색엔진 설정 + IndexNow 켜짐·최근 보내기',
  })
  @ApiDataResponse(ControllerSearchSettingsDefaultResponseDto)
  async get(
    @TransactionContext() ctx: ITransactionContext,
  ): Promise<{ data: ControllerSearchSettingsDefaultResponseDto }> {
    this.logger.log('검색엔진 설정 읽기');
    return { data: await this.searchSettingsDefaultService.get(ctx) };
  }

  @Put()
  @ApiOperation({
    operationId: 'adminSearchSettingsDefaultSave',
    summary: '검색엔진 설정 저장(통째로)',
  })
  @ApiDataResponse(ControllerSearchSettingsDefaultResponseDto)
  async save(
    @TransactionContext() ctx: ITransactionContext,
    @Body() dto: ControllerSearchSettingsDefaultSaveDto,
    @AdminUser() who: SessionPayload,
  ): Promise<{ data: ControllerSearchSettingsDefaultResponseDto }> {
    this.logger.log('검색엔진 설정 저장');
    return {
      data: await this.searchSettingsDefaultService.save(ctx, dto, who),
    };
  }
}
