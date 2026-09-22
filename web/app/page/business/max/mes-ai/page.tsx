import { PAGE_CSS } from '../maxStyles'
import SolutionShell from '../SolutionShell'
import { Bento, FlowCard } from '../Patterns'
import { seoMeta } from '@/lib/seo'
import { cmsPageContent } from '@/lib/cms'
import { orUndefined, texts, toHeroShots, toLead, toShot, toTone, type MesAiContent } from '../../../pageContentParts'
import { MES_AI_DEFAULT, MES_AI_KEY } from './content'

/**
 * 원본 PHP 에 없는 새 페이지다. M.AX 의 「제조 특화 AI」 탭에서 세 기능을 떼어 냈다.
 *
 * 2026-09-22 저녁 — channel.io/kr/marketing · /documents 의 느낌으로 다시 그렸다: 알약 kicker ·
 * 큰 가운데 제목 · 강철빛 틴트 한 색 · 흰/틴트 구역 번갈아.
 *  1) Bento(틴트 구역): 세 기능의 실제 화면 — 넓은 카드 하나 + 반 카드 둘
 *  2) FlowCard × 3(흰 구역): 기능마다 단계가 ↓ 로 이어진다. 문서가 들어와 값이 뽑히고 대조되어
 *     들어가는 순서라 번호가 장식이 아니다(옛 AiSteps 의 주석 그대로).
 * 글은 관리 화면의 페이지 글이다 — 못 읽으면 content.ts 의 기본 글(= maxContent.ts 의 AI_FEATURES·AI_LEAD)로 그린다.
 * 양식 자동생성(a2)과 고객 응대 챗봇(a5)은 각자 페이지가 따로 있다. 여기는 MES 안에서 도는 셋만 — 읽기·대조하기·물어보기.
 */
const PATH = '/page/business/max/mes-ai'

export const dynamic = 'force-dynamic'

export const generateMetadata = seoMeta({
  title: 'MES AI',
  description:
    '거래명세서·성적서를 OCR 로 읽어 MES 에 자동 입고하고, 국가별 규제를 자동 대조해 검증하며, 쌓인 제조 지식을 대화로 꺼내 씁니다.',
  path: PATH,
})

export default async function Page() {
  const c = (await cmsPageContent<MesAiContent>(MES_AI_KEY)) ?? MES_AI_DEFAULT
  const { shell, bento } = c
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
        <Bento
          kicker={orUndefined(bento.kicker)}
          title={bento.title}
          desc={orUndefined(bento.desc)}
          items={c.ais.map((a) => ({
            t: a.title,
            d: a.desc,
            ...(toShot(a.shot) ? { shot: toShot(a.shot)! } : {}),
            url: a.url,
          }))}
        />

        {c.ais.map((a, i) => (
          <section className="mx_sec4" key={i}>
            <div className="mx_wrap">
              <p className="mx_kicker hk_center">{a.label}</p>
              <FlowCard title={a.title} desc={a.desc} steps={texts(a.steps)} tone={toTone(a.tone)} />
            </div>
          </section>
        ))}
      </SolutionShell>
    </>
  )
}
