import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Logger,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  ApiDataResponse,
  ApiDataStringsResponse,
  ApiOkFlagResponse,
} from '../../../common/response/api-response.decorator';
import type { SessionPayload } from '../../../common/session/session-token';
import type { ITransactionContext } from '../../../common/typeorm/transaction-context';
import { TransactionContext } from '../../../common/typeorm/transaction-context.decorator';
import {
  AdminSessionGuard,
  AdminUser,
} from '../../admin-auth/guard/admin-session.guard';
import {
  ControllerAdminPostDefaultDetailResponseDto,
  ControllerAdminPostDefaultPageResponseDto,
} from '../dto/controller-admin-post-default-response.dto';
import {
  ControllerAdminPostDefaultListQueryDto,
  ControllerAdminPostDefaultReorderDto,
  ControllerAdminPostDefaultSaveDto,
} from '../dto/controller-admin-post-default.dto';
import { AdminPostDefaultService } from '../service/admin-post-default.service';

/**
 * 관리 화면의 글 CRUD. 세션 뒤. 응답은 `{ data }` · 목록 `{ data, total, page, pageSize }` ·
 * 지우기·순서 `{ ok: true }` — bmes 의 successResponse 로 감싸지 않는다(웹이 이 모양을 읽는다).
 */
@ApiTags('Admin Post Default - 관리 화면 글')
@ApiCookieAuth('dv_admin')
@UseGuards(AdminSessionGuard)
@Controller('admin/posts')
export class AdminPostDefaultController {
  private readonly logger = new Logger(AdminPostDefaultController.name);

  constructor(
    private readonly adminPostDefaultService: AdminPostDefaultService,
  ) {}

  @Get()
  @ApiOperation({
    operationId: 'adminPostDefaultList',
    summary: '글 목록(한 쪽 30개)',
  })
  @ApiOkResponse({ type: ControllerAdminPostDefaultPageResponseDto })
  async list(
    @TransactionContext() ctx: ITransactionContext,
    @Query() query: ControllerAdminPostDefaultListQueryDto,
    @AdminUser() who: SessionPayload,
  ): Promise<ControllerAdminPostDefaultPageResponseDto> {
    this.logger.log(
      `글 목록 board=${query.board ?? '*'} page=${query.page ?? 1}`,
    );
    return this.adminPostDefaultService.list(ctx, query, who);
  }

  @Get('category-labels')
  @ApiOperation({
    operationId: 'adminPostDefaultCategoryLabels',
    summary: '수행실적 「구분」에 쓴 값',
  })
  @ApiDataStringsResponse()
  async categoryLabels(
    @TransactionContext() ctx: ITransactionContext,
  ): Promise<{ data: string[] }> {
    return { data: await this.adminPostDefaultService.categoryLabels(ctx) };
  }

  @Get('faq-categories')
  @ApiOperation({
    operationId: 'adminPostDefaultFaqCategories',
    summary: 'FAQ 「분류」에 쓴 값',
  })
  @ApiDataStringsResponse()
  async faqCategories(
    @TransactionContext() ctx: ITransactionContext,
  ): Promise<{ data: string[] }> {
    return { data: await this.adminPostDefaultService.faqCategories(ctx) };
  }

  @Get(':id')
  @ApiOperation({ operationId: 'adminPostDefaultGet', summary: '글 하나' })
  @ApiDataResponse(ControllerAdminPostDefaultDetailResponseDto)
  async get(
    @TransactionContext() ctx: ITransactionContext,
    @Param('id', ParseIntPipe) id: number,
    @AdminUser() who: SessionPayload,
  ): Promise<{ data: ControllerAdminPostDefaultDetailResponseDto }> {
    return { data: await this.adminPostDefaultService.get(ctx, id, who) };
  }

  @Post()
  @ApiOperation({ operationId: 'adminPostDefaultCreate', summary: '글 만들기' })
  @ApiDataResponse(ControllerAdminPostDefaultDetailResponseDto, {
    status: 201,
  })
  async create(
    @TransactionContext() ctx: ITransactionContext,
    @Body() dto: ControllerAdminPostDefaultSaveDto,
    @AdminUser() who: SessionPayload,
  ): Promise<{ data: ControllerAdminPostDefaultDetailResponseDto }> {
    const data = await this.adminPostDefaultService.create(ctx, dto, who);
    this.logger.log(`글 만듦 id=${data.id} board=${data.board}`);
    return { data };
  }

  @Put(':id')
  @ApiOperation({ operationId: 'adminPostDefaultUpdate', summary: '글 고치기' })
  @ApiDataResponse(ControllerAdminPostDefaultDetailResponseDto)
  async update(
    @TransactionContext() ctx: ITransactionContext,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ControllerAdminPostDefaultSaveDto,
    @AdminUser() who: SessionPayload,
  ): Promise<{ data: ControllerAdminPostDefaultDetailResponseDto }> {
    const data = await this.adminPostDefaultService.update(ctx, id, dto, who);
    this.logger.log(`글 고침 id=${id} board=${data.board}`);
    return { data };
  }

  @Delete(':id')
  @HttpCode(200)
  @ApiOperation({ operationId: 'adminPostDefaultRemove', summary: '글 지우기' })
  @ApiOkFlagResponse()
  async remove(
    @TransactionContext() ctx: ITransactionContext,
    @Param('id', ParseIntPipe) id: number,
    @AdminUser() who: SessionPayload,
  ): Promise<{ ok: true }> {
    await this.adminPostDefaultService.remove(ctx, id, who);
    this.logger.log(`글 지움 id=${id}`);
    return { ok: true };
  }

  @Post('reorder')
  @HttpCode(200)
  @ApiOperation({
    operationId: 'adminPostDefaultReorder',
    summary: '순서 바꾸기(sort = 1..n)',
  })
  @ApiOkFlagResponse()
  async reorder(
    @TransactionContext() ctx: ITransactionContext,
    @Body() dto: ControllerAdminPostDefaultReorderDto,
    @AdminUser() who: SessionPayload,
  ): Promise<{ ok: true }> {
    await this.adminPostDefaultService.reorder(ctx, dto.ids, who);
    this.logger.log(`글 순서 ${dto.ids.length}개`);
    return { ok: true };
  }
}
