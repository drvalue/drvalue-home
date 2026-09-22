import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { PAGE_CSS as MAX_CSS } from '../../../business/max/maxStyles'
import SolutionShell from '../../../business/max/SolutionShell'
import { pageMeta } from '@/lib/seo'
import { cmsPost, dots } from '@/lib/cms'
import { PAGE_CSS } from '../recruitStyles'
import { dueOf, EMPLOYMENT_LABEL } from '../recruit'

/**
 * 채용공고 한 건. 본문은 관리 화면 편집기가 만든 HTML 이다(관리자만 쓴다).
 * 없는 글·초안·예약 전은 api 가 404 → notFound.
 */
export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const p = await cmsPost(slug)
  const title = p && p !== 'missing' ? p.title : '채용'
  return pageMeta({
    title,
    description: (p && p !== 'missing' && p.summary) || '디알밸류 채용 공고입니다.',
    path: `/page/support/recruit/${encodeURIComponent(slug)}`,
  })
}

export default async function Page({ params }: Props) {
  const { slug } = await params
  const p = await cmsPost(slug)
  if (p === 'missing') notFound()
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: MAX_CSS + PAGE_CSS }} />
      <SolutionShell
        path="/page/support/recruit"
        kicker="채용"
        kickerSub="고객센터"
        headLead="디알밸류와 함께 "
        headStrong="일할 사람을 찾습니다."
        desc="진행 중인 채용 공고입니다."
        ctaTitle="채용에 대해 궁금한 점이 있으신가요?"
        ctaDesc="문의하기에서 남기시면 담당자가 연락드립니다."
      >
        {p === null ? (
          <p className="rc_state">공고를 불러오지 못했습니다. 잠시 뒤 다시 열어 주세요.</p>
        ) : (
          <article className="rc_art" data-rv aria-label={p.title}>
            <span className="rc_top">
              {p.employment_type && <span className="rc_tag">{EMPLOYMENT_LABEL[p.employment_type] ?? p.employment_type}</span>}
              <span className={`rc_tag ${dueOf(p).cls}`}>{dueOf(p).text}</span>
            </span>
            <h2>{p.title}</h2>
            {p.published_date && <span className="rc_due">게시 {dots(p.published_date)}</span>}
            {p.body && <div className="rc_body" dangerouslySetInnerHTML={{ __html: p.body }} />}
            {p.attachments.length > 0 && (
              <ul className="rc_files" aria-label="첨부 파일">
                {p.attachments.map((f) => (
                  <li key={f.id}><a href={f.url}>{f.name}</a></li>
                ))}
              </ul>
            )}
            <a className="rc_back" href="/page/support/recruit">← 채용 목록</a>
          </article>
        )}
      </SolutionShell>
    </>
  )
}
