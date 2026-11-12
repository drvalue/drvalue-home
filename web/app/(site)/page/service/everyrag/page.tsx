import { PAGE_CSS } from '../../business/max/maxStyles'
import SolutionShell from '../../business/max/SolutionShell'
import { Cols, Statement } from '../../business/max/V4'
import { seoMeta } from '@/lib/seo'
import { cmsPageContent } from '@/lib/cms'
import { orUndefined, toHeroShots, toLead } from '../../pageContentParts'
import { EVERYRAG_DEFAULT, EVERYRAG_KEY, EVERYRAG_URL } from './content'

/**
 * everyrag — 디알밸류가 만들어 운영하는 RAG 플랫폼(studio.everyrag.com). 2026-11-12 사용자 요청으로 만들었다.
 *
 * 머리말(둘째 단추 = 서비스 바로가기) · 요약 카드 · 서비스 첫 화면 한 장 · 큰 문장 + 3열 카드 구역 셋.
 * 글은 관리 화면의 페이지 글이다 — 못 읽으면 content.ts 의 기본 글로 그린다. 글의 출처는 content.ts 머리말.
 * 움직이는 시연은 없다 — 서비스 사이트의 채팅 화면은 「예시 화면」이라 실제 화면으로 싣지 않았다.
 */
const PATH = '/page/service/everyrag'

export const dynamic = 'force-dynamic'

export const generateMetadata = seoMeta({
  title: 'everyrag RAG 플랫폼',
  description: '파일·JSON·대화 기록을 넣으면 조각 나누기·임베딩·색인·요약까지 처리하는 RAG 플랫폼. 올린 즉시 채팅으로 시험하고, 답에는 원문 인용이 붙습니다. 디알밸류가 만들어 운영합니다.',
  path: PATH,
})

export default async function Page() {
  const c = (await cmsPageContent(EVERYRAG_KEY)) ?? EVERYRAG_DEFAULT
  const { shell } = c
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PAGE_CSS }} />
      <SolutionShell
        path={PATH}
        look="v4"
        kicker={shell.kicker}
        kickerSub={shell.kickerSub}
        headLead={shell.headLead}
        headStrong={shell.headStrong}
        desc={shell.desc}
        lead={toLead(c.lead)}
        heroShot={toHeroShots(c.heroShots)}
        heroLink={shell.heroLink || 'everyrag 바로가기'}
        heroHref={EVERYRAG_URL}
        ctaTitle={orUndefined(shell.ctaTitle)}
        ctaDesc={orUndefined(shell.ctaDesc)}
      >
        {c.sections.map((s) => (
          <section className="mx_sec4 hk_sec" key={s.title}>
            {s.kicker && <p className="mx_kicker hk_center">{s.kicker}</p>}
            <Statement desc={orUndefined(s.desc)}>
              {s.title}
            </Statement>
            {s.items.length > 0 && <Cols items={s.items} />}
          </section>
        ))}
      </SolutionShell>
    </>
  )
}
