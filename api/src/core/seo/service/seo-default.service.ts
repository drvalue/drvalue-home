import { Injectable } from '@nestjs/common';
import { LANGUAGES } from '../../../common/entity/post-translation.entity';
import { CommonError } from '../../../common/error/common-error';
import { ServiceException } from '../../../common/error/service-exception.decorator';
import { RevisionService } from '../../../common/revision/revision.service';
import { snapshotToDto } from '../../../common/revision/snapshot-dto';
import type { SessionPayload } from '../../../common/session/session-token';
import type { ITransactionContext } from '../../../common/typeorm/transaction-context';
import { Transactional } from '../../../common/typeorm/transactional.decorator';
import {
  ControllerSeoDefaultPageResponseDto,
  ControllerSeoPublicPageResponseDto,
} from '../dto/controller-seo-default-response.dto';
import { ControllerSeoDefaultSaveDto } from '../dto/controller-seo-default.dto';
import { SeoError } from '../error/seo.error';
import { SeoFileDefaultRepository } from '../repository/file-default.repository';
import { PageMetaDefaultRepository } from '../repository/page-meta-default.repository';
import { PageMetaTranslationDefaultRepository } from '../repository/page-meta-translation-default.repository';

type Page = ControllerSeoDefaultPageResponseDto;

/**
 * 코드로 쓴 정적 장의 검색 정보 덮어쓰기. 행이 없으면 코드의 값이 나간다 — 되돌리기 = 행 지우기.
 * 글(게시판)의 검색 정보는 글 저장에 같이 있다(admin-post). 여기는 장만.
 */
@Injectable()
export class SeoDefaultService {
  constructor(
    private readonly pageMetaDefaultRepository: PageMetaDefaultRepository,
    private readonly pageMetaTranslationDefaultRepository: PageMetaTranslationDefaultRepository,
    private readonly seoFileDefaultRepository: SeoFileDefaultRepository,
    private readonly revisionService: RevisionService,
  ) {}

  /** 덮어쓴 장 전부(관리 화면). 덮어쓰지 않은 장은 목록에 없다 — 화면이 장 목록과 합친다. */
  @ServiceException({ errorCode: SeoError.LIST_UNKNOWN })
  async list(ctx: ITransactionContext): Promise<Page[]> {
    const rows = await this.pageMetaDefaultRepository.findAllFull(ctx);
    return rows.map((r) => ControllerSeoDefaultPageResponseDto.from(r));
  }

  /** 공개 사이트용. 언어 하나로 편다(없으면 한국어). 장 수만큼이라 한 번에 준다. */
  @ServiceException({ errorCode: SeoError.LIST_UNKNOWN })
  async publicList(
    ctx: ITransactionContext,
    lang?: string,
  ): Promise<ControllerSeoPublicPageResponseDto[]> {
    const language = (LANGUAGES as readonly string[]).includes(lang ?? '')
      ? (lang as string)
      : 'ko-KR';
    const rows = await this.pageMetaDefaultRepository.findAllFull(ctx);
    return rows.map((r) =>
      ControllerSeoPublicPageResponseDto.from(r, language),
    );
  }

  /** 한 장의 덮어쓰기를 통째로 바꾼다(없으면 만든다). 비운 제목·설명은 코드의 값으로 돌아간다. */
  @ServiceException({ errorCode: SeoError.SAVE_UNKNOWN })
  @Transactional()
  async save(
    ctx: ITransactionContext,
    dto: ControllerSeoDefaultSaveDto,
    who: SessionPayload,
  ): Promise<Page> {
    return this.write(ctx, dto, who);
  }

