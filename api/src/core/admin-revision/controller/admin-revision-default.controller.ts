import {
  Controller,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import type { SessionPayload } from '../../../common/session/session-token';
import {
  AdminSessionGuard,
  AdminUser,
} from '../../admin-auth/guard/admin-session.guard';
import { AdminRoles } from '../../admin-auth/guard/roles.decorator';
import { AdminRevisionDefaultService } from '../service/admin-revision-default.service';

/**
 * 변경 이력. 전체 목록·되돌리기는 관리자만, 한 글의 이력은 마케팅도(자기 게시판만).
 * 인사는 이력을 못 본다.
 */
@UseGuards(AdminSessionGuard)
@Controller('admin/revisions')
export class AdminRevisionDefaultController {
  constructor(
    private readonly adminRevisionDefaultService: AdminRevisionDefaultService,
  ) {}

  @Get()
  @AdminRoles('admin')
  list(
    @Query('collection') collection?: string,
    @Query('actor') actor?: string,
    @Query('page') page?: string,
  ) {
    return this.adminRevisionDefaultService.list({
      collection: collection || undefined,
      actor: actor || undefined,
      page: Number(page) || 1,
    });
  }

  @Get('item/:collection/:id')
  @AdminRoles('marketing')
  item(
    @Param('collection') collection: string,
    @Param('id') id: string,
    @AdminUser() who: SessionPayload,
  ) {
    return this.adminRevisionDefaultService.item(collection, id, who);
  }

  @Get(':id')
  @AdminRoles('marketing')
  async get(
    @Param('id', ParseIntPipe) id: number,
    @AdminUser() who: SessionPayload,
  ) {
    return { data: await this.adminRevisionDefaultService.get(id, who) };
  }

  @Post(':id/restore')
  @HttpCode(200)
  @AdminRoles('admin')
  restore(
    @Param('id', ParseIntPipe) id: number,
    @AdminUser() who: SessionPayload,
  ) {
    return this.adminRevisionDefaultService.restore(id, who);
  }
}
