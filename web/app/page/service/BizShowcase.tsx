'use client'

import { useEffect, useRef, useState } from 'react'
import { HK_BIZ } from './hankeonContent'

/**
 * Biz 판정 셋 — 채널톡 ALF 장의 짜임(2026-09-22 사용자가 지목): 폭 전체 사진 판 안에 「내 정보」와
 * 실제 공고 카드가 선으로 이어져 있고, 아래 3열 탭에 진행 막대가 차오르며 자동으로 다음 탭으로 넘어간다.
 * 탭을 누르면 그 판정으로 바로 간다. 마우스를 올리면 막대가 멈추고(CSS), 화면 밖이면 자동이 꺼진다. 움직임을 줄인 사람에게는
 * 카드 떠오름만 뺀다(막대·자동 넘김은 그대로). 첫 탭이 켜진 채 서버에서 그려지므로 스크립트 없이도 카드 한 장은 보인다.
 *
 * 카드 값(출처·제목·기관·추정가·경쟁 방식·판정 줄)은 hankeon.com/biz 화면 그대로 — 여기서 짓지 않는다.
 */
const STEP_MS = 6000

export default function BizShowcase() {
  const [cur, setCur] = useState(0)
  const [auto, setAuto] = useState(false)
  const [tick, setTick] = useState(0) // 같은 탭을 다시 눌러도 막대가 처음부터
  const box = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // 움직임 줄임이어도 자동 넘김은 둔다 — 4px 막대가 차는 것과 카드 교체는 흔들림이 아니다.
    // (카드 떠오르는 hkSwap 만 CSS 에서 끈다.)
    const el = box.current
    if (!el) return
    const io = new IntersectionObserver((es) => setAuto(es.some((e) => e.isIntersecting)), { threshold: 0.15 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const go = (i: number) => { setCur(i % HK_BIZ.cases.length); setTick((t) => t + 1) }
  const c = HK_BIZ.cases[cur]
  const mark = (k: string) => (k === 'ok' ? '✓' : k === 'no' ? '✕' : '?')

  return (
    <div className="hk_show" data-rv ref={box}>
      <div className="hk_show_plate">
        <div className="hk_show_me">
          <p className="hk_show_me_t">내 정보</p>
          <ul aria-label="내 정보">
            <li><span>지역</span><b>부산광역시</b></li>
            <li><span>면허</span><b>건축공사업 · 실내건축공사업</b></li>
            <li><span>대상</span><b>나라장터 · 지자체 공고 100건</b></li>
          </ul>
        </div>
        <i className="hk_show_link" aria-hidden="true" />
        <article key={c.k} className={`hk_bid ${c.k}`}>
          <p className="hk_bid_src"><i aria-hidden="true" />{c.card.src}</p>
          <h4>{c.card.t}</h4>
          <p className="hk_bid_org">{c.card.org}</p>
          <p className="hk_bid_price"><span>추정가</span><b>{c.card.price}</b><em>{c.card.kind}</em></p>
          <p className="hk_bid_verdict"><b>{mark(c.k)} {c.v}</b>{c.card.why}</p>
        </article>
      </div>
      <div className="hk_show_tabs" role="tablist" aria-label="판정 예시">
        {HK_BIZ.cases.map((x, i) => (
          <button key={x.k} type="button" role="tab" aria-selected={i === cur} className={i === cur ? 'on' : undefined} onClick={() => go(i)}>
            <i className="hk_show_bar" aria-hidden="true">
              {i === cur && auto && (
                <b key={tick} style={{ animationDuration: `${STEP_MS}ms` }}
                  onAnimationEnd={() => go(cur + 1)} />
              )}
            </i>
            <b>{x.v} — {x.t2}</b>
            <span>{x.d}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
