import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RevisionEntity } from '../entity/revision.entity';
import { RevisionRestoreRegistry } from './revision-restore.registry';
import { RevisionService } from './revision.service';

/** 변경 이력 기록기와 되돌리기 핸들러 모음. 여러 모듈이 가져가도 인스턴스는 하나다. */
@Module({
  imports: [TypeOrmModule.forFeature([RevisionEntity])],
  providers: [RevisionService, RevisionRestoreRegistry],
  exports: [RevisionService, RevisionRestoreRegistry],
})
export class RevisionModule {}
