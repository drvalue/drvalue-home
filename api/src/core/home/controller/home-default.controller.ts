import { Controller, Get, Logger, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiDataResponse } from '../../../common/response/api-response.decorator';
import type { ITransactionContext } from '../../../common/typeorm/transaction-context';
import { TransactionContext } from '../../../common/typeorm/transaction-context.decorator';
import { ControllerHomeDefaultPublicResponseDto } from '../dto/controller-home-default-response.dto';
import { ControllerHomeDefaultQueryDto } from '../dto/controller-home-default.dto';
import { HomeDefaultService } from '../service/home-default.service';

/**
 * 공개 메인 설정. 무인증 — 메인이 요청마다 읽는다. 살아 있는 배너 하나와 팝업들만 나간다.
 * 응답 `{ data: { banner, popups }, language }`.
 */
@ApiTags('Home Default - 공개 메인 배너·팝업')
@Controller('content/home')
export class HomeDefaultController {
  private readonly logger = new Logger(HomeDefaultController.name);

  constructor(private readonly homeDefaultService: HomeDefaultService) {}

  @Get()
  @ApiOperation({
    operationId: 'homeDefaultFind',
    summary: '지금 살아 있는 배너 하나와 팝업들',
  })
  @ApiDataResponse(ControllerHomeDefaultPublicResponseDto, { language: true })
  async find(
    @TransactionContext() ctx: ITransactionContext,
    @Query() query: ControllerHomeDefaultQueryDto,
  ): Promise<{
    data: ControllerHomeDefaultPublicResponseDto;
    language: string;
  }> {
    this.logger.log(`공개 메인 lang=${query.lang ?? 'ko-KR'}`);
    return this.homeDefaultService.findPublic(ctx, query.lang);
  }
}
