import FlowBand from './FlowBand'
import SolutionShell from './SolutionShell'
import { Statement } from './V4'
import { Showcase } from './Patterns'
import { PAGE_CSS } from './maxStyles'
import { MENU_ITEMS } from '@/lib/menu'
import { menuLabelOf } from '@/lib/menu-cms'
import { pageMeta } from '@/lib/seo'
import { cmsPageContent } from '@/lib/cms'
import { orUndefined, toHeroShots, toShot, type IndustryContent, type MaxHubContent, type MesAiContent, type ShowcaseCardContent } from '../../pageContentParts'
import { MAX_HUB_DEFAULT, MAX_HUB_KEY } from './content'
import { PCB_MES_DEFAULT, PCB_MES_KEY } from './pcb-mes/content'
import { COSMETICS_MES_DEFAULT, COSMETICS_MES_KEY } from './cosmetics-mes/content'
import { MES_AI_DEFAULT, MES_AI_KEY } from './mes-ai/content'

/**
 * 제조AI(M.AX) 소개 — 허브. 옮긴 페이지가 아니라 새로 만든 장이라 대조(compare.py) 대상이 아니다.
 *
 * 2026-09-22 저녁, 사용자가 지정한 두 레퍼런스(channel.io/kr/marketing · /documents)의 느낌만 쓴다 —
 * 큰 제목(64/600) · 알약 kicker · 한 색(강철빛) 틴트 판 · 흰/틴트/어두운 구역 번갈아. 골격:
 * 머리말(화면이 몇 초마다 넘어감) → 인증 띠 → 큰 문장 + 제품군 Showcase(알약 탭 + 큰 카드 + ‹ ›, alf-customer)
 * → 제조 흐름(어두운 판, meet/call IVR 구역) → 문의.
 *
 * 글은 관리 화면의 페이지 글이다(없으면 content.ts). 제품군 카드의 제목·설명은 하위 장(PCB MES · 화장품 MES ·
 * MES AI)의 페이지 글 머리말을 그대로 쓴다. 구역 차례는 메뉴(lib/menu.ts)에서 온다. 옛 「판 + 정지 3열 + 과제 카드」 제품군
 * 구역(Tabbed/Group/CaseCard)은 뺐다 — 게이지 탭은 하위 장이 맡는다. KPI 대시보드 화면은 안 쓴다(사용자:
 * 「우리 KPI 아니잖아」 — 시연 값이라 대표 화면으로 못 세운다).
 */
const PATH = '/page/business/max'

// 구역 차례·링크는 코드 메뉴가 정한다 — 관리 화면에서 순서를 바꾸거나 숨겨도 구역이 엇갈리지 않게.
// 탭 글자만 관리 화면 이름을 따른다(menuLabelOf, 주소로 찾는다).
const SUB = (MENU_ITEMS.find((m) => m.title === 'M.AX')?.sub ?? []).filter((s) => !s.hidden && s.l !== PATH)

export const dynamic = 'force-dynamic'

export const metadata = pageMeta({
  title: '제조AI(M.AX)',
  description:
    '견적부터 출고까지 하나의 흐름으로 연결된 업종 특화 MES 와 제조 AI. PCB·화장품 업종 특화 기능과 5대 제조 AI 를 제공합니다.',
  path: PATH,
})

/** 카드 그림이 비었으면 기본 글의 그림 — Showcase 는 그림 없는 카드를 그리지 못한다. */
const cardShot = (card: ShowcaseCardContent, fallback: ShowcaseCardContent) => (toShot(card.shot) ?? toShot(fallback.shot))!

export default async function Page() {
  const [labelOf, hub, pcbPage, cosPage, aiPage] = await Promise.all([
    menuLabelOf(),
    cmsPageContent<MaxHubContent>(MAX_HUB_KEY),
    cmsPageContent<IndustryContent>(PCB_MES_KEY),
    cmsPageContent<IndustryContent>(COSMETICS_MES_KEY),
    cmsPageContent<MesAiContent>(MES_AI_KEY),
  ])
  const c = hub ?? MAX_HUB_DEFAULT
  const pcb = (pcbPage ?? PCB_MES_DEFAULT).shell
  const cos = (cosPage ?? COSMETICS_MES_DEFAULT).shell
  const ai = (aiPage ?? MES_AI_DEFAULT).shell
  const { shell, statement } = c
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PAGE_CSS }} />
      <SolutionShell
        path={PATH}
        look="v4"
        proof
        kicker={shell.kicker}
        kickerSub={shell.kickerSub}
        headLead={shell.headLead}
        headStrong={shell.headStrong}
        desc={shell.desc}
        heroLink={orUndefined(shell.heroLink)}
        heroShot={toHeroShots(c.heroShots)}
        ctaTitle={orUndefined(shell.ctaTitle)}
        ctaDesc={orUndefined(shell.ctaDesc)}
      >
        <section className="mx_sec4 big" id="mx_body">
          {statement.kicker && <p className="mx_kicker hk_center">{statement.kicker}</p>}
          <Statement desc={orUndefined(statement.desc)}>
            {statement.title}
          </Statement>
          <Showcase items={[
            { tab: labelOf(SUB[0].l, SUB[0].t), id: 'pcb-mes', kicker: c.pcbCard.kicker, headLead: pcb.headLead, headStrong: pcb.headStrong, desc: pcb.desc, href: SUB[0].l,
              shot: cardShot(c.pcbCard, MAX_HUB_DEFAULT.pcbCard), url: c.pcbCard.url },
            { tab: labelOf(SUB[1].l, SUB[1].t), id: 'cosmetics-mes', kicker: c.cosCard.kicker, headLead: cos.headLead, headStrong: cos.headStrong, desc: cos.desc, href: SUB[1].l,
              shot: cardShot(c.cosCard, MAX_HUB_DEFAULT.cosCard), url: c.cosCard.url },
            { tab: labelOf(SUB[2].l, SUB[2].t), id: 'mes-ai', kicker: c.aiCard.kicker, headLead: ai.headLead, headStrong: ai.headStrong, desc: ai.desc, href: SUB[2].l,
              shot: cardShot(c.aiCard, MAX_HUB_DEFAULT.aiCard), url: c.aiCard.url },
          ]} />
        </section>

        <FlowBand />
      </SolutionShell>
    </>
  )
}
