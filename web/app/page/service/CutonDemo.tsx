'use client'

import { useEffect, useRef, useState } from 'react'
import { CT_DEMO } from './cutonContent'

/**
 * 컷온 체험 가이드 「예상견적산출」을 **순서대로 다시 보여 준다** — 도면 파일이 올라오고, 항목이 잡히고,
 * 분석값이 한 줄씩 채워지고, 재질그룹별 가격이 튀어나온 뒤 최저 합계가 뜬다.
 * 값은 전부 cuton.co.kr 가이드 화면의 것(cutonContent.ts). 연출만 우리 것이다.
 *
 * 화면에 들어오면 한 번 돈다. 「다시 보기」로 되감는다. 움직임을 줄인 사람에게는 끝난 상태를
 * 바로 보여 준다. 스크립트가 없어도 끝난 상태가 그려진다(기본값 = 완료).
 */
type Phase = 0 | 1 | 2 | 3 | 4 // 0 대기 · 1 도면 · 2 분석 · 3 가격 · 4 끝

export default function CutonDemo() {
  const box = useRef<HTMLDivElement>(null)
  const [phase, setPhase] = useState<Phase>(4)
  const [spec, setSpec] = useState(CT_DEMO.spec.length)
  const timers = useRef<number[]>([])

  const clear = () => { timers.current.forEach(clearTimeout); timers.current = [] }
  const at = (ms: number, fn: () => void) => { timers.current.push(window.setTimeout(fn, ms)) }

  const play = () => {
    clear()
    setPhase(1); setSpec(0)
    let t = 1400
    at(t, () => setPhase(2))
    CT_DEMO.spec.forEach((_, i) => { t += 520; at(t, () => setSpec(i + 1)) })
    t += 600
    at(t, () => setPhase(3))
    t += 1500
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

  return (
    <div className={`hk_demo ct_demo ct_p${phase}`} ref={box}>
      <div className="hk_win">
        <div className="hk_bar"><i /><i /><i /><span>cuton.co.kr / 예상견적산출 · 체험 가이드</span></div>
        <div className="hk_body ct_body">
          <div className="ct_left">
            <p className="ct_file"><i aria-hidden="true" /><b>{CT_DEMO.file}</b><span>{CT_DEMO.size} · {CT_DEMO.picked}</span></p>
            <ul className="ct_items" aria-label="항목">
              {CT_DEMO.items.map((it, i) => (
                <li key={it.t} style={{ ['--i' as string]: i }}><b>{it.t}</b><span>{it.d}</span><em>{it.price}</em></li>
              ))}
            </ul>
            <dl className="ct_spec" aria-label="항목 1 분석값">
              {CT_DEMO.spec.map(([k, v], i) => (
                <div key={k} className={i < spec ? 'on' : undefined}><dt>{k}</dt><dd>{v}</dd></div>
              ))}
            </dl>
          </div>
          <div className="ct_right" aria-live="polite">
            <p className="ct_gh">재질그룹별 가격 <span>항목 1</span></p>
            <ul className="ct_groups" aria-label="재질그룹별 가격">
              {CT_DEMO.groups.map((g, i) => (
                <li key={g.g} className={g.low ? 'low' : undefined} style={{ ['--i' as string]: i }}>
                  <b>{g.g}{g.low && <i>최저</i>}</b><span>{g.m}</span><em>{g.p}</em>
                </li>
              ))}
            </ul>
            <p className="ct_total"><span>{CT_DEMO.totalLabel}</span><b>{CT_DEMO.total}</b></p>
          </div>
        </div>
      </div>
      <div className="hk_ctl">
        <span>{CT_DEMO.note}</span>
        <button type="button" onClick={play}>다시 보기</button>
      </div>
    </div>
  )
}
