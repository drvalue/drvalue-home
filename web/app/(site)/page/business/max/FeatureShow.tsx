import type { ReactNode } from 'react'
import { mark, plain } from './text'
import type { Feature } from './maxContent'
import { Shots } from './ShotViewer'

/**
 * 기능 묶음 하나 = 기능마다 **전문** 판을 위에서 아래로 전부 편다. 판은 글 왼쪽(제목·요점
 * 전부·콜아웃·해시태그)과 화면 오른쪽. 화면이 없는 기능은 글이 폭을 다 쓰고, extra 가
 * 있으면 그 밑에 붙는다.
 *
 * 2026-09-22 사용자: 탭 한 줄로 줄이니 「내용 7개 다 어디 갔냐」 — 요점·콜아웃·칩은 자료다,
 * 레이아웃이 바뀌어도 하나도 빠지면 안 된다. 그래서 ShowTabs(제목+한 줄) 대신 이것.
 * 2026-09-28 사용자: 게이지 레일로 「다음다음 넘어가는」 대신 내리면서 바로 다 보이게 — 레일을 뺐다.
 */
const short = (f: Feature) => f.kicker.replace(/^[^-]+ - /, '')

export default function FeatureShow({ items, extra, url, hideShot = [] }: {
  items: Feature[]
  /** 기능 번호별로 판 밑에 더 그릴 것(예: KPI 셋). */
  extra?: Record<number, ReactNode>
  url?: string
  /** 화면을 안 싣는 기능 번호(예: PCB KPI — 시연 값이라 대표로 못 세운다). */
  hideShot?: number[]
}) {
  return (
    <div className="mx_fs hk_show">
      {items.map((f) => {
        const shot = hideShot.includes(f.no) ? undefined : f.shots?.[0]
        return (
          <article key={f.no} className={`mx_fs_panel${shot ? '' : ' one'}`}>
            <div className="mx_fs_txt">
              {/* 「생산 - 납기 예측」 → 「생산 · 납기 예측」(하이픈이 데이터 라벨처럼 보였다, 2026-09-28 검수). */}
              <p className="mx_fs_k">{f.kicker.replace(' - ', ' · ')}</p>
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
                  {/* 화면이 여럿이면 둘째 장부터 여는 단추가 붙는다(ShotViewer) — 내용은 다 들어가야 한다. */}
                  <Shots shots={f.shots!} />
                </div>
              </figure>
            )}
          </article>
        )
      })}
    </div>
  )
}
