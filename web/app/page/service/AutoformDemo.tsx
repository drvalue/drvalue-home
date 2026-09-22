'use client'

import { useEffect, useRef, useState } from 'react'
import { AF_DEMO } from './autoformContent'

/**
 * 오토폼이 하는 일 세 단계를 **실제 화면 세 장으로 차례로** 보여 준다 — 양식 등록 → 칸·데이터
 * 맺기 → 레코드 고르면 문서 생성. 단계가 켜지면 그 화면이 뜨고, 화면에 찍힌 값들이 라벨로
 * 하나씩 튀어나온다(라벨 글은 전부 그 화면에 있는 것 — autoformContent.ts).
 *
 * 화면에 들어오면 한 번 돈다. 「다시 보기」로 되감는다. 단계 단추를 누르면 그 단계로 바로 간다.
 * 움직임을 줄인 사람과 스크립트가 없는 환경에는 마지막 단계(문서 생성)가 바로 보인다.
 */
const HOLD_MS = 2600

export default function AutoformDemo() {
  const box = useRef<HTMLDivElement>(null)
  const last = AF_DEMO.steps.length - 1
  const [cur, setCur] = useState(last)
  const [playing, setPlaying] = useState(false)
  const [tick, setTick] = useState(0)
  const timers = useRef<number[]>([])

  const clear = () => { timers.current.forEach(clearTimeout); timers.current = [] }
  const play = () => {
    clear()
    setPlaying(true); setTick((t) => t + 1); setCur(0)
    AF_DEMO.steps.forEach((_, i) => {
      if (i === 0) return
      timers.current.push(window.setTimeout(() => setCur(i), i * HOLD_MS))
    })
    timers.current.push(window.setTimeout(() => setPlaying(false), last * HOLD_MS + HOLD_MS))
  }
  const pick = (i: number) => { clear(); setPlaying(false); setTick((t) => t + 1); setCur(i) }

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const el = box.current
    if (!el) return
    const io = new IntersectionObserver((es) => {
      if (es.some((e) => e.isIntersecting)) { io.disconnect(); play() }
    }, { threshold: 0.35 })
    io.observe(el)
    return () => { io.disconnect(); clear() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const s = AF_DEMO.steps[cur]
  return (
    <div className="af_demo" ref={box}>
      <ol className="af_steps" aria-label="단계">
        {AF_DEMO.steps.map((x, i) => (
          <li key={x.t}>
            <button type="button" className={i === cur ? 'on' : i < cur ? 'done' : undefined} onClick={() => pick(i)} aria-current={i === cur ? 'step' : undefined}>
              <i aria-hidden="true">{i < cur ? '✓' : i + 1}</i>
              <span><b>{x.t}</b><small>{x.sub}</small></span>
              {i === cur && playing && <em className="af_bar" aria-hidden="true"><b key={tick} style={{ animationDuration: `${HOLD_MS}ms` }} /></em>}
            </button>
          </li>
        ))}
      </ol>
      <div className="hk_win af_win">
        <div className="hk_bar"><i /><i /><i /><span>form automation · {s.t}</span></div>
        <div className="af_stage" key={`${cur}-${tick}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={s.shot.src} alt={s.shot.alt} width={s.shot.w} height={s.shot.h} loading="lazy" style={{ objectPosition: s.pos }} />
          <ul className="af_labels" aria-label="화면에 찍힌 값">
            {s.labels.map((l, i) => <li key={l} style={{ ['--i' as string]: i }}>{l}</li>)}
          </ul>
        </div>
      </div>
      <div className="hk_ctl">
        <span>실제 화면 · 2026년 7월</span>
        <button type="button" onClick={play}>다시 보기</button>
      </div>
    </div>
  )
}
