import SolutionShell from './SolutionShell'
import { FeatureBlock } from './FeatureBlocks'
import { orUndefined, toFeature, toLead, type FeaturePageContent } from '../../pageContentParts'

/**
 * 기능 덩어리 장(스마트 팩토리 · GrowTalk · GrowXD) — 머리말 + 요약 + 기능 줄(지그재그).
 * 세 장이 같은 모양이라 한 곳에서 그린다. 글은 관리 화면의 페이지 글이다(없으면 각 장의 content.ts).
 */
export default function FeaturePage({ path, c }: { path: string; c: FeaturePageContent }) {
  const { shell } = c
  return (
    <SolutionShell
      path={path}
      look="v4"
      kicker={shell.kicker}
      kickerSub={shell.kickerSub}
      headLead={shell.headLead}
      headStrong={shell.headStrong}
      desc={shell.desc}
      lead={toLead(c.lead)}
      ctaTitle={orUndefined(shell.ctaTitle)}
      ctaDesc={orUndefined(shell.ctaDesc)}
    >
      {c.features.map(toFeature).map((f, i) => <FeatureBlock key={f.no} f={f} flip={i % 2 === 1} tone={i} />)}
    </SolutionShell>
  )
}
