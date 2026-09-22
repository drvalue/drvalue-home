import {
  Controller,
  Get,
  HttpCode,
  Logger,
  Param,
  ParseIntPipe,
  Post,
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
  ApiDataListResponse,
  ApiDataResponse,
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
  ControllerAdminRevisionDefaultDetailResponseDto,
  ControllerAdminRevisionDefaultRestoreResponseDto,
  ControllerAdminRevisionDefaultRowResponseDto,
} from '../dto/controller-admin-revision-default-response.dto';
import { ControllerAdminRevisionDefaultListQueryDto } from '../dto/controller-admin-revision-default.dto';
import { AdminRevisionDefaultService } from '../service/admin-revision-default.service';

/**
 * 변경 이력. 전체 목록·되돌리기는 관리자만, 한 항목의 이력은 마케팅도(볼 수 있는 것만).
 * 인사는 이력을 못 본다.
 */
@ApiTags('Admin Revision Default - 관리 화면 변경 이력')
@ApiCookieAuth('dv_admin')
@UseGuards(AdminSessionGuard)
@Controller('admin/revisions')
export class AdminRevisionDefaultController {
  private readonly logger = new Logger(AdminRevisionDefaultController.name);

  constructor(
    private readonly adminRevisionDefaultService: AdminRevisionDefaultService,
  ) {}

  @Get()
  @AdminRoles('admin')
  @ApiOperation({
    operationId: 'adminRevisionDefaultList',
    summary: '전체 변경 이력(한 쪽 50줄)',
  })
  @ApiPageResponse(ControllerAdminRevisionDefaultRowResponseDto)
  list(
    @TransactionContext() ctx: ITransactionContext,
    @Query() query: ControllerAdminRevisionDefaultListQueryDto,
  ) {
    this.logger.log(
      `이력 목록 collection=${query.collection || '*'} page=${query.page ?? 1}`,
    );
    return this.adminRevisionDefaultService.list(ctx, query);
  }

  @Get('item/:collection/:id')
  @AdminRoles('marketing')
  @ApiOperation({
    operationId: 'adminRevisionDefaultItem',
    summary: '한 항목의 이력(최신순 100줄까지)',
  })
  @ApiDataListResponse(ControllerAdminRevisionDefaultRowResponseDto)
  async item(
    @TransactionContext() ctx: ITransactionContext,
    @Param('collection') collection: string,
    @Param('id') id: string,
    @AdminUser() who: SessionPayload,
  ): Promise<{ data: ControllerAdminRevisionDefaultRowResponseDto[] }> {
    this.logger.log(`항목 이력 ${collection}/${id}`);
    return {
      data: await this.adminRevisionDefaultService.item(
        ctx,
        collection,
        id,
        who,
      ),
    };
  }

  @Get(':id')
  @AdminRoles('marketing')
  @ApiOperation({
    operationId: 'adminRevisionDefaultGet',
    summary: '이력 한 건(바꾸기 전·뒤)',
  })
  @ApiDataResponse(ControllerAdminRevisionDefaultDetailResponseDto)
  async get(
    @TransactionContext() ctx: ITransactionContext,
    @Param('id', ParseIntPipe) id: number,
    @AdminUser() who: SessionPayload,
  ): Promise<{ data: ControllerAdminRevisionDefaultDetailResponseDto }> {
    this.logger.log(`이력 한 건 id=${id}`);
    return { data: await this.adminRevisionDefaultService.get(ctx, id, who) };
  }

  @Post(':id/restore')
  @HttpCode(200)
  @AdminRoles('admin')
  @ApiOperation({
    operationId: 'adminRevisionDefaultRestore',
    summary: '이 이력의 「바꾸기 전」으로 되돌리기',
  })
  @ApiOkResponse({ type: ControllerAdminRevisionDefaultRestoreResponseDto })
  restore(
    @TransactionContext() ctx: ITransactionContext,
    @Param('id', ParseIntPipe) id: number,
    @AdminUser() who: SessionPayload,
  ): Promise<ControllerAdminRevisionDefaultRestoreResponseDto> {
    this.logger.log(`되돌리기 id=${id}`);
    return this.adminRevisionDefaultService.restore(ctx, id, who);
  }
}
