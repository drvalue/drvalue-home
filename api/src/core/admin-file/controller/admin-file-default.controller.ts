import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { AdminSessionGuard } from '../../admin-auth/guard/admin-session.guard';
import { AdminFileDefaultService } from '../service/admin-file-default.service';

/** 관리 화면의 파일. 올리기와 미리보기. 공개 배포는 /api/content/assets 가 관문을 두고 한다. */
@UseGuards(AdminSessionGuard)
@Controller('admin/files')
export class AdminFileDefaultController {
  constructor(
    private readonly adminFileDefaultService: AdminFileDefaultService,
  ) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: 20 * 1024 * 1024 } }),
  )
  async upload(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body('title') title?: string,
  ) {
    const row = await this.adminFileDefaultService.upload(file, title);
    return {
      data: {
        id: row.id,
        url: `/api/content/assets/${row.id}`,
        filename_download: row.filenameDownload,
        title: row.title,
        type: row.type,
        width: row.width,
        height: row.height,
      },
    };
  }

  @Get(':id')
  async preview(@Param('id') id: string, @Res() res: Response) {
    const row = await this.adminFileDefaultService.get(id);
    res.setHeader('Content-Type', row.type ?? 'application/octet-stream');
    res.setHeader('Content-Disposition', 'inline');
    res.setHeader('Cache-Control', 'private, max-age=300');
    return res.sendFile(this.adminFileDefaultService.diskPath(row));
  }

  @Delete(':id')
  @HttpCode(200)
  async remove(@Param('id') id: string) {
    await this.adminFileDefaultService.remove(id);
    return { ok: true };
  }
}