  /**
   * 변경 이력의 한 장(관리 화면 모양)으로 되돌린다 — 지운 덮어쓰기도 되살린다. 저장 DTO 로 바꿔 같은
   * 규칙으로 검사하고, 그 사이에 지운 공유 그림은 비우고 경고로 알린다.
   */
  @ServiceException({ errorCode: SeoError.RESTORE_UNKNOWN })
  @Transactional()
  async restoreSnapshot(
    ctx: ITransactionContext,
    snapshot: Record<string, unknown>,
    who: SessionPayload,
  ): Promise<{ data: Page; warnings: string[] }> {
    const dto = await snapshotToDto(ControllerSeoDefaultSaveDto, {
      path: snapshot.path,
      no_index: snapshot.no_index ?? false,
      og_image: snapshot.og_image ?? null,
      translations: snapshot.translations ?? [],
    });
    const warnings: string[] = [];
    if (
      dto.og_image &&
      !(await this.seoFileDefaultRepository.exists(ctx, dto.og_image))
    ) {
      dto.og_image = null;
      warnings.push('공유 그림 파일이 지워져 있어 비워 두었습니다.');
    }
    return { data: await this.write(ctx, dto, who, 'restore'), warnings };
  }

  /** 공유 그림 확인 · 장 한 줄 · 번역 줄 · 변경 이력. 저장과 되돌리기가 같이 쓴다. */
  private async write(
    ctx: ITransactionContext,
    dto: ControllerSeoDefaultSaveDto,
    who: SessionPayload,
    action?: 'restore',
  ): Promise<Page> {
    if (
      dto.og_image &&
      !(await this.seoFileDefaultRepository.exists(ctx, dto.og_image))
    )
      throw CommonError.createByErrorCode(SeoError.OG_IMAGE_NOT_FOUND);

    const existing = await this.pageMetaDefaultRepository.findOneFull(
      ctx,
      dto.path,
    );
    const before = existing
      ? ControllerSeoDefaultPageResponseDto.from(existing)
      : undefined;

    // 장 한 줄만 저장한다(관계를 싣지 않은 새 객체) — 불러온 엔티티의 translations 를 비워
    // cascade 로 저장하면 TypeORM 이 번역 줄의 키(path)를 null 로 바꾸려 든다.
    const pages = this.pageMetaDefaultRepository.repository(ctx);
    await pages.save(
      pages.create({
        path: dto.path,
        noIndex: dto.no_index ?? false,
        ogImage: dto.og_image ? dto.og_image.toLowerCase() : null,
        updatedBy: who.email,
      }),
    );
    // 번역 줄은 지우고 다시 넣는다 — 언어가 둘뿐이고, 비운 줄을 남기지 않는다.
    await this.pageMetaTranslationDefaultRepository.deleteByPath(ctx, dto.path);
    const lines = dto.translations
      .map((t) => ({
        path: dto.path,
        languagesCode: t.languages_code,
        title: t.title?.trim() || null,
        description: t.description?.trim() || null,
      }))
      .filter((t) => t.title || t.description);
    if (lines.length)
      await this.pageMetaTranslationDefaultRepository
        .repository(ctx)
        .insert(lines);

    const saved = await this.pageMetaDefaultRepository.findOneFull(
      ctx,
      dto.path,
    );
    const after = ControllerSeoDefaultPageResponseDto.from(saved!);
    await this.revisionService.record(
      {
        actor: who.email,
        action: action ?? (existing ? 'update' : 'create'),
        collection: 'page_meta',
        itemId: dto.path,
        before,
        after,
      },
      ctx,
    );
    return after;
  }

  /** 덮어쓰기를 지운다 — 그 장은 코드에 적힌 제목·설명으로 돌아간다. */
  @ServiceException({ errorCode: SeoError.DELETE_UNKNOWN })
  @Transactional()
  async remove(
    ctx: ITransactionContext,
    path: string,
    who: SessionPayload,
  ): Promise<void> {
    const row = await this.pageMetaDefaultRepository.findOneFull(ctx, path);
    if (!row) throw CommonError.createByErrorCode(SeoError.NOT_FOUND);
    const before = ControllerSeoDefaultPageResponseDto.from(row);
    await this.pageMetaDefaultRepository.repository(ctx).remove(row);
    await this.revisionService.record(
      {
        actor: who.email,
        action: 'delete',
        collection: 'page_meta',
        itemId: path,
        before,
      },
      ctx,
    );
  }
}
