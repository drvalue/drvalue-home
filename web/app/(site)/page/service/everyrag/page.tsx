import EveryragDemo from '../EveryragDemo'
import { EVERYRAG_CSS } from '../everyragStyles'
import { PAGE_CSS } from '../../business/max/maxStyles'
import SolutionShell from '../../business/max/SolutionShell'
import { Cols, Statement } from '../../business/max/V4'
import { seoMeta } from '@/lib/seo'
import { cmsPageContent } from '@/lib/cms'
import CompareBlock from '../CompareBlock'
import { orUndefined, toHeroShots, toLead } from '../../pageContentParts'
import { EVERYRAG_DEFAULT, EVERYRAG_KEY, EVERYRAG_URL } from './content'

/**
 * everyrag — 디알밸류가 만들어 운영하는 RAG 플랫폼(studio.everyrag.com). 2026-11-12 사용자 요청으로 만들었다.
 *
 * 처음 판은 글 카드에 서비스 사이트 캡처를 얹은 것이었는데 사용자가 「별로」라고 했다. 다른 RAG 제품 장
 * (Pinecone Assistant · 올거나이즈 Alli)과 이 사이트의 오토폼 · 한건 장을 보고 같은 짜임으로 다시 세웠다:
 *  1) 대화 시연 — 예시 대화 셋이 순서대로 뜬다: 인용이 붙은 답 / 없다는 답 / 「자료 밖」 답(EveryragDemo)
 *  2) 전/후 — 직접 만들던 대화(어두운 카드) / 서비스 화면(밝은 카드) + ✕ 셋 · ✓ 셋
 *  3) 시작하기 — 단계 카드 셋(올리기 · 자동 요약 · 묻고 확인하기)
 * 같은 날 사용자: 「너무 개발자용 같다」 — API 키 · 임베딩 · curl 코드를 빼고, 문서를 찾는 사람의 말로 다시 썼다
 * (서비스 사이트의 Business 쪽 문장). 개발팀용 연동 얘기는 싣지 않는다 — 「everyrag 바로가기」로 넘어가면 문서가 있다.
 * 머리말 둘째 단추는 서비스로 가는 바깥 링크다. 글은 관리 화면의 페이지 글, 못 읽으면 content.ts 기본 글.
 * 고객 사례 · 성능 수치는 없다 — 서비스 사이트가 「공개할 고객은 아직 없다」고 적어 둔 그대로라 싣지 않았다.
 */
const PATH = '/page/service/everyrag'

export const dynamic = 'force-dynamic'

export const generateMetadata = seoMeta({
  title: 'everyrag 사내 문서 AI',
  description: '쌓인 문서와 대화를 올려 두면 채팅으로 바로 물어볼 수 있습니다. 답에는 원문 인용이 붙고, 자료에 없으면 없다고 답합니다. 디알밸류가 만들어 운영합니다.',
  path: PATH,
})

export default async function Page() {
  const c = (await cmsPageContent(EVERYRAG_KEY)) ?? EVERYRAG_DEFAULT
  const { shell, demo, compareStatement, extra } = c
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PAGE_CSS }} />
      <style dangerouslySetInnerHTML={{ __html: EVERYRAG_CSS }} />
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
        {/* 대화 시연 — 예시 대화 셋을 순서대로 */}
        <section className="mx_sec4 hk_sec">
          {demo.kicker && <p className="mx_kicker hk_center">{demo.kicker}</p>}
          <Statement desc={orUndefined(demo.desc)}>
            {demo.title}
          </Statement>
          <div className="hk_plate">
            <EveryragDemo />
          </div>
        </section>

        {/* 전/후 */}
        <section className="mx_sec4 hk_sec">
          {compareStatement.kicker && <p className="mx_kicker hk_center">{compareStatement.kicker}</p>}
          <Statement desc={orUndefined(compareStatement.desc)}>
            {compareStatement.title}
          </Statement>
          <CompareBlock c={c.compare} lightClass=" er_light" />
        </section>

        {/* 시작하기 — 올리고 · 정리되고 · 묻는다. 코드는 싣지 않는다(보는 사람은 도입 담당자다). */}
        <section className="mx_sec4 hk_sec">
          {extra.kicker && <p className="mx_kicker hk_center">{extra.kicker}</p>}
          <Statement desc={orUndefined(extra.desc)}>
            {extra.title}
          </Statement>
          {c.steps.length > 0 && <Cols items={c.steps} />}
        </section>
      </SolutionShell>
    </>
  )
}
