'use client'

import { useMemo, useState, type ReactNode } from 'react'
import { mark, plain } from './text'
import type { Shot, Tone } from './V4'

/**
 * 레퍼런스에서 옮긴 구역 패턴 셋. 2026-09-22 사용자가 channel.io/kr/meet/call 과
 * alf-customer 의 두 장면을 지목해 「컴포넌트화해서 모든 장에 골라 쓰라」고 했다.
 *
 *  - Showcase : 알약 탭 줄 + 큰 어두운 카드 하나 + ‹ › (alf-customer 「이미 AI로 상담을 줄인…」).
 *               카드 = kicker · 제목 · 설명 · 「자세히 보기」 · 오른쪽 제품 화면. 숫자·후기·고객명 없음 — 우리 자료에 없다.
 *  - Bento    : 어두운 바탕 위 넓은 카드 1 + 반 카드 2, 화면이 카드 아래로 잘려 나간다 (meet/call 「AI 세팅, 생각보다 쉽습니다」).
 *  - FlowCard : 연한 카드, 왼쪽 글 · 오른쪽 단계 카드가 ↓ 로 이어진다 (meet/call 「전화 연동도 5분이면 충분」).
 *
 * 어느 장에 무엇을 쓰는지·안 쓴 패턴과 이유는 design/PATTERNS.md (저장소 밖 문서 — 저장소 전체가
 * 웹 루트로 서빙되므로 추적되는 .md 에 두지 않는다). CSS 는 patternStyles.ts, 게이지·판은 ShowTabs·V4.
 */

/* ───────── Showcase ───────── */
export type ShowcaseItem = {
  tab: string
  id: string
  kicker: string
  headLead: string
  headStrong: string
  desc: string
  href: string
  shot: Shot
  url?: string
}

function Frame({ shot, url, eager }: { shot: Shot; url?: string; eager?: boolean }) {
  return (
    <div className="mx_browser">
      <div className="mx_browser_bar" aria-hidden="true"><i /><i /><i /><span>{url ?? 'max.drvalue.co.kr'}</span></div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={shot.src} alt={shot.alt} width={shot.w} height={shot.h} loading={eager ? undefined : 'lazy'} />
    </div>
  )
}

/**
 * 제품군 판 셋 — 2026-09-28 사용자: 좌우 화살표로 넘기는 판(블라인드 비평: 「흔한 슬라이더」) 대신 셋을 고정해 차례로 편다.
 * 판마다 글 왼쪽 · 화면 오른쪽, 구분선 한 줄(하위 장 기능 판과 같은 짜임). 주소의 #id 는 판의 id 라 그대로 그 자리로 간다.
 */
export function Showcase({ items, label = '제품군' }: { items: ShowcaseItem[]; label?: string }) {
  return (
    <div className="mx_show mx_show_rows" role="list" aria-label={label}>
      {items.map((c, i) => (
        <article key={c.id} id={c.id} role="listitem" className="mx_show_row">
          <div className="mx_show_txt">
            <p className="mx_show_k">{c.tab}</p>
            <h3>{mark(c.headLead)}<b>{plain(c.headStrong)}</b></h3>
            <p>{c.desc}</p>
            <a className="mx_show_more" href={c.href}>{c.tab} 자세히 보기<i aria-hidden="true">›</i></a>
          </div>
          <figure className="mx_show_fig">
            <Frame shot={c.shot} url={c.url} eager={i === 0} />
          </figure>
        </article>
      ))}
    </div>
  )
}

/* ───────── Bento ───────── */
export type BentoItem = {
  t: string
  d: string
  href?: string
  more?: string
  shot?: Shot
  url?: string
  /** 남색 카드 — 화면 없이 글과 화살표 링크만. */
  dark?: boolean
  /** 첫 카드 말고도 폭을 다 쓰게. */
  wide?: boolean
  /** 있으면 d 대신 요점 목록으로. */
  pts?: string[]
}

/**
 * 첫 카드는 넓게(글 왼쪽 · 화면 오른쪽), 나머지는 반 폭(글 위 · 화면 아래로 잘림).
 * 바탕은 남색에서 아래로 갈수록 강철빛 — 레퍼런스의 보라·파랑은 그들 브랜드라 안 쓴다.
 */
