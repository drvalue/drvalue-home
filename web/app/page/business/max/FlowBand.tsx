'use client'

import { useEffect, useRef, useState } from 'react'
import { KPI, STAGES } from './maxContent'

/**
 * MES 공통 프로세스 흐름 — channel.io/kr/meet/call 의 IVR 구역(어두운 남색 판 · 가운데 제목 ·
 * 선으로 이어진 흰 카드 · 밑에 유리 카드 셋)으로 다시 그렸다. 2026-09-22 사용자가 옛 MaxFlow
 * (6칸 지그재그 + 「AI 자동화만 보기」 토글)를 「너무 별로」라 했다.
 *
 *  - 위: 단계 6개가 게이지 레일. 5초에 차면 다음 단계로 넘어간다(ShowTabs 와 같은 규칙 — 마우스 올리면 멈춤, 화면 밖이면 정지).
 *  - 가운데: 현재 단계의 주공정 카드와 보조공정 카드가 점선으로 이어진다. AI 가 대신하는 일엔 AI 표.
 *  - 아래: KPI 셋(납기·이익·품질 영향 분석) — 레퍼런스의 유리 카드 셋 자리.
 * 글은 전부 maxContent.ts 의 STAGES·KPI 그대로.
 */
const STEP_MS = 5000

export default function FlowBand() {
  const [cur, setCur] = useState(0)
  const [auto, setAuto] = useState(false)
  const [tick, setTick] = useState(0)
  const box = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = box.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const io = new IntersectionObserver((es) => setAuto(es.some((e) => e.isIntersecting && e.boundingClientRect.height > 0)), { threshold: 0.2 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const go = (i: number) => { setCur(i % STAGES.length); setTick((t) => t + 1) }
  const s = STAGES[cur]
  const aiCount = STAGES.reduce((n, x) => n + x.top.filter((y) => y.ai).length + (x.bottom ?? []).filter((y) => y.ai).length, 0)

  const notes = (list: { t: string; ai?: boolean }[]) => (
    <ul className="mx_fb_notes">
      {list.map((n) => <li key={n.t} className={n.ai ? 'ai' : undefined}>{n.ai && <em aria-label="AI 가 자동으로">AI</em>}{n.t}</li>)}
    </ul>
  )

  return (
    <section className="mx_fb" ref={box}>
      <i className="mx_blob mx_b1" aria-hidden="true" /><i className="mx_blob mx_b2" aria-hidden="true" />
      <div className="mx_wrap">
        <div className="mx_fb_head" data-rv>
          <p className="mx_bento_k">제조 흐름 · AI 가 대신하는 일 {aiCount}</p>
          <h2 data-words>업종이 달라도 제조의 흐름은 같습니다</h2>
          <p className="mx_bento_d">견적부터 출고까지 여섯 단계를 하나의 데이터 흐름으로 잇습니다. 단계를 누르면 그 구간에서 무엇이 기록되고 무엇을 AI 가 대신하는지 봅니다.</p>
        </div>

        <ol className="mx_fb_rail hk_show" role="tablist" aria-label="제조 단계">
          {STAGES.map((x, i) => (
            <li key={x.main}>
              <button type="button" role="tab" aria-selected={i === cur} className={i === cur ? 'on' : undefined} onClick={() => go(i)}>
                <i className="hk_show_bar" aria-hidden="true">
                  {i === cur && auto && <b key={tick} style={{ animationDuration: `${STEP_MS}ms` }} onAnimationEnd={() => go(cur + 1)} />}
                </i>
                <b><small>{String(i + 1).padStart(2, '0')}</small>{x.main}</b>
                {x.sub && <span>+ {x.sub}</span>}
              </button>
            </li>
          ))}
        </ol>

        <div key={s.main} className={`mx_fb_panel${s.sub ? '' : ' one'}`} role="tabpanel">
          <article className="mx_fb_card">
            <header><small>주공정</small><h3>{s.main}</h3></header>
            {notes(s.top)}
          </article>
          {s.sub && (
            <>
              <i className="mx_fb_link" aria-hidden="true" />
              <article className="mx_fb_card sub">
                <header><small>같이 도는 공정</small><h3>{s.sub}</h3></header>
                {s.bottom && notes(s.bottom)}
              </article>
            </>
          )}
        </div>

        <ul className="mx_fb_kpi" data-rv="pop" aria-label="KPI 분석">
          {KPI.map((k) => (
            <li key={k.h}>
              <i className="mx_proof_ic" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M4 19h16" /><path d="M6 15l4-5 3 3 5-7" /></svg></i>
              <b>{k.h}</b>
              <span>{k.p}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
