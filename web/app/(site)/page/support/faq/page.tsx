import ClientAction from '@/components/ClientAction'
import { PAGE_CSS as MAX_CSS } from '../../business/max/maxStyles'
import SolutionShell from '../../business/max/SolutionShell'
import type { Metadata } from 'next'
import { seoMeta } from '@/lib/seo'
import { cmsBoard, type CmsPost } from '@/lib/cms'
import JsonLd from '@/components/JsonLd'
import { plainText } from '../board/text'

/**
 * 자주 묻는 질문. 분류별로 묶어 접기(<details>)로 보인다 — 스크립트 없이 열고 닫힌다.
 * 관리 화면 「FAQ」가 원본. 질문 = 제목, 답 = 본문(HTML), 순서 = 관리 화면에서 끈 순서.
 */
export const dynamic = 'force-dynamic'

const PATH = '/page/support/faq'

const DESCRIPTION =
  '도입 절차, 견적, 기술 지원 등 디알밸류에 자주 묻는 질문과 답입니다. MES·제조 AI 도입 전에 궁금한 점을 먼저 확인하세요.'

const baseMeta = seoMeta({ title: 'FAQ', description: DESCRIPTION, path: PATH })

/** 질문이 하나도 없는 동안은 색인하지 않는다 — 빈 장이 검색 결과에 「질문이 없습니다」로 잡힌다. */
export async function generateMetadata(): Promise<Metadata> {
  const [meta, rows] = await Promise.all([baseMeta(), cmsBoard('faq')])
  return rows && rows.length === 0 ? { ...meta, robots: { index: false, follow: true } } : meta
}

/** 장 전용 CSS — 템플릿 문자열이다. 안에 역따옴표를 넣지 않는다. */
const PAGE_CSS = `
#dvmax .fq_group { margin: 0 0 32px; }
#dvmax .fq_group h3 { margin: 0 0 12px; font-size: 15px; font-weight: 800; color: #3d5a80; letter-spacing: .02em; }
#dvmax .fq_item { border: 1px solid #e5e8eb; border-radius: 10px; background: #fff; margin-bottom: 8px; min-width: 0; }
#dvmax .fq_item summary {
  cursor: pointer; list-style: none; padding: 16px 44px 16px 18px; position: relative;
  font-weight: 700; font-size: 16px; line-height: 1.5; color: #191f28; word-break: keep-all; overflow-wrap: anywhere; }
#dvmax .fq_item summary::-webkit-details-marker { display: none; }
#dvmax .fq_item summary::after {
  content: "+"; position: absolute; right: 18px; top: 50%; transform: translateY(-50%);
  font-size: 20px; font-weight: 400; color: #8b95a1; }
#dvmax .fq_item[open] summary::after { content: "−"; }
#dvmax .fq_item summary:focus-visible { outline: 3px solid #d71920; outline-offset: 2px; border-radius: 10px; }
#dvmax .fq_a { padding: 0 18px 18px; color: #4e5968; font-size: 15px; line-height: 1.75; overflow-wrap: anywhere; }
#dvmax .fq_a img { max-width: 100%; height: auto; }
#dvmax .fq_a p { margin: 0 0 8px; }
#dvmax .fq_state { padding: 40px 20px; text-align: center; color: #4e5968; border: 1px dashed #d8dee4; border-radius: 12px; }
#dvmax .fq_state a { color: #3d5a80; font-weight: 700; }
`

/** 분류별로 묶는다. 순서는 api 가 준 순서(관리 화면의 sort) 그대로, 분류도 처음 나온 순. */
function group(rows: CmsPost[]): { name: string; items: CmsPost[] }[] {
  const out = new Map<string, CmsPost[]>()
  for (const r of rows) {
    const k = (r.faq_category ?? '').trim() || '기타'
    if (!out.has(k)) out.set(k, [])
    out.get(k)!.push(r)
  }
  return [...out.entries()].map(([name, items]) => ({ name, items }))
}

export default async function Page() {
  const rows = await cmsBoard('faq')
  return (
    <>
      {/* 화면에 펼쳐지는 질문·답 그대로. 질문이 없으면 싣지 않는다(빈 FAQPage 는 오류다). */}
      {rows && rows.length > 0 && (
        <JsonLd
          data={{
            '@type': 'FAQPage',
            mainEntity: rows.map((q) => ({
              '@type': 'Question',
              name: q.title,
              acceptedAnswer: { '@type': 'Answer', text: plainText(q.body, 1000) },
            })),
          }}
        />
      )}
      <style dangerouslySetInnerHTML={{ __html: MAX_CSS + PAGE_CSS }} />
      <SolutionShell
        path={PATH}
        kicker="FAQ"
        kickerSub="고객센터"
        headLead="자주 묻는 질문을 "
        headStrong="모았습니다."
        desc="도입 절차, 견적, 기술 지원 등 디알밸류에 자주 묻는 질문과 답입니다."
        ctaTitle="찾는 답이 없으신가요?"
        ctaDesc="문의하기에서 남기시면 담당자가 답드립니다."
      >
        <div data-rv>
          {rows === null ? (
            <p className="fq_state">질문 목록을 불러오지 못했습니다. 잠시 뒤 다시 열어 주세요.</p>
          ) : rows.length === 0 ? (
            <p className="fq_state">
              아직 등록된 질문이 없습니다. 궁금한 점은 <ClientAction as="a" calls={[{ fn: 'openContactModal' }]}>문의</ClientAction>로 남겨 주세요.
            </p>
          ) : (
            group(rows).map((g) => (
              <section className="fq_group" key={g.name} aria-label={g.name}>
                <h3>{g.name}</h3>
                {g.items.map((q) => (
                  <details className="fq_item" key={q.slug}>
                    <summary>{q.title}</summary>
                    <div className="fq_a" dangerouslySetInnerHTML={{ __html: q.body ?? '' }} />
                  </details>
                ))}
              </section>
            ))
          )}
        </div>
      </SolutionShell>
    </>
  )
}
