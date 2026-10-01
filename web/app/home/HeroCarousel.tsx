'use client'

import { Children, useEffect, useState, type ReactNode } from 'react'

/**
 * 홈 머리 그림의 장 넘김(2026-10-01 사용자 요청 — 슬라이드를 뺀 결정을 되돌렸다, decisions/0019).
 *
 * - 스크립트가 없으면 장이 위에서 아래로 그냥 쌓여 둘 다 보인다(「보이는 것이 기본」). 마운트한 뒤에만
 *   `is-rot` 을 달아 한 칸에 겹치고 하나만 보인다 — 숨기는 일은 스크립트가 한다.
 * - 자동 넘김은 7초. 마우스를 올리거나 안에 포커스가 있거나 탭이 가려졌거나 사용자가 멈췄으면 쉰다.
 *   움직임을 줄인 사람에게는 자동으로 안 넘기고 점으로만 옮긴다.
 * - 마우스일 때만 「올리면 쉰다」 — 손가락은 떼도 leave 가 안 와서 한 번 누르면 영영 멈춘다(iOS).
 *   포커스로 쉬는 것도 키보드(:focus-visible)일 때만 — 안드로이드는 탭하면 단추에 포커스가 남는다.
 * - 안 보이는 장은 `inert` — 숨은 링크에 탭이 가지 않는다.
 */
const INTERVAL = 7000

export default function HeroCarousel({ children }: { children: ReactNode }) {
  const slides = Children.toArray(children)
  const n = slides.length
  const [rot, setRot] = useState(false)
  const [ready, setReady] = useState(false)
  const [i, setI] = useState(0)
  const [paused, setPaused] = useState(false)
  const [hover, setHover] = useState(false)
  const [focus, setFocus] = useState(false)
  const [away, setAway] = useState(false)
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    setRot(true)
    // 겹치는 첫 틀에는 전환을 안 건다 — 건 채로 겹치면 보도자료 장이 첫 장 위에서 1초쯤 서서히 사라진다.
    let r2 = 0
    const r1 = requestAnimationFrame(() => { r2 = requestAnimationFrame(() => setReady(true)) })
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const readMq = () => setReduced(mq.matches)
    const readVis = () => setAway(document.hidden)
    readMq()
    readVis()
    mq.addEventListener('change', readMq)
    document.addEventListener('visibilitychange', readVis)
    return () => {
      cancelAnimationFrame(r1)
      cancelAnimationFrame(r2)
      mq.removeEventListener('change', readMq)
      document.removeEventListener('visibilitychange', readVis)
    }
  }, [])

  const playing = rot && n > 1 && !reduced && !paused && !hover && !focus && !away
  useEffect(() => {
    if (!playing) return
    const t = window.setTimeout(() => setI((k) => (k + 1) % n), INTERVAL)
    return () => window.clearTimeout(t)
  }, [playing, i, n])

  return (
    <div
      className={'dv_hero_set' + (rot ? ' is-rot' : '') + (ready ? ' is-ready' : '')}
      role="region"
      aria-roledescription="carousel"
      aria-label="주요 소식"
      onPointerEnter={(e) => { if (e.pointerType === 'mouse') setHover(true) }}
      onPointerLeave={(e) => { if (e.pointerType === 'mouse') setHover(false) }}
      onFocus={(e) => setFocus(e.target.matches(':focus-visible'))}
      onBlur={() => setFocus(false)}
    >
      <div className="dv_hero_slides" aria-live={playing ? 'off' : 'polite'}>
        {slides.map((s, k) => {
          const off = rot && k !== i
          return (
            <div
              key={k}
              className="dv_hero_slide"
              role="group"
              aria-roledescription="slide"
              aria-label={`${k + 1} / ${n}`}
              data-active={off ? undefined : 'true'}
              aria-hidden={off ? true : undefined}
              inert={off}
            >
              {s}
            </div>
          )
        })}
      </div>
      {rot && n > 1 && (
        <div className="dv_hero_ctl">
          {!reduced && (
            <button
              type="button"
              className="dv_hero_pp"
              aria-label={paused ? '자동 넘김 재생' : '자동 넘김 멈춤'}
              onClick={() => setPaused((p) => !p)}
            >
              {paused ? (
                <svg viewBox="0 0 14 14" aria-hidden="true"><path d="M3 1.5v11l9-5.5z" /></svg>
              ) : (
                <svg viewBox="0 0 14 14" aria-hidden="true"><path d="M3 1.5h3v11H3zM8 1.5h3v11H8z" /></svg>
              )}
            </button>
          )}
          <div className="dv_hero_dots">
            {slides.map((_, k) => (
              <button
                key={k}
                type="button"
                aria-label={`${k + 1}번째 장 보기`}
                aria-current={k === i ? 'true' : undefined}
                onClick={() => setI(k)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
