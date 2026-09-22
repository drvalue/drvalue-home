import { COMPANY_CSS } from '../companyContent'
import { PAGE_CSS } from '../../business/max/maxStyles'
import SolutionShell from '../../business/max/SolutionShell'
import { pageMeta } from '@/lib/seo'
import { cmsPageContent } from '@/lib/cms'
import VideoFacade from '@/components/VideoFacade'
import { orUndefined, toLead, toShot } from '../../pageContentParts'
import { COMPANY_INTRO_DEFAULT, COMPANY_INTRO_KEY, type CompanyIntroContent } from './content'

/**
 * /page/company/intro.php 를 옮긴 것. 2026-09-18 옛 꾸밈(사진 머리 + t_inner + AOS)
 * 에서 M.AX 계열과 같은 틀로 옮겼다 — 메뉴를 옮겨 다닐 때 두 꾸밈이 섞여 난잡했다.
 * 글은 관리 화면(페이지 → 회사소개 · 안내)에서 고친다 — 요청마다 api 의 페이지 글을 읽고,
 * 못 읽으면 content.ts 의 기본 글(= companyContent.ts 의 옛 글)로 그린다.
 */
const PATH = '/page/company/intro'

export const dynamic = 'force-dynamic'

export const metadata = pageMeta({
  title: '회사소개',
  description:
    '디알밸류는 제조 현장의 언어를 데이터로 통일합니다. MES/ERP 구축, 제조 AI 자동화, LLM/RAG 기반 AI Chat 을 실제 현장에서 운영해 온 회사입니다.',
  path: PATH,
})

export default async function Page() {
  const c = (await cmsPageContent<CompanyIntroContent>(COMPANY_INTRO_KEY)) ?? COMPANY_INTRO_DEFAULT
  const { shell, film } = c
  const shot = toShot(c.shot)
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
        {shot && (
          <figure className="cp_shot" data-rv="shot">
            <img src={shot.src} alt={shot.alt} width={shot.w} height={shot.h} loading="lazy" decoding="async" />
          </figure>
        )}

        <div className="cp_film" data-rv>
          <h3 className="cp_h3">{film.title}</h3>
          <p className="cp_h3desc">{film.desc}</p>
          <div className="video_container">
            <VideoFacade id={film.youtubeId} title={film.videoTitle} />
          </div>
        </div>
      </SolutionShell>
    </>
  )
}
