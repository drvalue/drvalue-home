'use client'

import { useAutoTabs } from './useAutoTabs'
import { AF_DB, AF_FORMS } from './autoformContent'

/**
 * 양식 셋을 채널톡 CoS 장의 짜임으로(한건 장의 BizShowcase 와 같은 틀): 폭 전체 사진 판 안에
 * 「데이터베이스」 카드와 양식 카드가 점선으로 이어져 있고, 아래 3열 탭을 누르면
 * 그 양식으로 간다. 스스로 넘어간다 — 막대가 차면 다음(useAutoTabs, 2026-09-29 되살림). 손을 올리면 멈춘다. 첫 탭이 켜진 채 서버에서 그려진다.
 *
 * 카드 값(파일명·쪽·표·스칼라·리스트·저장 시각·칸 대응)은 등록·매핑 화면에 찍힌 그대로.
 */

export default function AutoformShow() {
  const { cur, tick, go, boxProps, fillProps } = useAutoTabs(AF_FORMS.length)

  return (
    <div className="hk_show" data-rv {...boxProps}>
      <div className="hk_show_plate af_plate">
        <div className="hk_show_me">
          <p className="hk_show_me_t">데이터베이스</p>
          <ul aria-label="데이터베이스">
            <li><span>연결</span><b><i className="af_dot" aria-hidden="true" />{AF_DB.name}</b></li>
            <li><span>테이블</span><b>{AF_DB.tables}</b></li>
            <li><span>툴</span><b>생성된 툴 {AF_DB.tools}</b></li>
            <li><span>양식</span><b>분석된 양식 {AF_DB.forms}</b></li>
          </ul>
        </div>
        <i className="hk_show_link" aria-hidden="true" />
        {/* 판정·양식을 전부 HTML 에 싣고 고르지 않은 것만 숨긴다 — 고른 것만 그리면 나머지 내용이 검색·AI 크롤러에게 아예 없다(2026-09-28 SEO·GEO). */}
        {AF_FORMS.map((f, i) => (
          <article key={`${f.k}-${i === cur ? tick : 'x'}`} className={"af_form"} hidden={i !== cur} aria-live={i === cur ? "polite" : undefined}>
          <p className="af_form_head"><b>{f.file}</b><em>{f.kind}</em><span>저장됨</span></p>
          <p className="af_form_meta">{f.meta} · {f.when}</p>
          {f.pairs.length > 0 && (
            <ul className="af_pairs" aria-label="칸과 데이터의 대응">
              {f.pairs.map(([a, b]) => <li key={a}><b>{a}</b><i aria-hidden="true">←</i><code>{b}</code></li>)}
            </ul>
          )}
          {f.pairs.length === 0 && <p className="af_form_note">라벨·리스트를 자동 감지하고 매핑 초안을 만들어 드려요</p>}
        </article>
        ))}
      </div>
      <div className="hk_show_tabs" role="tablist" aria-label="양식 예시">
        {AF_FORMS.map((x, i) => (
          <button key={x.k} type="button" role="tab" aria-selected={i === cur} className={i === cur ? 'on' : undefined} onClick={() => go(i)}>
            <i className="hk_show_bar" aria-hidden="true">{i === cur && <b key={tick} {...fillProps} />}</i>
            <b>{x.t2}</b>
            <span>{x.d}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
