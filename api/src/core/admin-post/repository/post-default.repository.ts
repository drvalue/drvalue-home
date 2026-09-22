import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PostFileEntity } from '../../../common/entity/post-file.entity';
import { PostTranslationEntity } from '../../../common/entity/post-translation.entity';
import { PostEntity } from '../../../common/entity/post.entity';

@Injectable()
export class PostDefaultRepository {
  constructor(
    @InjectRepository(PostEntity) readonly repository: Repository<PostEntity>,
    @InjectRepository(PostTranslationEntity)
    readonly translations: Repository<PostTranslationEntity>,
    @InjectRepository(PostFileEntity)
    readonly files: Repository<PostFileEntity>,
  ) {}

  findOneFull(id: number): Promise<PostEntity | null> {
    return this.repository.findOne({
      where: { id },
      relations: { translations: true, files: { file: true } },
      order: { files: { id: 'ASC' } },
    });
  }

  findBySlug(slug: string): Promise<PostEntity | null> {
    return this.repository.findOne({ where: { slug } });
  }
}
