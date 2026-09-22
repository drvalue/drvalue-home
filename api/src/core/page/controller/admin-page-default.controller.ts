import {
  Body,
  Controller,
  Get,
  Logger,
  Param,
  Put,
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
import {
  ControllerPageDefaultDetailResponseDto,
  ControllerPageDefaultLangResponseDto,
  ControllerPageDefaultRowResponseDto,
} from '../dto/controller-page-default-response.dto';
import { ControllerPageDefaultSaveDto } from '../dto/controller-page-default.dto';
import { PageDefaultService } from '../service/page-default.service';

/**
 * 관리 화면의 페이지 글. 세션 뒤, 전체 권한·마케팅만(인사는 403).
 * 응답은 `{ data }` — bmes 의 successResponse 로 감싸지 않는다(웹이 이 모양을 읽는다).
 */
@ApiTags('Admin Page Default - 관리 화면 페이지 글')
@ApiCookieAuth('dv_admin')
@UseGuards(AdminSessionGuard)
@AdminRoles('marketing')
@Controller('admin/pages')
export class AdminPageDefaultController {
  private readonly logger = new Logger(AdminPageDefaultController.name);

  constructor(private readonly pageDefaultService: PageDefaultService) {}

  @Get()
  @ApiOperation({
    operationId: 'adminPageDefaultList',
    summary: '편집할 수 있는 페이지 목록',
  })
  @ApiDataListResponse(ControllerPageDefaultRowResponseDto)
  async list(
    @TransactionContext() ctx: ITransactionContext,
  ): Promise<{ data: ControllerPageDefaultRowResponseDto[] }> {
    return { data: await this.pageDefaultService.list(ctx) };
  }

  @Get(':key')
  @ApiOperation({
    operationId: 'adminPageDefaultGet',
    summary: '페이지 한 장 — 칸 구조와 언어별 글',
  })
  @ApiDataResponse(ControllerPageDefaultDetailResponseDto)
  async get(
    @TransactionContext() ctx: ITransactionContext,
    @Param('key') key: string,
  ): Promise<{ data: ControllerPageDefaultDetailResponseDto }> {
    return { data: await this.pageDefaultService.get(ctx, key) };
  }

  @Put(':key')
  @ApiOperation({
    operationId: 'adminPageDefaultSave',
    summary: '한 언어의 페이지 글 저장',
  })
  @ApiDataResponse(ControllerPageDefaultLangResponseDto)
  async save(
    @TransactionContext() ctx: ITransactionContext,
    @Param('key') key: string,
    @Body() dto: ControllerPageDefaultSaveDto,
    @AdminUser() who: SessionPayload,
  ): Promise<{ data: ControllerPageDefaultLangResponseDto }> {
    const data = await this.pageDefaultService.save(ctx, key, dto, who);
    this.logger.log(`페이지 저장 key=${key} lang=${dto.languages_code}`);
    return { data };
  }
}
