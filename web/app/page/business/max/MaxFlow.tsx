'use client'

import { useRef, useState } from 'react'
import { KPI, STAGES } from './maxContent'

/**
 * MES 공통 프로세스 흐름.
 *
 * 이 페이지의 중심인데 처음엔 6칸의 글이 한꺼번에 다 보였다. 34줄이 한 화면에
 * 깔리니 읽는 사람이 어디부터 볼지 모른다. 그래서 두 가지를 준다.
 *
 *   1. 단계를 고르면 **그 칸만 또렷하고 나머지는 흐려진다.** 흐름의 한 칸씩
 *      따라 읽을 수 있다. 아무것도 안 고르면 전부 또렷한 원래 모습이다 —
 *      고르기 전이 "반쯤 가려진 화면" 이면 안 된다.
 *   2. AI 항목만 켜고 끄는 단추. 이 페이지의 주장이 "AI 가 무엇을 자동으로
 *      하는가" 라서, 그것만 남겨 보는 것이 제일 빠른 설명이다.
 *
 * 고른 것을 다시 누르면 풀린다. 빠져나갈 길이 없으면 갇힌다.
 */
export default function MaxFlow() {
  const [pick, setPick] = useState<number | null>(null)
  const [aiOnly, setAiOnly] = useState(false)
  const flow = useRef<HTMLOListElement>(null)

  const aiCount = STAGES.reduce(
    (n, s) => n + s.top.filter((x) => x.ai).length + (s.bottom ?? []).filter((x) => x.ai).length,
    0,
  )

  function notes(list: { t: string; ai?: boolean }[] | undefined) {
    if (!list) return null
    const rows = aiOnly ? list.filter((n) => n.ai) : list
    if (!rows.length) return <ul className="mx_note mx_note_empty" aria-hidden="true" />
    return (
      <ul className="mx_note">
        {rows.map((n) => (
          <li key={n.t} className={n.ai ? 'is-ai' : ''}>
            {n.ai && <em>AI</em>}{n.t}
          </li>
        ))}
      </ul>
    )
  }

  return (
    <>
      <div className="mx_kpi" role="group" aria-label="KPI 분석">
        <div className="mx_kpi_tag">KPI</div>
        <div className="mx_kpi_items">
          {KPI.map((k) => (
            <div key={k.h}><h3>{k.h}</h3><p>{k.p}</p></div>
          ))}
        </div>
      </div>

      <div className="mx_flow_bar">
        <button
          type="button"
          className={`mx_aionly${aiOnly ? ' is-on' : ''}`}
          aria-pressed={aiOnly}
          onClick={() => setAiOnly((v) => !v)}
        >
          <i className="fa fa-magic" aria-hidden="true" />
          AI 자동화만 보기
          <span className="mx_aicount">{aiCount}</span>
        </button>
        {pick !== null && (
          <button type="button" className="mx_clear" onClick={() => setPick(null)}>
            전체 보기
          </button>
        )}
        <p className="mx_flow_hint">단계를 누르면 그 구간만 또렷하게 봅니다.</p>
      </div>

      <div className="mx_flow_scroll">
        <ol
          ref={flow}
          className={`mx_flow${pick !== null ? ' is-picked' : ''}`}
          aria-label="MES 프로세스 흐름"
          // 단계가 왼쪽부터 차례로 튀어나오고 고리가 퍼진다(v4). Reveal 이 li 마다 --i 를 준다.
          data-rv="pop"
        >
          {STAGES.map((s, i) => (
            <li
              className={`mx_stage${pick === i ? ' is-on' : ''}`}
              key={s.main}
            >
              {notes(s.top)}
              <button
                type="button"
                className="mx_pbox"
                aria-pressed={pick === i}
                onClick={() => setPick(pick === i ? null : i)}
              >
                {s.main}
                {i < STAGES.length - 1 && <span className="mx_arrow" aria-hidden="true" />}
              </button>
              {s.sub && (
                <>
                  <div className="mx_vlink" aria-hidden="true" />
                  <div className="mx_pbox is-sub">{s.sub}</div>
                </>
              )}
              {notes(s.bottom)}
            </li>
          ))}
        </ol>
      </div>
    </>
  )
}
