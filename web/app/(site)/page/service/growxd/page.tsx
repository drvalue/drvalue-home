import { PAGE_CSS } from '../../business/max/maxStyles'
import { FeatureBlock } from '../../business/max/FeatureBlocks'
import SolutionShell from '../../business/max/SolutionShell'
import FeaturePage from '../../business/max/FeaturePage'
import { seoMeta } from '@/lib/seo'
import { cmsPageContent } from '@/lib/cms'
import { GROWXD_DEFAULT, GROWXD_KEY } from './content'

/**
 * /page/service/growxd.php 를 옮긴 것. 2026-09-18 옛 꾸밈(가운데 정렬 사진 머리 + 아이콘 카드 + AOS)
 * 에서 M.AX 계열과 같은 틀로 옮겼다 — 한 메뉴 안에서 두 꾸밈이 섞여 난잡했다.
 * 글은 관리 화면의 페이지 글이다 — 못 읽으면 content.ts 의 기본 글(= solutionContent.ts 의 옛 글)로 그린다.
 */
const PATH = '/page/service/growxd'

export const dynamic = 'force-dynamic'

export const generateMetadata = seoMeta({
  title: 'GrowXD 생산관리시스템',
  description: '실적 수집(MES)을 넘어 AI 분석·예측을 결합한 차세대 제조실행시스템. 현장 장비부터 전사 지표까지 한 흐름으로 잇습니다.',
  path: PATH,
})

export default async function Page() {
  const c = (await cmsPageContent(GROWXD_KEY)) ?? GROWXD_DEFAULT
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PAGE_CSS }} />
      <FeaturePage path={PATH} c={c} />
    </>
  )
}
