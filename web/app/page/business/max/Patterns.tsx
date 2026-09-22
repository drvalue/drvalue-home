'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
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

export function Showcase({ items, label = '제품군' }: { items: ShowcaseItem[]; label?: string }) {
  const [cur, setCur] = useState(0)
  const box = useRef<HTMLDivElement>(null)
  const n = items.length
  const go = (i: number) => setCur(((i % n) + n) % n)

  useEffect(() => {
    // 주소의 #id 로 오면 그 탭. 메뉴·바깥 링크가 특정 제품군을 가리킬 수 있게.
    const byHash = () => {
      const i = items.findIndex((x) => `#${x.id}` === window.location.hash)
      if (i >= 0) setCur(i)
    }
    byHash()
    window.addEventListener('hashchange', byHash)
    return () => window.removeEventListener('hashchange', byHash)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const c = items[cur]
  return (
    <div className="mx_show" ref={box}>
      <div className="mx_show_tabs" role="tablist" aria-label={label}>
        {items.map((x, i) => (
          <button key={x.id} type="button" role="tab" id={`show-${x.id}`} aria-selected={i === cur} aria-controls={x.id} className={i === cur ? 'on' : undefined} onClick={() => go(i)}>
            {x.tab}
          </button>
        ))}
      </div>
      <div className="mx_show_stage">
        <button type="button" className="mx_show_arr prev" aria-label={`이전 ${label}`} onClick={() => go(cur - 1)}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
        </button>
        <article key={c.id} id={c.id} role="tabpanel" aria-labelledby={`show-${c.id}`} className="mx_show_card">
          <div className="mx_show_txt">
            <p className="mx_show_k">{c.kicker}</p>
            <h3>{mark(c.headLead)}<b>{plain(c.headStrong)}</b></h3>
            <p>{c.desc}</p>
            <a className="mx_show_more" href={c.href}>자세히 보기<i aria-hidden="true">›</i></a>
          </div>
          <figure className="mx_show_fig">
            <Frame shot={c.shot} url={c.url} eager={cur === 0} />
          </figure>
        </article>
        <button type="button" className="mx_show_arr next" aria-label={`다음 ${label}`} onClick={() => go(cur + 1)}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>
      <p className="mx_show_dots" aria-hidden="true">{items.map((x, i) => <i key={x.id} className={i === cur ? 'on' : undefined} />)}</p>
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
            <li key={b.t} className={`${i === 0 ? 'wide' : ''}${b.dark ? ' dark' : ''}`}>
              <div className="mx_bento_txt">
                <h3>{mark(b.t)}</h3>
                <p>{b.d}</p>
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
 * 머리말 판의 화면이 몇 초마다 다음 장으로 건너간다(크로스페이드 + 살짝 확대). 2026-09-22 사용자:
 * 「사진 멈춰 있지 말고 초 지날 때마다 하나씩 — 모션그래픽 느낌」. 화면 밖이면 멈추고, 움직임을 줄인
 * 사람에겐 첫 장만 보인다. 첫 장은 eager 로 받아 LCP 를 안 늦춘다.
 */
export function HeroCycle({ shots, every = 4200 }: { shots: HeroItem[]; every?: number }) {
  const [cur, setCur] = useState(0)
  const [on, setOn] = useState(false)
  const box = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = box.current
    if (!el || shots.length < 2) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const io = new IntersectionObserver((es) => setOn(es.some((e) => e.isIntersecting)), { threshold: 0.2 })
    io.observe(el)
    return () => io.disconnect()
  }, [shots.length])

  useEffect(() => {
    if (!on) return
    const id = window.setInterval(() => setCur((c) => (c + 1) % shots.length), every)
    return () => window.clearInterval(id)
  }, [on, every, shots.length])

  const c = shots[cur]
  return (
    <figure className="mx_plate" ref={box}>
      <div className="mx_plate_in">
        <i className="mx_blob mx_b1" aria-hidden="true" /><i className="mx_blob mx_b2" aria-hidden="true" /><i className="mx_blob mx_b3" aria-hidden="true" />
        <span key={c.tag} className="mx_plate_tag mx_cycle_tag">{c.tag}</span>
        <div className="mx_browser">
          <div className="mx_browser_bar" aria-hidden="true"><i /><i /><i /><span key={c.url ?? c.tag}>{c.url ?? 'max.drvalue.co.kr'}</span></div>
          <div className="mx_cycle" style={{ aspectRatio: `${c.w} / ${c.h}` }}>
            {shots.map((s, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={s.src} src={s.src} alt={s.alt} width={s.w} height={s.h} className={i === cur ? 'on' : undefined}
                loading={i === 0 ? undefined : 'lazy'} fetchPriority={i === 0 ? 'high' : undefined} aria-hidden={i !== cur} />
            ))}
          </div>
        </div>
      </div>
    </figure>
  )
}
