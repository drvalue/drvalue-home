'use client'

import { useState } from 'react'
import { CT_SHOW } from '../cutonContent'

/**
 * 컷온의 세 화면(예상견적산출 · 보관함 · 입찰마켓)을 채널톡 CoS 장의 짜임으로 — 폭 전체 판 안에
 * 「프로젝트」 패널과 그 화면의 카드가 점선으로 이어지고, 아래 3열 탭을 누르면 그 화면으로 간다
 * (스스로 넘어가지 않는다 — 2026-09-28 사용자: 시간이 지나야 다음 걸 보는 UI 정리). 한건 장의
 * BizShowcase 와 같은 틀(.hk_show*)을 쓴다. 카드 값은 가이드 화면 그대로(cutonContent.ts).
 */

export default function CutonShow() {
  const [cur, setCur] = useState(0)
  const [tick, setTick] = useState(0)

  const go = (i: number) => { setCur(i % CT_SHOW.cases.length); setTick((t) => t + 1) }

  return (
    <div className="hk_show ct_show" data-rv>
      <div className="hk_show_plate">
        <div className="hk_show_me">
          <p className="hk_show_me_t">프로젝트</p>
          <ul aria-label="프로젝트">
            {CT_SHOW.me.map(([k, v]) => <li key={k}><span>{k}</span><b>{v}</b></li>)}
          </ul>
        </div>
        <i className="hk_show_link" aria-hidden="true" />
        {/* 판정·양식을 전부 HTML 에 싣고 고르지 않은 것만 숨긴다 — 고른 것만 그리면 나머지 내용이 검색·AI 크롤러에게 아예 없다(2026-09-28 SEO·GEO). */}
        {CT_SHOW.cases.map((c, i) => (
          <article key={`${c.k}-${i === cur ? tick : 'x'}`} className={`hk_bid ct_card ${c.k}`} hidden={i !== cur} aria-live={i === cur ? "polite" : undefined}>
          <p className="hk_bid_src"><i aria-hidden="true" />{c.card.src}</p>
          <h4>{c.card.t}</h4>
          <p className="hk_bid_org">{c.card.sub}</p>
          <ul className="ct_rows">
            {c.card.rows.map(([k, v]) => <li key={k}><span>{k}</span><b>{v}</b></li>)}
          </ul>
          <p className="hk_bid_price"><span>{c.card.big[0]}</span><b>{c.card.big[1]}</b></p>
          <p className="hk_bid_verdict"><b>{c.v}</b>{c.card.tail}</p>
        </article>
        ))}
      </div>
      <div className="hk_show_tabs" role="tablist" aria-label="컷온 화면 셋">
        {CT_SHOW.cases.map((x, i) => (
          <button key={x.k} type="button" role="tab" aria-selected={i === cur} className={i === cur ? 'on' : undefined} onClick={() => go(i)}>
            <i className="hk_show_bar" aria-hidden="true" />
            <b>{x.v}</b>
            <span>{x.d}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
