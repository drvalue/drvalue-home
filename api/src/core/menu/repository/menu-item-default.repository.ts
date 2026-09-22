import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { MenuItemEntity } from '../../../common/entity/menu-item.entity';
import type { MenuLocation } from '../../../common/entity/menu-item.entity';
import { BaseRepository } from '../../../common/typeorm/base.repository';
import type { ITransactionContext } from '../../../common/typeorm/transaction-context';

/** 새로 넣을 한 칸. 이름은 언어별로 붙는다(cascade). */
export interface MenuItemInsert {
  location: MenuLocation;
  parentId: number | null;
  sort: number;
  href: string;
  visible: boolean;
  hiddenInDropdown: boolean;
  match: string[] | null;
  translations: {
    languagesCode: string;
    label: string;
    description: string | null;
  }[];
}

@Injectable()
export class MenuItemDefaultRepository extends BaseRepository<MenuItemEntity> {
  override repository(ctx: ITransactionContext): Repository<MenuItemEntity> {
    return super.repository(ctx, MenuItemEntity);
  }

  /** 메뉴 칸 전부(상단·하단, 꺼진 칸 포함)와 언어별 이름. 나무 모양은 응답 DTO 가 만든다. */
  findAllWithTranslations(ctx: ITransactionContext): Promise<MenuItemEntity[]> {
    return this.repository(ctx).find({
      relations: { translations: true },
      order: { location: 'ASC', sort: 'ASC', id: 'ASC' },
    });
  }

  /** 전부 지운다. 이름은 FK(ON DELETE CASCADE)로 같이 지워진다. 저장이 통째로 바꾸는 방식이라서다. */
  async deleteAll(ctx: ITransactionContext): Promise<void> {
    await this.repository(ctx)
      .createQueryBuilder()
      .delete()
      .from(MenuItemEntity)
      .execute();
  }

  /** 한 칸을 넣고 id 를 돌려준다(하위가 부모 id 를 받는다). */
  async insertOne(
    ctx: ITransactionContext,
    input: MenuItemInsert,
  ): Promise<number> {
    const repo = this.repository(ctx);
    const saved = await repo.save(
      repo.create({
        location: input.location,
        parentId: input.parentId,
        sort: input.sort,
        href: input.href,
        visible: input.visible,
        hiddenInDropdown: input.hiddenInDropdown,
        match: input.match,
        translations: input.translations,
      }),
    );
    return saved.id;
  }
}
