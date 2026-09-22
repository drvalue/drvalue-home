import { ApiProperty } from '@nestjs/swagger';
import type { MenuItemEntity } from '../../../common/entity/menu-item.entity';
import { LANGUAGES } from '../../../common/entity/post-translation.entity';

/** 이 사이트의 언어(ko-KR · en-US). 웹이 이 목록을 형으로 받는다. */
type Language = (typeof LANGUAGES)[number];

/**
 * 메뉴 응답. 엔티티(평평한 행) → 나무 모양 변환은 여기서만 한다(`from`).
 * 관리 화면용(언어별 이름 전부 · 꺼진 칸 포함)과 공개용(한 언어 · 보이는 칸만) 두 벌이다.
 */

const DEFAULT_LANGUAGE = 'ko-KR';
const bySort = (a: MenuItemEntity, b: MenuItemEntity) =>
  a.sort - b.sort || a.id - b.id;

// ── 관리 화면 ─────────────────────────────────────────────────────────

export class ControllerMenuDefaultLabelResponseDto {
  @ApiProperty({ enum: LANGUAGES, example: 'ko-KR' })
  languages_code!: Language;
  @ApiProperty({ example: '공지사항' }) label!: string;
  @ApiProperty({ nullable: true, type: String }) description!: string | null;
}

export class ControllerMenuDefaultAdminChildResponseDto {
  @ApiProperty() id!: number;
  @ApiProperty() href!: string;
  @ApiProperty() visible!: boolean;
  @ApiProperty() hidden_in_dropdown!: boolean;
  @ApiProperty({ type: [ControllerMenuDefaultLabelResponseDto] })
  translations!: ControllerMenuDefaultLabelResponseDto[];
}

export class ControllerMenuDefaultAdminNodeResponseDto extends ControllerMenuDefaultAdminChildResponseDto {
  @ApiProperty({ nullable: true, type: [String] }) match!: string[] | null;
  @ApiProperty({ type: [ControllerMenuDefaultAdminChildResponseDto] })
  children!: ControllerMenuDefaultAdminChildResponseDto[];
}

export class ControllerMenuDefaultAdminTreeResponseDto {
  @ApiProperty({ type: [ControllerMenuDefaultAdminNodeResponseDto] })
  top!: ControllerMenuDefaultAdminNodeResponseDto[];
  @ApiProperty({ type: [ControllerMenuDefaultAdminChildResponseDto] })
  footer!: ControllerMenuDefaultAdminChildResponseDto[];
  @ApiProperty({ nullable: true, type: String, format: 'date-time' })
  updated_on!: string | null;

  static from(
    rows: MenuItemEntity[],
  ): ControllerMenuDefaultAdminTreeResponseDto {
    const labels = (
      r: MenuItemEntity,
    ): ControllerMenuDefaultLabelResponseDto[] =>
      [...(r.translations ?? [])]
        .sort((a, b) =>
          a.languagesCode === DEFAULT_LANGUAGE
            ? -1
            : b.languagesCode === DEFAULT_LANGUAGE
              ? 1
              : 0,
        )
        .map((t) => ({
          languages_code: t.languagesCode as Language,
          label: t.label,
          description: t.description,
        }));
    const child = (
      r: MenuItemEntity,
    ): ControllerMenuDefaultAdminChildResponseDto => ({
      id: r.id,
      href: r.href,
      visible: r.visible,
      hidden_in_dropdown: r.hiddenInDropdown,
      translations: labels(r),
    });
    const top = rows
      .filter((r) => r.location === 'top' && r.parentId === null)
      .sort(bySort);
    const latest = rows.reduce<Date | null>(
      (m, r) => (!m || new Date(r.updatedOn) > m ? new Date(r.updatedOn) : m),
      null,
    );
    return {
      top: top.map((r) => ({
        ...child(r),
        match: r.match,
        children: rows
          .filter((c) => c.parentId === r.id)
          .sort(bySort)
          .map(child),
      })),
      footer: rows
        .filter((r) => r.location === 'footer' && r.parentId === null)
        .sort(bySort)
        .map(child),
      updated_on: latest ? latest.toISOString() : null,
    };
  }
}

// ── 공개 ─────────────────────────────────────────────────────────────

export class ControllerMenuDefaultPublicChildResponseDto {
  @ApiProperty({ example: '공지사항' }) label!: string;
  @ApiProperty({ example: '/page/support/notice' }) href!: string;
  @ApiProperty({ nullable: true, type: String }) description!: string | null;
  @ApiProperty({
    description: '드롭다운에는 안 띄우고 현재 위치 줄에만 이름을 쓴다',
  })
  hidden_in_dropdown!: boolean;
}

export class ControllerMenuDefaultPublicNodeResponseDto {
  @ApiProperty({ example: '고객센터' }) label!: string;
  @ApiProperty({ example: '/page/support/notice' }) href!: string;
  @ApiProperty({ type: [String], example: ['/page/support/'] })
  match!: string[];
  @ApiProperty({ type: [ControllerMenuDefaultPublicChildResponseDto] })
  children!: ControllerMenuDefaultPublicChildResponseDto[];
}

export class ControllerMenuDefaultPublicLinkResponseDto {
  @ApiProperty() label!: string;
  @ApiProperty() href!: string;
}

export class ControllerMenuDefaultPublicTreeResponseDto {
  @ApiProperty({ type: [ControllerMenuDefaultPublicNodeResponseDto] })
  top!: ControllerMenuDefaultPublicNodeResponseDto[];
  @ApiProperty({ type: [ControllerMenuDefaultPublicLinkResponseDto] })
  footer!: ControllerMenuDefaultPublicLinkResponseDto[];

  /** 보이는 칸만, 한 언어로. 그 언어 이름이 없으면 한국어 이름. 꺼진 대분류의 하위도 빠진다. */
  static from(
    rows: MenuItemEntity[],
    language: string,
  ): ControllerMenuDefaultPublicTreeResponseDto {
    const pick = (r: MenuItemEntity) => {
      const ts = r.translations ?? [];
      return (
        ts.find((t) => t.languagesCode === language) ??
        ts.find((t) => t.languagesCode === DEFAULT_LANGUAGE)
      );
    };
    const shown = rows.filter((r) => r.visible);
    return {
      top: shown
        .filter((r) => r.location === 'top' && r.parentId === null)
        .sort(bySort)
        .map((r) => ({
          label: pick(r)?.label ?? '',
          href: r.href,
          match: r.match?.length ? r.match : [r.href],
          children: shown
            .filter((c) => c.parentId === r.id)
            .sort(bySort)
            .map((c) => ({
              label: pick(c)?.label ?? '',
              href: c.href,
              description: pick(c)?.description ?? null,
              hidden_in_dropdown: c.hiddenInDropdown,
            })),
        })),
      footer: shown
        .filter((r) => r.location === 'footer' && r.parentId === null)
        .sort(bySort)
        .map((r) => ({ label: pick(r)?.label ?? '', href: r.href })),
    };
  }
}
