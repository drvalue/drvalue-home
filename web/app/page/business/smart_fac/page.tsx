import { PAGE_CSS } from '../max/maxStyles'
import FeaturePage from '../max/FeaturePage'
import { pageMeta } from '@/lib/seo'
import { cmsPageContent } from '@/lib/cms'
import type { FeaturePageContent } from '../../pageContentParts'
import { SMART_FAC_DEFAULT, SMART_FAC_KEY } from './content'

/**
 * /page/business/smart_fac.php 를 옮긴 것. 2026-09-18 옛 꾸밈(가운데 정렬 사진 머리 + 아이콘 카드 + AOS)
 * 에서 M.AX 계열과 같은 틀로 옮겼다 — 한 메뉴 안에서 두 꾸밈이 섞여 난잡했다.
 * 글은 관리 화면의 페이지 글이다 — 못 읽으면 content.ts 의 기본 글(= solutionContent.ts 의 옛 글)로 그린다.
 */
const PATH = '/page/business/smart_fac'

export const dynamic = 'force-dynamic'

export const metadata = pageMeta({
  title: '스마트 팩토리 사업',
  description: '설비와 공정을 디지털로 연결해 실시간 최적화를 실현합니다. AI 자동 견적, IoT 통합 모니터링, MES/ERP 실시간 연계를 제공합니다.',
  path: PATH,
})

export default async function Page() {
  const c = (await cmsPageContent<FeaturePageContent>(SMART_FAC_KEY)) ?? SMART_FAC_DEFAULT
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PAGE_CSS }} />
      <FeaturePage path={PATH} c={c} />
    </>
  )
}
