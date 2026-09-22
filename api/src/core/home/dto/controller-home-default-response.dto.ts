import { ApiProperty } from '@nestjs/swagger';
import type { HomeBannerEntity } from '../../../common/entity/home-banner.entity';
import type { HomePopupEntity } from '../../../common/entity/home-popup.entity';
import { LANGUAGES } from '../../../common/entity/post-translation.entity';

const DEFAULT_LANGUAGE = 'ko-KR';
/** 이 사이트의 언어(ko-KR · en-US). 웹이 이 목록을 형으로 받는다. */
type Language = (typeof LANGUAGES)[number];

const iso = (d: Date | string | null | undefined): string | null =>
  d ? new Date(d).toISOString() : null;

export type FileSizes = Map<
  string,
  { width: number | null; height: number | null }
>;

/** 기간·보이기로 본 지금 상태. 관리 목록의 배지. */
export type LiveState = 'live' | 'scheduled' | 'ended' | 'off';

export function liveState(
  row: {
    visible: boolean;
    startsAt: Date | null;
    endsAt: Date | null;
  },
  now: Date,
): LiveState {
  if (!row.visible) return 'off';
  if (row.startsAt && new Date(row.startsAt) > now) return 'scheduled';
  if (row.endsAt && new Date(row.endsAt) <= now) return 'ended';
  return 'live';
}

/** 그 언어 행, 없으면 한국어 행. */
function textOf<T extends { languagesCode: string }>(
  rows: T[] | undefined,
  lang: string,
): T | undefined {
  return (
    rows?.find((t) => t.languagesCode === lang) ??
    rows?.find((t) => t.languagesCode === DEFAULT_LANGUAGE)
  );
}

export class ControllerHomeDefaultImageResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty({ description: '관리 미리보기 주소(초안이어도 보인다)' })
  url!: string;
  @ApiProperty({ nullable: true, type: Number }) width!: number | null;
  @ApiProperty({ nullable: true, type: Number }) height!: number | null;

  static from(
    id: string | null,
    sizes: FileSizes,
  ): ControllerHomeDefaultImageResponseDto | null {
    if (!id) return null;
    const s = sizes.get(id);
    return {
      id,
      url: `/api/admin/files/${id}`,
      width: s?.width ?? null,
      height: s?.height ?? null,
    };
  }
}

export class ControllerHomeDefaultBannerTextResponseDto {
  @ApiProperty({ enum: LANGUAGES, example: 'ko-KR' })
  languages_code!: Language;
  @ApiProperty({ nullable: true, type: String }) title!: string | null;
  @ApiProperty({ nullable: true, type: String }) description!: string | null;
  @ApiProperty({ nullable: true, type: String }) alt!: string | null;
  @ApiProperty({ nullable: true, type: String }) link_label!: string | null;
}

/** 관리 목록의 배너 한 줄. */
export class ControllerHomeDefaultBannerResponseDto {
  @ApiProperty() id!: number;
  @ApiProperty() sort!: number;
  @ApiProperty() visible!: boolean;
  @ApiProperty({ enum: ['live', 'scheduled', 'ended', 'off'] })
  state!: LiveState;
  @ApiProperty({
    nullable: true,
    type: ControllerHomeDefaultImageResponseDto,
  })
  image!: ControllerHomeDefaultImageResponseDto | null;
  @ApiProperty({ nullable: true, type: String }) link_href!: string | null;
  @ApiProperty({ nullable: true, type: String, format: 'date-time' })
  starts_at!: string | null;
  @ApiProperty({ nullable: true, type: String, format: 'date-time' })
  ends_at!: string | null;
  @ApiProperty({ type: [ControllerHomeDefaultBannerTextResponseDto] })
  translations!: ControllerHomeDefaultBannerTextResponseDto[];
  @ApiProperty({ nullable: true, type: String, format: 'date-time' })
  updated_on!: string | null;
  @ApiProperty({ nullable: true, type: String }) updated_by!: string | null;

  static from(
    row: HomeBannerEntity,
    sizes: FileSizes,
    now: Date,
  ): ControllerHomeDefaultBannerResponseDto {
    return {
      id: row.id,
      sort: row.sort,
      visible: row.visible,
      state: liveState(row, now),
      image: ControllerHomeDefaultImageResponseDto.from(row.image, sizes),
      link_href: row.linkHref,
      starts_at: iso(row.startsAt),
      ends_at: iso(row.endsAt),
      translations: (row.translations ?? [])
        .map((t) => ({
          languages_code: t.languagesCode as Language,
          title: t.title,
          description: t.description,
          alt: t.alt,
          link_label: t.linkLabel,
        }))
        .sort((a, b) => a.languages_code.localeCompare(b.languages_code)),
      updated_on: iso(row.updatedOn),
      updated_by: row.updatedBy,
    };
  }
}

export class ControllerHomeDefaultPopupTextResponseDto {
  @ApiProperty({ enum: LANGUAGES, example: 'ko-KR' })
  languages_code!: Language;
  @ApiProperty({ nullable: true, type: String }) title!: string | null;
  @ApiProperty({ nullable: true, type: String }) body!: string | null;
  @ApiProperty({ nullable: true, type: String }) alt!: string | null;
  @ApiProperty({ nullable: true, type: String }) link_label!: string | null;
}

