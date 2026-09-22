import { PAGE_CSS } from '../max/maxStyles'
import SolutionShell from '../max/SolutionShell'
import { Group, Statement } from '../max/V4'
import Tabbed from '../max/Tabbed'
import ShowTabs from '../max/ShowTabs'
import type { Lead } from '../max/SolutionShell'
import { plain } from '../max/text'
import { seoMeta } from '@/lib/seo'
import { MENU_ITEMS } from '@/lib/menu'
import { menuLabelOf } from '@/lib/menu-cms'
import { cmsPageContent } from '@/lib/cms'
import { orUndefined, toHeroShots, toLead, toShot, toTone, type AiSolContent, type ChatContent, type LeadContent, type ServiceDemoContent, type ShowTabContent } from '../../pageContentParts'
import type { ShowItem } from '../max/ShowTabs'
import { AI_SOL_DEFAULT, AI_SOL_KEY } from './content'
import { AUTOFORM_DEFAULT, AUTOFORM_KEY } from '../../service/autoform/content'
import { CUTON_DEFAULT, CUTON_KEY } from '../../service/cuton/content'
import { CADON_DEFAULT, CADON_KEY } from '../../service/cadon/content'
import { CHAT_DEFAULT, CHAT_KEY } from '../../service/chat/content'
import { HANGEON_DEFAULT, HANGEON_KEY } from '../../service/hangeon/content'

/**
 * /page/business/ai_sol.php 를 옮긴 것. 2026-09-22 사용자가 지정한 레퍼런스(channel.io/kr/works)
 * 골격으로 다시 그렸다 — 가운데 머리말 + 판 → 인증 띠 → 큰 문장·3열(세 방식) → 로드맵 3열 →
 * 제품군 구역 다섯(오토폼·컷온·CADON·채팅·한건: 알약 탭·제목·판·3열) → 문의.
 * 글은 관리 화면의 페이지 글이다(없으면 content.ts = solutionContent.ts 의 옛 글). 제품군 구역의 제목·설명은
 * 각 서비스 장의 요약 칸을, 탭은 이 장의 글을 쓴다. 수행 과제 카드는 사용자 지시로 뺐다(09-22).
 */
const PATH = '/page/business/ai_sol'

export const generateMetadata = seoMeta({
  title: 'AI 솔루션 개발',
  description: '최신 LLM 부터 보안이 강조된 온프레미스 로컬 AI 까지. 기업 내부 데이터를 기반으로 답변하는 RAG 시스템을 구축합니다.',
  path: PATH,
})

// 구역 차례·링크는 코드 메뉴가 정한다(href('오토폼') 처럼 코드 이름으로 찾는다) — 관리 화면에서
// 이름을 바꾸거나 숨겨도 구역과 탭이 엇갈리지 않게. 탭 글자만 관리 화면 이름을 따른다(Page 안).
const SUB = (MENU_ITEMS.find((m) => m.title === 'AI솔루션')?.sub ?? []).filter((s) => !s.hidden && s.l !== PATH)
const TABS = SUB.map((s) => ({ t: s.t, id: s.l.split('/').pop()! }))
const at = (name: string) => TABS.findIndex((t) => t.t === name)
const href = (name: string) => SUB[at(name)].l
/** 구역 설명 — 요약 칸의 설명, 없으면 큰 값 설명(옛 leadDesc 와 같다). */
const leadDesc = (l: LeadContent) => l.desc || l.heroLabel || ''
/** 탭 글 → ShowTabs 항목. 그림이 비었으면 그 탭은 뺀다(판은 그림이 있어야 그린다). */
const tabsOf = (xs: ShowTabContent[]): ShowItem[] =>
  xs.flatMap((x) => {
    const shot = toShot(x.image)
    return shot ? [{ t: x.t, d: x.d, tone: toTone(x.tone), tag: x.tag, url: x.url, shot }] : []
  })

export const dynamic = 'force-dynamic'

export default async function Page() {
  const [labelOf, own, af, ct, cd, ch, hk] = await Promise.all([
    menuLabelOf(),
    cmsPageContent<AiSolContent>(AI_SOL_KEY),
    cmsPageContent<ServiceDemoContent>(AUTOFORM_KEY),
    cmsPageContent<ServiceDemoContent>(CUTON_KEY),
    cmsPageContent<ServiceDemoContent>(CADON_KEY),
    cmsPageContent<ChatContent>(CHAT_KEY),
    cmsPageContent<ServiceDemoContent>(HANGEON_KEY),
  ])
  const c = own ?? AI_SOL_DEFAULT
  const autoform = (af ?? AUTOFORM_DEFAULT).lead
  const cuton = (ct ?? CUTON_DEFAULT).lead
  const cadon = (cd ?? CADON_DEFAULT).lead
  const chat = (ch ?? CHAT_DEFAULT).lead
  const hangeon = (hk ?? HANGEON_DEFAULT).lead
  const { shell, road } = c
  const tabs = SUB.map((s, i) => ({ ...TABS[i], t: labelOf(s.l, s.t) }))
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
        lead={toLead(c.lead)}
        ctaTitle={orUndefined(shell.ctaTitle)}
        ctaDesc={orUndefined(shell.ctaDesc)}
        heroLink={orUndefined(shell.heroLink)}
        heroHref="#made"
        heroShot={toHeroShots(c.heroShots)}
      >
        {/* 로드맵 — 아이콘 카드 줄이 위(머리말 요약)와 연달아 두 번 오면 채널톡엔 없는 조합(사용자 09-22).
            순서가 있는 셋이라 번호 붙은 색 판 셋으로. */}
        <div className="mx_sec4">
          <p className="mx_kicker" style={{ textAlign: 'center' }}>{road.kicker}</p>
          <Statement>{road.title}</Statement>
          <ol className="mx_road" data-rv="pop">
            {road.items.map((r, i) => (
              <li key={r.t}><i>{String(i + 1).padStart(2, '0')}</i><b>{r.t}</b><span>{r.d}</span></li>
            ))}
          </ol>
        </div>

        <div id="made" />
        <Tabbed tabs={tabs}>
        <Group headLead={autoform.title} desc={leadDesc(autoform)} href={href('오토폼')}
          show={<ShowTabs items={tabsOf(c.autoformTabs)} />} />
        <Group headLead={cuton.title} desc={leadDesc(cuton)} href={href('컷온')}
          show={<ShowTabs items={tabsOf(c.cutonTabs)} />} />
        <Group headLead={cadon.title} desc={leadDesc(cadon)} href={href('CADON')}
          show={<ShowTabs items={tabsOf(c.cadonTabs)} />} />
        <Group headLead={chat.title} desc={leadDesc(chat)} href={href('채팅')}
          show={<ShowTabs items={tabsOf(c.chatTabs)} />} />
        <Group headLead={hangeon.title} desc={leadDesc(hangeon)} href={href('한건')}
          show={<ShowTabs items={tabsOf(c.hangeonTabs)} />} />
        </Tabbed>
      </SolutionShell>
    </>
  )
}
