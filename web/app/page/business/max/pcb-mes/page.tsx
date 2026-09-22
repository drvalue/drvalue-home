import { PAGE_CSS } from '../maxStyles'
import IndustryPage from '../IndustryPage'
import { seoMeta } from '@/lib/seo'
import { cmsPageContent } from '@/lib/cms'
import { orUndefined, toGroups, toHeroShots, toIndustry, type IndustryContent } from '../../../pageContentParts'
import { PCB_MES_DEFAULT, PCB_MES_KEY } from './content'

/** 원본 PHP 에 없는 새 페이지다. M.AX 페이지의 「PCB 업종」 탭을 떼어 냈다.
 * 글은 관리 화면의 페이지 글이다 — 못 읽으면 content.ts 의 기본 글(= maxContent.ts 의 옛 글)로 그린다. */
const PATH = '/page/business/max/pcb-mes'

export const dynamic = 'force-dynamic'

export const generateMetadata = seoMeta({
  title: 'PCB MES',
  description:
    '소량 다품종 샘플 PCB 를 위한 MES. 수십 항목의 사양 검증, 수율을 높이는 원판 배치, 내·외주 공정 진척과 거래 명세를 하나의 흐름으로 관리합니다.',
  path: PATH,
})

export default async function Page() {
  const c = (await cmsPageContent<IndustryContent>(PCB_MES_KEY)) ?? PCB_MES_DEFAULT
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
        ind={toIndustry(c, 'pcb', 'PCB 업종')}
        heroShot={toHeroShots(c.heroShots)}
        groups={toGroups(c)}
        {...(c.kpi ? { kpi: c.kpi } : {})}
      />
    </>
  )
}
