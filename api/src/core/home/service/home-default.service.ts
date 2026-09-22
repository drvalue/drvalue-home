import { Injectable } from '@nestjs/common';
import { LANGUAGES } from '../../../common/entity/post-translation.entity';
import { CommonError } from '../../../common/error/common-error';
import { ServiceException } from '../../../common/error/service-exception.decorator';
import { RevisionService } from '../../../common/revision/revision.service';
import { snapshotToDto } from '../../../common/revision/snapshot-dto';
import type { SessionPayload } from '../../../common/session/session-token';
import type { ITransactionContext } from '../../../common/typeorm/transaction-context';
import { Transactional } from '../../../common/typeorm/transactional.decorator';
import { sanitizeRichtext } from '../../page/service/richtext';
import {
  ControllerHomeDefaultBannerResponseDto,
  ControllerHomeDefaultPopupResponseDto,
  ControllerHomeDefaultPublicResponseDto,
} from '../dto/controller-home-default-response.dto';
import {
  ControllerHomeDefaultBannerDto,
  ControllerHomeDefaultBannerSaveDto,
  ControllerHomeDefaultPopupDto,
  ControllerHomeDefaultPopupSaveDto,
} from '../dto/controller-home-default.dto';
import { HomeError } from '../error/home.error';
import { HomeBannerDefaultRepository } from '../repository/home-banner-default.repository';
import { HomeBannerTranslationDefaultRepository } from '../repository/home-banner-translation-default.repository';
import { HomeFileDefaultRepository } from '../repository/home-file-default.repository';
import { HomePopupDefaultRepository } from '../repository/home-popup-default.repository';
import { HomePopupTranslationDefaultRepository } from '../repository/home-popup-translation-default.repository';

const DEFAULT_LANGUAGE = 'ko-KR';
const BODY_MAX = 2000;

/** 빈 문자열·공백은 null — 비운 칸은 기본 글로 떨어진다는 약속. */
const clean = (s: string | null | undefined): string | null => {
  const t = (s ?? '').trim();
  return t ? t : null;
};
const when = (s: string | null | undefined): Date | null =>
  s ? new Date(s) : null;

/**
 * 메인 화면의 기간 배너와 팝업(E8). 메인 글(문구·구역 차례·카드)은 페이지 글 엔진('home')이 맡는다.
 *
 * 규칙: 배너는 그림 필수 · 팝업은 그림이나 한국어 제목·내용 중 하나 · 끝 > 시작 · 한 항목에 같은 언어 한 번 ·
 * 그림은 미디어에 있는 파일만(지워졌으면 409) · 팝업 내용은 허용 태그만(2000자).
 * 저장은 목록 전체를 한 번에 — 받은 id 는 고치고(팝업의 「보지 않기」가 id 에 걸려 있다), 없는 id 는 새로,
 * 목록에서 빠진 것은 지운다. 바꾸기 전·뒤 전체가 변경 이력 한 줄(collection home_banners · home_popups).
 */
/** 변경 이력에 남은 배너·팝업 한 개(관리 화면 응답 모양) 중 되돌리기에 쓰는 칸. */
interface SnapItem {
  id?: number;
  visible?: boolean;
  image?: { id?: string } | null;
  link_href?: string | null;
  starts_at?: string | null;
  ends_at?: string | null;
  width?: number;
  dismiss_days?: number;
  translations?: unknown[];
}

@Injectable()
export class HomeDefaultService {
  constructor(
    private readonly homeBannerDefaultRepository: HomeBannerDefaultRepository,
    private readonly homeBannerTranslationDefaultRepository: HomeBannerTranslationDefaultRepository,
    private readonly homePopupDefaultRepository: HomePopupDefaultRepository,
    private readonly homePopupTranslationDefaultRepository: HomePopupTranslationDefaultRepository,
    private readonly homeFileDefaultRepository: HomeFileDefaultRepository,
    private readonly revisionService: RevisionService,
  ) {}

