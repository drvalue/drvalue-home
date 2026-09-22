/**
 * 소개 장(회사·사업·서비스)의 페이지 글 — 형과 변환. api 의 `core/page/schema/parts.ts` 와 같은 모양이다
 * (칸을 바꾸면 둘 다 고친다).
 *
 * 두 방향이 있다:
 *  - 옛 자료(maxContent·solutionContent·companyContent 의 Lead·Feature·Shot) → 페이지 글(기본 글·씨앗)
 *  - 페이지 글 → 화면 부품이 받는 모양(Lead·Feature·HeroShot)
 * 씨앗(web/scripts/page-seed.mjs)이 node 로 바로 읽는다 — `@/` 별칭과 값 import 를 쓰지 않는다(형만).
 */
import type { HeroShot, Lead } from './business/max/SolutionShell'
import type { Feature, IndustryTab, Shot } from './business/max/maxContent'
import type { Group } from './business/max/IndustryPage'
import type { Tone } from './business/max/V4'
import type { ImageValue, PageContentMap } from '../../../lib/page-types.gen'

// ── 형 ─────────────────────────────────────────────────────────────
// 장마다 저장되는 글의 모양은 api 의 칸 구조(core/page/schema)에서 만든 형(lib/page-types.gen.ts)이다.
// 여기서는 그 형에 부품 이름을 붙일 뿐 옮겨 적지 않는다(값 import 없음 — 씨앗 스크립트가 node 로 읽는다).

/**
 * 그림 칸. 미디어 파일(id) 이거나, 기본 글처럼 사이트에 이미 있는 그림(src).
 * 치수: 미디어는 저장할 때 api 가 적고, 사이트 그림은 기본 글의 값을 그대로 쓴다.
 */
export type PageImage = ImageValue | null

/** 기능 덩어리 장(스마트 팩토리 · GrowTalk · GrowXD) — 머리말 + 요약 + 기능 줄. */
export type FeaturePageContent = PageContentMap['business-smart-fac']
/** 업종 장(PCB · 화장품)의 묶음 — 기능 번호로 게이지 탭·카드를 고른다. cols 'kpi' 면 KPI 카드. kpi 는 PCB 만. */
export type IndustryContent = Omit<PageContentMap['business-pcb-mes'], 'kpi'> & { kpi?: PageContentMap['business-pcb-mes']['kpi'] }
/** MES AI 장 — 머리말 + 요약 + 화면 판 + 「실제 화면」 벤토 + AI 셋의 흐름 카드. */
export type MesAiContent = PageContentMap['business-mes-ai']
/** 제조AI(M.AX) 소개 장 — 머리말 · 화면 판 · 큰 문장 · 제품군 카드 셋(글은 하위 장의 머리말을 쓴다). */
export type MaxHubContent = PageContentMap['business-max']
/** AI 솔루션 개발 장 — 머리말 · 요약 · 로드맵 · 제품군 다섯(글은 각 서비스 장의 요약을, 탭은 여기). */
export type AiSolContent = PageContentMap['business-ai-sol']
/**
 * 서비스 시연 장(오토폼 · CADON · 컷온 · 한건) — 머리말 · 요약 · 화면 판 · 시연 구역 문장 · 전/후 · 셋째 구역 문장.
 * 시연 자체(움직이는 화면)와 구역 짜임은 각 장의 코드다. 여기는 글과 그림만.
 */
export type ServiceDemoContent = PageContentMap['service-autoform']
/** 채팅 장 — 머리말 · 요약(선언 문장과 AI 솔루션 장이 쓴다) · 머리 그림 둘 · 전/후. */
export type ChatContent = PageContentMap['service-chat']

/** 머리말. 제품 소개 장 둘(M.AX · AI 솔루션)만 머리 링크(heroLink)가 있다. */
export type ShellContent = FeaturePageContent['shell'] & { heroLink?: string }
export type LeadContent = FeaturePageContent['lead']
export type Card = LeadContent['items'][number]
export type FeatureContent = FeaturePageContent['features'][number]
export type Line = FeatureContent['points'][number]
export type ShotContent = IndustryContent['heroShots'][number]
export type IndustryGroupContent = IndustryContent['groups'][number]
export type StatementContent = MesAiContent['bento']
export type ShowcaseCardContent = MaxHubContent['pcbCard']
export type ShowTabContent = AiSolContent['autoformTabs'][number]
export type CompareContent = ServiceDemoContent['compare']

/* ── 옛 자료 → 페이지 글 ─────────────────────────────────────────── */

/** `**…**` 강조 표시를 뗀 민글 — business/max/text.tsx 의 plain 과 같다(그 파일은 JSX 라 씨앗 스크립트가 못 읽는다). */
export const plainText = (s: string) => s.replace(/\*\*/g, '')

