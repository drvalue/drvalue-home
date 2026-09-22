'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { mark, plain } from './text'
import type { Feature } from './maxContent'

/**
 * 기능 묶음 하나 = 게이지 레일(FlowBand 와 같은 규칙: 6초에 차면 다음, 마우스 올리면 멈춤,
 * 화면 밖이면 정지) + 현재 기능의 **전문** 판. 판은 글 왼쪽(제목·요점 전부·콜아웃·해시태그)
 * 과 화면 오른쪽. 화면이 없는 기능은 글이 폭을 다 쓰고, extra 가 있으면 그 밑에 붙는다.
 *
 * 2026-09-22 사용자: 탭 한 줄로 줄이니 「내용 7개 다 어디 갔냐」 — 요점·콜아웃·칩은 자료다,
 * 레이아웃이 바뀌어도 하나도 빠지면 안 된다. 그래서 ShowTabs(제목+한 줄) 대신 이것.
 */
const STEP_MS = 6000
const short = (f: Feature) => f.kicker.replace(/^[^-]+ - /, '')

export default function FeatureShow({ items, extra, url, hideShot = [] }: {
  items: Feature[]
  /** 기능 번호별로 판 밑에 더 그릴 것(예: KPI 셋). */
  extra?: Record<number, ReactNode>
  url?: string
  /** 화면을 안 싣는 기능 번호(예: PCB KPI — 시연 값이라 대표로 못 세운다). */
  hideShot?: number[]
}) {
  const [cur, setCur] = useState(0)
  const [auto, setAuto] = useState(false)
  const [tick, setTick] = useState(0)
  const box = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = box.current
    if (!el || items.length < 2) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const io = new IntersectionObserver((es) => setAuto(es.some((e) => e.isIntersecting && e.boundingClientRect.height > 0)), { threshold: 0.15 })
    io.observe(el)
    return () => io.disconnect()
  }, [items.length])

  const go = (i: number) => { setCur(i % items.length); setTick((t) => t + 1) }
  const f = items[cur]
  const shot = hideShot.includes(f.no) ? undefined : f.shots?.[0]
  return (
    <div className="mx_fs hk_show" ref={box}>
      {items.length > 1 && (
        <ol className="mx_fs_rail" role="tablist" aria-label="기능">
          {items.map((x, i) => (
            <li key={x.no}>
              <button type="button" role="tab" aria-selected={i === cur} className={i === cur ? 'on' : undefined} onClick={() => go(i)}>
                <i className="hk_show_bar" aria-hidden="true">
                  {i === cur && auto && <b key={tick} style={{ animationDuration: `${STEP_MS}ms` }} onAnimationEnd={() => go(cur + 1)} />}
                </i>
                <b><small>{String(x.no).padStart(2, '0')}</small>{short(x)}</b>
              </button>
            </li>
          ))}
        </ol>
      )}
      <article key={f.no} className={`mx_fs_panel${shot ? '' : ' one'}`} role="tabpanel">
        <div className="mx_fs_txt">
          <p className="mx_fs_k">{f.kicker}</p>
          <h3>{mark(f.title)}</h3>
          <ul className="mx_fs_pts">
            {f.points.map((p) => <li key={p}>{mark(p)}</li>)}
          </ul>
          {f.callout && (
            <div className="mx_fs_callout">
              <p>{f.callout.lead}</p>
              <p className="mx_fs_res">{f.callout.result}</p>
            </div>
          )}
          {f.chips.length > 0 && (
            <ul className="mx_fs_chips" aria-label="키워드">
              {f.chips.map((c) => <li key={c}>#{c}</li>)}
            </ul>
          )}
          {extra?.[f.no]}
        </div>
        {shot && (
          <figure className="mx_fs_fig">
            <div className="mx_browser">
              <div className="mx_browser_bar" aria-hidden="true"><i /><i /><i /><span>{url ?? 'max.drvalue.co.kr'} / {short(f)}</span></div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={shot.src} alt={shot.alt} width={shot.w} height={shot.h} loading="lazy" />
            </div>
            {f.shots!.length > 1 && <figcaption>{plain(f.title)} · 화면 {f.shots!.length}장 중 첫 장</figcaption>}
          </figure>
        )}
      </article>
    </div>
  )
}
