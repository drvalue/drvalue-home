import { COMPANY_CSS } from '../companyContent'
import { PAGE_CSS } from '../../business/max/maxStyles'
import SolutionShell from '../../business/max/SolutionShell'
import { seoMeta } from '@/lib/seo'
import { cmsPageContent } from '@/lib/cms'
import { orUndefined, toLead } from '../../pageContentParts'
import { COMPANY_VISION_DEFAULT, COMPANY_VISION_KEY } from './content'

/**
 * /page/company/vision.php 를 옮긴 것. 2026-09-18 옛 꾸밈(사진 머리 + t_inner + AOS)
 * 에서 M.AX 계열과 같은 틀로 옮겼다 — 메뉴를 옮겨 다닐 때 두 꾸밈이 섞여 난잡했다.
 * 글은 관리 화면(페이지 → 회사소개 · 비전)에서 고친다 — 못 읽으면 content.ts 의 기본 글로 그린다.
 * 옛 장의 스톡 사진(/photo/cnc-machine.jpg, Pexels)은 뺐다.
 */
const PATH = '/page/company/vision'

export const dynamic = 'force-dynamic'

export const generateMetadata = seoMeta({
  title: '비전',
  description:
    '단순한 자동화를 넘어 제조 현장의 모든 데이터를 살아있는 정보로 전환합니다. 디알밸류가 그리는 지능형 제조의 방향과 전략을 소개합니다.',
  path: PATH,
})

export default async function Page() {
  const c = (await cmsPageContent(COMPANY_VISION_KEY)) ?? COMPANY_VISION_DEFAULT
  const { shell, strategy } = c
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PAGE_CSS }} />
      <style dangerouslySetInnerHTML={{ __html: COMPANY_CSS }} />
      <SolutionShell
        path={PATH}
        kicker={shell.kicker}
        kickerSub={shell.kickerSub}
        headLead={shell.headLead}
        headStrong={shell.headStrong}
        desc={shell.desc}
        lead={toLead(c.lead)}
        ctaTitle={orUndefined(shell.ctaTitle)}
        ctaDesc={orUndefined(shell.ctaDesc)}
      >
        <div className="cp_strategy">
          <h3 className="cp_h3">{strategy.title}</h3>
          {/* 누르는 자리가 아니라 설명이다. 카드 모양만 빌린다. */}
          <div className="mx_navgrid" data-rv>
            {strategy.items.map((it) => (
              <div className="mx_navcard" key={it.t}>
                <b>{it.t}</b>
                <span>{it.d}</span>
              </div>
            ))}
          </div>
        </div>
      </SolutionShell>
    </>
  )
}
