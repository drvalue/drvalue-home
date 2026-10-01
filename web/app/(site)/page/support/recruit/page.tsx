import ClientAction from '@/components/ClientAction'
import type { Metadata } from 'next'
import { PAGE_CSS as MAX_CSS } from '../../business/max/maxStyles'
import SolutionShell from '../../business/max/SolutionShell'
import { seoMeta } from '@/lib/seo'
import { cmsBoard } from '@/lib/cms'
import { PAGE_CSS } from './recruitStyles'
import { dueOf, EMPLOYMENT_LABEL } from './recruit'

/**
 * 채용공고 목록. 관리 화면 「채용공고」(hr 역할)가 원본이다.
 * 서버에서 그린다 — 스크립트가 꺼져도 목록이 다 보인다. 순서는 api 가 정한다(마감 임박 순,
 * 상시 채용은 뒤). 요청마다 읽으므로 저장하면 바로 보인다.
 */
export const dynamic = 'force-dynamic'

const PATH = '/page/support/recruit'

const baseMeta = seoMeta({
  title: '채용',
  description:
    '디알밸류와 함께 제조 현장의 데이터를 바꿀 사람을 찾습니다. 진행 중인 채용 공고를 고용 형태·마감일과 함께 안내합니다. 회사는 경기도 안산 한양대학교 ERICA 창업보육센터에 있습니다.',
  path: PATH,
})

/** 공고가 하나도 없는 동안은 색인하지 않는다 — 빈 장이 검색 결과에 잡힌다. */
export async function generateMetadata(): Promise<Metadata> {
  const [meta, rows] = await Promise.all([baseMeta(), cmsBoard('recruit')])
  return rows && rows.length === 0 ? { ...meta, robots: { index: false, follow: true } } : meta
}

export default async function Page() {
  const rows = await cmsBoard('recruit')
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: MAX_CSS + PAGE_CSS }} />
      <SolutionShell
        path={PATH}
        kicker="채용"
        kickerSub="고객센터"
        headLead="디알밸류와 함께 "
        headStrong="일할 사람을 찾습니다."
        desc="제조 현장의 데이터를 바꿀 사람을 찾습니다. 진행 중인 채용 공고입니다."
        ctaTitle="채용에 대해 궁금한 점이 있으신가요?"
        ctaDesc="문의하기에서 남기시면 담당자가 연락드립니다."
      >
        <div data-rv>
          {rows === null ? (
            <p className="rc_state">채용 공고를 불러오지 못했습니다. 잠시 뒤 다시 열어 주세요.</p>
          ) : rows.length === 0 ? (
            <p className="rc_state">
              지금 진행 중인 채용이 없습니다. 함께하고 싶으시면 <ClientAction as="a" calls={[{ fn: 'openContactModal' }]}>문의</ClientAction>로 알려 주세요.
            </p>
          ) : (
            <ul className="rc_list">
              {rows.map((r) => {
                const due = dueOf(r)
                return (
                  <li className="rc_item" key={r.slug}>
                    <a href={`${PATH}/${encodeURIComponent(r.slug)}`}>
                      <span className="rc_top">
                        {r.employment_type && <span className="rc_tag">{EMPLOYMENT_LABEL[r.employment_type] ?? r.employment_type}</span>}
                        <span className={`rc_tag ${due.cls}`}>{due.text}</span>
                      </span>
                      <h3 className="rc_title">{r.title}</h3>
                      {r.summary && <p className="rc_sum">{r.summary}</p>}
                    </a>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </SolutionShell>
    </>
  )
}