export function Bento({ items, kicker, title, desc }: { items: BentoItem[]; kicker?: string; title?: string; desc?: string }) {
  return (
    <section className="mx_bento">
      <i className="mx_blob mx_b1" aria-hidden="true" /><i className="mx_blob mx_b2" aria-hidden="true" />
      <div className="mx_wrap">
        {(kicker || title) && (
          <div className="mx_bento_head" data-rv>
            {kicker && <p className="mx_bento_k">{kicker}</p>}
            {title && <h2 data-words>{title}</h2>}
            {desc && <p className="mx_bento_d">{desc}</p>}
          </div>
        )}
        <ul className="mx_bento_grid" data-rv="pop">
          {items.map((b, i) => (
            <li key={b.t} className={`${i === 0 || b.wide ? 'wide' : ''}${b.dark ? ' dark' : ''}`}>
              <div className="mx_bento_txt">
                <h3>{mark(b.t)}</h3>
                {b.pts ? <ul className="mx_bento_pts">{b.pts.map((x) => <li key={x}>{mark(x)}</li>)}</ul> : <p>{b.d}</p>}
                {b.href && <a className="mx_bento_more" href={b.href}>{b.more ?? '자세히 보기'}<i aria-hidden="true">→</i></a>}
              </div>
              {b.shot && (
                <figure className="mx_bento_fig">
                  <Frame shot={b.shot} url={b.url} />
                </figure>
              )}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

/* ───────── FlowCard ───────── */
/**
 * 단계가 뜻을 가질 때만 쓴다(문서가 들어와 값이 뽑히고 대조되어 들어가는 흐름). 순서 없는 목록에
 * 번호를 붙이면 「구조는 정보다」 규칙에 걸린다.
 */
export function FlowCard({ title, desc, steps, tone = '', href, more, aside }: {
  title: string
  desc?: string
  steps: string[]
  tone?: Tone
  href?: string
  more?: string
  /** 글 밑에 더 둘 것(예: 화면 판). */
  aside?: ReactNode
}) {
  return (
    <article className={`mx_fcard${tone ? ` ${tone}` : ''}`} data-rv>
      <div className="mx_fcard_txt">
        <h3>{mark(title)}</h3>
        {desc && <p>{desc}</p>}
        {href && <a className="mx_bento_more" href={href}>{more ?? '자세히 보기'}<i aria-hidden="true">→</i></a>}
        {aside}
      </div>
      <ol className="mx_fcard_steps" data-rv>
        {steps.map((s, i) => (
          <li key={s}><i aria-hidden="true">{i + 1}</i><span>{mark(s)}</span></li>
        ))}
      </ol>
    </article>
  )
}

/* ───────── HeroCycle ───────── */
export type HeroItem = Shot & { tag: string; url?: string }

/**
 * 머리말 판의 화면 여럿 — 판 밑 탭(화면 이름)을 누르면 그 장으로 바뀐다(크로스페이드).
 * 2026-09-22 에는 몇 초마다 스스로 넘어갔는데, 2026-09-28 사용자가 「시간이 지나야 다음 걸 보는 UI」를
 * 정리하라 해서 자동 넘김을 뺐다. 첫 장은 eager 로 받아 LCP 를 안 늦추고, 스크립트가 없으면 첫 장만 보인다.
 */
export function HeroCycle({ shots }: { shots: HeroItem[] }) {
  const [cur, setCur] = useState(0)

  const c = shots[cur]

  // 상자 비율은 **한 번만** 정한다. 예전엔 지금 보이는 장의 w/h 를 그대로 써서
  // (게다가 aspect-ratio 에 transition 까지 걸려 있어) 장이 넘어갈 때마다 판 높이가
  // 늘었다 줄었다 했다 — 화면이 출렁여서 읽기가 어렵다.
  // 기준은 **가장 높은 장**이고, 그림은 잘라 채우지 않고 넣어 맞춘다(contain).
  // 납작한 장에 맞추면 판이 얇은 띠가 되고(실측 305px), 잘라 채우면 표가 대부분인
  // MES 화면에서 좌측 라벨·앞 열이 날아가 뭘 보는 화면인지 알 수 없다.
  // 높은 장에 맞춰 두면 납작한 장은 툴바 바로 밑에 붙고 아래가 흰 여백으로 남는데,
  // 브라우저 창 안이라 「짧은 페이지」처럼 읽혀 어색하지 않다.
  const ratio = useMemo(() => {
    const tallest = shots.reduce((a, s) => (s.w / s.h < a.w / a.h ? s : a), shots[0])
    return `${tallest.w} / ${tallest.h}`
  }, [shots])

  return (
    <figure className="mx_plate flat">
      <div className="mx_plate_in">
        <div className="mx_browser">
          <div className="mx_browser_bar" aria-hidden="true"><i /><i /><i /><span key={c.url ?? c.tag}>{c.url ?? 'max.drvalue.co.kr'}</span></div>
          <div className="mx_cycle" style={{ aspectRatio: ratio }}>
            {shots.map((s, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={s.src} src={s.src} alt={s.alt} width={s.w} height={s.h} className={i === cur ? 'on' : undefined}
                loading={i === 0 ? undefined : 'lazy'} fetchPriority={i === 0 ? 'high' : undefined} aria-hidden={i !== cur} />
            ))}
          </div>
        </div>
      </div>
      {shots.length > 1 && (
        <div className="mx_cycle_tabs" role="tablist" aria-label="화면">
          {shots.map((s, i) => (
            <button key={s.src} type="button" role="tab" aria-selected={i === cur} className={i === cur ? 'on' : undefined} onClick={() => setCur(i)}>{s.tag}</button>
          ))}
        </div>
      )}
    </figure>
  )
}
