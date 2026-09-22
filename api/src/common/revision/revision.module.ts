import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RevisionEntity } from '../entity/revision.entity';
import { RevisionService } from './revision.service';

@Module({
  imports: [TypeOrmModule.forFeature([RevisionEntity])],
  providers: [RevisionService],
  exports: [RevisionService],
})
export class RevisionModule {}
