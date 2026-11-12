'use client'

import { useEffect, useRef, useState } from 'react'
import { ER_CHAT } from './everyragContent'

/**
 * everyrag 가 사이트에 올려 둔 예시 대화를 **순서대로 다시 보여 준다** — 묻고, 답이 뜬다. 세 번.
 * 자료에 있으면 인용이 붙고, 없으면 없다고 답하고, 일반 지식은 「자료 밖」 표시가 붙는다.
 * 글은 전부 그 예시 화면 그대로(everyragContent.ts). 연출만 우리 것이다.
 *
 * 화면에 들어오면 한 번 돈다. 「다시 보기」로 되감는다. 움직임을 줄인 사람에게는 끝난 상태를 바로 보여 준다.
 * 스크립트가 없어도 끝난 상태가 그려진다(기본값 = 전부 보임).
 */
const TOTAL = ER_CHAT.length * 2

export default function EveryragDemo() {
  const [shown, setShown] = useState(TOTAL)
  const [playing, setPlaying] = useState(false)
  const box = useRef<HTMLDivElement>(null)
  const timers = useRef<number[]>([])

  const clear = () => { timers.current.forEach(clearTimeout); timers.current = [] }
  const at = (ms: number, fn: () => void) => { timers.current.push(window.setTimeout(fn, ms)) }

  const play = () => {
    clear()
    setPlaying(true); setShown(0)
    let t = 300
    for (let i = 1; i <= TOTAL; i++) {
      // 질문 뒤 답은 조금 뜸을 들이고, 다음 질문은 답을 읽을 틈을 준다
      t += i % 2 === 1 ? (i === 1 ? 200 : 1500) : 900
      at(t, () => setShown(i))
    }
    at(t + 600, () => setPlaying(false))
  }

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

  const cls = (base: string, n: number) => `${base}${n > shown ? ' er_hide' : playing ? ' er_in' : ''}`
  return (
    <div className="hk_demo er_demo" ref={box}>
      <div className="hk_win">
        <div className="hk_bar"><i /><i /><i /><span>studio.everyrag.com · 예시 대화</span></div>
        <div className="hk_body">
          <ol className="er_chat" aria-live="polite">
            {ER_CHAT.flatMap((turn, i) => [
              <li key={`q${i}`} className={cls('er_q', i * 2 + 1)}>{turn.q}</li>,
              <li key={`a${i}`} className={cls(turn.kind === 'none' ? 'er_a none' : 'er_a', i * 2 + 2)}>
                {turn.kind === 'outside' && <span className="er_out">자료 밖</span>}
                {turn.a}
                {turn.kind === 'cite' && (
                  <>
                    <sup>[{turn.cite.no}]</sup>.
                    <span className="er_cite"><b>[{turn.cite.no}] {turn.cite.source}</b>{turn.cite.text}</span>
                  </>
                )}
              </li>,
            ])}
          </ol>
        </div>
      </div>
      <div className="hk_ctl">
        <span>서비스 사이트의 예시 대화</span>
        <button type="button" onClick={play}>다시 보기</button>
      </div>
    </div>
  )
}
