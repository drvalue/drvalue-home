import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Public, SkipGatewaySignature } from '@drvalue-oss/iam-nestjs';
import { AdminSessionGuard } from '../../admin-auth/guard/admin-session.guard';
import {
  ControllerAdminPostDefaultReorderDto,
  ControllerAdminPostDefaultSaveDto,
} from '../dto/controller-admin-post-default.dto';
import { AdminPostDefaultService } from '../service/admin-post-default.service';

/** 관리 화면의 글 CRUD. 세션(또는 스크립트 토큰) 뒤. */
@SkipGatewaySignature()
@Public()
@UseGuards(AdminSessionGuard)
@Controller('admin/posts')
export class AdminPostDefaultController {
  constructor(
    private readonly adminPostDefaultService: AdminPostDefaultService,
  ) {}

  @Get()
  list(
    @Query('board') board?: string,
    @Query('q') q?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
  ) {
    return this.adminPostDefaultService.list({
      board,
      q,
      status,
      page: Number(page) || 1,
    });
  }

  @Get('category-labels')
  async categoryLabels() {
    return { data: await this.adminPostDefaultService.categoryLabels() };
  }

  @Get(':id')
  async get(@Param('id', ParseIntPipe) id: number) {
    return { data: await this.adminPostDefaultService.get(id) };
  }

  @Post()
  async create(@Body() dto: ControllerAdminPostDefaultSaveDto) {
    return { data: await this.adminPostDefaultService.create(dto) };
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ControllerAdminPostDefaultSaveDto,
  ) {
    return { data: await this.adminPostDefaultService.update(id, dto) };
  }

  @Delete(':id')
  @HttpCode(200)
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.adminPostDefaultService.remove(id);
    return { ok: true };
  }

  @Post('reorder')
  @HttpCode(200)
  async reorder(@Body() dto: ControllerAdminPostDefaultReorderDto) {
    await this.adminPostDefaultService.reorder(dto.ids);
    return { ok: true };
  }
}
