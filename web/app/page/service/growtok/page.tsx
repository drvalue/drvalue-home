import { GROWTOK, GROWTOK_LEAD } from '../solutionContent'
import { PAGE_CSS } from '../../business/max/maxStyles'
import SolutionShell from '../../business/max/SolutionShell'
import { FeatureBlock } from '../../business/max/FeatureBlocks'
import { seoMeta } from '@/lib/seo'

/**
 * /page/service/growtok.php 를 옮긴 것. 2026-09-18 옛 꾸밈(가운데 정렬 사진 머리 + 아이콘 카드 + AOS)
 * 에서 M.AX 계열과 같은 틀로 옮겼다 — 한 메뉴 안에서 두 꾸밈이 섞여 난잡했다.
 * 글은 solutionContent.ts 에 그대로 옮겨 두었다. 새로 지은 문장은 없다.
 */
const PATH = '/page/service/growtok'

export const generateMetadata = seoMeta({
  title: 'GrowTalk 협업 플랫폼',
  description: '제조·공공기관·쇼핑몰 운영사의 현장 상황을 데이터화해 의사결정을 돕는 협업 플랫폼. 실시간 이슈 공유와 모바일 최적화를 제공합니다.',
  path: PATH,
})

export default function Page() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PAGE_CSS }} />
      <SolutionShell
        path={PATH}
        look="v4"
        kicker="GrowTalk"
        kickerSub="AI솔루션"
        headLead="현장의 목소리를 데이터로, "
        headStrong="지능형 협업 플랫폼 GrowTalk"
        desc="제조·공공기관·쇼핑몰 운영사 등 현장의 실시간 상황을 데이터화하여 신속한 의사결정을 돕는 스마트 협업 플랫폼입니다."
        lead={GROWTOK_LEAD}
        ctaTitle="GrowTalk으로 스마트한 현장을 만들어보세요"
        ctaDesc="현장과 사무실이 같은 화면에서 이야기합니다."
      >
        {GROWTOK.map((f, i) => <FeatureBlock key={f.no} f={f} flip={i % 2 === 1} tone={i} />)}
      </SolutionShell>
    </>
  )
}
