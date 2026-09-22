'use client'

import { useEffect, useRef, useState } from 'react'
import { Plate, type Shot, type Tone } from './V4'

/**
 * 판 + 진행 막대 탭 셋 — 채널웍스·CoS 장에서 큰 판 밑에 오는 「3열 탭」. 막대가 6초에 차면 다음
 * 탭으로 넘어가며 위 판의 화면이 바뀐다. 탭을 누르면 바로 그 화면. 마우스를 올리면 막대가 멈춘다(CSS).
 * 화면 밖이면 자동을 끈다. 첫 탭이 켜진 채 서버에서 그려지므로 스크립트 없이도 화면 한 장은 보인다.
 * 한건 장의 BizShowcase 와 같은 규칙 — 그쪽은 카드가 바뀌고 여기는 화면이 바뀐다.
 *
 * 사용자 지적(2026-09-22): 판 밑 3열이 링크만 되고 「애니메이션이 멈춰 있다」 — 채널톡의 그 줄은
 * 항상 게이지 탭이지 링크 목록이 아니다.
 */
export type ShowItem = { t: string; d: string; shot: Shot; tag?: string; url?: string; phone?: boolean; narrow?: boolean; tone?: Tone }
const STEP_MS = 6000

export default function ShowTabs({ items }: { items: ShowItem[] }) {
  const [cur, setCur] = useState(0)
  const [auto, setAuto] = useState(false)
  const [tick, setTick] = useState(0)
  const box = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = box.current
    if (!el) return
    // 숨은 탭 판(높이 0)은 자동을 안 켠다 — 안 그러면 다섯이 같이 넘어간다.
    const io = new IntersectionObserver((es) => setAuto(es.some((e) => e.isIntersecting && e.boundingClientRect.height > 0)), { threshold: 0.15 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const go = (i: number) => { setCur(i % items.length); setTick((t) => t + 1) }
  const c = items[cur]
  return (
    <div className="hk_show mx_showtabs" ref={box}>
      <div key={c.shot.src} className="mx_showtabs_plate">
        <Plate shot={c.shot} tone={c.tone} tag={c.tag} url={c.url} phone={c.phone} narrow={c.narrow} />
      </div>
      <div className="hk_show_tabs" role="tablist" aria-label="화면">
        {items.map((x, i) => (
          <button key={x.t} type="button" role="tab" aria-selected={i === cur} className={i === cur ? 'on' : undefined} onClick={() => go(i)}>
            <i className="hk_show_bar" aria-hidden="true">
              {i === cur && auto && <b key={tick} style={{ animationDuration: `${STEP_MS}ms` }} onAnimationEnd={() => go(cur + 1)} />}
            </i>
            <b>{x.t}</b>
            <span>{x.d}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
