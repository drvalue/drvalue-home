'use client'

import { useEffect, useRef, useState } from 'react'
import { GC_DEMO, GC_UI } from './growchatContent'

/**
 * GrowChat 고객 창에서 실제로 오간 대화를 **순서대로 다시 보여 준다** — 고객 문의가 타이핑되어
 * 말풍선이 되고, 「상담이 시작되었습니다」가 뜨고, 상담사 답 둘이 차례로 떠오른다.
 * 글은 2026-09-22 로컬 GrowChat 에서 오간 것(growchatContent.ts). 연출만 우리 것이다.
 *
 * 화면에 들어오면 한 번 돈다. 「다시 보기」로 되감는다. 움직임을 줄인 사람에게는 끝난 상태를
 * 바로 보여 준다. 스크립트가 없어도 끝난 상태가 그려진다(기본값 = 완료).
 */
type Phase = 0 | 1 | 2 | 3 | 4 | 5 // 0 대기 · 1 첫 문의 타이핑 · 2 둘째 타이핑 · 3 상담 시작 · 4 답 · 5 끝

export default function GrowchatDemo() {
  const box = useRef<HTMLDivElement>(null)
  const [phase, setPhase] = useState<Phase>(5)
  const [typed, setTyped] = useState(-1) // -1 = 타이핑 없음
  const timers = useRef<number[]>([])

  const clear = () => { timers.current.forEach(clearTimeout); timers.current = [] }
  const at = (ms: number, fn: () => void) => { timers.current.push(window.setTimeout(fn, ms)) }

  const play = () => {
    clear()
    let t = 300
    const type = (q: string, p: Phase) => {
      at(t, () => { setPhase(p); setTyped(0) })
      for (let i = 1; i <= q.length; i++) { t += /[,.?]/.test(q[i - 2] ?? '') ? 120 : 24; at(t, () => setTyped(i)) }
      t += 350
      at(t, () => setTyped(-1)) // 전송 → 말풍선으로
      t += 500
    }
    type(GC_DEMO.customer[0], 1)
    type(GC_DEMO.customer[1], 2)
    at(t, () => setPhase(3)); t += 1100
    at(t, () => setPhase(4)); t += 2200
    at(t, () => setPhase(5))
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

  const typingQ = phase === 1 ? GC_DEMO.customer[0] : phase === 2 ? GC_DEMO.customer[1] : ''
  const shown = phase === 0 ? 0 : phase === 1 ? 0 : phase === 2 ? 1 : 2 // 말풍선이 된 고객 문의 수
  return (
    <div className={`gc_demo gc_p${phase}`} ref={box}>
      <div className="gc_win">
        <div className="gc_top"><b>{GC_UI.brand}</b><span>{GC_UI.hours}</span></div>
        <div className="gc_body">
          <p className="gc_sys">{GC_UI.opened}</p>
          {GC_DEMO.customer.slice(0, shown).map((m, i) => <p key={i} className="gc_me">{m}</p>)}
          {phase >= 3 && <p className="gc_sys gc_start">{GC_UI.started}</p>}
          {phase >= 4 && (
            <div className="gc_them" aria-live="polite">
              <span className="gc_who">{GC_UI.agentLabel}</span>
              {GC_DEMO.agent.map((m, i) => <p key={i} style={{ ['--i' as string]: i }}>{m}</p>)}
              <small>{GC_DEMO.time.answer} 읽음</small>
            </div>
          )}
        </div>
        <div className="gc_input"><span><b>{typed >= 0 ? typingQ.slice(0, typed) : GC_UI.placeholder}</b>{typed >= 0 && <i className="gc_caret" aria-hidden="true" />}</span><i aria-hidden="true">➤</i></div>
      </div>
      <div className="hk_ctl">
        <span>홈페이지 상담 창에서 그대로 찍은 시연 대화 · {GC_DEMO.time.ask} → {GC_DEMO.time.answer}</span>
        <button type="button" onClick={play}>다시 보기</button>
      </div>
    </div>
  )
}
