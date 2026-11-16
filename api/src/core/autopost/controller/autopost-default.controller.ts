import {
  Body,
  Controller,
  Get,
  HttpCode,
  Logger,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { ApiDataResponse } from '../../../common/response/api-response.decorator';
import type { ITransactionContext } from '../../../common/typeorm/transaction-context';
import { TransactionContext } from '../../../common/typeorm/transaction-context.decorator';
import type { Picture } from '../client/autopost-claude.client';
import { ControllerAutopostDefaultBundleDto } from '../dto/controller-autopost-default.dto';
import {
  ControllerAutopostDefaultBundleResponseDto,
  ControllerAutopostDefaultRulesResponseDto,
} from '../dto/controller-autopost-default-response.dto';
import { AutopostTokenGuard } from '../guard/autopost-token.guard';
import type { Article } from '../model/article';
import { AutopostDefaultService } from '../service/autopost-default.service';

/**
 * 바깥(사람 기계의 예약 실행)에서 만든 자동 글을 받는 입구. 사람이 아니라 프로그램이 부른다 — 관리 화면의 문(IAM 세션)이 아니라
 * 토큰(`Authorization: Bearer`)이 문이다(결정 0021). 서버에 토큰이 없으면 전부 401 로 닫힌다.
 * **여기로 들어온 글은 사람 검수 없이 뉴스 게시판에 공개된다.** 판정은 보낸 쪽이 이미 했다고 믿고, 코드 검사만 다시 돌린다.
 * 속도 제한을 토큰 검사보다 먼저 건다 — 틀린 토큰을 계속 넣어 보는 것도 IP 당 분 5회 · 시 30회에 걸린다.
 */
@ApiTags('Autopost Default - 자동 글 묶음 받기')
@ApiBearerAuth()
@UseGuards(ThrottlerGuard, AutopostTokenGuard)
@Controller('autopost')
export class AutopostDefaultController {
  private readonly logger = new Logger(AutopostDefaultController.name);

  constructor(
    private readonly autopostDefaultService: AutopostDefaultService,
  ) {}

  @Get('rules')
  @ApiOperation({
    operationId: 'autopostDefaultRules',
    summary: '글을 쓰는 쪽이 읽는 주제 기준·이미 다룬 글·규칙·구조',
  })
  @ApiDataResponse(ControllerAutopostDefaultRulesResponseDto)
  async rules(
    @TransactionContext() ctx: ITransactionContext,
  ): Promise<{ data: ControllerAutopostDefaultRulesResponseDto }> {
    this.logger.log('자동 글 규칙 읽기');
    return {
      data: ControllerAutopostDefaultRulesResponseDto.from(
        await this.autopostDefaultService.rules(ctx),
      ),
    };
  }

  @Post('bundle')
  @HttpCode(200)
  @ApiOperation({
    operationId: 'autopostDefaultPublishBundle',
    summary:
      '글 묶음을 공개한다(한 주에 한 편 · 이미 낸 출처 거절). 거절도 200 이고 outcome 으로 가른다',
  })
  @ApiDataResponse(ControllerAutopostDefaultBundleResponseDto)
  async publishBundle(
    @TransactionContext() ctx: ITransactionContext,
    @Body() dto: ControllerAutopostDefaultBundleDto,
  ): Promise<{ data: ControllerAutopostDefaultBundleResponseDto }> {
    const pictures: Picture[] = (dto.pictures ?? []).map((pic) => ({
      section: pic.section ?? null,
      mime: 'image/jpeg',
      bytes: Buffer.from(pic.data, 'base64'),
    }));
    const done = await this.autopostDefaultService.publishGiven(
      ctx,
      // 형은 서비스의 구조 검사가 본다(틀리면 거절 사유로 돌아간다).
      dto.article as unknown as Article,
      pictures,
    );
    this.logger.log(
      `자동 글 묶음 받기 outcome=${done.outcome} pictures=${done.pictures}`,
    );
    return { data: ControllerAutopostDefaultBundleResponseDto.from(done) };
  }
}
