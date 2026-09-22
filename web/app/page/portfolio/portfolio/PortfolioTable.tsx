'use client'

import { useMemo, useState } from 'react'

export type Row = { readonly 과제명: string; readonly 기간: string; readonly 구분: string }

/**
 * 수행실적 표.
 *
 * 표만 있으면 아홉 줄을 다 읽어야 규모가 잡힌다. 위에 요약 세 칸을 둬서
 * 건수·기간·발주 갈래를 먼저 보이고, 갈래를 눌러 걸러 볼 수 있게 했다.
 *
 * **요약 숫자는 전부 아래 표에서 세서 만든다.** 없는 숫자를 지어내지 않는다.
 */
export default function PortfolioTable({ rows }: { rows: readonly Row[] }) {
  const [type, setType] = useState<string | null>(null)

  const types = useMemo(() => [...new Set(rows.map((r) => r.구분))], [rows])
  const span = useMemo(() => {
    // '24.06~24.11' 꼴에서 앞뒤를 떼어 가장 이른 것과 가장 늦은 것을 찾는다.
    const all = rows.flatMap((r) => r.기간.split('~').map((v) => v.trim()))
    const sorted = [...all].sort()
    return sorted.length ? `${sorted[0]} ~ ${sorted[sorted.length - 1]}` : '-'
  }, [rows])

  const shown = type ? rows.filter((r) => r.구분 === type) : rows

  return (
    <>
      <div className="pf_sum">
        <div><b>{rows.length}건</b><span>수행 과제</span></div>
        <div><b>{span}</b><span>수행 기간</span></div>
        <div><b>{types.length}갈래</b><span>발주·사업 유형</span></div>
      </div>

      <div className="pf_filter" role="group" aria-label="발주·사업 유형으로 거르기">
        <button
          type="button"
          className={`pf_fbtn${type === null ? ' is-on' : ''}`}
          aria-pressed={type === null}
          onClick={() => setType(null)}
        >
          전체 <i>{rows.length}</i>
        </button>
        {types.map((t) => (
          <button
            key={t}
            type="button"
            className={`pf_fbtn${type === t ? ' is-on' : ''}`}
            aria-pressed={type === t}
            onClick={() => setType(type === t ? null : t)}
          >
            {t} <i>{rows.filter((r) => r.구분 === t).length}</i>
          </button>
        ))}
      </div>

      <div className="pf_table_wrap">
        <table className="pf_table">
          <thead>
            <tr>
              <th>과제명</th>
              <th>수행기간</th>
              <th>구분</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((pf) => (
              <tr key={pf.과제명}>
                <td>{pf.과제명}</td>
                <td className="pf_col_period">{pf.기간}</td>
                <td className="pf_col_type"><span>{pf.구분}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
