import { Controller, Get, Param, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { Readable } from 'node:stream';
import type { ReadableStream as WebReadable } from 'node:stream/web';
import { pipeline } from 'node:stream/promises';
import { Public, SkipGatewaySignature } from '@drvalue-oss/iam-nestjs';
import { ContentDefaultService } from '../service/content-default.service';

/**
 * 공개 홈페이지가 직접 부른다. 게이트웨이를 거치지 않으므로 서명 검사를 뺀다
 * (`@Public()` 은 인증만 면제한다).
 */
@SkipGatewaySignature()
@Controller('content')
export class ContentDefaultController {
  constructor(private readonly contentDefaultService: ContentDefaultService) {}

  @Public()
  @Get('posts')
  async posts(
    @Query('board') board?: string,
    @Query('page') page?: string,
    @Query('q') q?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('lang') lang?: string,
  ) {
    return this.contentDefaultService.findPosts({
      board,
      page,
      q,
      startDate,
      endDate,
      lang,
    });
  }

  @Public()
  @Get('posts/:slug')
  async post(@Param('slug') slug: string, @Query('lang') lang?: string) {
    return this.contentDefaultService.findPost(slug, lang);
  }

  @Public()
  @Get('assets/:id')
  async asset(@Param('id') id: string, @Res() res: Response) {
    const up = await this.contentDefaultService.fetchFile(id);
    for (const h of [
      'content-type',
      'content-length',
      'last-modified',
      'etag',
    ]) {
      const v = up.headers.get(h);
      if (v) res.setHeader(h, v);
    }
    // 파일 이름을 헤더에 싣지 않는다. 헤더 주입과 한글 깨짐이 같이 생긴다.
    res.setHeader('Content-Disposition', 'inline');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    // pipeline 은 backpressure 를 지킨다. write 로 밀면 큰 파일에 메모리가 쌓인다.
    await pipeline(Readable.fromWeb(up.body as WebReadable), res);
  }
}
