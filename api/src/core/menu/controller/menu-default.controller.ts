import { Controller, Get, Logger, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { ITransactionContext } from '../../../common/typeorm/transaction-context';
import { TransactionContext } from '../../../common/typeorm/transaction-context.decorator';
import { ControllerMenuDefaultPublicTreeResponseDto } from '../dto/controller-menu-default-response.dto';
import { ControllerMenuDefaultQueryDto } from '../dto/controller-menu-default.dto';
import { MenuDefaultService } from '../service/menu-default.service';

/**
 * 공개 메뉴. 무인증 — 모든 장의 머리글이 읽는다. 보이는 칸만 나간다.
 * 응답 `{ data: { top, footer }, language }` — 공개 글 목록(`/api/content/posts`)과 같은 모양.
 */
@ApiTags('Menu Default - 공개 메뉴')
@Controller('content/menu')
export class MenuDefaultController {
  private readonly logger = new Logger(MenuDefaultController.name);

  constructor(private readonly menuDefaultService: MenuDefaultService) {}

  @Get()
  @ApiOperation({
    operationId: 'menuDefaultFind',
    summary: '공개 메뉴(상단·하단)',
  })
  @ApiOkResponse({ type: ControllerMenuDefaultPublicTreeResponseDto })
  async find(
    @TransactionContext() ctx: ITransactionContext,
    @Query() query: ControllerMenuDefaultQueryDto,
  ): Promise<{
    data: ControllerMenuDefaultPublicTreeResponseDto;
    language: string;
  }> {
    this.logger.log(`공개 메뉴 lang=${query.lang ?? 'ko-KR'}`);
    return this.menuDefaultService.findPublic(ctx, query.lang);
  }
}
