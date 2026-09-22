import { GROWXD, GROWXD_LEAD } from '../solutionContent'
import { PAGE_CSS } from '../../business/max/maxStyles'
import SolutionShell from '../../business/max/SolutionShell'
import { FeatureBlock } from '../../business/max/FeatureBlocks'
import { seoMeta } from '@/lib/seo'

/**
 * /page/service/growxd.php 를 옮긴 것. 2026-09-18 옛 꾸밈(가운데 정렬 사진 머리 + 아이콘 카드 + AOS)
 * 에서 M.AX 계열과 같은 틀로 옮겼다 — 한 메뉴 안에서 두 꾸밈이 섞여 난잡했다.
 * 글은 solutionContent.ts 에 그대로 옮겨 두었다. 새로 지은 문장은 없다.
 */
const PATH = '/page/service/growxd'

export const generateMetadata = seoMeta({
  title: 'GrowXD 생산관리시스템',
  description: '실적 수집(MES)을 넘어 AI 분석·예측을 결합한 차세대 제조실행시스템. 현장 장비부터 전사 지표까지 한 흐름으로 잇습니다.',
  path: PATH,
})

export default function Page() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PAGE_CSS }} />
      <SolutionShell
        path={PATH}
        look="v4"
        kicker="GrowXD"
        kickerSub="AI솔루션"
        headLead="AI가 스스로 최적화하는 "
        headStrong="지능형 생산 관리 시스템, GrowXD"
        desc="단순한 실적 수집(MES)을 넘어 AI 기반의 분석과 예측 기능을 결합한 차세대 제조실행시스템입니다."
        lead={GROWXD_LEAD}
        ctaTitle="GrowXD와 함께 자율 제조의 시대를 시작하세요"
        ctaDesc="현장 데이터부터 전사 지표까지 한 흐름으로 잇습니다."
      >
        {GROWXD.map((f, i) => <FeatureBlock key={f.no} f={f} flip={i % 2 === 1} tone={i} />)}
      </SolutionShell>
    </>
  )
}