/** 옛 자료의 그림 → 그림 칸(사이트 그림 경로). 늘 값이 있다 — 필수 그림 칸에 그대로 들어간다. */
export const imageOf = (s: Shot | { src: string; alt: string; w: number; h: number }): ImageValue => ({
  id: null,
  alt: s.alt,
  src: s.src,
  width: s.w,
  height: s.h,
})
export const lines = (xs: readonly string[]): Line[] => xs.map((text) => ({ text }))
export const leadOf = (l: Lead): LeadContent => ({
  title: l.title,
  desc: l.desc ?? '',
  heroN: l.hero?.n ?? '',
  heroLabel: l.hero?.label ?? '',
  items: (l.items ?? []).map(({ t, d }) => ({ t, d })),
})
export const shotOf = (h: HeroShot): ShotContent => ({ image: imageOf(h), tag: h.tag, url: h.url ?? '' })
export const featureOf = (f: Feature): FeatureContent => ({
  no: String(f.no),
  kicker: f.kicker,
  title: f.title,
  points: lines(f.points),
  chips: lines(f.chips),
  calloutLead: f.callout?.lead ?? '',
  calloutResult: f.callout?.result ?? '',
  shots: (f.shots ?? []).map((s) => ({ image: imageOf(s) })),
})
export const compareOf = (
  before: { title: string; points: readonly string[]; bubbles: readonly { who: string; t: string }[] },
  after: { title: string; points: readonly string[] },
  shot: { src: string; alt: string; w: number; h: number },
): CompareContent => ({
  before: { title: before.title, points: lines(before.points), bubbles: before.bubbles.map(({ who, t }) => ({ who, t })) },
  after: { title: after.title, points: lines(after.points) },
  shot: imageOf(shot),
})

/* ── 페이지 글 → 화면 부품 ────────────────────────────────────────── */

/** 그림 칸 → 공개 주소. 미디어는 관문(/api/content/assets), 사이트 그림은 그 주소. 비었으면 null. */
export function imageSrc(img: PageImage | undefined): string | null {
  if (!img) return null
  if (img.id) return `/api/content/assets/${img.id}`
  return img.src ?? null
}
/** 그림 칸 → Shot. 비었으면 null. */
export function toShot(img: PageImage | undefined): Shot | null {
  const src = imageSrc(img)
  if (!src || !img) return null
  return { src, alt: img.alt, w: img.width ?? 1600, h: img.height ?? 1000 }
}
export const texts = (xs: Line[]): string[] => xs.map((x) => x.text)
/** 빈 칸은 빼고 Lead 로 — 옛 자료와 같은 모양(없는 칸은 없다). */
export function toLead(c: LeadContent): Lead {
  return {
    title: c.title,
    ...(c.desc ? { desc: c.desc } : {}),
    ...(c.items.length ? { items: c.items } : {}),
    ...(c.heroN ? { hero: { n: c.heroN, label: c.heroLabel } } : {}),
  }
}
export function toHeroShot(s: ShotContent): HeroShot | null {
  const shot = toShot(s.image)
  return shot ? { ...shot, tag: s.tag, ...(s.url ? { url: s.url } : {}) } : null
}
/** 하나면 판 한 장(객체), 여럿이면 몇 초마다 넘어간다(배열), 없으면 판 없음 — 옛 호출과 같게. */
export function toHeroShots(xs: ShotContent[]): HeroShot | HeroShot[] | undefined {
  const shots = xs.map(toHeroShot).filter((x): x is HeroShot => x !== null)
  if (shots.length === 0) return undefined
  return shots.length === 1 ? shots[0] : shots
}
export function toFeature(c: FeatureContent): Feature {
  const shots = c.shots.map((s) => toShot(s.image)).filter((x): x is Shot => x !== null)
  return {
    no: Number(c.no),
    kicker: c.kicker,
    title: c.title,
    points: texts(c.points),
    chips: texts(c.chips),
    ...(c.calloutLead || c.calloutResult ? { callout: { lead: c.calloutLead, result: c.calloutResult } } : {}),
    ...(shots.length ? { shots } : {}),
  }
}
/** '1, 2,3' → [1, 2, 3] */
export const numbers = (s: string): number[] =>
  s
    .split(',')
    .map((x) => Number(x.trim()))
    .filter((n) => Number.isInteger(n) && n > 0)
/** 업종 장 글 → IndustryPage 의 ind. id·label 은 화면이 쓰지 않는 이름표라 코드에서 준다. */
export function toIndustry(c: IndustryContent, id: string, label: string): IndustryTab {
  return {
    id,
    label,
    headLead: c.shell.headLead,
    headStrong: c.shell.headStrong,
    desc: c.shell.desc,
    lead: toLead(c.lead),
    features: c.features.map(toFeature),
  }
}
export function toGroups(c: IndustryContent): Group[] {
  return c.groups.map((g) => ({
    kicker: g.kicker,
    title: g.title,
    desc: g.desc,
    nos: numbers(g.nos),
    ...(g.cols === 'kpi' ? { cols: 'kpi' as const } : {}),
  }))
}
/** 판 색 — 스키마 pattern 이 '' · sand · steel 만 받는다. */
export const toTone = (s: string | undefined): Tone => (s === 'sand' || s === 'steel' ? s : '')
/** 비운 문구는 틀의 기본값을 쓰게 undefined 로. */
export const orUndefined = (s: string | undefined) => (s ? s : undefined)
