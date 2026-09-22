import SolutionShell, { type HeroShot } from './SolutionShell'
import FeatureShow from './FeatureShow'
import { Cols, Statement } from './V4'
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
 */
export type Group = {
  kicker: string
  title: string
  desc: string
  /** 이 묶음에 들어갈 기능 번호(Feature.no). */
  nos: number[]
  /** 'kpi' 면 이 묶음은 화면을 안 싣고, 기능 판 밑에 KPI 셋(납기·이익·품질 영향 분석)을 붙인다. */
  cols?: 'kpi'
}

export default function IndustryPage({
  path, kicker, ind, heroShot, groups, url,
}: {
  path: string
  /** 머리말 왼쪽 작은 글씨. 업종 이름이 들어간다. */
  kicker: string
  ind: IndustryTab
  /** 머리말 밑 판의 화면. 여럿이면 몇 초마다 넘어간다. 아래 판에 안 나오는 것으로 고른다. */
  heroShot?: HeroShot | HeroShot[]
  groups: Group[]
  /** 화면 프레임 주소줄 앞부분. */
  url?: string
}) {
  const by = (nos: number[]) => nos.map((n) => ind.features.find((f) => f.no === n)!).filter(Boolean)
  const kpi = <Cols items={KPI.map((k) => ({ t: k.h, d: k.p }))} />
  return (
    <SolutionShell
      path={path}
      look="v4"
      kicker={kicker}
      kickerSub="제조AI(M.AX)"
      headLead={ind.headLead}
      headStrong={ind.headStrong}
      desc={ind.desc}
      lead={ind.lead}
      heroShot={heroShot}
      ctaTitle="우리 공장에 맞는 M.AX 구성이 궁금하신가요?"
    >
      {groups.map((g) => {
        const fs = by(g.nos)
        const extra = g.cols === 'kpi' ? Object.fromEntries(fs.map((f) => [f.no, kpi])) : undefined
        return (
          <section className="mx_sec4" key={g.kicker}>
            <p className="mx_kicker hk_center">{g.kicker}</p>
            <Statement desc={g.desc}>{g.title}</Statement>
            <FeatureShow items={fs} extra={extra} url={url} hideShot={g.cols === 'kpi' ? g.nos : []} />
          </section>
        )
      })}
    </SolutionShell>
  )
}
