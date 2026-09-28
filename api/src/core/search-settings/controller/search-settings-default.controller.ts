import { Controller, Get, Logger } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiDataResponse } from '../../../common/response/api-response.decorator';
import type { ITransactionContext } from '../../../common/typeorm/transaction-context';
import { TransactionContext } from '../../../common/typeorm/transaction-context.decorator';
import { ControllerSearchSettingsPublicResponseDto } from '../dto/controller-search-settings-default-response.dto';
import { SearchSettingsDefaultService } from '../service/search-settings-default.service';

/**
 * 공개 사이트가 읽는 검색엔진 설정 — robots.txt 의 AI 스위치와 머리 정보의 소유 확인 코드. 무인증이다:
 * 확인 코드는 모든 장의 <head> 에, 스위치는 robots.txt 에 그대로 나가는 공개 값이다. 화면은 1분 캐시로 읽는다
 * (web/lib/search-settings.ts). IndexNow 키와 보내기 기록은 여기 없다.
 */
@ApiTags('Search Settings Default - 공개 검색엔진 설정')
@Controller('content/search-settings')
export class SearchSettingsDefaultController {
  private readonly logger = new Logger(SearchSettingsDefaultController.name);

  constructor(
    private readonly searchSettingsDefaultService: SearchSettingsDefaultService,
  ) {}

  @Get()
  @ApiOperation({
    operationId: 'searchSettingsDefaultPublicGet',
    summary: '확인 코드 · AI 스위치 · IndexNow 켜짐',
  })
  @ApiDataResponse(ControllerSearchSettingsPublicResponseDto)
  async get(
    @TransactionContext() ctx: ITransactionContext,
  ): Promise<{ data: ControllerSearchSettingsPublicResponseDto }> {
    this.logger.log('공개 검색엔진 설정');
    return { data: await this.searchSettingsDefaultService.publicGet(ctx) };
  }
}
