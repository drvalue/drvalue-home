import { PAGE_CSS } from '../maxStyles'
import IndustryPage from '../IndustryPage'
import { seoMeta } from '@/lib/seo'
import { cmsPageContent } from '@/lib/cms'
import { orUndefined, toGroups, toHeroShots, toIndustry } from '../../../pageContentParts'
import { COSMETICS_MES_DEFAULT, COSMETICS_MES_KEY } from './content'

/** 원본 PHP 에 없는 새 페이지다. M.AX 페이지의 「화장품 업종」 탭을 떼어 냈다.
 * 글은 관리 화면의 페이지 글이다 — 못 읽으면 content.ts 의 기본 글(= maxContent.ts 의 옛 글)로 그린다. */
const PATH = '/page/business/max/cosmetics-mes'

export const dynamic = 'force-dynamic'

export const generateMetadata = seoMeta({
  title: '화장품 MES',
  description:
    '화장품 제조를 위한 MES. 연구노트·처방, 견적·수주·출하·수금, 원료 발주·입고, 생산계획·작업지시, 단계별 품질검사, cGMP 양식·감사, 클레임·CAPA, 국가별 규제·MSDS, 공정·설비 모니터링까지 한 시스템입니다.',
  path: PATH,
})

export default async function Page() {
  const c = (await cmsPageContent(COSMETICS_MES_KEY)) ?? COSMETICS_MES_DEFAULT
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
      />
    </>
  )
}
