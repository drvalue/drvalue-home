import { INTRO_FILM, INTRO_LEAD, INTRO_SHOT, COMPANY_CSS } from '../companyContent'
import { PAGE_CSS } from '../../business/max/maxStyles'
import SolutionShell from '../../business/max/SolutionShell'
import { pageMeta } from '@/lib/seo'
import VideoFacade from '@/components/VideoFacade'

/**
 * /page/company/intro.php 를 옮긴 것. 2026-09-18 옛 꾸밈(사진 머리 + t_inner + AOS)
 * 에서 M.AX 계열과 같은 틀로 옮겼다 — 메뉴를 옮겨 다닐 때 두 꾸밈이 섞여 난잡했다.
 * 글은 companyContent.ts 에 그대로 옮겨 두었다. 새로 지은 문장은 없다.
 */
const PATH = '/page/company/intro'

export const metadata = pageMeta({
  title: '회사소개',
  description:
    '디알밸류는 제조 현장의 언어를 데이터로 통일합니다. MES/ERP 구축, 제조 AI 자동화, LLM/RAG 기반 AI Chat 을 실제 현장에서 운영해 온 회사입니다.',
  path: PATH,
})

export default function Page() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PAGE_CSS }} />
      <style dangerouslySetInnerHTML={{ __html: COMPANY_CSS }} />
      <SolutionShell
        path={PATH}
        kicker="안내"
        kickerSub="회사소개"
        headLead="데이터로 제조의 "
        headStrong="새로운 가치를 연결합니다."
        desc="현장의 비효율을 혁신하여 엔지니어가 본질에만 집중할 수 있는 세상을 만듭니다."
        lead={INTRO_LEAD}
      >
        <figure className="cp_shot" data-rv="shot">
          <img src={INTRO_SHOT.src} alt={INTRO_SHOT.alt} width={INTRO_SHOT.w} height={INTRO_SHOT.h} loading="lazy" decoding="async" />
        </figure>

        <div className="cp_film" data-rv>
          <h3 className="cp_h3">{INTRO_FILM.title}</h3>
          <p className="cp_h3desc">{INTRO_FILM.desc}</p>
          <div className="video_container">
            <VideoFacade id={INTRO_FILM.id} title={INTRO_FILM.videoTitle} />
          </div>
        </div>
      </SolutionShell>
    </>
  )
}
