import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { PostFileEntity } from '../../../common/entity/post-file.entity';
import { BaseRepository } from '../../../common/typeorm/base.repository';
import type { ITransactionContext } from '../../../common/typeorm/transaction-context';

@Injectable()
export class PostFileDefaultRepository extends BaseRepository<PostFileEntity> {
  override repository(ctx: ITransactionContext): Repository<PostFileEntity> {
    return super.repository(ctx, PostFileEntity);
  }

  /** 글의 첨부를 모두 뗀다(파일은 남는다). 고칠 때 새 목록으로 갈아 끼우기 전에 부른다. */
  async deleteByPost(ctx: ITransactionContext, postId: number): Promise<void> {
    await this.repository(ctx).delete({ post: { id: postId } });
  }
}
