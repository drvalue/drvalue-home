import { PAGE_CSS } from '../../business/max/maxStyles'
import { FeatureBlock } from '../../business/max/FeatureBlocks'
import SolutionShell from '../../business/max/SolutionShell'
import FeaturePage from '../../business/max/FeaturePage'
import { seoMeta } from '@/lib/seo'
import { cmsPageContent } from '@/lib/cms'
import { GROWTOK_DEFAULT, GROWTOK_KEY } from './content'

/**
 * /page/service/growtok.php 를 옮긴 것. 2026-09-18 옛 꾸밈(가운데 정렬 사진 머리 + 아이콘 카드 + AOS)
 * 에서 M.AX 계열과 같은 틀로 옮겼다 — 한 메뉴 안에서 두 꾸밈이 섞여 난잡했다.
 * 글은 관리 화면의 페이지 글이다 — 못 읽으면 content.ts 의 기본 글(= solutionContent.ts 의 옛 글)로 그린다.
 */
const PATH = '/page/service/growtok'

export const dynamic = 'force-dynamic'

export const generateMetadata = seoMeta({
  title: 'GrowTalk 협업 플랫폼',
  description: '제조·공공기관·쇼핑몰 운영사의 현장 상황을 데이터화해 의사결정을 돕는 협업 플랫폼. 실시간 이슈 공유와 모바일 최적화를 제공합니다.',
  path: PATH,
})

export default async function Page() {
  const c = (await cmsPageContent(GROWTOK_KEY)) ?? GROWTOK_DEFAULT
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PAGE_CSS }} />
      <FeaturePage path={PATH} c={c} />
    </>
  )
}
