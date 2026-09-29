'use client'

import { useAutoTabs } from '../useAutoTabs'
import { CD_CASES } from '../cadonContent'

/**
 * 판정 셋(전개 결과 · DFM 위반 · 3D 되접기) — 채널톡 CoS 장의 짜임(한건 BizShowcase 와 같은 결정):
 * 폭 전체 판 안에 「도면」 쪽지와 CutON 패널을 점선으로 잇고, 아래 3열 탭을 누르면 그 판정으로 간다.
 * 스스로 넘어간다 — 막대가 차면 다음(useAutoTabs, 2026-09-29 되살림). 손을 올리면 멈춘다. 첫 탭이 켜진 채 서버에서 그려진다.
 *
 * 패널 값(파일·PASS/REVIEW·절곡·치수)은 실제 화면에 찍힌 것(cadonContent.ts) — 여기서 짓지 않는다.
 */

export default function CadonCases() {
  const { cur, tick, go, boxProps, fillProps } = useAutoTabs(CD_CASES.length)

  return (
    <div className="cd_show" data-rv {...boxProps}>
      <div className="cd_show_plate">
        <div className="cd_show_me">
          <p className="cd_show_me_t">도면</p>
          <ul aria-label="입력">
            <li><span>파일</span><b>unistrut.STEP</b></li>
            <li><span>크기</span><b>42 × 250 × 22 mm</b></li>
            <li><span>자재</span><b>A1100 · t 2</b></li>
          </ul>
        </div>
        <i className="cd_show_link" aria-hidden="true" />
        {/* 판정·양식을 전부 HTML 에 싣고 고르지 않은 것만 숨긴다 — 고른 것만 그리면 나머지 내용이 검색·AI 크롤러에게 아예 없다(2026-09-28 SEO·GEO). */}
        {CD_CASES.map((c, i) => (
          <article key={`${c.k}-${i === cur ? tick : 'x'}`} className={`cd_panel ${c.k}`} hidden={i !== cur} aria-live={i === cur ? "polite" : undefined}>
          <p className="cd_panel_head"><b>CutON</b> {c.card.head}<span>{c.card.file}</span></p>
          <p className="cd_panel_chips">{c.card.chips.map((x) => <em key={x}>{x}</em>)}</p>
          <div className="cd_panel_box">
            <p className="cd_panel_line">{c.card.line}{c.card.badge && <i>{c.card.badge}</i>}</p>
            <ul>{c.card.rows.map((r, i) => <li key={i}>{r}</li>)}</ul>
          </div>
        </article>
        ))}
      </div>
      <div className="cd_show_tabs" role="tablist" aria-label="판정 예시">
        {CD_CASES.map((x, i) => (
          <button key={x.k} type="button" role="tab" aria-selected={i === cur} className={i === cur ? 'on' : undefined} onClick={() => go(i)}>
            <i className="cd_show_bar" aria-hidden="true">{i === cur && <b key={tick} {...fillProps} />}</i>
            <b>{x.v}</b>
            <span>{x.d}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
