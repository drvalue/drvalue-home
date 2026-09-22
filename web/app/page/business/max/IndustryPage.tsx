import SolutionShell, { type HeroShot } from './SolutionShell'
import ShowTabs, { type ShowItem } from './ShowTabs'
import { Cols, Statement } from './V4'
import { plain } from './text'
import { KPI, type Feature, type IndustryTab } from './maxContent'

/**
 * 업종 한 갈래를 페이지 한 장으로 그린다.
 *
 * 왜 생겼나: PCB 와 화장품이 M.AX 페이지 한 장 안의 **탭**이었다. 탭은 주소가
 * 없다 — 메뉴에서 「PCB MES」 를 눌러 바로 그 내용으로 보낼 수가 없고, 검색에도
 * 두 업종이 한 장으로 합쳐져 잡힌다.
 *
 * 2026-09-22 저녁, 기능 지그재그(FeatureBlock)를 걷어내고 channel.io marketing·documents 의
 * 골격으로 바꿨다: 알약 kicker → 가운데 큰 문장 → 게이지 탭(ShowTabs, 6초에 차면 다음 화면).
 * 화면 없는 기능(화장품 모니터링 둘, PCB KPI)은 문장 밑 아이콘 카드(Cols)로 — 판 밑 정지 3열 금지 규칙.
 * PCB KPI 화면은 시연 값이라 안 싣는다(사용자: 「우리 KPI 아니잖아」).
 *
 * 자료는 `maxContent.ts` 를 그대로 읽는다. 문장은 묶음(Group)마다 페이지 파일이 준다.
 */
export type Group = {
  /** 알약 kicker. */
  kicker: string
  title: string
  desc: string
  /** 이 묶음에 들어갈 기능 번호(Feature.no). 화면 있는 것은 게이지 탭, 없으면 아이콘 카드. */
  nos: number[]
  /** 'kpi' 면 기능 대신 KPI 셋(납기·이익·품질 영향 분석)을 아이콘 카드로 — PCB 7번은 화면을 안 싣는다. */
  cols?: 'kpi'
}

const short = (f: Feature) => f.kicker.replace(/^[^-]+ - /, '')

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
  kpi = KPI_CARDS,
}: {
  path: string
  /** 머리말 왼쪽 작은 글씨. 업종 이름이 들어간다. */
  kicker: string
  kickerSub?: string
  ctaTitle?: string
  ctaDesc?: string
  ind: IndustryTab
  /** 머리말 밑 판의 화면. 여럿이면 몇 초마다 넘어간다. 아래 탭에 안 나오는 것으로 고른다. */
  heroShot?: HeroShot | HeroShot[]
  groups: Group[]
  /** 「KPI」 묶음(cols: 'kpi')의 카드. 관리 화면의 페이지 글이 주고, 없으면 maxContent 의 KPI. */
  kpi?: { t: string; d: string }[]
}) {
  const by = (nos: number[]) => nos.map((n) => ind.features.find((f) => f.no === n)!).filter(Boolean)
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
        const tabs: ShowItem[] = g.cols ? [] : fs.filter((f) => f.shots?.length).map((f) => ({
          t: short(f),
          d: f.callout?.result ?? plain(f.points[0] ?? ''),
          shot: f.shots![0],
          tag: plain(f.title),
          url: `max.drvalue.co.kr / ${short(f)}`,
        }))
        const cards = g.cols === 'kpi'
          ? kpi
          : fs.filter((f) => !f.shots?.length).map((f) => ({ t: short(f), d: plain(f.points[0] ?? '') }))
        return (
          <section className="mx_sec4" key={g.kicker}>
            <p className="mx_kicker hk_center">{g.kicker}</p>
            <Statement desc={g.desc}>{g.title}</Statement>
            {tabs.length > 0 && <ShowTabs items={tabs} />}
            {cards.length > 0 && <Cols items={cards} />}
          </section>
        )
      })}
    </SolutionShell>
  )
}
