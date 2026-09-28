import { KPI, STAGES } from './maxContent'

/**
 * MES 공통 프로세스 흐름 — 사용자가 처음 준 시안(max-page-draft.html 의 flow-sec) 그대로:
 * 흰 바탕 · 왼쪽 정렬 제목 · KPI 띠 · 여섯 칸(위 메모 → 주공정 상자 → 이음선 → 같이 도는 공정 → 아래 메모).
 * 2026-09-28 사용자: 어두운 그라데이션 판(channel.io IVR 구역)은 「AI 느낌」이라 뺐다.
 * 누르는 것도 넘어가는 것도 없다 — 옛 MaxFlow 의 고르기·「AI 자동화만 보기」도 뺐다.
 * CSS 는 maxStyles.ts 의 .mx_kpi · .mx_flow* 를 그대로 쓰고 patternStyles.ts 의 .mx_fb 가 바탕·폰 배치만 맡는다.
 * 글은 전부 maxContent.ts 의 STAGES·KPI.
 */
export default function FlowBand() {
  const notes = (list: { t: string; ai?: boolean }[] | undefined) =>
    list && (
      <ul className="mx_note">
        {list.map((n) => <li key={n.t} className={n.ai ? 'is-ai' : undefined}>{n.ai && <em>AI</em>}{n.t}</li>)}
      </ul>
    )

  return (
    <section className="mx_fb">
      <div className="mx_wrap">
        <h2 className="mx_sec_title">MES 공통 프로세스</h2>
        <p className="mx_sec_desc">업종이 달라도 제조의 흐름은 같습니다. M.AX는 아래 전 과정을 하나의 데이터 흐름으로 연결합니다.</p>

        <div className="mx_kpi" role="group" aria-label="KPI 분석">
          <div className="mx_kpi_tag">KPI</div>
          <div className="mx_kpi_items">
            {KPI.map((k) => <div key={k.h}><h3>{k.h}</h3><p>{k.p}</p></div>)}
          </div>
        </div>

        <ol className="mx_flow" aria-label="MES 프로세스 흐름">
          {STAGES.map((s, i) => (
            <li key={s.main} className="mx_stage">
              {notes(s.top)}
              <div className="mx_pbox">
                {s.main}
                {i < STAGES.length - 1 && <span className="mx_arrow" aria-hidden="true" />}
              </div>
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
    </section>
  )
}