  /** 공개 메인 — 지금 살아 있는 배너 하나와 팝업들(뜨는 차례). */
  @ServiceException({ errorCode: HomeError.GET_UNKNOWN })
  async findPublic(
    ctx: ITransactionContext,
    lang: string | undefined,
  ): Promise<{
    data: ControllerHomeDefaultPublicResponseDto;
    language: string;
  }> {
    const language = lang ?? DEFAULT_LANGUAGE;
    const now = new Date();
    const banners = await this.homeBannerDefaultRepository.findLive(ctx, now);
    const popups = await this.homePopupDefaultRepository.findLive(ctx, now);
    const banner = banners[0] ?? null;
    const sizes = await this.homeFileDefaultRepository.findSizes(ctx, [
      ...(banner?.image ? [banner.image] : []),
      ...popups.flatMap((p) => (p.image ? [p.image] : [])),
    ]);
    return {
      data: ControllerHomeDefaultPublicResponseDto.from(
        banner,
        popups,
        sizes,
        language,
      ),
      language,
    };
  }

  /** 관리 목록 — 배너 전부(꺼진 것·기간 밖 포함)와 지금 상태. */
  @ServiceException({ errorCode: HomeError.GET_UNKNOWN })
  async findBanners(
    ctx: ITransactionContext,
  ): Promise<ControllerHomeDefaultBannerResponseDto[]> {
    const rows =
      await this.homeBannerDefaultRepository.findAllWithTranslations(ctx);
    const sizes = await this.homeFileDefaultRepository.findSizes(
      ctx,
      rows.flatMap((r) => (r.image ? [r.image] : [])),
    );
    const now = new Date();
    return rows.map((r) =>
      ControllerHomeDefaultBannerResponseDto.from(r, sizes, now),
    );
  }

  /** 관리 목록 — 팝업 전부와 지금 상태. */
  @ServiceException({ errorCode: HomeError.GET_UNKNOWN })
  async findPopups(
    ctx: ITransactionContext,
  ): Promise<ControllerHomeDefaultPopupResponseDto[]> {
    const rows =
      await this.homePopupDefaultRepository.findAllWithTranslations(ctx);
    const sizes = await this.homeFileDefaultRepository.findSizes(
      ctx,
      rows.flatMap((r) => (r.image ? [r.image] : [])),
    );
    const now = new Date();
    return rows.map((r) =>
      ControllerHomeDefaultPopupResponseDto.from(r, sizes, now),
    );
  }

  /** 배너 목록 전체를 저장한다(순서 = 배열 순서). */
  @ServiceException({ errorCode: HomeError.SAVE_UNKNOWN })
  @Transactional()
  async saveBanners(
    ctx: ITransactionContext,
    dto: ControllerHomeDefaultBannerSaveDto,
    who: SessionPayload,
  ): Promise<ControllerHomeDefaultBannerResponseDto[]> {
    return this.writeBanners(ctx, dto, who, 'update');
  }

  /**
   * 변경 이력의 배너 목록(관리 화면 모양)으로 되돌린다. 저장 DTO 로 바꿔 같은 규칙으로 검사하고,
   * 그 사이에 지운 그림은 비우고 경고로 알린다.
   */
  @ServiceException({ errorCode: HomeError.RESTORE_UNKNOWN })
  @Transactional()
  async restoreBanners(
    ctx: ITransactionContext,
    snapshot: unknown,
    who: SessionPayload,
  ): Promise<{
    data: ControllerHomeDefaultBannerResponseDto[];
    warnings: string[];
  }> {
    const items = (Array.isArray(snapshot) ? snapshot : []) as SnapItem[];
    const dto = await snapshotToDto(ControllerHomeDefaultBannerSaveDto, {
      items: items.map((b) => ({
        id: b.id,
        visible: b.visible,
        image: b.image?.id ?? null,
        link_href: b.link_href ?? null,
        starts_at: b.starts_at ?? null,
        ends_at: b.ends_at ?? null,
        translations: b.translations ?? [],
      })),
    });
    const warnings = await this.dropGoneImages(ctx, dto.items, '배너');
    return {
      data: await this.writeBanners(ctx, dto, who, 'restore'),
      warnings,
    };
  }

