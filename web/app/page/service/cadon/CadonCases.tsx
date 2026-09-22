'use client'

import { useEffect, useRef, useState } from 'react'
import { CD_CASES } from '../cadonContent'

/**
 * 판정 셋(전개 결과 · DFM 위반 · 3D 되접기) — 채널톡 CoS 장의 짜임(한건 BizShowcase 와 같은 결정):
 * 폭 전체 판 안에 「도면」 쪽지와 CutON 패널을 점선으로 잇고, 아래 3열 탭의 진행 막대가 차면 다음으로
 * 자동 넘어간다. 탭을 누르면 바로 간다. 마우스를 올리거나 화면 밖이면 멈추고, 움직임을 줄인 사람에게는
 * 자동 넘김 없이 탭만 남는다. 첫 탭이 켜진 채 서버에서 그려진다.
 *
 * 패널 값(파일·PASS/REVIEW·절곡·치수)은 실제 화면에 찍힌 것(cadonContent.ts) — 여기서 짓지 않는다.
 */
const STEP_MS = 6000

export default function CadonCases() {
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

  const go = (i: number) => { setCur(i % CD_CASES.length); setTick((t) => t + 1) }
  const c = CD_CASES[cur]

  return (
    <div className="cd_show" data-rv ref={box}
      onMouseEnter={() => { hold.current = true }} onMouseLeave={() => { hold.current = false }}>
      <div className="cd_show_plate">
        <div className="cd_show_me">
          <p className="cd_show_me_t">도면</p>
          <ul aria-label="입력">
            <li><span>파일</span><b>unistrut.STEP</b></li>
            <li><span>크기</span><b>42 × 250 × 22 mm</b></li>
            <li><span>자재</span><b>A1100 · t 2</b></li>
          </ul>
        </div>
        <i className="cd_show_link" aria-hidden="true" />
        <article key={`${c.k}-${tick}`} className={`cd_panel ${c.k}`} aria-live="polite">
          <p className="cd_panel_head"><b>CutON</b> {c.card.head}<span>{c.card.file}</span></p>
          <p className="cd_panel_chips">{c.card.chips.map((x) => <em key={x}>{x}</em>)}</p>
          <div className="cd_panel_box">
            <p className="cd_panel_line">{c.card.line}{c.card.badge && <i>{c.card.badge}</i>}</p>
            <ul>{c.card.rows.map((r, i) => <li key={i}>{r}</li>)}</ul>
          </div>
        </article>
      </div>
      <div className="cd_show_tabs" role="tablist" aria-label="판정 예시">
        {CD_CASES.map((x, i) => (
          <button key={x.k} type="button" role="tab" aria-selected={i === cur} className={i === cur ? 'on' : undefined} onClick={() => go(i)}>
            <i className="cd_show_bar" aria-hidden="true">
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
