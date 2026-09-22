import { Body, Controller, Logger, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { ApiOkFlagResponse } from '../../../common/response/api-response.decorator';
import type { ITransactionContext } from '../../../common/typeorm/transaction-context';
import { TransactionContext } from '../../../common/typeorm/transaction-context.decorator';
import { ControllerInquiryDefaultCreateDto } from '../dto/controller-inquiry-default.dto';
import { InquiryDefaultService } from '../service/inquiry-default.service';

/**
 * 공개 홈페이지가 직접 부른다. 무인증.
 * 속도 제한 가드는 여기에만 건다 — APP_GUARD 로 넣으면 게시판 조회까지 묶인다.
 * 응답은 `{ ok: true }` 뿐이다 — 어느 쪽(메일·DB)이 실패했는지 싣지 않는다.
 */
@ApiTags('Inquiry Default - 공개 문의 접수')
@UseGuards(ThrottlerGuard)
@Controller('inquiry')
export class InquiryDefaultController {
  private readonly logger = new Logger(InquiryDefaultController.name);

  constructor(private readonly inquiryDefaultService: InquiryDefaultService) {}

  @Post()
  @ApiOperation({
    operationId: 'inquiryDefaultCreate',
    summary: '문의 접수(메일 + DB, IP 당 분 5회 · 시 30회)',
  })
  @ApiOkFlagResponse({ status: 201 })
  async create(
    @TransactionContext() ctx: ITransactionContext,
    @Body() dto: ControllerInquiryDefaultCreateDto,
  ): Promise<{ ok: true }> {
    await this.inquiryDefaultService.create(ctx, dto);
    this.logger.log(`문의 접수 type=${dto.user_type}`);
    return { ok: true };
  }
}
