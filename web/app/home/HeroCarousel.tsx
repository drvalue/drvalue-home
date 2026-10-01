'use client'

import { Children, useEffect, useState, type ReactNode } from 'react'

/**
 * 홈 머리 그림의 장 넘김(2026-10-01 사용자 요청 — 슬라이드를 뺀 결정을 되돌렸다, decisions/0019).
 *
 * - 스크립트가 없으면 장이 위에서 아래로 그냥 쌓여 둘 다 보인다(「보이는 것이 기본」). 마운트한 뒤에만
 *   `is-rot` 을 달아 한 칸에 겹치고 하나만 보인다 — 숨기는 일은 스크립트가 한다.
 * - 자동 넘김은 7초. 마우스를 올리거나 안에 포커스가 있거나 탭이 가려졌거나 사용자가 멈췄으면 쉰다.
 *   움직임을 줄인 사람에게는 자동으로 안 넘기고 점으로만 옮긴다.
 * - 안 보이는 장은 `inert` — 숨은 링크에 탭이 가지 않는다.
 */
const INTERVAL = 7000

export default function HeroCarousel({ children }: { children: ReactNode }) {
  const slides = Children.toArray(children)
  const n = slides.length
  const [rot, setRot] = useState(false)
  const [i, setI] = useState(0)
  const [paused, setPaused] = useState(false)
  const [hold, setHold] = useState(false)
  const [away, setAway] = useState(false)
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    setRot(true)
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const readMq = () => setReduced(mq.matches)
    const readVis = () => setAway(document.hidden)
    readMq()
    readVis()
    mq.addEventListener('change', readMq)
    document.addEventListener('visibilitychange', readVis)
    return () => {
      mq.removeEventListener('change', readMq)
      document.removeEventListener('visibilitychange', readVis)
    }
  }, [])

  const playing = rot && n > 1 && !reduced && !paused && !hold && !away
  useEffect(() => {
    if (!playing) return
    const t = window.setTimeout(() => setI((k) => (k + 1) % n), INTERVAL)
    return () => window.clearTimeout(t)
  }, [playing, i, n])

  return (
    <div
      className={rot ? 'dv_hero_set is-rot' : 'dv_hero_set'}
      role="region"
      aria-roledescription="carousel"
      aria-label="주요 소식"
      onMouseEnter={() => setHold(true)}
      onMouseLeave={() => setHold(false)}
      onFocus={() => setHold(true)}
      onBlur={() => setHold(false)}
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
