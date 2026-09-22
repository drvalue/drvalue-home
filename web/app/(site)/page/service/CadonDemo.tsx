'use client'

import { useEffect, useRef, useState } from 'react'
import { CD_STEPS } from './cadonContent'

/**
 * CADON 이 AutoCAD 안에서 한 일을 **순서대로 다시 보여 준다** — STEP 열기 → 전개·작도 →
 * 절곡 시뮬레이션 → 3D 되접기. 화면 네 장은 실제 실행 캡처(cadonContent.ts), 단계 이름과
 * 한 줄 설명만 우리 것이다. 화면이 바뀔 때 그 단계의 명령과 화면에 찍힌 값이 함께 뜬다.
 *
 * 화면에 들어오면 한 번 돈다(단계당 2.6초). 「다시 보기」로 되감는다. 단계를 누르면 그리로 간다.
 * 움직임을 줄인 사람에게는 끝 상태(마지막 단계·전 단계 완료)를 바로 보여 준다. 스크립트가 없어도
 * 끝 상태가 그려진다(기본값 = 완료).
 */
const STEP_MS = 2600
const LAST = CD_STEPS.length - 1

export default function CadonDemo() {
  const box = useRef<HTMLDivElement>(null)
  const [cur, setCur] = useState(LAST)     // 보이는 화면
  const [done, setDone] = useState(LAST)   // 이 번호까지 완료 표시
  const [playing, setPlaying] = useState(false)
  const timers = useRef<number[]>([])

  const clear = () => { timers.current.forEach(clearTimeout); timers.current = [] }
  const play = () => {
    clear()
    setPlaying(true); setCur(0); setDone(-1)
    CD_STEPS.forEach((_, i) => {
      timers.current.push(window.setTimeout(() => { setCur(i); setDone(i - 1) }, i * STEP_MS))
      timers.current.push(window.setTimeout(() => setDone(i), i * STEP_MS + STEP_MS * 0.7))
    })
    timers.current.push(window.setTimeout(() => setPlaying(false), CD_STEPS.length * STEP_MS))
  }
  const jump = (i: number) => { clear(); setPlaying(false); setCur(i); setDone(i) }

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

  const s = CD_STEPS[cur]
  return (
    <div className={`cd_demo${playing ? ' is-playing' : ''}`} ref={box}>
      <div className="cd_screen">
        <div className="cd_screen_bar"><i /><i /><i /><span>AutoCAD · 명령: {s.cmd}</span></div>
        <div className="cd_shots">
          {CD_STEPS.map((x, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={x.shot.src} src={x.shot.src} alt={x.shot.alt} width={x.shot.w} height={x.shot.h}
              loading={i === LAST ? undefined : 'lazy'} className={i === cur ? 'on' : undefined} aria-hidden={i !== cur} />
          ))}
        </div>
        <ul key={cur} className="cd_facts" aria-label="화면에 찍힌 값">
          {s.facts.map((f, i) => <li key={f} style={{ ['--i' as string]: i }}>{f}</li>)}
        </ul>
      </div>

      <div className="cd_side">
        <ol className="cd_steps" aria-label="진행 단계">
          {CD_STEPS.map((x, i) => (
            <li key={x.t} className={i === cur ? 'on' : i <= done ? 'ok' : undefined}>
              <button type="button" onClick={() => jump(i)} aria-current={i === cur ? 'step' : undefined}>
                <i aria-hidden="true">{i <= done && i !== cur ? '✓' : i + 1}</i>
                <span><b>{x.t}</b><small>{x.sub}</small></span>
              </button>
            </li>
          ))}
        </ol>
        <div className="cd_ctl">
          <span>실제 실행 화면 · unistrut.STEP 한 부품</span>
          <button type="button" onClick={play}>다시 보기</button>
        </div>
      </div>
    </div>
  )
}
