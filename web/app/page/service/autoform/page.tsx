import AutoformDemo from '../AutoformDemo'
import AutoformShow from '../AutoformShow'
import { AUTOFORM_CSS } from '../autoformStyles'
import { PAGE_CSS } from '../../business/max/maxStyles'
import SolutionShell from '../../business/max/SolutionShell'
import { Statement } from '../../business/max/V4'
import { pageMeta } from '@/lib/seo'
import { cmsPageContent } from '@/lib/cms'
import CompareBlock from '../CompareBlock'
import { orUndefined, toHeroShots, toLead, type ServiceDemoContent } from '../../pageContentParts'
import { AUTOFORM_DEFAULT, AUTOFORM_KEY } from './content'

/**
 * 오토폼 — 쓰던 한글 양식 그대로 업무 데이터를 채우는 문서 자동화.
 *
 * 2026-09-22 한건 장과 같은 짜임(channel.io/kr/cos)으로 옮겼다:
 *  1) 시연 판 — 실제 화면 세 장이 단계대로 넘어가며 화면에 찍힌 값이 라벨로 뜬다(AutoformDemo)
 *  2) 전/후 — 어두운 카드(문서 만들던 대화) / 밝은 카드(매핑 화면) + ✕ 셋 · ✓ 셋
 *  3) 양식 셋 — 폭 전체 판에 데이터베이스↔양식 카드, 아래 3열 탭이 자동으로 넘어간다(AutoformShow)
 *  (3열 요약은 머리말 요약과 겹쳐 뺐다 — 사용자 지적 09-22)
 *
 * 화면·숫자는 전부 제품 화면(2026년 7월 캡처)에 찍힌 것. 우리가 쓴 문장은 autoformContent.ts
 * 머리말에 적어 두었다 — 사용자 확인 대상. 기능 블록 셋은 뺐다(한건 장에서 사용자가 뺀 것과 같이).
 * 글과 그림은 관리 화면의 페이지 글이다(없으면 content.ts). 시연과 양식 셋은 코드다.
 */
const PATH = '/page/service/autoform'

export const dynamic = 'force-dynamic'

export const metadata = pageMeta({
  title: '오토폼',
  description: '쓰던 한글(HWP·HWPX) 양식을 그대로 등록하고 문서 칸과 업무 데이터를 한 번 맺어 두면, 레코드를 고르는 것만으로 서식 그대로 문서가 나옵니다.',
  path: PATH,
})

export default async function Page() {
  const c = (await cmsPageContent<ServiceDemoContent>(AUTOFORM_KEY)) ?? AUTOFORM_DEFAULT
  const { shell, demo, compareStatement, extra } = c
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PAGE_CSS }} />
      <style dangerouslySetInnerHTML={{ __html: AUTOFORM_CSS }} />
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
        {/* 시연 — 실제 화면 세 장을 단계대로 */}
        <section className="mx_sec4 hk_sec">
          {demo.kicker && <p className="mx_kicker hk_center">{demo.kicker}</p>}
          <Statement desc={orUndefined(demo.desc)}>
            {demo.title}
          </Statement>
          <div className="hk_plate">
            <AutoformDemo />
          </div>
        </section>

        {/* 전/후 */}
        <section className="mx_sec4 hk_sec">
          {compareStatement.kicker && <p className="mx_kicker hk_center">{compareStatement.kicker}</p>}
          <Statement desc={orUndefined(compareStatement.desc)}>
            {compareStatement.title}
          </Statement>
          <CompareBlock c={c.compare} lightClass=" af_light" listsRv="pop" />
        </section>

        {/* 양식 셋 — 등록 화면 목록에 있는 것 */}
        <section className="mx_sec4 hk_sec">
          {extra.kicker && <p className="mx_kicker hk_center">{extra.kicker}</p>}
          <Statement desc={orUndefined(extra.desc)}>
            {extra.title}
          </Statement>
          <AutoformShow />
        </section>

      </SolutionShell>
    </>
  )
}
