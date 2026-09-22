import { SMARTFAC, SMARTFAC_LEAD } from '../../service/solutionContent'
import { PAGE_CSS } from '../max/maxStyles'
import SolutionShell from '../max/SolutionShell'
import { FeatureBlock } from '../max/FeatureBlocks'
import { seoMeta } from '@/lib/seo'

/**
 * /page/business/smart_fac.php 를 옮긴 것. 2026-09-18 옛 꾸밈(가운데 정렬 사진 머리 + 아이콘 카드 + AOS)
 * 에서 M.AX 계열과 같은 틀로 옮겼다 — 한 메뉴 안에서 두 꾸밈이 섞여 난잡했다.
 * 글은 solutionContent.ts 에 그대로 옮겨 두었다. 새로 지은 문장은 없다.
 */
const PATH = '/page/business/smart_fac'

export const generateMetadata = seoMeta({
  title: '스마트 팩토리 사업',
  description: '설비와 공정을 디지털로 연결해 실시간 최적화를 실현합니다. AI 자동 견적, IoT 통합 모니터링, MES/ERP 실시간 연계를 제공합니다.',
  path: PATH,
})

export default function Page() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PAGE_CSS }} />
      <SolutionShell
        path={PATH}
        look="v4"
        kicker="스마트 팩토리 사업"
        kickerSub="M.AX"
        headLead="제조 현장의 가치를 데이터로, "
        headStrong="디알밸류 스마트팩토리 솔루션"
        desc="생산성은 높이고, 비용은 낮추는 지능형 공장 구축의 표준"
        lead={SMARTFAC_LEAD}
        ctaTitle="디알밸류와 함께 제조업의 혁신을 시작하세요."
        ctaDesc="현장 진단부터 정부지원사업 연계까지 전문가가 직접 상담해 드립니다."
      >
        {SMARTFAC.map((f, i) => <FeatureBlock key={f.no} f={f} flip={i % 2 === 1} tone={i} />)}
      </SolutionShell>
    </>
  )
}
