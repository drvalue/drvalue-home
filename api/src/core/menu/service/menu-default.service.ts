import { Injectable } from '@nestjs/common';
import { LANGUAGES } from '../../../common/entity/post-translation.entity';
import type { MenuLocation } from '../../../common/entity/menu-item.entity';
import { CommonError } from '../../../common/error/common-error';
import { ServiceException } from '../../../common/error/service-exception.decorator';
import { RevisionService } from '../../../common/revision/revision.service';
import type { SessionPayload } from '../../../common/session/session-token';
import type { ITransactionContext } from '../../../common/typeorm/transaction-context';
import { Transactional } from '../../../common/typeorm/transactional.decorator';
import {
  ControllerMenuDefaultAdminTreeResponseDto,
  ControllerMenuDefaultPublicTreeResponseDto,
} from '../dto/controller-menu-default-response.dto';
import {
  ControllerMenuDefaultChildDto,
  ControllerMenuDefaultLabelDto,
  ControllerMenuDefaultNodeDto,
  ControllerMenuDefaultSaveDto,
  isMatchPath,
} from '../dto/controller-menu-default.dto';
import { MenuError } from '../error/menu.error';
import { MenuItemDefaultRepository } from '../repository/menu-item-default.repository';

const DEFAULT_LANGUAGE = 'ko-KR';

/**
 * 사이트 메뉴(상단 대분류 + 하위 한 단, 하단 링크 한 줄).
 *
 * 규칙: 칸마다 한국어 이름 필수 · 한 칸에 같은 언어 두 번 금지 · 깊이 2(DTO 가 모양으로 막는다) ·
 * 「켜지는 주소」는 / 로 시작 · 저장은 메뉴 전체를 한 번에 바꾸고 변경 이력 한 줄과 한 트랜잭션.
 * 공개 읽기는 보이는 칸만, 한 언어로(없으면 한국어).
 */
@Injectable()
export class MenuDefaultService {
  constructor(
    private readonly menuItemDefaultRepository: MenuItemDefaultRepository,
    private readonly revisionService: RevisionService,
  ) {}

  /** 공개 메뉴. 헤더·현재 위치 줄·옆 차례표·바닥글이 읽는다. */
  @ServiceException({ errorCode: MenuError.GET_UNKNOWN })
  async findPublic(
    ctx: ITransactionContext,
    lang: string | undefined,
  ): Promise<{
    data: ControllerMenuDefaultPublicTreeResponseDto;
    language: string;
  }> {
    const language = lang ?? DEFAULT_LANGUAGE;
    const rows =
      await this.menuItemDefaultRepository.findAllWithTranslations(ctx);
    return {
      data: ControllerMenuDefaultPublicTreeResponseDto.from(rows, language),
      language,
    };
  }

  /** 관리 화면의 메뉴 전체(꺼진 칸·언어별 이름 포함). */
  @ServiceException({ errorCode: MenuError.GET_UNKNOWN })
  async findAdmin(
    ctx: ITransactionContext,
  ): Promise<ControllerMenuDefaultAdminTreeResponseDto> {
    const rows =
      await this.menuItemDefaultRepository.findAllWithTranslations(ctx);
    return ControllerMenuDefaultAdminTreeResponseDto.from(rows);
  }

  /**
   * 메뉴 전체를 바꾼다. 지금 것을 지우고 받은 순서대로 다시 넣는다(순서 = 배열 순서).
   * 바꾸기 전·뒤 전체를 변경 이력(collection `menu`, item `site`)에 남긴다.
   */
  @ServiceException({ errorCode: MenuError.SAVE_UNKNOWN })
  @Transactional()
  async save(
    ctx: ITransactionContext,
    dto: ControllerMenuDefaultSaveDto,
    who: SessionPayload,
  ): Promise<ControllerMenuDefaultAdminTreeResponseDto> {
    for (const node of dto.top) {
      this.assertNode(node);
      if (node.match?.some((m) => !isMatchPath(m)))
        throw CommonError.createByErrorCode(MenuError.BAD_MATCH);
      for (const child of node.children ?? []) this.assertNode(child);
    }
    for (const link of dto.footer) this.assertNode(link);

    const before = ControllerMenuDefaultAdminTreeResponseDto.from(
      await this.menuItemDefaultRepository.findAllWithTranslations(ctx),
    );
    await this.menuItemDefaultRepository.deleteAll(ctx);

    for (const [i, node] of dto.top.entries()) {
      const id = await this.insert(ctx, 'top', null, i + 1, node, {
        match: node.match?.length ? node.match : null,
        hiddenInDropdown: false,
      });
      for (const [j, child] of (node.children ?? []).entries())
        await this.insert(ctx, 'top', id, j + 1, child, {
          match: null,
          hiddenInDropdown: child.hidden_in_dropdown ?? false,
        });
    }
    for (const [i, link] of dto.footer.entries())
      await this.insert(ctx, 'footer', null, i + 1, link, {
        match: null,
        hiddenInDropdown: false,
      });

    const after = ControllerMenuDefaultAdminTreeResponseDto.from(
      await this.menuItemDefaultRepository.findAllWithTranslations(ctx),
    );
    await this.revisionService.record(
      {
        actor: who.email,
        action: 'update',
        collection: 'menu',
        itemId: 'site',
        before,
        after,
      },
      ctx,
    );
    return after;
  }

  /** 한국어 이름 필수 · 같은 언어 두 번 금지. */
  private assertNode(
    node: ControllerMenuDefaultNodeDto | ControllerMenuDefaultChildDto,
  ): void {
    const codes = node.translations.map((t) => t.languages_code);
    if (new Set(codes).size !== codes.length)
      throw CommonError.createByErrorCode(MenuError.DUPLICATE_LANGUAGE);
    const ko = node.translations.find(
      (t) => t.languages_code === DEFAULT_LANGUAGE,
    );
    if (!ko?.label?.trim())
      throw CommonError.createByErrorCode(MenuError.NEED_KO_LABEL);
  }

  private insert(
    ctx: ITransactionContext,
    location: MenuLocation,
    parentId: number | null,
    sort: number,
    node: ControllerMenuDefaultNodeDto | ControllerMenuDefaultChildDto,
    extra: { match: string[] | null; hiddenInDropdown: boolean },
  ): Promise<number> {
    return this.menuItemDefaultRepository.insertOne(ctx, {
      location,
      parentId,
      sort,
      href: node.href.trim(),
      visible: node.visible,
      hiddenInDropdown: extra.hiddenInDropdown,
      match: extra.match,
      translations: node.translations
        // 빈 영어 이름은 행을 만들지 않는다 — 공개 읽기가 한국어로 떨어진다.
        .filter((t: ControllerMenuDefaultLabelDto) => t.label?.trim())
        .filter((t) =>
          (LANGUAGES as readonly string[]).includes(t.languages_code),
        )
        .map((t) => ({
          languagesCode: t.languages_code,
          label: t.label.trim(),
          description: t.description?.trim() || null,
        })),
    });
  }
}
