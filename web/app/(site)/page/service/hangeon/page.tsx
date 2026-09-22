import { HK_HONEST } from '../hankeonContent'
import HankeonDemo from '../HankeonDemo'
import BizShowcase from '../BizShowcase'
import { PAGE_CSS } from '../../business/max/maxStyles'
import SolutionShell from '../../business/max/SolutionShell'
import { Statement } from '../../business/max/V4'
import { seoMeta } from '@/lib/seo'
import { cmsPageContent } from '@/lib/cms'
import CompareBlock from '../CompareBlock'
import { orUndefined, toHeroShots, toLead } from '../../pageContentParts'
import { HANGEON_DEFAULT, HANGEON_KEY } from './content'

/**
 * 한건(hankeon.com) — 디알밸류가 만들어 상용 운영 중인 건설 AI.
 *
 * 2026-09-22 사용자 지시로 channel.io/kr/cos 의 두 구역을 옮겼다:
 *  1) 대화 시연 판 — 실제 질문이 타이핑되고 진행 단계·답·인용 조문이 순서대로 뜬다(HankeonDemo)
 *  2) 전/후 대비 — 어두운 카드(자료 뒤지던 대화) / 밝은 카드(실제 화면) + ✕ 셋 · ✓ 셋
 * 그리고 Biz(맞춤 입찰 검색)를 부산 소재 건축공사업 프로필로 실제 조회한 결과.
 *
 * 화면·답·건수는 전부 그날 서비스에 로그인해 받은 것(hankeonContent.ts). 우리가 쓴 문장은
 * 히어로 제목·설명, 큰 문장 넷과 그 설명, 전/후 카드 제목·말풍선·✕·✓, 「모르면 모른다」 본문.
 * 사용자가 2026-09-22 「알아서 맞추라」고 했다. 같은 날 맨 아래 기능 블록 둘(「무엇인가」·
 * 「같은 구조, 다른 현장」)은 빼라고 해서 뺐다 — 시연·전후·Biz 가 이미 그 말을 한다.
 */
const PATH = '/page/service/hangeon'

export const dynamic = 'force-dynamic'

export const generateMetadata = seoMeta({
  title: '한건 AI Chat',
  description:
    'LLM·RAG 기반 건설 AI. KCS·KDS·표준품셈과 법령을 근거로 답하고, 나라장터 공고를 면허 기준으로 가려 줍니다. 디알밸류가 만들어 상용으로 운영 중입니다.',
  path: PATH,
})

export default async function Page() {
  const c = (await cmsPageContent(HANGEON_KEY)) ?? HANGEON_DEFAULT
  const { shell, demo, compareStatement, extra } = c
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
        ctaTitle={orUndefined(shell.ctaTitle)}
        ctaDesc={orUndefined(shell.ctaDesc)}
      >
        {/* 대화 시연 — 실제 질문·단계·답을 순서대로 */}
        <section className="mx_sec4 hk_sec">
          {demo.kicker && <p className="mx_kicker hk_center">{demo.kicker}</p>}
          <Statement desc={orUndefined(demo.desc)}>
            {demo.title}
          </Statement>
          <div className="hk_plate">
            <HankeonDemo />
          </div>
        </section>

        {/* 전/후 */}
        <section className="mx_sec4 hk_sec">
          {compareStatement.kicker && <p className="mx_kicker hk_center">{compareStatement.kicker}</p>}
          <Statement desc={orUndefined(compareStatement.desc)}>
            {compareStatement.title}
          </Statement>
          <CompareBlock c={c.compare} />
        </section>

        {/* 모르면 모른다 — 실제 응답(기록이라 코드에 둔다) */}
        <section className="mx_sec4 hk_sec">
          <div className="hk_honest" data-rv>
            <div>
              <p className="mx_kicker">모르면 모른다고 답합니다</p>
              <h3>근거가 없으면 확정하지 않습니다</h3>
              <p>같은 날 던진 다른 질문 — 자료에 없는 것은 없다고 답하고, 무엇을 더 확인해야 하는지 적어 줍니다. 근거 {HK_HONEST.evidence}건을 찾고도 그렇게 답했습니다.</p>
            </div>
            <blockquote>
              <p className="hk_hq">{HK_HONEST.q}</p>
              <p className="hk_ha">{HK_HONEST.a}</p>
              <p className="hk_hn">{HK_HONEST.note}</p>
            </blockquote>
          </div>
        </section>

        {/* Biz */}
        <section className="mx_sec4 hk_sec">
          {extra.kicker && <p className="mx_kicker hk_center">{extra.kicker}</p>}
          <Statement desc={orUndefined(extra.desc)}>
            {extra.title}
          </Statement>
          {/* 판정 셋 — 채널톡 온사이트 장의 짜임(09-22 사용자 지목): 왼쪽 사진 판 위에 제품 카드가 떠 있고,
              오른쪽에 제목·설명·「판정 예시」 목록. 목록을 누르면 왼쪽 카드가 바뀐다. 카드 값은 실제 화면 그대로. */}
          <BizShowcase />
        </section>

      </SolutionShell>
    </>
  )
}
