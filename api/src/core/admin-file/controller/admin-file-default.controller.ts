import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Logger,
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
import {
  ApiBody,
  ApiConsumes,
  ApiCookieAuth,
  ApiOkResponse,
  ApiOperation,
  ApiProduces,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import {
  ApiDataResponse,
  ApiOkFlagResponse,
  ApiPageResponse,
} from '../../../common/response/api-response.decorator';
import type { SessionPayload } from '../../../common/session/session-token';
import type { ITransactionContext } from '../../../common/typeorm/transaction-context';
import { TransactionContext } from '../../../common/typeorm/transaction-context.decorator';
import {
  AdminSessionGuard,
  AdminUser,
} from '../../admin-auth/guard/admin-session.guard';
import { ControllerAdminFileDefaultResponseDto } from '../dto/controller-admin-file-default-response.dto';
import {
  ControllerAdminFileDefaultListQueryDto,
  ControllerAdminFileDefaultRemoveQueryDto,
  ControllerAdminFileDefaultUpdateDto,
  ControllerAdminFileDefaultUploadDto,
} from '../dto/controller-admin-file-default.dto';
import {
  AdminFileDefaultService,
  MAX_UPLOAD,
} from '../service/admin-file-default.service';

/**
 * 관리 화면의 파일(미디어). 목록 · 올리기 · 이름 · 미리보기 · 지우기.
 * 공개 배포는 /api/content/assets 가 관문(공개된 곳이 가리키나)을 두고 한다.
 * 역할 제한 없음 — 채용공고(인사)도 그림을 올린다.
 * 웹은 목록·올리기를 rewrite 대신 route handler 로 흘려보낸다(본문 10MB 자름 — web/app/api/admin/files).
 */
@ApiTags('Admin File Default - 관리 화면 미디어')
@ApiCookieAuth('dv_admin')
@UseGuards(AdminSessionGuard)
@Controller('admin/files')
export class AdminFileDefaultController {
  private readonly logger = new Logger(AdminFileDefaultController.name);

  constructor(
    private readonly adminFileDefaultService: AdminFileDefaultService,
  ) {}

  @Get()
  @ApiOperation({
    operationId: 'adminFileDefaultList',
    summary: '파일 목록(최신순, 한 쪽 40개, 쓰는 곳의 수)',
  })
  @ApiPageResponse(ControllerAdminFileDefaultResponseDto)
  async list(
    @TransactionContext() ctx: ITransactionContext,
    @Query() query: ControllerAdminFileDefaultListQueryDto,
  ) {
    return this.adminFileDefaultService.list(ctx, query);
  }

  @Post()
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: MAX_UPLOAD } }),
  )
  @ApiOperation({
    operationId: 'adminFileDefaultUpload',
    summary: '파일 올리기(그림·PDF 20MB · 영상 200MB)',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: { type: 'string', format: 'binary' },
        title: { type: 'string', maxLength: 255 },
      },
    },
  })
  @ApiDataResponse(ControllerAdminFileDefaultResponseDto, { status: 201 })
  async upload(
    @TransactionContext() ctx: ITransactionContext,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() dto: ControllerAdminFileDefaultUploadDto,
    @AdminUser() who: SessionPayload,
  ): Promise<{ data: ControllerAdminFileDefaultResponseDto }> {
    const data = await this.adminFileDefaultService.upload(
      ctx,
      file,
      dto.title,
      who,
    );
    this.logger.log(`파일 올림 id=${data.id} type=${data.type}`);
    return { data };
  }

  @Get(':id')
  @ApiOperation({
    operationId: 'adminFileDefaultPreview',
    summary: '관리 화면 미리보기(원본)',
  })
  @ApiProduces('application/octet-stream')
  @ApiOkResponse({
    description: '파일 원본',
    schema: { type: 'string', format: 'binary' },
  })
  async preview(
    @TransactionContext() ctx: ITransactionContext,
    @Param('id') id: string,
    @Res() res: Response,
  ): Promise<void> {
    const file = await this.adminFileDefaultService.preview(ctx, id);
    res.setHeader('Content-Type', file.type);
    res.setHeader('Content-Disposition', 'inline');
    res.setHeader('Cache-Control', 'private, max-age=300');
    res.sendFile(file.path);
  }

  @Patch(':id')
  @ApiOperation({
    operationId: 'adminFileDefaultRename',
    summary: '보이는 이름 바꾸기',
  })
  @ApiDataResponse(ControllerAdminFileDefaultResponseDto)
  async rename(
    @TransactionContext() ctx: ITransactionContext,
    @Param('id') id: string,
    @Body() dto: ControllerAdminFileDefaultUpdateDto,
    @AdminUser() who: SessionPayload,
  ): Promise<{ data: ControllerAdminFileDefaultResponseDto }> {
    const data = await this.adminFileDefaultService.rename(
      ctx,
      id,
      dto.title,
      who,
    );
    this.logger.log(`파일 이름 바꿈 id=${id}`);
    return { data };
  }

  @Delete(':id')
  @HttpCode(200)
  @ApiOperation({
    operationId: 'adminFileDefaultRemove',
    summary: '지우기(쓰는 중이면 409, force=1 이면 빼고 지움)',
  })
  @ApiOkFlagResponse()
  async remove(
    @TransactionContext() ctx: ITransactionContext,
    @Param('id') id: string,
    @Query() query: ControllerAdminFileDefaultRemoveQueryDto,
    @AdminUser() who: SessionPayload,
  ): Promise<{ ok: true }> {
    const force = query.force === '1' || query.force === 'true';
    await this.adminFileDefaultService.remove(ctx, id, force, who);
    this.logger.log(`파일 지움 id=${id} force=${force}`);
    return { ok: true };
  }
}
