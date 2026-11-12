import EveryragDemo from '../EveryragDemo'
import { ER_CODE } from '../everyragContent'
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
 *  3) 시작하기 — 서비스 사이트의 curl 두 번(넣기 · 묻기) + 단계 카드 셋
 * 머리말 둘째 단추는 서비스로 가는 바깥 링크다. 글은 관리 화면의 페이지 글, 못 읽으면 content.ts 기본 글.
 * 고객 사례 · 성능 수치는 없다 — 서비스 사이트가 「공개할 고객은 아직 없다」고 적어 둔 그대로라 싣지 않았다.
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

        {/* 시작하기 — 서비스 사이트의 curl 두 번. 코드는 자기 칸 안에서만 옆으로 민다. */}
        <section className="mx_sec4 hk_sec">
          {extra.kicker && <p className="mx_kicker hk_center">{extra.kicker}</p>}
          <Statement desc={orUndefined(extra.desc)}>
            {extra.title}
          </Statement>
          <pre className="er_code" tabIndex={0} aria-label="everyrag API 호출 예시 — 자료 넣기와 물어보기" data-rv>
            {ER_CODE.map((line, i) => (
              <span key={i} className={line.startsWith('#') ? 'c' : undefined}>{line + '\n'}</span>
            ))}
          </pre>
          <p className="er_code_note">YOUR_HOST 는 자리표시자입니다. 실제 주소는 콘솔 컬렉션 화면의 Host 값입니다.</p>
          {c.steps.length > 0 && <Cols items={c.steps} />}
        </section>
      </SolutionShell>
    </>
  )
}
