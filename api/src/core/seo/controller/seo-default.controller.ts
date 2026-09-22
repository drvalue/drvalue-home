import { Controller, Get, Logger, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { ITransactionContext } from '../../../common/typeorm/transaction-context';
import { TransactionContext } from '../../../common/typeorm/transaction-context.decorator';
import { ControllerSeoPublicPageResponseDto } from '../dto/controller-seo-default-response.dto';
import { SeoDefaultService } from '../service/seo-default.service';

/**
 * 공개 사이트가 읽는 정적 장의 검색 정보 덮어쓰기. 무인증 — 화면의 <head> 에 그대로 나가는 값이다.
 * 장 수만큼(수십 줄)이라 한 번에 준다. 화면은 1분 캐시로 읽는다(web/lib/seo.ts).
 */
@ApiTags('Seo Default - 공개 검색 정보')
@Controller('content/page-meta')
export class SeoDefaultController {
  private readonly logger = new Logger(SeoDefaultController.name);

  constructor(private readonly seoDefaultService: SeoDefaultService) {}

  @Get()
  @ApiOperation({
    operationId: 'seoDefaultPublicList',
    summary: '덮어쓴 장 전부(언어 하나로)',
  })
  @ApiOkResponse({ type: [ControllerSeoPublicPageResponseDto] })
  async list(
    @TransactionContext() ctx: ITransactionContext,
    @Query('lang') lang?: string,
  ): Promise<{ data: ControllerSeoPublicPageResponseDto[] }> {
    this.logger.log('공개 검색 정보');
    return { data: await this.seoDefaultService.publicList(ctx, lang) };
  }
}
