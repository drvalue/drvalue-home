import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { ITransactionContext } from '../../../common/typeorm/transaction-context';
import { TransactionContext } from '../../../common/typeorm/transaction-context.decorator';
import { ControllerPageDefaultPublicResponseDto } from '../dto/controller-page-default-response.dto';
import { ControllerPageDefaultLangQueryDto } from '../dto/controller-page-default.dto';
import { PageDefaultService } from '../service/page-default.service';

/** 공개 홈페이지가 부르는 페이지 글. 무인증. 없으면 404 — 화면은 코드의 글로 그린다. */
@ApiTags('Page Default - 공개 페이지 글')
@Controller('content/pages')
export class PageDefaultController {
  constructor(private readonly pageDefaultService: PageDefaultService) {}

  @Get(':key')
  @ApiOperation({
    operationId: 'pageDefaultGet',
    summary: '페이지 글(요청 언어, 없으면 기본 언어)',
  })
  @ApiOkResponse({ type: ControllerPageDefaultPublicResponseDto })
  async get(
    @TransactionContext() ctx: ITransactionContext,
    @Param('key') key: string,
    @Query() query: ControllerPageDefaultLangQueryDto,
  ): Promise<ControllerPageDefaultPublicResponseDto> {
    return this.pageDefaultService.findPublic(ctx, key, query.lang);
  }
}