  /** 검사 · 저장(id 를 지킨다) · 변경 이력. 저장과 되돌리기가 같이 쓴다. */
  private async writeBanners(
    ctx: ITransactionContext,
    dto: ControllerHomeDefaultBannerSaveDto,
    who: SessionPayload,
    action: 'update' | 'restore',
  ): Promise<ControllerHomeDefaultBannerResponseDto[]> {
    for (const item of dto.items) this.assertBanner(item);
    await this.assertFiles(
      ctx,
      dto.items.map((i) => i.image ?? null),
    );

    const before = await this.findBanners(ctx);
    const existing = await this.homeBannerDefaultRepository.findIds(ctx);
    const keep: number[] = [];
    for (const [i, item] of dto.items.entries()) {
      const row = {
        sort: i + 1,
        visible: item.visible,
        image: (item.image ?? '').toLowerCase() || null,
        linkHref: clean(item.link_href),
        startsAt: when(item.starts_at),
        endsAt: when(item.ends_at),
        updatedBy: who.email,
      };
      let id: number;
      if (item.id && existing.has(item.id)) {
        id = item.id;
        await this.homeBannerDefaultRepository.updateOne(ctx, id, row);
      } else id = await this.homeBannerDefaultRepository.insertOne(ctx, row);
      keep.push(id);
      await this.homeBannerTranslationDefaultRepository.replaceFor(
        ctx,
        id,
        item.translations
          .map((t) => ({
            languagesCode: t.languages_code,
            title: clean(t.title),
            description: clean(t.description),
            alt: clean(t.alt),
            linkLabel: clean(t.link_label),
          }))
          .filter((t) => t.title || t.description || t.alt || t.linkLabel),
      );
    }
    await this.homeBannerDefaultRepository.deleteExcept(ctx, keep);

    const after = await this.findBanners(ctx);
    await this.revisionService.record(
      {
        actor: who.email,
        action,
        collection: 'home_banners',
        itemId: 'list',
        before,
        after,
      },
      ctx,
    );
    return after;
  }

  /** 팝업 목록 전체를 저장한다(순서 = 배열 순서 = 뜨는 차례). */
  @ServiceException({ errorCode: HomeError.SAVE_UNKNOWN })
  @Transactional()
  async savePopups(
    ctx: ITransactionContext,
    dto: ControllerHomeDefaultPopupSaveDto,
    who: SessionPayload,
  ): Promise<ControllerHomeDefaultPopupResponseDto[]> {
    return this.writePopups(ctx, dto, who, 'update');
  }

  /**
   * 변경 이력의 팝업 목록(관리 화면 모양)으로 되돌린다. 저장 DTO 로 바꿔 같은 규칙으로 검사하고,
   * 그 사이에 지운 그림은 비우고 경고로 알린다.
   */
  @ServiceException({ errorCode: HomeError.RESTORE_UNKNOWN })
  @Transactional()
  async restorePopups(
    ctx: ITransactionContext,
    snapshot: unknown,
    who: SessionPayload,
  ): Promise<{
    data: ControllerHomeDefaultPopupResponseDto[];
    warnings: string[];
  }> {
    const items = (Array.isArray(snapshot) ? snapshot : []) as SnapItem[];
    const dto = await snapshotToDto(ControllerHomeDefaultPopupSaveDto, {
      items: items.map((p) => ({
        id: p.id,
        visible: p.visible,
        image: p.image?.id ?? null,
        link_href: p.link_href ?? null,
        starts_at: p.starts_at ?? null,
        ends_at: p.ends_at ?? null,
        width: p.width,
        dismiss_days: p.dismiss_days,
        translations: p.translations ?? [],
      })),
    });
    const warnings = await this.dropGoneImages(ctx, dto.items, '팝업');
    return { data: await this.writePopups(ctx, dto, who, 'restore'), warnings };
  }

  /** 검사 · 저장(id 를 지킨다 — 「N일 보지 않기」가 id 에 걸려 있다) · 변경 이력. */
  private async writePopups(
    ctx: ITransactionContext,
    dto: ControllerHomeDefaultPopupSaveDto,
    who: SessionPayload,
    action: 'update' | 'restore',
  ): Promise<ControllerHomeDefaultPopupResponseDto[]> {
    const bodies = dto.items.map((item) => this.assertPopup(item));
    await this.assertFiles(
      ctx,
      dto.items.map((i) => i.image ?? null),
    );

    const before = await this.findPopups(ctx);
    const existing = await this.homePopupDefaultRepository.findIds(ctx);
    const keep: number[] = [];
    for (const [i, item] of dto.items.entries()) {
      const row = {
        sort: i + 1,
        visible: item.visible,
        image: (item.image ?? '').toLowerCase() || null,
        linkHref: clean(item.link_href),
        startsAt: when(item.starts_at),
        endsAt: when(item.ends_at),
        width: item.width,
        dismissDays: item.dismiss_days,
        updatedBy: who.email,
      };
      let id: number;
      if (item.id && existing.has(item.id)) {
        id = item.id;
        await this.homePopupDefaultRepository.updateOne(ctx, id, row);
      } else id = await this.homePopupDefaultRepository.insertOne(ctx, row);
      keep.push(id);
      await this.homePopupTranslationDefaultRepository.replaceFor(
        ctx,
        id,
        item.translations
          .map((t) => ({
            languagesCode: t.languages_code,
            title: clean(t.title),
            body: bodies[i].get(t.languages_code) ?? null,
            alt: clean(t.alt),
            linkLabel: clean(t.link_label),
          }))
          .filter((t) => t.title || t.body || t.alt || t.linkLabel),
      );
    }
    await this.homePopupDefaultRepository.deleteExcept(ctx, keep);

    const after = await this.findPopups(ctx);
    await this.revisionService.record(
      {
        actor: who.email,
        action,
        collection: 'home_popups',
        itemId: 'list',
        before,
        after,
      },
      ctx,
    );
    return after;
  }

