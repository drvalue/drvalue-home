import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import type { SessionPayload } from '../../../common/session/session-token';
import {
  AdminSessionGuard,
  AdminUser,
} from '../../admin-auth/guard/admin-session.guard';
import { AdminRoles } from '../../admin-auth/guard/roles.decorator';
import { ControllerAdminUserDefaultUpdateDto } from '../dto/controller-admin-user-default.dto';
import { AdminUserDefaultService } from '../service/admin-user-default.service';

/** 권한 — 누가 무엇을 고칠 수 있나. 「전부」 범위만 본다. 사람 추가·삭제는 없다(IAM 이 정한다). */
@UseGuards(AdminSessionGuard)
@AdminRoles('admin')
@Controller('admin/users')
export class AdminUserDefaultController {
  constructor(
    private readonly adminUserDefaultService: AdminUserDefaultService,
  ) {}

  @Get()
  async list() {
    return { data: await this.adminUserDefaultService.list() };
  }

  @Patch(':email')
  async setRole(
    @Param('email') email: string,
    @Body() dto: ControllerAdminUserDefaultUpdateDto,
    @AdminUser() who: SessionPayload,
  ) {
    return {
      data: await this.adminUserDefaultService.setRole(email, dto.role, who),
    };
  }
}
