import { Controller, Get, Param, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { pipeline } from 'node:stream/promises';
import { ContentDefaultService } from '../service/content-default.service';

/**
 * 공개 홈페이지가 직접 부른다. 무인증.
 */
@Controller('content')
export class ContentDefaultController {
  constructor(private readonly contentDefaultService: ContentDefaultService) {}
  @Get('posts')
  async posts(
    @Query('board') board?: string,
    @Query('page') page?: string,
    @Query('q') q?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('lang') lang?: string,
    @Query('limit') limit?: string,
  ) {
    return this.contentDefaultService.findPosts({
      board,
      page,
      q,
      startDate,
      endDate,
      lang,
      limit,
    });
  }
  @Get('posts/:slug')
  async post(@Param('slug') slug: string, @Query('lang') lang?: string) {
    return this.contentDefaultService.findPost(slug, lang);
  }
  @Get('assets/:id')
  async asset(@Param('id') id: string, @Res() res: Response) {
    const file = await this.contentDefaultService.publicFile(id);
    res.setHeader('Content-Type', file.type);
    res.setHeader('Content-Length', String(file.size));
    // 파일 이름을 헤더에 싣지 않는다. 헤더 주입과 한글 깨짐이 같이 생긴다.
    res.setHeader('Content-Disposition', 'inline');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    await pipeline(this.contentDefaultService.stream(file.path), res);
  }
}
