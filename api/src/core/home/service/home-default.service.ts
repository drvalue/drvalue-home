import { Injectable } from '@nestjs/common';
import { LANGUAGES } from '../../../common/entity/post-translation.entity';
import { CommonError } from '../../../common/error/common-error';
import { ServiceException } from '../../../common/error/service-exception.decorator';
import { RevisionService } from '../../../common/revision/revision.service';
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
        action: 'update',
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
        action: 'update',
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
