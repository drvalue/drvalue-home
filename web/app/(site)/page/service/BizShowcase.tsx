'use client'

import { useAutoTabs } from './useAutoTabs'
import { HK_BIZ } from './hankeonContent'

/**
 * Biz 판정 셋 — 채널톡 ALF 장의 짜임(2026-09-22 사용자가 지목): 폭 전체 사진 판 안에 「내 정보」와
 * 실제 공고 카드가 선으로 이어져 있고, 아래 3열 탭을 누르면 그 판정으로 간다.
 * 스스로 넘어간다 — 막대가 차면 다음(useAutoTabs, 2026-09-29 되살림). 손을 올리면 멈춘다. 움직임을 줄인 사람에게는
 * 카드 떠오름만 뺀다. 첫 탭이 켜진 채 서버에서 그려지므로 스크립트 없이도 카드 한 장은 보인다.
 *
 * 카드 값(출처·제목·기관·추정가·경쟁 방식·판정 줄)은 hankeon.com/biz 화면 그대로 — 여기서 짓지 않는다.
 */

export default function BizShowcase() {
  const { cur, tick, go, boxProps, fillProps } = useAutoTabs(HK_BIZ.cases.length)
  const mark = (k: string) => (k === 'ok' ? '✓' : k === 'no' ? '✕' : '?')

  return (
    <div className="hk_show" data-rv {...boxProps}>
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
        {/* 판정·양식을 전부 HTML 에 싣고 고르지 않은 것만 숨긴다 — 고른 것만 그리면 나머지 내용이 검색·AI 크롤러에게 아예 없다(2026-09-28 SEO·GEO). */}
        {HK_BIZ.cases.map((c, i) => (
          <article key={c.k} className={`hk_bid ${c.k}`} hidden={i !== cur}>
          <p className="hk_bid_src"><i aria-hidden="true" />{c.card.src}</p>
          <h4>{c.card.t}</h4>
          <p className="hk_bid_org">{c.card.org}</p>
          <p className="hk_bid_price"><span>추정가</span><b>{c.card.price}</b><em>{c.card.kind}</em></p>
          <p className="hk_bid_verdict"><b>{mark(c.k)} {c.v}</b>{c.card.why}</p>
        </article>
        ))}
      </div>
      <div className="hk_show_tabs" role="tablist" aria-label="판정 예시">
        {HK_BIZ.cases.map((x, i) => (
          <button key={x.k} type="button" role="tab" aria-selected={i === cur} className={i === cur ? 'on' : undefined} onClick={() => go(i)}>
            <i className="hk_show_bar" aria-hidden="true">{i === cur && <b key={tick} {...fillProps} />}</i>
            <b>{x.v} — {x.t2}</b>
            <span>{x.d}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
