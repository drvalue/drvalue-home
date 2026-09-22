import { Module } from '@nestjs/common';
import { RevisionModule } from '../../common/revision/revision.module';
import { AdminAuthModule } from '../admin-auth/admin-auth.module';
import { AdminMenuDefaultController } from './controller/admin-menu-default.controller';
import { MenuDefaultController } from './controller/menu-default.controller';
import { MenuItemDefaultRepository } from './repository/menu-item-default.repository';
import { MenuDefaultService } from './service/menu-default.service';

/** 사이트 메뉴(E9). 공개 읽기(`/api/content/menu`)와 관리(`/api/admin/menu`)가 같은 서비스를 쓴다. */
@Module({
  imports: [AdminAuthModule, RevisionModule],
  controllers: [MenuDefaultController, AdminMenuDefaultController],
  providers: [MenuItemDefaultRepository, MenuDefaultService],
})
export class MenuModule {}
