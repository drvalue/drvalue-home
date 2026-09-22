import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import type { SessionPayload } from '../../../common/session/session-token';
import {
  AdminSessionGuard,
  AdminUser,
} from '../../admin-auth/guard/admin-session.guard';
import { ControllerAdminFileDefaultUpdateDto } from '../dto/controller-admin-file-default.dto';
import {
  AdminFileDefaultService,
  MAX_UPLOAD,
} from '../service/admin-file-default.service';

/**
 * 관리 화면의 파일(미디어). 목록 · 올리기 · 이름 · 미리보기 · 지우기.
 * 공개 배포는 /api/content/assets 가 관문(게시된 글이 참조하나)을 두고 한다.
 * 역할 제한 없음 — 채용공고(인사)도 그림을 올린다.
 */
@UseGuards(AdminSessionGuard)
@Controller('admin/files')
export class AdminFileDefaultController {
  constructor(
    private readonly adminFileDefaultService: AdminFileDefaultService,
  ) {}

  @Get()
  list(
    @Query('q') q?: string,
    @Query('type') type?: string,
    @Query('page') page?: string,
  ) {
    return this.adminFileDefaultService.list({
      q,
      type,
      page: Number(page) || 1,
    });
  }

  @Post()
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: MAX_UPLOAD } }),
  )
  async upload(
    @UploadedFile() file: Express.Multer.File | undefined,
    @AdminUser() who: SessionPayload,
    @Body('title') title?: string,
  ) {
    const row = await this.adminFileDefaultService.upload(file, title, who);
    return { data: this.adminFileDefaultService.view(row, 0) };
  }

  @Get(':id')
  async preview(@Param('id') id: string, @Res() res: Response) {
    const row = await this.adminFileDefaultService.get(id);
    res.setHeader('Content-Type', row.type ?? 'application/octet-stream');
    res.setHeader('Content-Disposition', 'inline');
    res.setHeader('Cache-Control', 'private, max-age=300');
    return res.sendFile(this.adminFileDefaultService.diskPath(row));
  }

  @Patch(':id')
  async rename(
    @Param('id') id: string,
    @Body() dto: ControllerAdminFileDefaultUpdateDto,
    @AdminUser() who: SessionPayload,
  ) {
    return {
      data: await this.adminFileDefaultService.rename(id, dto.title, who),
    };
  }

  @Delete(':id')
  @HttpCode(200)
  async remove(
    @Param('id') id: string,
    @AdminUser() who: SessionPayload,
    @Query('force') force?: string,
  ) {
    await this.adminFileDefaultService.remove(
      id,
      force === '1' || force === 'true',
      who,
    );
    return { ok: true };
  }
}
