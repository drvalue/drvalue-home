import ClientAction from '@/components/ClientAction'
import { PAGE_CSS as MAX_CSS } from '../../business/max/maxStyles'
import SolutionShell from '../../business/max/SolutionShell'
import { cmsBoardPage, type CmsPost } from '@/lib/cms'
import { PAGE_CSS } from './boardStyles'
import { detailPath, type BoardConf } from './boards'
import { dotDate } from './text'

/**
 * 공지·보도·뉴스 목록. 서버가 다 그린다 — 예전에는 jQuery 가 빈 상자에 채웠고, 스크립트가
 * 꺼진 사람과 검색 로봇에게 게시판이 비어 보였다(절대 규칙 4 · SEO 감사).
 * 검색은 GET 폼이라 스크립트 없이 된다. 쪽 넘김도 링크다.
 */

export type BoardQuery = { page: number; q: string; startDate: string; endDate: string }

const DAY = /^\d{4}-\d{2}-\d{2}$/

/** 주소의 검색 조건을 믿을 수 있는 값으로. 이상한 값은 버린다. */
export function readQuery(sp: Record<string, string | string[] | undefined>): BoardQuery {
  const one = (k: string) => {
    const v = sp[k]
    return (Array.isArray(v) ? v[0] : v) ?? ''
  }
  const page = Math.max(1, Math.min(10_000, parseInt(one('page'), 10) || 1))
  const day = (v: string) => (DAY.test(v) ? v : '')
  return { page, q: one('q').trim().slice(0, 200), startDate: day(one('startDate')), endDate: day(one('endDate')) }
}

function qs(q: Partial<BoardQuery>): string {
  const p = new URLSearchParams()
  if (q.q) p.set('q', q.q)
  if (q.startDate) p.set('startDate', q.startDate)
  if (q.endDate) p.set('endDate', q.endDate)
  if (q.page && q.page > 1) p.set('page', String(q.page))
  const s = p.toString()
  return s ? `?${s}` : ''
}

function StateBox({ icon, title, desc, action }: { icon: 'doc' | 'warn'; title: string; desc: string; action?: React.ReactNode }) {
  return (
    <div className="dv_state">
      <div className="dv_state_ico" aria-hidden="true">
        {icon === 'warn' ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 9v4" /><path d="M12 17h.01" /><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" /></svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /><path d="M8 13h8" /><path d="M8 17h5" /></svg>
        )}
      </div>
      <p className="dv_state_t">{title}</p>
      <p className="dv_state_d">{desc}</p>
      {action}
    </div>
  )
}

function Row({ conf, it }: { conf: BoardConf; it: CmsPost }) {
  const date = it.published_date ?? ''
  return (
    <li className={`dv_news_row${it.is_pinned ? ' is-pinned' : ''}`}>
      <time className="dv_news_date" dateTime={date.slice(0, 10)}>{dotDate(date) || '-'}</time>
      <div className="dv_news_txt">
        <a className="dv_news_title" href={detailPath(conf, it.slug)}>
          {it.is_pinned ? <span className="dv_pin">고정</span> : it.press_media ? <span className="dv_news_media">{it.press_media}</span> : null}
          {it.title}
        </a>
        {it.summary && <p className="dv_news_sum">{it.summary}</p>}
      </div>
      <span className="dv_news_arrow" aria-hidden="true">→</span>
    </li>
  )
}

function Pager({ conf, q, total, pageSize }: { conf: BoardConf; q: BoardQuery; total: number; pageSize: number }) {
  const pages = Math.max(1, Math.ceil(total / pageSize))
  if (pages <= 1) return null
  const block = 5
  const start = Math.floor((q.page - 1) / block) * block + 1
  const end = Math.min(start + block - 1, pages)
  const href = (p: number) => `${conf.path}${qs({ ...q, page: p })}`
  const nums = []
  for (let p = start; p <= end; p++) nums.push(p)
  return (
    <nav className="dv_pager" aria-label={`${conf.label} 쪽 넘김`}>
      {q.page > 1 ? <a href={href(q.page - 1)} aria-label="이전 쪽">‹</a> : <span aria-disabled="true">‹</span>}
      {nums.map((p) =>
        p === q.page ? (
          <a key={p} href={href(p)} className="on" aria-current="page">{p}</a>
        ) : (
          <a key={p} href={href(p)}>{p}</a>
        ),
      )}
      {q.page < pages ? <a href={href(q.page + 1)} aria-label="다음 쪽">›</a> : <span aria-disabled="true">›</span>}
    </nav>
  )
}

export default async function BoardList({ conf, query }: { conf: BoardConf; query: BoardQuery }) {
  const res = await cmsBoardPage(conf.key, query)
  const searching = Boolean(query.q || query.startDate || query.endDate)
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: MAX_CSS + PAGE_CSS }} />
      <SolutionShell
        path={conf.path}
        kicker={conf.label}
        kickerSub="고객센터"
        headLead={conf.headLead}
        headStrong={conf.headStrong}
        desc={conf.description}
        ctaTitle="문의사항이 있으신가요?"
        ctaDesc="프로젝트 문의는 문의하기에서 남길 수 있습니다."
      >
        <div className="sp_board" data-rv>
          <form className="dv_search" method="get" action={conf.path} role="search">
            <div className="dv_qwrap">
              <input type="text" name="q" aria-label="제목 / 내용 검색" placeholder="제목 / 내용 검색" defaultValue={query.q} maxLength={200} />
              <button type="submit" className="dv_qicon" aria-label="검색">
                <img src="/img/search.svg" alt="" width={20} height={20} />
              </button>
            </div>
            <input type="date" name="startDate" aria-label="시작일" defaultValue={query.startDate} />
            <input type="date" name="endDate" aria-label="종료일" defaultValue={query.endDate} />
            <a className="dv_btn dv_btn_reset" href={conf.path}>초기화</a>
          </form>

          {res === null ? (
            <div className="dv_news">
              <StateBox
                icon="warn"
                title="목록을 불러오지 못했습니다"
                desc="잠시 뒤 다시 시도해 주세요. 계속 같으면 고객센터로 알려 주세요."
                action={<a className="dv_state_act" href={`${conf.path}${qs(query)}`}>다시 불러오기</a>}
              />
            </div>
          ) : res.data.length === 0 ? (
            <div className="dv_news">
              {searching ? (
                <StateBox
                  icon="doc"
                  title="검색 결과가 없습니다"
                  desc="다른 낱말로 찾아보거나 기간을 넓혀 보세요."
                  action={<a className="dv_state_act" href={conf.path}>검색 조건 지우기</a>}
                />
              ) : (
                <StateBox
                  icon="doc"
                  title={conf.emptyTitle}
                  desc={conf.emptyDesc}
                  action={<ClientAction as="a" className="dv_state_act" calls={[{ fn: 'openContactModal' }]}>문의 남기기</ClientAction>}
                />
              )}
            </div>
          ) : (
            <>
              <ul className="dv_news">
                {res.data.map((it) => (
                  <Row key={it.slug} conf={conf} it={it} />
                ))}
              </ul>
              <Pager conf={conf} q={query} total={res.total} pageSize={res.pageSize} />
            </>
          )}
        </div>
      </SolutionShell>
    </>
  )
}
