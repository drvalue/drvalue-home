import type { ReactNode } from 'react'
import { mark, plain } from './text'
import type { Shot } from './maxContent'
export type { Shot }

/**
 * v4 꾸밈의 공용 조각. 레퍼런스 channel.io/kr/works 의 구역들을 우리 자료로 그린다.
 *
 *  - Plate   : 웜 판 위 남색 메쉬 + 떠다니는 덩어리 + 브라우저 프레임 안의 실제 화면
 *  - Statement: 가운데 큰 문장 (MotionFx 가 낱말로 쪼개 차례로 띄운다)
 *  - Cols    : 상단 바가 왼쪽부터 채워지는 3열
 *  - CaseCard: 레퍼런스의 후기 카드 자리 — 후기·얼굴·수치 대신 **실재하는 수행 과제**
 *  - Group   : 제품군 한 판 = 제목/설명/윤곽 단추 · 판 · 3열 · 과제 카드 (Tabbed 안에서 하나씩 보인다)
 *
 * 숫자·고객명·인용문은 없다. 자료에 없는 것은 여기서도 못 만든다.
 */

export type Tone = '' | 'sand' | 'steel'
export const TONES: Tone[] = ['', 'sand', 'steel']

export function Plate({
  shot, tone = '', tag, url, phone, children, eager,
}: {
  shot?: Shot; tone?: Tone; tag?: string; url?: string; phone?: boolean; children?: ReactNode; eager?: boolean
}) {
  const inner = phone && shot ? (
    <div className="mx_phone">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={shot.src} alt={shot.alt} width={shot.w} height={shot.h} loading={eager ? undefined : 'lazy'} fetchPriority={eager ? 'high' : undefined} />
    </div>
  ) : (
    <div className="mx_browser">
      <div className="mx_browser_bar" aria-hidden="true"><i /><i /><i /><span>{url ?? 'drvalue.co.kr'}</span></div>
      {children ?? (shot && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={shot.src} alt={shot.alt} width={shot.w} height={shot.h} loading={eager ? undefined : 'lazy'} fetchPriority={eager ? 'high' : undefined} />
      ))}
    </div>
  )
  return (
    <figure className={`mx_plate${tone ? ` ${tone}` : ''}`}>
      <div className="mx_plate_in">
        <i className="mx_blob mx_b1" aria-hidden="true" /><i className="mx_blob mx_b2" aria-hidden="true" /><i className="mx_blob mx_b3" aria-hidden="true" />
        {tag && <span className="mx_plate_tag">{tag}</span>}
        {inner}
      </div>
    </figure>
  )
}

export function Statement({ children, desc }: { children: string; desc?: string }) {
  return (
    <>
      <h2 className="mx_state" data-rv="pop" data-words>{children}</h2>
      {desc && <p className="mx_state_p" data-rv>{desc}</p>}
    </>
  )
}

export type Col = { t: string; d: string; href?: string; more?: string }

/** 3열 카드의 아이콘 — 채널웍스 3열은 셋 다 같은 깃발 아이콘을 쓴다. 우리는 열마다 다른 획 하나. */
const COL_ICONS = [
  <svg key="a" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 20V5l6 3-6 3" /><path d="M5 5h12l-3 3 3 3H5" /></svg>,
  <svg key="b" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l2.4 5.2L20 9l-4 4 1 5.8-5-2.7-5 2.7 1-5.8-4-4 5.6-.8z" /></svg>,
  <svg key="c" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8" /><path d="M12 8v4l3 2" /></svg>,
]

/**
 * 3열 카드 — 채널웍스 「상담 혁신은 채널톡 / 업무 혁신은 채널웍스 / 진정한 All-as-one」 줄.
 * 아이콘 상자 · 제목(+ 링크면 ›) · 한 줄. 위쪽 굵은 막대(옛 꾸밈)는 사용자가 「이건 뭐하자는 거냐」고
 * 해서 뺐다(2026-09-22). 카드는 차례로 떠오른다.
 */
export function Cols({ items, active = -1 }: { items: Col[]; active?: number }) {
  return (
    <ul className="mx_cols" data-rv="pop">
      {items.map((c, i) => {
        const dim = active >= 0 && i !== active
        const body = (
          <>
            <i className="mx_cols_ic">{COL_ICONS[i % COL_ICONS.length]}</i>
            <b>{mark(c.t)}{c.href && <em className="mx_cols_go" aria-hidden="true">›</em>}</b>
            <span>{c.d}</span>
          </>
        )
        return (
          <li key={c.t} className={dim ? 'dim' : undefined}>
            {c.href ? <a className="mx_cols_a" href={c.href} aria-label={`${c.t} — ${c.more ?? '자세히 보기'}`}>{body}</a> : body}
          </li>
        )
      })}
    </ul>
  )
}

export type Case = { 과제명: string; 기간: string; 구분: string }

export function CaseCard({ pf, title, who }: { pf: Case; title: string; who: string }) {
  return (
    <div className="mx_case" data-rv>
      <div className="mx_case_k">
        <small>{pf.구분}</small>
        <b>{pf.기간}<i>수행 기간</i></b>
      </div>
      <div className="mx_case_t">
        <h3>{title}</h3>
        <p>{pf.과제명}</p>
        <p className="mx_who">{who}</p>
      </div>
    </div>
  )
}

export function Group({
  headLead, headStrong, desc, href, plate, cols, caseCard, show,
}: {
  headLead: string
  headStrong?: string
  desc: string
  href: string
  plate?: ReactNode
  cols?: Col[]
  caseCard?: ReactNode
  /** 판 + 게이지 탭(ShowTabs) — 있으면 plate·cols 대신 이것. */
  show?: ReactNode
}) {
  return (
    <section className="mx_sec4 mx_grp">
      <div className="mx_wrap">
        <div className="mx_ghead" data-rv>
          <div><h2>{mark(headLead)}{headStrong && <b>{plain(headStrong)}</b>}</h2></div>
          <div><p>{desc}</p><a className="mx_pill o" href={href}>자세히 보기</a></div>
        </div>
        {show ?? (<>{plate}{cols && <Cols items={cols} />}</>)}
        {caseCard}
      </div>
    </section>
  )
}

/**
 * 사진 카드 셋 — 채널웍스 장에서 큰 판 밑에 오는 「고객 · 팀 · AI CoS」 사진 카드 줄.
 * 카드마다 제품 화면 한 장 + 이름 + 한 줄. 화면은 위쪽이 잘려 보이고(cover, top) 카드는 차례로 뜬다.
 */
export type GalItem = { src: string; alt: string; w: number; h: number; t: string; d: string; href?: string }
export function Gallery({ items }: { items: GalItem[] }) {
  return (
    <ul className="mx_gal" data-rv="pop">
      {items.map((g) => (
        <li key={g.src}>
          <figure>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={g.src} alt={g.alt} width={g.w} height={g.h} loading="lazy" />
          </figure>
          <h3>{g.href ? <a href={g.href}>{g.t}</a> : g.t}</h3>
          <p>{g.d}</p>
        </li>
      ))}
    </ul>
  )
}