  /** 배너: 그림 필수 · 기간 · 언어 한 번씩. */
  private assertBanner(item: ControllerHomeDefaultBannerDto): void {
    if (!item.image)
      throw CommonError.createByErrorCode(HomeError.NEED_BANNER_IMAGE);
    this.assertPeriod(item.starts_at, item.ends_at);
    this.assertLanguages(item.translations.map((t) => t.languages_code));
  }

  /** 팝업: 기간 · 언어 한 번씩 · 내용 정리(허용 태그, 2000자) · 그림이나 한국어 제목·내용 중 하나. 정리한 내용을 언어별로 돌려준다. */
  private assertPopup(
    item: ControllerHomeDefaultPopupDto,
  ): Map<string, string | null> {
    this.assertPeriod(item.starts_at, item.ends_at);
    this.assertLanguages(item.translations.map((t) => t.languages_code));
    const bodies = new Map<string, string | null>();
    for (const t of item.translations) {
      const body = clean(sanitizeRichtext(t.body ?? ''));
      if (body && body.length > BODY_MAX)
        throw CommonError.createByErrorCode(HomeError.BODY_TOO_LONG);
      bodies.set(t.languages_code, body);
    }
    const ko = item.translations.find(
      (t) => t.languages_code === DEFAULT_LANGUAGE,
    );
    if (!item.image && !clean(ko?.title) && !bodies.get(DEFAULT_LANGUAGE))
      throw CommonError.createByErrorCode(HomeError.NEED_POPUP_CONTENT);
    return bodies;
  }

  private assertPeriod(
    startsAt: string | null | undefined,
    endsAt: string | null | undefined,
  ): void {
    if (startsAt && endsAt && new Date(endsAt) <= new Date(startsAt))
      throw CommonError.createByErrorCode(HomeError.BAD_PERIOD);
  }

  private assertLanguages(codes: string[]): void {
    if (new Set(codes).size !== codes.length)
      throw CommonError.createByErrorCode(HomeError.DUPLICATE_LANGUAGE);
    if (codes.some((c) => !(LANGUAGES as readonly string[]).includes(c)))
      throw CommonError.createByErrorCode(HomeError.DUPLICATE_LANGUAGE);
  }

  /** 되돌릴 목록에서 지금 미디어에 없는 그림을 비운다. 비운 것이 있으면 경고 한 줄. */
  private async dropGoneImages(
    ctx: ITransactionContext,
    items: { image?: string | null }[],
    what: string,
  ): Promise<string[]> {
    const ids = items.flatMap((i) => (i.image ? [i.image.toLowerCase()] : []));
    const sizes = await this.homeFileDefaultRepository.findSizes(ctx, ids);
    let gone = 0;
    for (const item of items)
      if (item.image && !sizes.has(item.image.toLowerCase())) {
        item.image = null;
        gone += 1;
      }
    return gone
      ? [`${what} 그림 ${gone}개는 파일이 지워져 있어 비워 두었습니다.`]
      : [];
  }

  /** 그림이 미디어에 아직 있나 — 폼이 들고 있던 파일을 누가 지웠으면 409(FK 에 걸려 500 이 나기 전에). */
  private async assertFiles(
    ctx: ITransactionContext,
    images: (string | null)[],
  ): Promise<void> {
    const ids = images.flatMap((i) => (i ? [i.toLowerCase()] : []));
    const sizes = await this.homeFileDefaultRepository.findSizes(ctx, ids);
    if (ids.some((id) => !sizes.has(id)))
      throw CommonError.createByErrorCode(HomeError.IMAGE_GONE);
  }
}
