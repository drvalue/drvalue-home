import { KPI, STAGES } from './maxContent'

/**
 * MES 공통 프로세스 흐름 — channel.io/kr/meet/call 의 IVR 구역(어두운 남색 판 · 가운데 제목 ·
 * 흰 카드 · 밑에 유리 카드 셋)으로 다시 그렸다. 2026-09-22 사용자가 옛 MaxFlow
 * (6칸 지그재그 + 「AI 자동화만 보기」 토글)를 「너무 별로」라 했다.
 *
 *  - 위: 단계 6개를 한 번에 편다 — 단계마다 주공정 카드, 같이 도는 공정이 있으면 카드 아래칸.
 *    2026-09-28 사용자: 5초마다 넘어가던 레일(「흐르는 거」)을 빼고, 업종 공통이라 장 위쪽에.
 *    폰에서는 두 줄 격자로 줄여 한 화면에 흐름이 보이게 한다.
 *  - 아래: KPI 셋(납기·이익·품질 영향 분석) — 레퍼런스의 유리 카드 셋 자리.
 * 글은 전부 maxContent.ts 의 STAGES·KPI 그대로.
 */
export default function FlowBand() {
  const aiCount = STAGES.reduce((n, x) => n + x.top.filter((y) => y.ai).length + (x.bottom ?? []).filter((y) => y.ai).length, 0)

  const notes = (list: { t: string; ai?: boolean }[]) => (
    <ul className="mx_fb_notes">
      {list.map((n) => <li key={n.t} className={n.ai ? 'ai' : undefined}>{n.ai && <em aria-label="AI 가 자동으로">AI</em>}{n.t}</li>)}
    </ul>
  )

  return (
    <section className="mx_fb">
      <i className="mx_blob mx_b1" aria-hidden="true" /><i className="mx_blob mx_b2" aria-hidden="true" />
      <div className="mx_wrap">
        <div className="mx_fb_head" data-rv>
          <p className="mx_bento_k">제조 흐름 · AI 가 대신하는 일 {aiCount}</p>
          <h2 data-words>업종이 달라도 제조의 흐름은 같습니다</h2>
          <p className="mx_bento_d">견적부터 출고까지 여섯 단계를 하나의 데이터 흐름으로 잇습니다. 단계마다 무엇이 기록되고 무엇을 AI 가 대신하는지 봅니다.</p>
        </div>

        <ol className="mx_fb_stages" aria-label="제조 단계" data-rv>
          {STAGES.map((x, i) => (
            <li key={x.main} className="mx_fb_card">
              <header><small>{String(i + 1).padStart(2, '0')}</small><h3>{x.main}</h3></header>
              {notes(x.top)}
              {x.sub && (
                <div className="mx_fb_sub">
                  <p><small>같이 도는 공정</small><b>{x.sub}</b></p>
                  {x.bottom && notes(x.bottom)}
                </div>
              )}
            </li>
          ))}
        </ol>

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
