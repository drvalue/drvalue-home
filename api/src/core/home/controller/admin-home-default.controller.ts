import { Body, Controller, Get, Logger, Put, UseGuards } from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiDataListResponse } from '../../../common/response/api-response.decorator';
import type { SessionPayload } from '../../../common/session/session-token';
import type { ITransactionContext } from '../../../common/typeorm/transaction-context';
import { TransactionContext } from '../../../common/typeorm/transaction-context.decorator';
import {
  AdminSessionGuard,
  AdminUser,
} from '../../admin-auth/guard/admin-session.guard';
import { AdminRoles } from '../../admin-auth/guard/roles.decorator';
import {
  ControllerHomeDefaultBannerResponseDto,
  ControllerHomeDefaultPopupResponseDto,
} from '../dto/controller-home-default-response.dto';
import {
  ControllerHomeDefaultBannerSaveDto,
  ControllerHomeDefaultPopupSaveDto,
} from '../dto/controller-home-default.dto';
import { HomeDefaultService } from '../service/home-default.service';

/**
 * 관리 화면의 메인 배너·팝업. 세션 뒤 · 전체 권한과 마케팅만(인사는 403).
 * 저장은 목록 전체를 한 번에 바꾼다. 응답 `{ data: [...] }`. 메인 글(문구·구역 차례)은 /api/admin/pages/home.
 */
@ApiTags('Admin Home Default - 관리 화면 메인 배너·팝업')
@ApiCookieAuth('dv_admin')
@UseGuards(AdminSessionGuard)
@AdminRoles('marketing')
@Controller('admin/home')
export class AdminHomeDefaultController {
  private readonly logger = new Logger(AdminHomeDefaultController.name);

  constructor(private readonly homeDefaultService: HomeDefaultService) {}

  @Get('banners')
  @ApiOperation({
    operationId: 'adminHomeDefaultFindBanners',
    summary: '배너 전부(꺼진 것·기간 밖 포함)',
  })
  @ApiDataListResponse(ControllerHomeDefaultBannerResponseDto)
  async findBanners(
    @TransactionContext() ctx: ITransactionContext,
  ): Promise<{ data: ControllerHomeDefaultBannerResponseDto[] }> {
    this.logger.log('메인 배너 읽기');
    return { data: await this.homeDefaultService.findBanners(ctx) };
  }

  @Put('banners')
  @ApiOperation({
    operationId: 'adminHomeDefaultSaveBanners',
    summary: '배너 전체 저장',
  })
  @ApiDataListResponse(ControllerHomeDefaultBannerResponseDto)
  async saveBanners(
    @TransactionContext() ctx: ITransactionContext,
    @Body() dto: ControllerHomeDefaultBannerSaveDto,
    @AdminUser() who: SessionPayload,
  ): Promise<{ data: ControllerHomeDefaultBannerResponseDto[] }> {
    this.logger.log(`메인 배너 저장 items=${dto.items.length}`);
    return { data: await this.homeDefaultService.saveBanners(ctx, dto, who) };
  }

  @Get('popups')
  @ApiOperation({
    operationId: 'adminHomeDefaultFindPopups',
    summary: '팝업 전부(꺼진 것·기간 밖 포함)',
  })
  @ApiDataListResponse(ControllerHomeDefaultPopupResponseDto)
  async findPopups(
    @TransactionContext() ctx: ITransactionContext,
  ): Promise<{ data: ControllerHomeDefaultPopupResponseDto[] }> {
    this.logger.log('메인 팝업 읽기');
    return { data: await this.homeDefaultService.findPopups(ctx) };
  }

  @Put('popups')
  @ApiOperation({
    operationId: 'adminHomeDefaultSavePopups',
    summary: '팝업 전체 저장',
  })
  @ApiDataListResponse(ControllerHomeDefaultPopupResponseDto)
  async savePopups(
    @TransactionContext() ctx: ITransactionContext,
    @Body() dto: ControllerHomeDefaultPopupSaveDto,
    @AdminUser() who: SessionPayload,
  ): Promise<{ data: ControllerHomeDefaultPopupResponseDto[] }> {
    this.logger.log(`메인 팝업 저장 items=${dto.items.length}`);
    return { data: await this.homeDefaultService.savePopups(ctx, dto, who) };
  }
}
