'use client'

import { useEffect, useRef, useState } from 'react'
import { CT_SHOW } from '../cutonContent'

/**
 * 컷온의 세 화면(예상견적산출 · 보관함 · 입찰마켓)을 채널톡 CoS 장의 짜임으로 — 폭 전체 판 안에
 * 「프로젝트」 패널과 그 화면의 카드가 점선으로 이어지고, 아래 3열 탭은 6초 막대가 차면 다음으로
 * 자동 넘어간다(마우스 올리면 멈춤 · 화면 밖이면 멈춤 · 움직임 줄임이면 자동 없음). 한건 장의
 * BizShowcase 와 같은 틀(.hk_show*)을 쓴다. 카드 값은 가이드 화면 그대로(cutonContent.ts).
 */
const STEP_MS = 6000

export default function CutonShow() {
  const [cur, setCur] = useState(0)
  const [auto, setAuto] = useState(false)
  const [tick, setTick] = useState(0)
  const box = useRef<HTMLDivElement>(null)
  const hold = useRef(false)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const el = box.current
    if (!el) return
    const io = new IntersectionObserver((es) => setAuto(es.some((e) => e.isIntersecting)), { threshold: 0.15 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const go = (i: number) => { setCur(i % CT_SHOW.cases.length); setTick((t) => t + 1) }
  const c = CT_SHOW.cases[cur]

  return (
    <div className="hk_show ct_show" data-rv ref={box}
      onMouseEnter={() => { hold.current = true }} onMouseLeave={() => { hold.current = false }}>
      <div className="hk_show_plate">
        <div className="hk_show_me">
          <p className="hk_show_me_t">프로젝트</p>
          <ul aria-label="프로젝트">
            {CT_SHOW.me.map(([k, v]) => <li key={k}><span>{k}</span><b>{v}</b></li>)}
          </ul>
        </div>
        <i className="hk_show_link" aria-hidden="true" />
        <article key={`${c.k}-${tick}`} className={`hk_bid ct_card ${c.k}`} aria-live="polite">
          <p className="hk_bid_src"><i aria-hidden="true" />{c.card.src}</p>
          <h4>{c.card.t}</h4>
          <p className="hk_bid_org">{c.card.sub}</p>
          <ul className="ct_rows">
            {c.card.rows.map(([k, v]) => <li key={k}><span>{k}</span><b>{v}</b></li>)}
          </ul>
          <p className="hk_bid_price"><span>{c.card.big[0]}</span><b>{c.card.big[1]}</b></p>
          <p className="hk_bid_verdict"><b>{c.v}</b>{c.card.tail}</p>
        </article>
      </div>
      <div className="hk_show_tabs" role="tablist" aria-label="컷온 화면 셋">
        {CT_SHOW.cases.map((x, i) => (
          <button key={x.k} type="button" role="tab" aria-selected={i === cur} className={i === cur ? 'on' : undefined} onClick={() => go(i)}>
            <i className="hk_show_bar" aria-hidden="true">
              {i === cur && auto && (
                <b key={tick} style={{ animationDuration: `${STEP_MS}ms` }}
                  onAnimationEnd={() => { if (!hold.current) go(cur + 1); else setTick((t) => t + 1) }} />
              )}
            </i>
            <b>{x.v}</b>
            <span>{x.d}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
