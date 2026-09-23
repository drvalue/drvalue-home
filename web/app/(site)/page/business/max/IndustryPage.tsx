import SolutionShell, { type HeroShot } from './SolutionShell'
import FeatureShow from './FeatureShow'
import { Bento, FlowCard } from './Patterns'
import { Cols, Statement } from './V4'
import { plain } from './text'
import { KPI, type IndustryTab } from './maxContent'

/**
 * 업종 한 갈래를 페이지 한 장으로 그린다.
 *
 * 왜 생겼나: PCB 와 화장품이 M.AX 페이지 한 장 안의 **탭**이었다. 탭은 주소가
 * 없다 — 메뉴에서 「PCB MES」 를 눌러 바로 그 내용으로 보낼 수가 없고, 검색에도
 * 두 업종이 한 장으로 합쳐져 잡힌다.
 *
 * 골격(2026-09-22 밤): 알약 kicker → 가운데 큰 문장 → FeatureShow(게이지 레일 + 기능 전문 판).
 * 기능의 요점·콜아웃·해시태그는 자료라 하나도 안 뺀다 — 탭 한 줄로 줄였다가 「내용 7개 다
 * 어디 갔냐」는 지적을 받았다. PCB KPI(7번)는 화면을 안 싣고(사용자: 「우리 KPI 아니잖아」)
 * 글 판 밑에 KPI 셋을 아이콘 카드로 붙인다.
 *
 * 자료는 `maxContent.ts` 를 그대로 읽는다. 묶음 문장은 페이지 파일이 준다.
 * 머리말·문의 문구와 KPI 카드는 관리 화면의 페이지 글이 주고, 안 주면 여기 기본값이다.
 */
export type Group = {
  kicker: string
  title: string
  desc: string
  /** 이 묶음에 들어갈 기능 번호(Feature.no). */
  nos: number[]
  /** 'kpi' 면 이 묶음은 화면을 안 싣고, 기능 판 밑에 KPI 셋(납기·이익·품질 영향 분석)을 붙인다. */
  cols?: 'kpi'
  /**
   * 묶음마다 다른 모양(2026-09-22 사용자: 「다 똑같이 들어가니 별로」).
   *  show  — 게이지 레일 + 기능 전문 판(기본)
   *  flow  — 기능마다 FlowCard: 요점이 순서(발주→입고, 계획→지시)일 때만
   *  bento — 틴트 구역 + 카드 격자. 화면 있는 기능은 화면 카드, 없는 건 남색 글 카드(wide)
   *  cols  — 문장 밑 아이콘 카드 셋(요점 셋 = 카드 셋). 기능 하나짜리 묶음에
   */
  layout?: 'show' | 'flow' | 'bento' | 'cols'
}

const KPI_CARDS = KPI.map((k) => ({ t: k.h, d: k.p }))

export default function IndustryPage({
  path,
  kicker,
  kickerSub = '제조AI(M.AX)',
  ctaTitle = '우리 공장에 맞는 M.AX 구성이 궁금하신가요?',
  ctaDesc,
  ind,
  heroShot,
  groups,
  url,
  kpi = KPI_CARDS,
}: {
  path: string
  /** 머리말 왼쪽 작은 글씨. 업종 이름이 들어간다. */
  kicker: string
  kickerSub?: string
  ctaTitle?: string
  ctaDesc?: string
  ind: IndustryTab
  /** 머리말 밑 판의 화면. 여럿이면 몇 초마다 넘어간다. 아래 판에 안 나오는 것으로 고른다. */
  heroShot?: HeroShot | HeroShot[]
  groups: Group[]
  /** 화면 프레임 주소줄 앞부분. */
  url?: string
  /** 「KPI」 묶음(cols: 'kpi')의 카드. 관리 화면의 페이지 글이 주고, 없으면 maxContent 의 KPI. */
  kpi?: { t: string; d: string }[]
}) {
  const by = (nos: number[]) => nos.map((n) => ind.features.find((f) => f.no === n)!).filter(Boolean)
  const kpiCards = <Cols items={kpi} />
  return (
    <SolutionShell
      path={path}
      look="v4"
      kicker={kicker}
      kickerSub={kickerSub}
      headLead={ind.headLead}
      headStrong={ind.headStrong}
      desc={ind.desc}
      lead={ind.lead}
      heroShot={heroShot}
      ctaTitle={ctaTitle}
      ctaDesc={ctaDesc}
    >
      {groups.map((g) => {
        const fs = by(g.nos)
        const extra = g.cols === 'kpi' ? Object.fromEntries(fs.map((f) => [f.no, kpiCards])) : undefined
        if (g.layout === 'bento') {
          return (
            <Bento key={g.kicker} kicker={g.kicker} title={g.title} desc={g.desc} items={fs.map((f, i) => ({
              t: f.title, d: plain(f.points[0] ?? ''), pts: f.points, shot: f.shots?.[0], url: `${url ?? 'max.drvalue.co.kr'} / ${f.kicker.replace(/^[^-]+ - /, '')}`,
              // 화면 없는 카드는 남색·폭 가득. 반 카드가 홀수로 남으면 마지막도 폭 가득 — 빈 칸을 안 남긴다.
              dark: !f.shots?.length, wide: !f.shots?.length || (fs.length % 2 === 0 && i === fs.length - 1),
            }))} />
          )
        }
        const body = g.layout === 'flow'
          ? fs.map((f, i) => <FlowCard key={f.no} title={f.title} desc={f.callout?.lead} steps={f.points} tone={(['', 'sand', 'steel'] as const)[i % 3]} />)
          : g.layout === 'cols'
            ? <Cols items={fs.flatMap((f) => f.points.slice(0, 3).map((pt, i) => ({ t: f.chips[i] ?? f.kicker, d: plain(pt) })))} />
            : <FeatureShow items={fs} extra={extra} url={url} hideShot={g.cols === 'kpi' ? g.nos : []} />
        return (
          <section className="mx_sec4" key={g.kicker}>
            <p className="mx_kicker hk_center">{g.kicker}</p>
            <Statement desc={g.desc}>{g.title}</Statement>
            {body}
          </section>
        )
      })}
    </SolutionShell>
  )
}
