import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Logger,
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
import type { SessionPayload } from '../../../common/session/session-token';
import type { ITransactionContext } from '../../../common/typeorm/transaction-context';
import { TransactionContext } from '../../../common/typeorm/transaction-context.decorator';
import {
  AdminSessionGuard,
  AdminUser,
} from '../../admin-auth/guard/admin-session.guard';
import { AdminRoles } from '../../admin-auth/guard/roles.decorator';
import { ControllerSeoDefaultPageResponseDto } from '../dto/controller-seo-default-response.dto';
import {
  ControllerSeoDefaultPathQueryDto,
  ControllerSeoDefaultSaveDto,
} from '../dto/controller-seo-default.dto';
import { SeoDefaultService } from '../service/seo-default.service';

/**
 * 관리 화면 「SEO」 — 정적 장의 검색 제목·설명·공유 그림·색인 제외. 전체 권한과 마케팅만(인사 403).
 * 주소에 슬래시가 들어가서 장은 쿼리(`?path=`)로 고른다.
 */
@ApiTags('Admin Seo Default - 관리 화면 SEO')
@ApiCookieAuth('dv_admin')
@UseGuards(AdminSessionGuard)
@AdminRoles('marketing')
@Controller('admin/seo/pages')
export class AdminSeoDefaultController {
  private readonly logger = new Logger(AdminSeoDefaultController.name);

  constructor(private readonly seoDefaultService: SeoDefaultService) {}

  @Get()
  @ApiOperation({
    operationId: 'adminSeoDefaultList',
    summary: '덮어쓴 장 전부',
  })
  @ApiOkResponse({ type: [ControllerSeoDefaultPageResponseDto] })
  async list(
    @TransactionContext() ctx: ITransactionContext,
  ): Promise<{ data: ControllerSeoDefaultPageResponseDto[] }> {
    this.logger.log('SEO 목록');
    return { data: await this.seoDefaultService.list(ctx) };
  }

  @Put()
  @ApiOperation({
    operationId: 'adminSeoDefaultSave',
    summary: '한 장의 검색 설정 저장(없으면 만든다)',
  })
  @ApiOkResponse({ type: ControllerSeoDefaultPageResponseDto })
  async save(
    @TransactionContext() ctx: ITransactionContext,
    @Body() dto: ControllerSeoDefaultSaveDto,
    @AdminUser() who: SessionPayload,
  ): Promise<{ data: ControllerSeoDefaultPageResponseDto }> {
    this.logger.log(`SEO 저장 ${dto.path}`);
    return { data: await this.seoDefaultService.save(ctx, dto, who) };
  }

  @Delete()
  @HttpCode(200)
  @ApiOperation({
    operationId: 'adminSeoDefaultRemove',
    summary: '덮어쓰기 지우기(코드의 값으로 돌아간다)',
  })
  async remove(
    @TransactionContext() ctx: ITransactionContext,
    @Query() query: ControllerSeoDefaultPathQueryDto,
    @AdminUser() who: SessionPayload,
  ): Promise<{ ok: true }> {
    this.logger.log(`SEO 되돌리기 ${query.path}`);
    await this.seoDefaultService.remove(ctx, query.path, who);
    return { ok: true };
  }
}
