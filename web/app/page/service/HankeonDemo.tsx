'use client'

import { useEffect, useRef, useState } from 'react'
import { HK_DEMO } from './hankeonContent'

/**
 * 한건 Chat 이 실제로 한 일을 **순서대로 다시 보여 준다** — 질문이 타이핑되고,
 * 진행 단계가 하나씩 켜지고, 답이 단락으로 떠오르고, 인용 조문이 튀어나온다.
 * 글은 전부 2026-09-22 실제 응답(hankeonContent.ts). 연출만 우리 것이다.
 *
 * 화면에 들어오면 한 번 돈다. 「다시 보기」로 되감는다. 움직임을 줄인 사람에게는
 * 끝난 상태를 바로 보여 준다. 스크립트가 없어도 끝난 상태가 그려진다(기본값 = 완료).
 */
type Phase = 0 | 1 | 2 | 3 | 4 // 0 대기 · 1 타이핑 · 2 단계 · 3 답 · 4 끝

export default function HankeonDemo() {
  const box = useRef<HTMLDivElement>(null)
  const [phase, setPhase] = useState<Phase>(4)
  const [typed, setTyped] = useState(HK_DEMO.q.length)
  const [step, setStep] = useState(HK_DEMO.steps.length)
  const timers = useRef<number[]>([])

  const clear = () => { timers.current.forEach(clearTimeout); timers.current = [] }
  const at = (ms: number, fn: () => void) => { timers.current.push(window.setTimeout(fn, ms)) }

  const play = () => {
    clear()
    setPhase(1); setTyped(0); setStep(0)
    const q = HK_DEMO.q
    // 타이핑: 글자당 28ms, 쉼표·마침표 뒤엔 조금 멈춘다
    let t = 200
    for (let i = 1; i <= q.length; i++) {
      t += /[,.?]/.test(q[i - 2] ?? '') ? 140 : 26
      at(t, () => setTyped(i))
    }
    t += 400
    at(t, () => setPhase(2))
    HK_DEMO.steps.forEach((_, i) => { t += 650; at(t, () => setStep(i + 1)) })
    t += 500
    at(t, () => setPhase(3))
    t += 1600
    at(t, () => setPhase(4))
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

  const q = HK_DEMO.q.slice(0, typed)
  return (
    <div className={`hk_demo hk_p${phase}`} ref={box}>
      <div className="hk_win">
        <div className="hk_bar"><i /><i /><i /><span>hankeon.com / Chat · 근거 기반 질의응답</span></div>
        <div className="hk_body">
          <div className="hk_q"><span>{q}</span>{phase === 1 && <i className="hk_caret" aria-hidden="true" />}</div>

          <ol className="hk_steps" aria-label="진행 단계">
            {HK_DEMO.steps.map((s, i) => (
              <li key={s} className={i < step ? 'on' : undefined}><b aria-hidden="true">{i < step ? '✓' : ''}</b>{s}</li>
            ))}
          </ol>

          <div className="hk_ans" aria-live="polite">
            {HK_DEMO.answer.map((p, i) => <p key={i} style={{ ['--i' as string]: i }}>{p}</p>)}
            <p className="hk_verdict" style={{ ['--i' as string]: HK_DEMO.answer.length }}>[해석] {HK_DEMO.verdict}</p>
            <ul className="hk_cites" aria-label="인용 조문">
              {HK_DEMO.cites.map((c, i) => <li key={c} style={{ ['--i' as string]: i }}>{c}</li>)}
              <li className="hk_ev" style={{ ['--i' as string]: HK_DEMO.cites.length }}>근거 {HK_DEMO.evidence}건</li>
            </ul>
          </div>
        </div>
      </div>
      <div className="hk_ctl">
        <span>실제 응답 · {HK_DEMO.took}</span>
        <button type="button" onClick={play}>다시 보기</button>
      </div>
    </div>
  )
}
