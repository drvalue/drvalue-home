'use client'

import { useState } from 'react'
import { HK_BIZ } from './hankeonContent'

/**
 * Biz 판정 셋 — 채널톡 ALF 장의 짜임(2026-09-22 사용자가 지목): 폭 전체 사진 판 안에 「내 정보」와
 * 실제 공고 카드가 선으로 이어져 있고, 아래 3열 탭을 누르면 그 판정으로 간다.
 * 스스로 넘어가지 않는다(2026-09-28 사용자: 시간이 지나야 다음 걸 보는 UI 정리). 움직임을 줄인 사람에게는
 * 카드 떠오름만 뺀다. 첫 탭이 켜진 채 서버에서 그려지므로 스크립트 없이도 카드 한 장은 보인다.
 *
 * 카드 값(출처·제목·기관·추정가·경쟁 방식·판정 줄)은 hankeon.com/biz 화면 그대로 — 여기서 짓지 않는다.
 */

export default function BizShowcase() {
  const [cur, setCur] = useState(0)
  const [tick, setTick] = useState(0) // 같은 탭을 다시 눌러도 막대가 처음부터


  const go = (i: number) => { setCur(i % HK_BIZ.cases.length); setTick((t) => t + 1) }
  const c = HK_BIZ.cases[cur]
  const mark = (k: string) => (k === 'ok' ? '✓' : k === 'no' ? '✕' : '?')

  return (
    <div className="hk_show" data-rv>
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
            <i className="hk_show_bar" aria-hidden="true" />
            <b>{x.v} — {x.t2}</b>
            <span>{x.d}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