/** 관리 목록의 팝업 한 줄. */
export class ControllerHomeDefaultPopupResponseDto {
  @ApiProperty() id!: number;
  @ApiProperty() sort!: number;
  @ApiProperty() visible!: boolean;
  @ApiProperty({ enum: ['live', 'scheduled', 'ended', 'off'] })
  state!: LiveState;
  @ApiProperty({
    nullable: true,
    type: ControllerHomeDefaultImageResponseDto,
  })
  image!: ControllerHomeDefaultImageResponseDto | null;
  @ApiProperty({ nullable: true, type: String }) link_href!: string | null;
  @ApiProperty({ nullable: true, type: String, format: 'date-time' })
  starts_at!: string | null;
  @ApiProperty({ nullable: true, type: String, format: 'date-time' })
  ends_at!: string | null;
  @ApiProperty() width!: number;
  @ApiProperty() dismiss_days!: number;
  @ApiProperty({ type: [ControllerHomeDefaultPopupTextResponseDto] })
  translations!: ControllerHomeDefaultPopupTextResponseDto[];
  @ApiProperty({ nullable: true, type: String, format: 'date-time' })
  updated_on!: string | null;
  @ApiProperty({ nullable: true, type: String }) updated_by!: string | null;

  static from(
    row: HomePopupEntity,
    sizes: FileSizes,
    now: Date,
  ): ControllerHomeDefaultPopupResponseDto {
    return {
      id: row.id,
      sort: row.sort,
      visible: row.visible,
      state: liveState(row, now),
      image: ControllerHomeDefaultImageResponseDto.from(row.image, sizes),
      link_href: row.linkHref,
      starts_at: iso(row.startsAt),
      ends_at: iso(row.endsAt),
      width: row.width,
      dismiss_days: row.dismissDays,
      translations: (row.translations ?? [])
        .map((t) => ({
          languages_code: t.languagesCode as Language,
          title: t.title,
          body: t.body,
          alt: t.alt,
          link_label: t.linkLabel,
        }))
        .sort((a, b) => a.languages_code.localeCompare(b.languages_code)),
      updated_on: iso(row.updatedOn),
      updated_by: row.updatedBy,
    };
  }
}

/** 공개 그림 — 관문(/api/content/assets)을 거친다. 살아 있는 배너·팝업의 그림만 열린다. */
export class ControllerHomeDefaultPublicImageDto {
  @ApiProperty({ example: '/api/content/assets/…' }) url!: string;
  @ApiProperty({ nullable: true, type: Number }) width!: number | null;
  @ApiProperty({ nullable: true, type: Number }) height!: number | null;
  @ApiProperty() alt!: string;
}

export class ControllerHomeDefaultPublicLinkDto {
  @ApiProperty() label!: string;
  @ApiProperty() href!: string;
}

export class ControllerHomeDefaultPublicBannerDto {
  @ApiProperty() id!: number;
  @ApiProperty({ type: ControllerHomeDefaultPublicImageDto })
  image!: ControllerHomeDefaultPublicImageDto;
  @ApiProperty({ nullable: true, type: String }) title!: string | null;
  @ApiProperty({ nullable: true, type: String }) description!: string | null;
  @ApiProperty({ nullable: true, type: ControllerHomeDefaultPublicLinkDto })
  link!: ControllerHomeDefaultPublicLinkDto | null;
}

export class ControllerHomeDefaultPublicPopupDto {
  @ApiProperty() id!: number;
  @ApiProperty({
    nullable: true,
    type: ControllerHomeDefaultPublicImageDto,
  })
  image!: ControllerHomeDefaultPublicImageDto | null;
  @ApiProperty({ nullable: true, type: String }) title!: string | null;
  @ApiProperty({
    nullable: true,
    type: String,
    description: '허용 태그만 남긴 HTML',
  })
  body!: string | null;
  @ApiProperty({ nullable: true, type: ControllerHomeDefaultPublicLinkDto })
  link!: ControllerHomeDefaultPublicLinkDto | null;
  @ApiProperty() width!: number;
  @ApiProperty() dismiss_days!: number;
}

const LINK_LABEL = '자세히 보기';

function publicImage(
  id: string | null,
  alt: string | null | undefined,
  sizes: FileSizes,
): ControllerHomeDefaultPublicImageDto | null {
  if (!id) return null;
  const s = sizes.get(id);
  return {
    url: `/api/content/assets/${id}`,
    width: s?.width ?? null,
    height: s?.height ?? null,
    alt: alt ?? '',
  };
}

/** 공개 메인 설정 — 살아 있는 배너 하나(머리 그림)와 팝업들(뜨는 차례). 누가 고쳤는지는 싣지 않는다. */
export class ControllerHomeDefaultPublicResponseDto {
  @ApiProperty({
    nullable: true,
    type: ControllerHomeDefaultPublicBannerDto,
  })
  banner!: ControllerHomeDefaultPublicBannerDto | null;
  @ApiProperty({ type: [ControllerHomeDefaultPublicPopupDto] })
  popups!: ControllerHomeDefaultPublicPopupDto[];

  static from(
    banner: HomeBannerEntity | null,
    popups: HomePopupEntity[],
    sizes: FileSizes,
    lang: string,
  ): ControllerHomeDefaultPublicResponseDto {
    const b = banner ? textOf(banner.translations, lang) : undefined;
    const bannerImage = banner
      ? publicImage(banner.image, b?.alt, sizes)
      : null;
    return {
      banner:
        banner && bannerImage
          ? {
              id: banner.id,
              image: bannerImage,
              title: b?.title || null,
              description: b?.description || null,
              link: banner.linkHref
                ? { label: b?.linkLabel || LINK_LABEL, href: banner.linkHref }
                : null,
            }
          : null,
      popups: popups.map((p) => {
        const t = textOf(p.translations, lang);
        return {
          id: p.id,
          image: publicImage(p.image, t?.alt, sizes),
          title: t?.title || null,
          body: t?.body || null,
          link: p.linkHref
            ? { label: t?.linkLabel || LINK_LABEL, href: p.linkHref }
            : null,
          width: p.width,
          dismiss_days: p.dismissDays,
        };
      }),
    };
  }
}
