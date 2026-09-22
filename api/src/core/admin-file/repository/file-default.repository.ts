import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FileEntity } from '../../../common/entity/file.entity';

@Injectable()
export class FileDefaultRepository {
  constructor(
    @InjectRepository(FileEntity) readonly repository: Repository<FileEntity>,
  ) {}

  findById(id: string): Promise<FileEntity | null> {
    return this.repository.findOne({ where: { id } });
  }
}
