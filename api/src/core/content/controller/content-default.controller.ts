import { Controller, Get, Param, Query, Res } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiProduces,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { pipeline } from 'node:stream/promises';
import type { ITransactionContext } from '../../../common/typeorm/transaction-context';
import { TransactionContext } from '../../../common/typeorm/transaction-context.decorator';
import {
  ControllerContentDefaultPostDetailEnvelopeDto,
  ControllerContentDefaultPostListResponseDto,
} from '../dto/controller-content-default-response.dto';
import {
  ControllerContentDefaultPostQueryDto,
  ControllerContentDefaultPostsQueryDto,
} from '../dto/controller-content-default.dto';
import { ContentDefaultService } from '../service/content-default.service';

/**
 * 공개 홈페이지가 직접 부른다. 무인증. 응답은 `{ data, total, pageSize, language }` ·
 * 글 하나 `{ data, language }` — 옛 게시판 JS 와 웹(lib/cms.ts)이 이 모양을 읽는다.
 * 목록은 요청마다 불리므로 로그를 남기지 않는다.
 */
@ApiTags('Content Default - 공개 게시판·파일')
@Controller('content')
export class ContentDefaultController {
  constructor(private readonly contentDefaultService: ContentDefaultService) {}

  @Get('posts')
  @ApiOperation({
    operationId: 'contentDefaultPosts',
    summary: '공개 게시판 한 쪽(틀린 쿼리 값은 자르거나 무시)',
  })
  @ApiOkResponse({ type: ControllerContentDefaultPostListResponseDto })
  async posts(
    @TransactionContext() ctx: ITransactionContext,
    @Query() query: ControllerContentDefaultPostsQueryDto,
  ): Promise<ControllerContentDefaultPostListResponseDto> {
    return this.contentDefaultService.findPosts(ctx, query);
  }

  @Get('posts/:slug')
  @ApiOperation({
    operationId: 'contentDefaultPost',
    summary: '공개 글 하나(본문·첨부)',
  })
  @ApiOkResponse({ type: ControllerContentDefaultPostDetailEnvelopeDto })
  async post(
    @TransactionContext() ctx: ITransactionContext,
    @Param('slug') slug: string,
    @Query() query: ControllerContentDefaultPostQueryDto,
  ): Promise<ControllerContentDefaultPostDetailEnvelopeDto> {
    return this.contentDefaultService.findPost(ctx, slug, query.lang);
  }

  @Get('assets/:id')
  @ApiOperation({
    operationId: 'contentDefaultAsset',
    summary: '공개 파일 원본(공개된 곳이 가리키는 파일만)',
  })
  @ApiProduces('application/octet-stream')
  @ApiOkResponse({
    description: '파일 원본. Content-Type 은 올릴 때의 형식',
    schema: { type: 'string', format: 'binary' },
  })
  async asset(
    @TransactionContext() ctx: ITransactionContext,
    @Param('id') id: string,
    @Res() res: Response,
  ): Promise<void> {
    const file = await this.contentDefaultService.publicFile(ctx, id);
    res.setHeader('Content-Type', file.type);
    res.setHeader('Content-Length', String(file.size));
    // 파일 이름을 헤더에 싣지 않는다. 헤더 주입과 한글 깨짐이 같이 생긴다.
    res.setHeader('Content-Disposition', 'inline');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    await pipeline(file.stream, res);
  }
}
