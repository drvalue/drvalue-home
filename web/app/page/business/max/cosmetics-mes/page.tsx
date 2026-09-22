import { PAGE_CSS } from '../maxStyles'
import IndustryPage from '../IndustryPage'
import { pageMeta } from '@/lib/seo'
import { cmsPageContent } from '@/lib/cms'
import { orUndefined, toGroups, toHeroShots, toIndustry, type IndustryContent } from '../../../pageContentParts'
import { COSMETICS_MES_DEFAULT, COSMETICS_MES_KEY } from './content'

/** 원본 PHP 에 없는 새 페이지다. M.AX 페이지의 「화장품 업종」 탭을 떼어 냈다.
 * 글은 관리 화면의 페이지 글이다 — 못 읽으면 content.ts 의 기본 글(= maxContent.ts 의 옛 글)로 그린다. */
const PATH = '/page/business/max/cosmetics-mes'

export const dynamic = 'force-dynamic'

export const metadata = pageMeta({
  title: '화장품 MES',
  description:
    '화장품 제조를 위한 MES. 배합과 LOT 이력, 원료·부자재 입출고, 공정과 품질 기록을 이어 붙여 출하까지의 근거를 남깁니다.',
  path: PATH,
})

export default async function Page() {
  const c = (await cmsPageContent<IndustryContent>(COSMETICS_MES_KEY)) ?? COSMETICS_MES_DEFAULT
  const { shell } = c
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PAGE_CSS }} />
      <IndustryPage
        path={PATH}
        kicker={shell.kicker}
        kickerSub={shell.kickerSub}
        ctaTitle={orUndefined(shell.ctaTitle)}
        ctaDesc={orUndefined(shell.ctaDesc)}
        ind={toIndustry(c, 'cos', '화장품 업종')}
        heroShot={toHeroShots(c.heroShots)}
        groups={toGroups(c)}
        {...(c.kpi ? { kpi: c.kpi } : {})}
      />
    </>
  )
}
