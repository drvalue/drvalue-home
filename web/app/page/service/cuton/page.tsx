import CutonDemo from '../CutonDemo'
import CutonShow from './CutonShow'
import { CUTON_CSS } from '../cutonStyles'
import { PAGE_CSS } from '../../business/max/maxStyles'
import SolutionShell from '../../business/max/SolutionShell'
import { Statement } from '../../business/max/V4'
import { pageMeta } from '@/lib/seo'
import { cmsPageContent } from '@/lib/cms'
import CompareBlock from '../CompareBlock'
import { orUndefined, toHeroShots, toLead, type ServiceDemoContent } from '../../pageContentParts'
import { CUTON_DEFAULT, CUTON_KEY } from './content'

/**
 * 컷온(CutOn) — 디알밸류가 만들어 운영하는 레이저 절단 자동 견적 플랫폼(cuton.co.kr).
 *
 * 2026-09-22 한건 장과 같은 짜임(channel.io/kr/cos)으로 다시 세웠다:
 *  1) 시연 판 — 체험 가이드 「예상견적산출」이 순서대로 다시 돈다(CutonDemo)
 *  2) 전/후 — 도면 보내고 기다리던 대화 / 보관함 실제 화면 + ✕ 셋 · ✓ 셋
 *  3) 세 화면 — 예상견적산출 · 보관함 · 입찰마켓, 폭 전체 판 + 자동 넘김 탭(CutonShow)
 *
 * 화면·값은 전부 cuton.co.kr 공개 체험 가이드에서 로그인 없이 받은 것(cutonContent.ts). 가이드 값은
 * 컷온이 만든 예시 값이라 장에도 그렇게 적는다. 우리가 쓴 문장은 cutonContent.ts 머리말에 적었다.
 * 옛 기능 블록(FeatureBlocks)은 뺐다 — 한건 장에서 사용자가 뺀 것과 같은 결정.
 */
const PATH = '/page/service/cuton'

export const dynamic = 'force-dynamic'

export const metadata = pageMeta({
  title: '컷온(CutOn) AI 자동 견적',
  description: '도면(DXF)을 올리면 AI 가 형상을 분석해 재질·두께·수량 기준 레이저 절단 견적을 즉시 산출합니다. 보관함에 저장하고 입찰마켓에 올려 파트너 업체의 제안을 받습니다. 디알밸류가 만들어 운영합니다.',
  path: PATH,
})

export default async function Page() {
  const c = (await cmsPageContent<ServiceDemoContent>(CUTON_KEY)) ?? CUTON_DEFAULT
  const { shell, demo, compareStatement, extra } = c
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PAGE_CSS }} />
      <style dangerouslySetInnerHTML={{ __html: CUTON_CSS }} />
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
        ctaTitle={orUndefined(shell.ctaTitle)}
        ctaDesc={orUndefined(shell.ctaDesc)}
      >
        <section className="mx_sec4 hk_sec">
          {demo.kicker && <p className="mx_kicker hk_center">{demo.kicker}</p>}
          <Statement desc={orUndefined(demo.desc)}>
            {demo.title}
          </Statement>
          <div className="hk_plate">
            <CutonDemo />
          </div>
        </section>

        {/* 전/후 */}
        <section className="mx_sec4 hk_sec">
          {compareStatement.kicker && <p className="mx_kicker hk_center">{compareStatement.kicker}</p>}
          <Statement desc={orUndefined(compareStatement.desc)}>
            {compareStatement.title}
          </Statement>
          <CompareBlock c={c.compare} lightClass=" ct_light" />
        </section>

        <section className="mx_sec4 hk_sec">
          {extra.kicker && <p className="mx_kicker hk_center">{extra.kicker}</p>}
          <Statement desc={orUndefined(extra.desc)}>
            {extra.title}
          </Statement>
          <CutonShow />
        </section>

      </SolutionShell>
    </>
  )
}
